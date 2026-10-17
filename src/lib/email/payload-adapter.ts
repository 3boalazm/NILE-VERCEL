import type { EmailAdapter, SendEmailOptions } from "payload"

import { getSmtpSettings, nodemailer } from "./mailer"

/**
 * Payload email adapter backed by the shared SMTP settings (F-52).
 *
 * Payload previously had no `email` config at all, so it used its built-in
 * console transport — the "Email will be written to console" warning seen
 * during testing. That is the right behaviour for local dev and CI, but it
 * meant no CMS-side mail could ever actually be delivered in production.
 *
 * This adapter keeps that safe fallback while adding a real path: when
 * `SMTP_HOST` is set it sends over SMTP, otherwise it logs the message and
 * resolves successfully rather than throwing. Failing loudly here would turn
 * an unconfigured mailer into a broken inquiry submission — the mail is a
 * side-effect of that flow, not its purpose.
 */
export const npfEmailAdapter: EmailAdapter = ({ payload }) => {
  const settings = getSmtpSettings()

  // Built once per adapter init, not per message: nodemailer reuses the
  // connection pool across sends.
  const transport = settings
    ? nodemailer.createTransport({
        host: settings.host,
        port: settings.port,
        secure: settings.secure,
        ...(settings.auth ? { auth: settings.auth } : {}),
      })
    : null

  return {
    name: "npf-smtp-email",
    defaultFromAddress: settings?.fromAddress ?? "noreply@example.com",
    defaultFromName: settings?.fromName ?? "Nile Pharma Food",
    sendEmail: async (message: SendEmailOptions) => {
      if (!transport) {
        payload.logger.info(
          { to: message.to, subject: message.subject },
          "[email] SMTP not configured (set SMTP_HOST) — message logged, not sent"
        )
        return { delivered: false, reason: "smtp_not_configured" as const }
      }
      const info = await transport.sendMail({
        // Spread first, then override `from`: doing it the other way round
        // would let an absent `message.from` clobber the default with
        // `undefined`. Payload normalizes `from` itself (nodemailer v8 changed
        // its shape), so only supply the identity when the caller did not.
        ...message,
        from:
          message.from ??
          `"${settings?.fromName ?? "Nile Pharma Food"}" <${settings?.fromAddress ?? "noreply@example.com"}>`,
      })
      return { delivered: true, messageId: info.messageId }
    },
  }
}
