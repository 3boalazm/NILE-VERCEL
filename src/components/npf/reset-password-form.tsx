"use client"

/**
 * Password recovery confirm form (F-04).
 *
 * Consumes the emailed token. Client-side validation mirrors the server
 * action (`resetPassword`) purely for feedback speed — the action re-checks
 * everything, because it is a public endpoint and the browser cannot be
 * trusted.
 */

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { CheckCircle2Icon, Loader2Icon } from "lucide-react"

import { resetPassword } from "@/lib/auth/actions"
import { getCommonErrors } from "@/lib/i18n/common-errors"
import type { Dictionary } from "@/lib/i18n/dictionaries"
import { reportError } from "@/lib/telemetry/report-error"
import { PasswordField } from "@/components/npf/password-field"

type AuthDictionary = Dictionary["auth"]

export function NPFResetPasswordForm({
  locale,
  dictionary,
  token,
}: {
  locale: string
  dictionary: AuthDictionary
  token: string
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const common = getCommonErrors(locale)
  const base = `/${locale}`

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const data = new FormData(event.currentTarget)
    const password = String(data.get("password") ?? "")
    const confirm = String(data.get("confirmPassword") ?? "")

    // Cheap pre-flight so the visitor gets an instant, specific answer instead
    // of a round-trip that would be rejected server-side anyway.
    if (password !== confirm) {
      setError(dictionary.resetPasswordErrorMismatch)
      return
    }
    if (password.length < 6) {
      setError(dictionary.resetPasswordErrorWeak)
      return
    }

    setSubmitting(true)
    try {
      const result = await resetPassword(token, password, confirm)
      if (!result.ok) {
        setError(
          result.error === "PasswordResetTokenInvalidError" ||
            result.error === "PasswordResetTokenExpiredError" ||
            result.error === "invalid_token"
            ? dictionary.resetPasswordErrorInvalidToken
            : result.error === "password_mismatch"
              ? dictionary.resetPasswordErrorMismatch
              : result.error === "password_too_short" || result.error === "PasswordValidationError"
                ? dictionary.resetPasswordErrorWeak
                : result.error === "rate_limited"
                  ? dictionary.resetPasswordErrorRateLimited
                  : dictionary.resetPasswordErrorGeneric
        )
        return
      }
      setDone(true)
    } catch (error) {
      // F-65: a dropped connection here is invisible server-side, so the
      // failure is reported as well as shown (rate-limited, never throws).
      reportError(error, { scope: "client", action: "resetPassword" })
      // F-64: browser-side connection drop — surface it and stay retryable.
      setError(common.networkError)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="ngc-form text-center" role="status">
        <span className="ngc-empty-icon justify-self-center" data-tone="ok" aria-hidden="true">
          <CheckCircle2Icon />
        </span>
        <p className="ngc-sub mx-auto">
          {dictionary.resetPasswordSuccess}
        </p>
        <Link
          href={`${base}/login`}
          className="ng-btn ng-btn-primary ngc-block"
        >
          {dictionary.loginSubmit}
        </Link>
      </div>
    )
  }

  const errorId = "reset-password-error"

  return (
    <form method="post" onSubmit={handleSubmit} className="ngc-form">
      {/* F-59: same show/hide toggle as every other password field on the
          site — resetting a password you can't see is peak frustration. */}
      <PasswordField
        id="password"
        name="password"
        label={`${dictionary.resetPasswordPassword} *`}
        showLabel={dictionary.showPassword}
        hideLabel={dictionary.hidePassword}
        hint={dictionary.resetPasswordHint}
        autoComplete="new-password"
        minLength={6}
        required
        invalid={Boolean(error)}
        describedBy={error ? errorId : undefined}
      />

      <PasswordField
        id="confirmPassword"
        name="confirmPassword"
        label={`${dictionary.resetPasswordConfirm} *`}
        showLabel={dictionary.showPassword}
        hideLabel={dictionary.hidePassword}
        autoComplete="new-password"
        minLength={6}
        required
        invalid={Boolean(error)}
        describedBy={error ? errorId : undefined}
      />

      {error && (
        <p id={errorId} className="ngc-alert" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="ng-btn ng-btn-primary ng-btn-lg ngc-block"
      >
        {submitting && <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />}
        {submitting ? dictionary.resetPasswordSubmitting : dictionary.resetPasswordSubmit}
      </button>

      {/* An expired/invalid link is the most common way to land here with no
          token at all, so the escape hatch is always visible. */}
      <p className="ngc-form-foot">
        <Link href={`${base}/login/forgot-password`} className="ngc-inline-link">
          {dictionary.resetPasswordRequestLink}
        </Link>
      </p>
    </form>
  )
}
