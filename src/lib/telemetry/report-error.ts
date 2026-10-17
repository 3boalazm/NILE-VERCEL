/**
 * F-65 — error reporting pipeline.
 *
 * Until now every failure path ended at `console.error`. In a browser that is
 * invisible to the team: the customer's console is not ours, so a render crash,
 * a failed server action or a checkout network error produced no record
 * anywhere anyone could read. This module is the single place errors get
 * reported, and it is deliberately transport-agnostic:
 *
 *   SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN
 *       → posts a Sentry **envelope** straight to Sentry's ingest API. No SDK
 *         dependency: an envelope is three JSON lines, and pulling
 *         `@sentry/nextjs` into this tree (which already resolves peer-dep
 *         conflicts with `--legacy-peer-deps`) to send one event type is not a
 *         trade worth making. Swapping to the real SDK later means replacing
 *         `sendToSentry`, nothing else.
 *   NPF_ERROR_ENDPOINT / NEXT_PUBLIC_ERROR_ENDPOINT
 *       → posts the same normalized JSON to any collector (Loki, a webhook,
 *         an internal OTLP-ish bridge).
 *   neither set
 *       → structured console record only. That is still an improvement on the
 *         status quo: one consistent JSON shape, greppable in container logs,
 *         instead of eleven ad-hoc `console.error("[whatever]", e)` strings.
 *
 * Three rules this module does not break:
 *  1. **It never throws.** An error reporter that can fail loudly turns one
 *     incident into two. Everything is wrapped, and transport failures are
 *     swallowed after being counted.
 *  2. **It is rate-limited.** A render loop or a retry storm would otherwise
 *     send thousands of identical events per minute — a self-inflicted outage
 *     of the collector, and real billing. 20/minute per process (or per page
 *     load, in the browser).
 *  3. **It carries no personal data by default.** Only what the caller passes
 *     in `extra`; no request bodies, no cookies, no form values. Server
 *     actions already know which field failed — they pass the field *name*.
 *
 * Why this file does not use the zod schemas in `src/lib/env.ts`: it is
 * imported by `error.tsx`/`global-error.tsx`, i.e. it lands in the client
 * bundle of the error path specifically, which must stay as small as possible.
 * Env access here is direct and static (`process.env.X`) so Next can inline the
 * `NEXT_PUBLIC_*` values at build time — a dynamic lookup would not be inlined
 * and would silently read `undefined` in the browser.
 */

export type ErrorScope =
  | "error-boundary"
  | "global-error"
  | "server-action"
  | "route-handler"
  | "client"
  | (string & {})

export type ErrorContext = {
  /** Where it happened. Kept free-form so new call sites need no enum edit. */
  scope?: ErrorScope
  /** URL path (browser) or route (server). Never a full URL with query. */
  path?: string
  /** Server action / mutation name, e.g. "resetPassword". */
  action?: string
  /** Caller-supplied, non-personal context. */
  extra?: Record<string, unknown>
  /**
   * The caller already wrote its own log record (see `logError` in
   * src/lib/observability/log.ts) — use external transports only, and do not
   * emit the console fallback, so one failure is never printed twice.
   */
  quiet?: boolean
}

type NormalizedError = {
  name: string
  message: string
  stack?: string
  digest?: string
}

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_PER_WINDOW = 20

let windowStartedAt = 0
let sentInCurrentWindow = 0
let droppedInCurrentWindow = 0

/** Test seam: resets the flood guard between cases. */
export function resetErrorRateLimit(): void {
  windowStartedAt = 0
  sentInCurrentWindow = 0
  droppedInCurrentWindow = 0
}

/** True when the event may be sent; false when it should be dropped. */
export function takeRateLimitSlot(now: number = Date.now()): boolean {
  if (now - windowStartedAt >= RATE_LIMIT_WINDOW_MS) {
    windowStartedAt = now
    if (droppedInCurrentWindow > 0) {
      // Surface the flood that was suppressed, once, so a dropped-event
      // incident is still visible in the logs.
      console.warn(`[report-error] dropped ${droppedInCurrentWindow} error report(s) in the last window (rate limit)`)
    }
    sentInCurrentWindow = 0
    droppedInCurrentWindow = 0
  }
  if (sentInCurrentWindow >= RATE_LIMIT_MAX_PER_WINDOW) {
    droppedInCurrentWindow++
    return false
  }
  sentInCurrentWindow++
  return true
}

/** `https://<key>@<host>/<projectId>` → the ingest envelope URL. */
export function parseSentryDsn(dsn: string): { envelopeUrl: string; publicKey: string; projectId: string } | null {
  const match = /^(https?):\/\/([^@\s]+)@([^/\s]+)\/(\S+)$/.exec(dsn.trim())
  if (!match) return null
  const [, protocol, publicKey, host, projectId] = match
  return { envelopeUrl: `${protocol}://${host}/api/${projectId}/envelope/`, publicKey, projectId }
}

/** 32 lowercase hex chars, as Sentry's `event_id` requires. */
function makeEventId(): string {
  const cryptoRef = typeof globalThis !== "undefined" ? globalThis.crypto : undefined
  if (cryptoRef?.randomUUID) return cryptoRef.randomUUID().replace(/-/g, "")
  let out = ""
  for (let i = 0; i < 32; i++) out += Math.floor(Math.random() * 16).toString(16)
  return out
}

/**
 * Builds the three-line Sentry envelope (header, item header, item payload).
 * Exported for tests: the shape is the whole integration, so it is the part
 * worth asserting.
 */
export function buildSentryEnvelope(params: {
  dsn: string
  error: NormalizedError
  context: ErrorContext
  environment?: string
}): string {
  const eventId = makeEventId()
  const sentAt = new Date().toISOString()
  const header = {
    event_id: eventId,
    sent_at: sentAt,
    dsn: params.dsn,
    sdk: { name: "npf-inline-reporter", version: "1.0.0" },
  }
  const itemHeader = { type: "event" }
  const item = {
    event_id: eventId,
    timestamp: Math.floor(Date.now() / 1000),
    platform: "javascript",
    level: "error",
    environment: params.environment ?? "production",
    transaction: params.context.path ?? params.context.action ?? params.context.scope,
    exception: {
      values: [
        {
          type: params.error.name,
          value: params.error.message,
          ...(params.error.stack ? { stacktrace: { frames: parseStack(params.error.stack) } } : {}),
        },
      ],
    },
    tags: {
      scope: params.context.scope ?? "unspecified",
      ...(params.context.action ? { action: params.context.action } : {}),
      ...(params.error.digest ? { next_digest: params.error.digest } : {}),
    },
    extra: params.context.extra ?? {},
  }
  return `${JSON.stringify(header)}\n${JSON.stringify(itemHeader)}\n${JSON.stringify(item)}`
}

/** Minimal stack → Sentry frames (bottom-up, as Sentry expects). */
function parseStack(stack: string): Array<{ filename: string; lineno?: number; function?: string }> {
  return stack
    .split("\n")
    .slice(0, 20)
    .map((line) => {
      const at = /^\s*at\s+(?:(.+?)\s+\()?(https?:\/\/|\/|\w:\/)[^\s)]+/.exec(line)
      const file = /(?:at\s+(?:.*?\s+\()?)([^\s()]+):\d+:\d+/.exec(line)?.[1]
      const lineno = /:(\d+):\d+\)?$/.exec(line.trim())?.[1]
      if (!file && !at) return null
      return {
        filename: file ?? at?.[0].trim() ?? line.trim(),
        ...(lineno ? { lineno: Number(lineno) } : {}),
        ...(at?.[1] ? { function: at[1] } : {}),
      }
    })
    .filter((frame): frame is { filename: string; lineno?: number; function?: string } => frame !== null)
    .reverse()
}

function normalize(error: unknown): NormalizedError {
  if (error instanceof Error) {
    const withDigest = error as Error & { digest?: string }
    return {
      name: error.name || "Error",
      message: error.message || String(error),
      ...(error.stack ? { stack: error.stack } : {}),
      ...(withDigest.digest ? { digest: withDigest.digest } : {}),
    }
  }
  if (typeof error === "string") return { name: "Error", message: error }
  return { name: "Error", message: (() => { try { return JSON.stringify(error) } catch { return String(error) } })() }
}

function currentPath(context: ErrorContext): string | undefined {
  if (context.path) return context.path
  try {
    if (typeof window !== "undefined") return window.location.pathname
  } catch {
    /* no window (server) — path is optional */
  }
  return undefined
}

function dsnForRuntime(): string | undefined {
  const inBrowser = typeof window !== "undefined"
  // Static member access on purpose: Next inlines NEXT_PUBLIC_* at build time.
  if (inBrowser) return process.env.NEXT_PUBLIC_SENTRY_DSN || undefined
  return process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || undefined
}

function endpointForRuntime(): string | undefined {
  const inBrowser = typeof window !== "undefined"
  if (inBrowser) return process.env.NEXT_PUBLIC_ERROR_ENDPOINT || undefined
  return process.env.NPF_ERROR_ENDPOINT || process.env.NEXT_PUBLIC_ERROR_ENDPOINT || undefined
}

/** Fire-and-forget, timeout-bounded, never rejecting into the caller. */
function post(url: string, body: string, contentType: string): void {
  try {
    const inBrowser = typeof window !== "undefined"
    if (inBrowser && typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      // Beacons survive the navigation/unload that often follows a crash.
      const blob = new Blob([body], { type: contentType })
      if (navigator.sendBeacon(url, blob)) return
    }
    const controller = typeof AbortController !== "undefined" ? new AbortController() : undefined
    const timer = controller ? setTimeout(() => controller.abort(), 5_000) : undefined
    void fetch(url, {
      method: "POST",
      headers: { "content-type": contentType },
      body,
      keepalive: inBrowser,
      signal: controller?.signal,
    })
      .catch(() => undefined)
      .finally(() => {
        if (timer) clearTimeout(timer)
      })
  } catch {
    // Reporting must never become the second failure.
  }
}

function sendToSentry(dsn: string, error: NormalizedError, context: ErrorContext): boolean {
  const parsed = parseSentryDsn(dsn)
  if (!parsed) {
    console.warn(`[report-error] SENTRY_DSN is not a valid DSN — falling back to console logging`)
    return false
  }
  const envelope = buildSentryEnvelope({
    dsn,
    error,
    context,
    environment: process.env.APP_ENV ?? process.env.NODE_ENV ?? "production",
  })
  const url = `${parsed.envelopeUrl}?sentry_key=${encodeURIComponent(parsed.publicKey)}&sentry_version=7`
  post(url, envelope, "application/x-sentry-envelope")
  return true
}

/**
 * Report an error. Safe to call from anywhere, including inside a `catch` that
 * is itself failing — it never throws and never awaits.
 */
export function reportError(error: unknown, context: ErrorContext = {}): void {
  try {
    const normalized = normalize(error)
    const enriched: ErrorContext = { ...context, path: currentPath(context) }
    const record = {
      ts: new Date().toISOString(),
      level: "error",
      scope: enriched.scope ?? "unspecified",
      path: enriched.path,
      action: enriched.action,
      digest: normalized.digest,
      error: { name: normalized.name, message: normalized.message },
      extra: enriched.extra,
    }

    if (!takeRateLimitSlot()) {
      // Still leave a local trace so the incident is not entirely invisible.
      console.warn(`[report-error] suppressed (rate limit): ${normalized.name}: ${normalized.message}`)
      return
    }

    const dsn = dsnForRuntime()
    if (dsn && sendToSentry(dsn, normalized, enriched)) return

    const endpoint = endpointForRuntime()
    if (endpoint) {
      post(endpoint, JSON.stringify(record), "application/json")
      return
    }

    if (context.quiet) return

    // No transport configured: one consistent, greppable shape.
    if (typeof window === "undefined") {
      console.error(JSON.stringify(record))
    } else {
      console.error(`[report-error:${record.scope}]`, normalized.name, normalized.message, error)
    }
  } catch {
    // Swallow: see rule 1 in the module comment.
  }
}
