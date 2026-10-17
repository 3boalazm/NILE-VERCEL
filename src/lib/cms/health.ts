import "server-only"

import { connect } from "node:net"

/**
 * The deployment self-check behind `GET /api/health`.
 *
 * The difference between "the environment variables are set" and "the running
 * deployment can use them" is invisible from the outside. A Vercel deployment
 * built before the variables were added, a `DATABASE_URI` pointing at
 * `localhost`, a Postgres that refuses the credentials, a database that is
 * reachable but not seeded — all four look identical from the browser: the
 * site renders, the catalog section says it is unavailable, and the only
 * explanation is in a log the deployer has to go and read.
 *
 * This module answers that question, and it answers it without revealing
 * anything:
 *
 *   - NO secret values. No `DATABASE_URI`, no `PAYLOAD_SECRET`, no host
 *     name, no port, no password — not even inside an error message (a
 *     connection error is reduced to its error code).
 *   - Only booleans and coarse kinds (`public` / `private` / `localhost`), so
 *     the response says "the database is unreachable" without saying where
 *     the database is.
 *   - The product count is public information anyway (the catalog pages
 *     list it).
 *
 * It is deliberately read-only: it opens a connection, counts rows, closes.
 * It never writes, and it never serves catalog content.
 */
export type Reachability = "ok" | "unreachable" | "timeout" | "skipped"

export type HealthReport = {
  status: "ok" | "degraded"
  checkedAt: string
  deployment: {
    vercelEnv: string
    commit: string
    nodeEnv: string
  }
  cms: {
    secretConfigured: boolean
    secretValid: boolean
    databaseConfigured: boolean
    databaseScheme: "postgresql" | "postgres" | "invalid" | "missing"
    databaseHostKind: "public" | "private" | "localhost" | "unknown"
    databaseReachable: Reachability
  }
  catalog: { ok: boolean; products: number | null; error: string | null }
  commerce: { vendureConfigured: boolean; vendureReachable: Reachability }
  /** Breaks the storefront. */
  problems: string[]
  /** Degrades a part of it. */
  notes: string[]
}

export type HealthDeps = {
  env: Record<string, string | undefined>
  /** Counts the published catalog. Rejects when the CMS cannot be read. */
  readCatalogCount: () => Promise<number>
  /** Injected so the report is testable without a database. */
  probe?: (host: string, port: number) => Promise<Reachability>
  now?: () => Date
}

/** The secret has to clear the schema's own floor (see src/lib/env.ts). */
const MIN_SECRET_LENGTH = 32
const PROBE_TIMEOUT_MS = 3_000

/**
 * Reduce any failure to a code the operator can act on, without echoing
 * anything that could carry a host, a user or a password.
 */
export function safeErrorCode(error: unknown): string {
  const code = (error as { code?: unknown } | null)?.code
  if (typeof code === "string" && /^[A-Z0-9]{3,12}$/.test(code)) return code
  const name = (error as { name?: unknown } | null)?.name
  if (typeof name === "string" && /^[A-Za-z]{3,40}$/.test(name)) return name
  return "unknown"
}

/**
 * Classify a database host without naming it. `localhost` is separated from
 * `private` because only the first one is *always* wrong for a deployed
 * function.
 */
export function classifyHost(host: string): HealthReport["cms"]["databaseHostKind"] {
  const h = host.trim().toLowerCase().replace(/^\[|\]$/g, "")
  if (!h) return "unknown"
  if (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "::1" ||
    h === "0.0.0.0" ||
    h.endsWith(".localhost")
  ) {
    return "localhost"
  }
  if (
    h.endsWith(".local") ||
    h.endsWith(".internal") ||
    h.startsWith("host.docker.internal")
  ) {
    return "private"
  }
  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h)
  if (v4) {
    const a = Number(v4[1])
    const b = Number(v4[2])
    if (a === 10 || a === 127) return "private"
    if (a === 172 && b >= 16 && b <= 31) return "private"
    if (a === 192 && b === 168) return "private"
    if (a === 169 && b === 254) return "private"
  }
  return "public"
}

/** A TCP connect test — no credentials, no query, no data. */
export function tcpProbe(
  host: string,
  port: number,
  timeoutMs = PROBE_TIMEOUT_MS,
): Promise<Reachability> {
  return new Promise((resolve) => {
    let settled = false
    const socket = connect({ host, port })
    const done = (result: Reachability) => {
      if (settled) return
      settled = true
      try {
        socket.destroy()
      } catch {
        /* the socket may already be closed */
      }
      resolve(result)
    }
    socket.setTimeout(timeoutMs)
    socket.once("connect", () => done("ok"))
    socket.once("timeout", () => done("timeout"))
    socket.once("error", () => done("unreachable"))
  })
}

export async function buildHealthReport(deps: HealthDeps): Promise<HealthReport> {
  const { env, readCatalogCount } = deps
  const probe = deps.probe ?? tcpProbe
  const now = deps.now?.() ?? new Date()
  const problems: string[] = []
  const notes: string[] = []

  // "localhost" only breaks a *deployed* function: in local development it
  // is exactly where the database is.
  const deployed = Boolean(env.VERCEL_ENV) || env.NODE_ENV === "production"

  const secret = env.PAYLOAD_SECRET ?? ""
  const secretConfigured = secret.length > 0
  const secretValid = secret.length >= MIN_SECRET_LENGTH
  if (!secretConfigured) problems.push("PAYLOAD_SECRET is not set")
  else if (!secretValid)
    problems.push(
      `PAYLOAD_SECRET is shorter than the ${MIN_SECRET_LENGTH} characters the schema requires`,
    )

  const uri = env.DATABASE_URI ?? ""
  const databaseConfigured = uri.length > 0
  let databaseScheme: HealthReport["cms"]["databaseScheme"] = "missing"
  let databaseHostKind: HealthReport["cms"]["databaseHostKind"] = "unknown"
  let databaseReachable: Reachability = "skipped"

  if (databaseConfigured) {
    try {
      const parsed = new URL(uri)
      if (parsed.protocol === "postgres:") databaseScheme = "postgres"
      else if (parsed.protocol === "postgresql:") databaseScheme = "postgresql"
      else databaseScheme = "invalid"
      if (databaseScheme === "invalid") {
        problems.push("DATABASE_URI must start with postgres:// or postgresql://")
      }
      const host = parsed.hostname
      const port = parsed.port ? Number(parsed.port) : 5432
      databaseHostKind = classifyHost(host)
      // Always probe — including localhost, where the answer is "reachable"
      // in development and "unreachable" once deployed. The verdict has to be
      // the measured one; the localhost *advice* is what depends on where
      // the code is running.
      databaseReachable = await probe(host, port)
      if (databaseReachable !== "ok") {
        problems.push(`the database host did not accept a connection (${databaseReachable})`)
      }
      if (databaseHostKind === "localhost" && deployed) {
        problems.push(
          "DATABASE_URI points at localhost — a deployed function cannot reach the host's own localhost",
        )
      }
    } catch {
      databaseScheme = "invalid"
      problems.push("DATABASE_URI is not a parsable connection string")
    }
  } else {
    problems.push("DATABASE_URI is not set")
  }

  // The real test: can the CMS read the catalog at all?
  let catalog: HealthReport["catalog"] = { ok: false, products: null, error: null }
  if (secretValid && databaseConfigured && databaseScheme !== "invalid") {
    try {
      const products = await readCatalogCount()
      catalog = { ok: true, products, error: null }
      if (products === 0) {
        problems.push("the database is reachable but the catalog is empty — seed it (npm run seed)")
      }
    } catch (error) {
      const code = safeErrorCode(error)
      catalog = { ok: false, products: null, error: code }
      problems.push(`the CMS could not read the catalog (${code})`)
    }
  }

  const vendureUrl = env.VENDURE_SHOP_API_URL ?? ""
  const vendureConfigured = vendureUrl.length > 0
  let vendureReachable: Reachability = "skipped"
  if (vendureConfigured) {
    try {
      const parsed = new URL(vendureUrl)
      vendureReachable = await probe(
        parsed.hostname,
        parsed.port ? Number(parsed.port) : parsed.protocol === "https:" ? 443 : 80,
      )
      if (vendureReachable !== "ok") {
        notes.push(
          `the Vendure shop API did not answer (${vendureReachable}) — cart and checkout will be unavailable`,
        )
      }
    } catch {
      vendureReachable = "unreachable"
      notes.push("VENDURE_SHOP_API_URL is not a parsable URL")
    }
  } else {
    notes.push(
      "VENDURE_SHOP_API_URL is not set — the catalog shows, but cart, checkout and live prices are unavailable",
    )
  }

  return {
    status: problems.length === 0 ? "ok" : "degraded",
    checkedAt: now.toISOString(),
    deployment: {
      vercelEnv: env.VERCEL_ENV ?? "unknown",
      commit: (env.VERCEL_GIT_COMMIT_SHA ?? "").slice(0, 7) || "unknown",
      nodeEnv: env.NODE_ENV ?? "unknown",
    },
    cms: {
      secretConfigured,
      secretValid,
      databaseConfigured,
      databaseScheme,
      databaseHostKind,
      databaseReachable,
    },
    catalog,
    commerce: { vendureConfigured, vendureReachable },
    problems,
    notes,
  }
}
