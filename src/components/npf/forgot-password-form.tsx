"use client"

/**
 * Password recovery request form (F-04).
 *
 * Success copy is uniform by design — the server action returns `ok: true`
 * whether or not the address exists (see `requestPasswordReset`), because a
 * distinguishable failure would let anyone enumerate which emails hold an
 * account. The message therefore says "if that email is registered…", and the
 * form does not reveal the difference.
 */

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { ArrowLeftIcon, CheckCircle2Icon, Loader2Icon } from "lucide-react"

import { requestPasswordReset } from "@/lib/auth/actions"
import { getCommonErrors } from "@/lib/i18n/common-errors"
import type { Dictionary } from "@/lib/i18n/dictionaries"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { reportError } from "@/lib/telemetry/report-error"

type AuthDictionary = Dictionary["auth"]

export function NPFForgotPasswordForm({
  locale,
  dictionary,
}: {
  locale: string
  dictionary: AuthDictionary
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const common = getCommonErrors(locale)
  const base = `/${locale}`

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    const data = new FormData(event.currentTarget)
    try {
      const result = await requestPasswordReset(String(data.get("email") ?? ""))
      if (!result.ok) {
        setError(
          result.error === "rate_limited"
            ? dictionary.forgotPasswordErrorRateLimited
            : dictionary.forgotPasswordErrorGeneric
        )
        return
      }
      setSent(true)
    } catch (error) {
      // F-65: a dropped connection here is invisible server-side, so the
      // failure is reported as well as shown (rate-limited, never throws).
      reportError(error, { scope: "client", action: "requestPasswordReset" })
      // F-64: the browser's own connection dropped mid-submit, so the action
      // call rejected before any result could be returned. Without this the
      // spinner would spin forever with the button disabled.
      setError(common.networkError)
    } finally {
      setSubmitting(false)
    }
  }

  // Terminal state: the only useful next action is checking the inbox, so the
  // form is replaced rather than left submittable (which would invite repeat
  // requests that the rate limiter would then refuse).
  if (sent) {
    return (
      <div className="ngc-form text-center" role="status">
        <span className="ngc-empty-icon justify-self-center" data-tone="ok" aria-hidden="true">
          <CheckCircle2Icon />
        </span>
        <p className="ngc-sub mx-auto">
          {dictionary.forgotPasswordSuccess}
        </p>
        <Link
          href={`${base}/login`}
          className="ng-btn ng-btn-primary ngc-block"
        >
          <ArrowLeftIcon className="size-4 rtl:rotate-180" aria-hidden="true" />
          {dictionary.forgotPasswordBackToLogin}
        </Link>
      </div>
    )
  }

  const errorId = "forgot-password-error"

  return (
    <form method="post" onSubmit={handleSubmit} className="ngc-form">
      <div className="ngc-field">
        <Label htmlFor="email">{dictionary.forgotPasswordEmail} *</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
      </div>

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
        {submitting ? dictionary.forgotPasswordSubmitting : dictionary.forgotPasswordSubmit}
      </button>

      <p className="ngc-form-foot">
        <Link href={`${base}/login`} className="ngc-inline-link">
          {dictionary.forgotPasswordBackToLogin}
        </Link>
      </p>
    </form>
  )
}
