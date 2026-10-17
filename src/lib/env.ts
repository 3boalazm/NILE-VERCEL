/**
 * F-11 — runtime environment validation.
 *
 * Before this module, configuration was read ad-hoc at each call site
 * (`process.env.DB_PORT`, `+process.env.DB_PORT`, `process.env.SMTP_SECURE ===
 * "true"`, …). Three concrete failure modes came out of that:
 *
 *  1. **Silent typos.** `vendure-config.ts` reads `SUPERADMIN_USERNAME` /
 *     `SUPERADMIN_PASSWORD`; `.env.example` used to document `SUPERADMIN_USER` /
 *     `SUPERADMIN_PASS`. Setting the documented names did nothing at all, and
 *     Vendure created a super-admin nobody could log in as. Nothing warned.
 *  2. **Coercion surprises.** `+process.env.DB_PORT` is `NaN` when the var is
 *     unset, and `NaN` reaches the pg driver as an invalid port.
 *  3. **Late, one-at-a-time failures.** `payload.config.ts` threw on the first
 *     missing var, so a fresh clone needed several start-and-fix cycles to
 *     discover everything `.env` was missing.
 *
 * So: one zod schema per *scope* (Payload/CMS, Vendure server), parsed once at
 * module load, failing with **every** problem listed together and pointing at
 * `.env.example`. Values that are optional-but-consequential (no SMTP host, no
 * super-admin credentials) produce a warning rather than a throw — the app must
 * still boot in mock/offline development, which is a supported mode
 * (`MOCK_CATALOG_FALLBACK=1`), not a misconfiguration.
 *
 * This file is deliberately dependency-free beyond `zod` and must stay
 * importable from plain Node (`src/index.ts` bootstraps Vendure outside Next),
 * which is why it does not use `server-only`.
 */
import { z } from "zod"

/** Payload signs JWTs and encrypts fields with this — short values are a real risk. */
const MIN_SECRET_LENGTH = 32

const secret = (what: string) =>
  z
    .string({ message: `${what} is required` })
    .min(MIN_SECRET_LENGTH, `${what} must be at least ${MIN_SECRET_LENGTH} characters`)

const postgresUri = z
  .string({ message: "DATABASE_URI is required" })
  .min(1, "DATABASE_URI is required")
  .refine((v) => /^postgres(ql)?:\/\//i.test(v), "DATABASE_URI must be a postgres:// or postgresql:// connection string")

/**
 * Numeric env var → real number, with a message per check.
 *
 * Per-check messages matter: zod v4 lets a schema-level `error`/`message`
 * shadow the messages of chained refinements, so `DATABASE_POOL_MAX=9999`
 * would otherwise be reported as "must be a whole number" — true of nothing
 * and helpful to nobody. `z.coerce.number()` on an unset var yields NaN, which
 * then fails these checks loudly instead of reaching the pg driver as a NaN
 * port (the old `+process.env.DB_PORT` behaviour).
 */
const intVar = (name: string, { min = 1, max = 65535 }: { min?: number; max?: number } = {}) =>
  z.coerce
    .number({ error: `${name} must be a number` })
    .int(`${name} must be a whole number`)
    .min(min, `${name} must be at least ${min}`)
    .max(max, `${name} must be at most ${max}`)

const boolFromText = z
  .enum(["true", "false", "1", "0", "yes", "no", ""])
  .optional()
  .transform((v) => v === "true" || v === "1" || v === "yes")

/**
 * Shared by both scopes so the storefront, Payload and Vendure cannot drift
 * apart on the same physical database (F-71: pools were left at driver
 * defaults, i.e. pg's `max: 10` per process — with a Next server *and* a
 * Vendure worker on one host that quietly doubles, and nobody had written the
 * number down).
 */
const poolSchema = z.object({
  /** pg pool `max`. Sized per process; see scripts/backup-db.sh notes and .env.example. */
  DATABASE_POOL_MAX: intVar("DATABASE_POOL_MAX", { max: 200 }).default(10),
})

const smtpSchema = z.object({
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: intVar("SMTP_PORT").default(587),
  SMTP_SECURE: boolFromText,
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASS: z.string().min(1).optional(),
  EMAIL_FROM_ADDRESS: z.string().min(1).optional(),
  EMAIL_FROM_NAME: z.string().min(1).optional(),
})

/** Payload / CMS side — imported by `src/payload.config.ts` (and therefore by
 * the Next app itself, so a throw here surfaces at boot, before any request). */
export const payloadEnvSchema = poolSchema
  .merge(smtpSchema)
  .extend({
    PAYLOAD_SECRET: secret("PAYLOAD_SECRET"),
    DATABASE_URI: postgresUri,
    /** Storefront origin used to build absolute links in transactional mail. */
    STOREFRONT_URL: z.string().min(1).optional(),
  })

/** Vendure server side — imported by `src/vendure-config.ts` via `src/index.ts`. */
export const vendureEnvSchema = poolSchema
  .merge(smtpSchema)
  .extend({
    DB_HOST: z.string({ message: "DB_HOST is required" }).min(1, "DB_HOST is required"),
    DB_PORT: intVar("DB_PORT").default(5432),
    DB_NAME: z.string({ message: "DB_NAME is required" }).min(1, "DB_NAME is required"),
    DB_USERNAME: z.string({ message: "DB_USERNAME is required" }).min(1, "DB_USERNAME is required"),
    DB_PASSWORD: z.string({ message: "DB_PASSWORD is required" }).min(1, "DB_PASSWORD is required"),
    DB_SCHEMA: z.string().min(1).default("public"),
    COOKIE_SECRET: secret("COOKIE_SECRET"),
    // Required on purpose. Vendure's `superadminCredentials` is optional in
    // its own type but defaults to `superadmin`/`superadmin` at runtime
    // (@vendure/core/dist/config/vendure-config.d.ts: "@default 'superadmin'"),
    // so "unset" does not mean "no super-admin" — it means a published
    // credential pair on the admin panel. Failing the boot is the only safe
    // reading. The scaffold's environment.d.ts used to type these as
    // non-optional `string`, which hid the gap from tsc entirely.
    SUPERADMIN_USERNAME: z.string({ message: "SUPERADMIN_USERNAME is required (Vendure would default to 'superadmin')" }).min(1, "SUPERADMIN_USERNAME is required"),
    SUPERADMIN_PASSWORD: z
      .string({ message: "SUPERADMIN_PASSWORD is required (Vendure would default to 'superadmin')" })
      .min(8, "SUPERADMIN_PASSWORD must be at least 8 characters"),
    STOREFRONT_URL: z.string().min(1).optional(),
    APP_ENV: z.enum(["dev", "staging", "production"]).optional(),
    PORT: intVar("PORT").default(3000),
    VENDURE_SERVER_PORT: intVar("VENDURE_SERVER_PORT").default(3001),
  })
  // F-57 — the 8-char floor above is what stops the published
  // superadmin/superadmin pair; a real deployment needs more. Outside dev the
  // super-admin password must carry four character classes and 12+ chars,
  // because it is the one credential that bypasses every other control in
  // the admin API. Dev keeps the weak floor on purpose: local scaffolds and
  // CI seed data are not secrets, and failing their boot would just teach
  // people to disable validation.
  .superRefine((env, ctx) => {
    if (env.APP_ENV === undefined || env.APP_ENV === "dev") return
    const pw = env.SUPERADMIN_PASSWORD
    const strong =
      pw.length >= 12 && /[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)
    if (!strong) {
      ctx.addIssue({
        code: "custom",
        path: ["SUPERADMIN_PASSWORD"],
        message:
          "SUPERADMIN_PASSWORD must be 12+ characters with upper+lower+digit+symbol outside APP_ENV=dev (F-57)",
      })
    }
  })

export type PayloadEnv = z.infer<typeof payloadEnvSchema>
export type VendureEnv = z.infer<typeof vendureEnvSchema>

/** Problems that must stop the boot. */
function formatIssues(scope: string, issues: z.core.$ZodIssue[]): string {
  const lines = issues
    .map((issue) => {
      const name = issue.path.length ? String(issue.path[0]) : "(root)"
      return `  • ${name} — ${issue.message}`
    })
    .join("\n")
  return `[${scope}] environment validation failed:\n${lines}\n\nCopy .env.example to .env and set the values above.`
}

/**
 * Parse or throw — every problem at once. `source` defaults to `process.env`
 * and is injectable so the schemas stay unit-testable without mutating the
 * real environment.
 */
export function parseEnvOrThrow<T extends z.ZodType>(
  schema: T,
  scope: string,
  source: Record<string, string | undefined> = process.env
): z.output<T> {
  const result = schema.safeParse(source)
  if (!result.success) {
    throw new Error(formatIssues(scope, result.error.issues))
  }
  return result.data
}

/**
 * Consequential-but-optional gaps. These do NOT stop the boot (offline/mock
 * development is supported on purpose) but they are printed once so a
 * production deploy cannot ship with, say, no super-admin credentials or no
 * SMTP host and nobody noticing until a customer reports it.
 */
export type EnvWarning = { name: string; impact: string }

export function vendureEnvWarnings(env: VendureEnv): EnvWarning[] {
  const out: EnvWarning[] = []
  if (!env.STOREFRONT_URL) {
    out.push({
      name: "STOREFRONT_URL",
      impact: "transactional mail links fall back to a default origin, so password-reset emails may point somewhere that serves nothing",
    })
  } else if (env.APP_ENV !== undefined && env.APP_ENV !== "dev" && !env.STOREFRONT_URL.startsWith("https://")) {
    // F-44 — a production deployment advertising a plain-http origin ships
    // password-reset and verification links that leak the reset token on the
    // wire. Warn loudly at boot; TLS termination is a deploy concern, so this
    // stays a warning (a staging box behind a private tunnel may legitimately
    // be http) rather than a boot failure.
    out.push({
      name: "STOREFRONT_URL",
      impact: `must be https:// outside APP_ENV=dev (got ${env.STOREFRONT_URL}) — email links would carry tokens in cleartext`,
    })
  }
  if (!env.SMTP_HOST) {
    out.push({ name: "SMTP_HOST", impact: "mail runs in devMode (written to static/email/test-emails) — nothing is delivered" })
  }
  return out
}

export function payloadEnvWarnings(env: PayloadEnv): EnvWarning[] {
  const out: EnvWarning[] = []
  if (!env.SMTP_HOST) {
    out.push({ name: "SMTP_HOST", impact: "CMS mail (contact inquiries) is logged instead of sent" })
  }
  if (!env.STOREFRONT_URL) {
    out.push({ name: "STOREFRONT_URL", impact: "CMS-generated links cannot be made absolute" })
  }
  return out
}

/** Print once per process; noisy repetition in a request loop helps nobody. */
const warned = new Set<string>()

export function warnEnvIssues(scope: string, issues: EnvWarning[]): void {
  for (const issue of issues) {
    const key = `${scope}:${issue.name}`
    if (warned.has(key)) continue
    warned.add(key)
    console.warn(`[${scope}] ${issue.name} not configured — ${issue.impact}`)
  }
}
