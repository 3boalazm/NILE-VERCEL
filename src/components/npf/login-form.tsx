"use client"

import { getRecoveryCopy } from "@/lib/i18n/recovery"
import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2Icon } from "lucide-react"

import { login } from "@/lib/auth/actions"
import { getSafeLoginRedirect } from "@/lib/auth/redirect"
import { reconcileWishlist } from "@/lib/wishlist"
import { getCommonErrors } from "@/lib/i18n/common-errors"
import type { Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/dictionaries"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { reportError } from "@/lib/telemetry/report-error"
import { PasswordField } from "@/components/npf/password-field"

type AuthDictionary = Dictionary["auth"]

export function NPFLoginForm({ locale, dictionary }: { locale: Locale; dictionary: AuthDictionary }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const base = `/${locale}`
  // Supports "log in to continue" flows (e.g. a future protected checkout
  // step) without hardcoding a single post-login destination.
  const redirectTo = getSafeLoginRedirect(searchParams.get("redirect"), locale)
  const common = getCommonErrors(locale)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    const data = new FormData(event.currentTarget)
    try {
      const result = await login(String(data.get("email") ?? ""), String(data.get("password") ?? ""))
      if (!result.ok) {
        setError(
          result.error === "INVALID_CREDENTIALS_ERROR"
            ? dictionary.loginErrorInvalid
            : result.error === "rate_limited"
              ? dictionary.loginErrorRateLimited
              : dictionary.loginErrorGeneric
        )
        return
      }
      // F-20: with the session now live, reconcile (pull account → merge →
      // push union) — fire-and-forget: a sync failure must never break or
      // delay the login navigation; it converges on the next wishlist visit.
      reconcileWishlist().catch(() => {})
      router.push(redirectTo)
      router.refresh()
    } catch (error) {
      // F-65: a dropped connection here is invisible server-side, so the
      // failure is reported as well as shown (rate-limited, never throws).
      reportError(error, { scope: "client", action: "login" })
      // F-64: the visitor's own connection dropped mid-submit, so the action
      // call rejected and no `result` ever came back. Previously this left the
      // button disabled and the spinner running with no message at all — now
      // it reports the drop and stays retryable.
      setError(common.networkError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form method="post" aria-busy={submitting} aria-describedby={error ? "form-feedback" : undefined} onSubmit={handleSubmit} className="ngc-form">
      <div className="ngc-field">
        <Label htmlFor="email">{dictionary.loginEmail} *</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="ngc-field">
        <PasswordField
          id="password"
          name="password"
          label={dictionary.loginPassword + " *"}
          showLabel={dictionary.showPassword}
          hideLabel={dictionary.hidePassword}
          autoComplete="current-password"
          minLength={6}
          required
          invalid={Boolean(error)}
          describedBy={error ? "form-feedback" : undefined}
          labelSuffix={
            /* F-04: recovery entry point. Sits on the password row (the place
               people look when they cannot remember it) rather than buried
               under the submit button. */
            <Link href={`${base}/login/forgot-password`}>
              {dictionary.forgotPasswordLink}
            </Link>
          }
        />
      </div>

      <Link href={`${base}/forgot-password`} className="ngc-quiet justify-self-start">{getRecoveryCopy(locale).forgot}</Link>
      {error && (
        <p className="ngc-alert" id="form-feedback" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="ng-btn ng-btn-primary ng-btn-lg ngc-block"
      >
        {submitting && <Loader2Icon className="size-4 animate-spin" />}
        {submitting ? dictionary.loginSubmitting : dictionary.loginSubmit}
      </button>

      <p className="ngc-form-foot">
        {dictionary.loginNoAccount}{" "}
        <Link href={`${base}/register`} className="ngc-inline-link">
          {dictionary.loginRegisterLink}
        </Link>
      </p>
    </form>
  )
}
