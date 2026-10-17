import "server-only"

import { reportError } from "@/lib/telemetry/report-error"

type LogContext = Record<string, string | number | boolean | null | undefined>

function emit(level: "error" | "warn", scope: string, message: string, context: LogContext) {
  // Single-line JSON: trivial for any log collector to parse (Vercel,
  // Dokku, plain journald), still greppable by a human over SSH. Never
  // pass PII (passwords, full customer records) as context — scopes +
  // error messages only.
  console[level === "error" ? "error" : "warn"](
    JSON.stringify({ ts: new Date().toISOString(), level, scope, message, ...context })
  )
}

/**
 * Unexpected failure the operator should know about (Vendure down, DB error, ...).
 *
 * F-65: this is also the single place where server-side failures reach the
 * external error pipeline. Every server action already funnels through here,
 * so wiring the transport into `reportError` once covers all of them instead of
 * needing an extra call at each catch site. `quiet: true` because `emit` below
 * has already written the structured log record — without it an unconfigured
 * deployment would print the same failure twice.
 */
export function logError(scope: string, error: unknown, context: LogContext = {}) {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined
  emit("error", scope, message, stack ? { ...context, stack } : context)
  reportError(error, { scope: "server-action", action: scope, quiet: true, extra: { ...context } })
}

/** Degraded-but-handled path (fallback used, outage already in progress). */
export function logWarn(scope: string, message: string, context: LogContext = {}) {
  emit("warn", scope, message, context)
}
