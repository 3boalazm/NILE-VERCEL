/**
 * Shared outbound-email configuration (F-52).
 *
 * Two systems in this repo send email and they were previously configured
 * independently and inconsistently:
 *
 *  - **Vendure** (`src/vendure-config.ts`) sends the transactional commerce
 *    mail — password reset, email verification, order confirmation. It was
 *    hard-wired to `devMode: true` (writes .eml files to `static/email/`) and
 *    its template links pointed at a dead scaffold origin
 *    (`http://localhost:8080/password-reset`), so even a "sent" reset mail
 *    would have linked nowhere.
 *  - **Payload** (`src/payload.config.ts`) sends CMS-side mail (admin
 *    notifications, inquiry alerts). No adapter was configured at all, so it
 *    fell back to Payload's console transport.
 *
 * This module is the single place that decides *how* mail leaves the building.
 * It exposes plain SMTP **options** rather than a live transport, because that
 * is what Vendure's `EmailPlugin` expects; the Payload adapter wraps the same
 * options in `nodemailer.createTransport` itself (see `payload-adapter.ts`).
 *
 * Deliberately free of `payload`/`@vendure` imports so both runtimes — the
 * Next.js server and the separately-compiled Vendure server — can use it
 * without dragging the other's dependency graph along.
 */

/** SMTP connection + identity, or `null` when email is not configured. */
export interface SmtpSettings {
  host: string
  port: number
  secure: boolean
  auth?: { user: string; pass: string }
  fromAddress: string
  fromName: string
}

/**
 * Reads SMTP configuration from the environment.
 *
 * Returns `null` unless `SMTP_HOST` is set — a half-configured mailer (host
 * with no credentials, or credentials with no host) is worse than none, since
 * it fails at send time on a request path instead of degrading predictably.
 * Callers treat `null` as "keep the existing dev/console behaviour", which is
 * the correct posture for local development and CI.
 */
export function getSmtpSettings(): SmtpSettings | null {
  const host = process.env.SMTP_HOST?.trim()
  if (!host) return null

  const port = Number(process.env.SMTP_PORT ?? 587)
  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASS

  const fromAddress =
    process.env.EMAIL_FROM_ADDRESS?.trim() || `noreply@${host.replace(/^smtp\./, "")}`
  const fromName = process.env.EMAIL_FROM_NAME?.trim() || "Nile Pharma Food"

  return {
    host,
    port: Number.isFinite(port) && port > 0 ? port : 587,
    // SMTP_SECURE=true means "implicit TLS on connect" (port 465). The default
    // is false = STARTTLS upgrade on 587, which is what most providers want.
    secure: /^(1|true|yes)$/i.test(process.env.SMTP_SECURE ?? ""),
    // Only attach auth when both halves exist — nodemailer treats a user with
    // no password as an error rather than as "anonymous".
    ...(user && pass ? { auth: { user, pass } } : {}),
    fromAddress,
    fromName,
  }
}

/**
 * The transport shape Vendure's `EmailPlugin` accepts. Kept separate from
 * {@link SmtpSettings} so the `fromAddress`/`fromName` identity fields (which
 * belong to the message, not the connection) do not leak into the transport.
 */
export function getVendureEmailTransport() {
  const settings = getSmtpSettings()
  if (!settings) return null
  return {
    type: "smtp" as const,
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    ...(settings.auth ? { auth: settings.auth } : {}),
  }
}

/** RFC-style `From` header value, e.g. `"Nile Pharma Food" <noreply@…>`. */
export function getFromAddress(): string {
  const settings = getSmtpSettings()
  if (!settings) return '"Nile Pharma Food" <noreply@example.com>'
  return `"${settings.fromName}" <${settings.fromAddress}>`
}

/**
 * Absolute origin used to build links inside outbound email.
 *
 * Every previous value in this repo was a hard-coded `http://localhost:8080`
 * scaffold — which is exactly why the password-reset link was dead. Order:
 * `STOREFRONT_URL` (explicit, preferred), then `NEXT_PUBLIC_SERVER_URL` (often
 * already set for the storefront build), then a local dev default.
 */
export function getStorefrontUrl(): string {
  const raw =
    process.env.STOREFRONT_URL?.trim() ||
    process.env.NEXT_PUBLIC_SERVER_URL?.trim() ||
    "http://localhost:3000"
  return raw.replace(/\/+$/, "")
}

/**
 * Locale-prefixed storefront URL. Transactional mail in this project is sent
 * in the customer's locale where Vendure knows it; the reset link must land on
 * a real localized route, so `ar` (the default locale) is the safe baseline.
 */
export function getLocalizedStorefrontUrl(locale: "ar" | "en" = "ar"): string {
  return `${getStorefrontUrl()}/${locale}`
}

/**
 * Re-exported for the one consumer that needs a live transport (the Payload
 * adapter), so `nodemailer` stays a single, explicit dependency of this module
 * rather than something each caller imports separately.
 */
export { default as nodemailer } from "nodemailer"
