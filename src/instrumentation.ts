import { logError } from "@/lib/observability/log"

/**
 * F-72 — structured `unhandledRejection` handling.
 *
 * The decision the register asked for, made explicitly:
 *
 *   Option A (fail fast at boot) was REJECTED: a Postgres outage at boot
 *   would take down the *whole* process, including the storefront routes
 *   that degrade cleanly today (`/ar` answers 200 via MOCK_CATALOG_FALLBACK,
 *   content pages render, only catalog/admin surfaces fail). Trading
 *   graceful degradation for a hard outage is the wrong trade for a
 *   revenue-facing storefront.
 *
 *   Option B (this file) — a structured process-level handler that LOGS and
 *   REPORTS instead of letting Node's default (terminate the process) fire.
 *   The masking risk the register worried about is addressed three ways:
 *     1. every event goes through the same structured log + the F-65
 *        reporting pipeline, so nothing disappears silently — an ops team
 *        sees these the same way it sees handled errors;
 *     2. the handler records the rejection's identity (reason type/message/
 *        stack) rather than a counter, so a *new* bug is distinguishable
 *        from the known Payload-init quirk in the logs;
 *     3. the known trigger is documented here and in OPS: with Postgres
 *        unreachable, `@payloadcms/next`'s init leaves a floating promise
 *        whose rejection reason is literally `undefined`. That is a
 *        framework quirk, not application state worth dying for.
 *
 * Next calls `register()` once per server instance (Node runtime only),
 * before any route code runs.
 */
export function handleUnhandledRejection(reason: unknown): void {
  const described =
    reason instanceof Error
      ? { message: reason.message, stack: reason.stack }
      : { message: String(reason), stack: undefined }
  // logError() feeds the F-65 reporting pipeline itself (quietly, and it
  // never throws), so one call both logs structuredly and reports — a
  // failure inside the reporter cannot become the next unhandled rejection.
  logError("process:unhandledRejection", reason instanceof Error ? reason : new Error(described.message), {
    reasonType: reason === undefined ? "undefined" : typeof reason,
    note: "F-72: kept alive by design — see src/instrumentation.ts",
  })
}

export function register(): void {
  if (typeof process === "undefined") return
  process.on("unhandledRejection", (reason) => {
    handleUnhandledRejection(reason)
  })
}
