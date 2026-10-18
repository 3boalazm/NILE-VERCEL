"use client"

/**
 * Emailed-token confirmation screen (F-52), shared by `/verify` (account
 * activation) and `/verify-email-change` (address change).
 *
 * The two flows render identically but must call different server actions:
 * Vendure issues a distinct token kind for each, and `verifyCustomerAccount`
 * rejects an address-change token (and vice versa). `mode` selects the action;
 * everything else is shared.
 *
 * Confirmation is a button press rather than an automatic on-mount call on
 * purpose — an emailed link is frequently prefetched by mail scanners and
 * browser link previews, and a token must be single-use. Auto-submitting on
 * render would let a scanner consume the visitor's token before they arrive.
 */

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { CheckCircle2Icon, Loader2Icon } from "lucide-react"

import { confirmEmailAddressChange, verifyCustomerAccount } from "@/lib/auth/actions"
import { getCommonErrors } from "@/lib/i18n/common-errors"
import type { Dictionary } from "@/lib/i18n/dictionaries"
import { reportError } from "@/lib/telemetry/report-error"

type AuthDictionary = Dictionary["auth"]

export type VerifyTokenMode = "account" | "email-change"

export function NPFVerifyTokenForm({
  locale,
  dictionary,
  token,
  mode,
}: {
  locale: string
  dictionary: AuthDictionary
  token: string
  mode: VerifyTokenMode
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const common = getCommonErrors(locale)
  const base = `/${locale}`

  const isAccount = mode === "account"
  const title = isAccount ? dictionary.verifyAccountTitle : dictionary.verifyEmailChangeTitle
  const body = isAccount ? dictionary.verifyAccountBody : dictionary.verifyEmailChangeBody
  const successCopy = isAccount ? dictionary.verifyAccountSuccess : dictionary.verifyEmailChangeSuccess

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const result = isAccount
        ? await verifyCustomerAccount(token)
        : await confirmEmailAddressChange(token)
      if (!result.ok) {
        setError(
          result.error === "rate_limited"
            ? dictionary.verifyTokenErrorRateLimited
            : result.error && /token/i.test(result.error)
              ? dictionary.verifyTokenErrorInvalidToken
              : dictionary.verifyTokenErrorGeneric
        )
        return
      }
      setDone(true)
    } catch (error) {
      // F-65: a dropped connection here is invisible server-side, so the
      // failure is reported as well as shown (rate-limited, never throws).
      reportError(error, { scope: "client", action: "verifyToken" })
      // F-64: browser-side connection drop — report it and stay retryable.
      setError(common.networkError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="ngc-form">
      <div className="ngc-stack text-center" style={{ ["--ngc-gap" as string]: "10px" }}>
        <h1 className="ngc-title ngc-title-sm">{title}</h1>
        <p className="ngc-sub mx-auto">{body}</p>
      </div>

      {done ? (
        <div className="ngc-form text-center" role="status">
          <span className="ngc-empty-icon justify-self-center" data-tone="ok" aria-hidden="true">
            <CheckCircle2Icon />
          </span>
          <p className="ngc-sub mx-auto">{successCopy}</p>
          <Link
            href={`${base}/login`}
            className="ng-btn ng-btn-primary ngc-block"
          >
            {dictionary.loginSubmit}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="ngc-form">
          {error && (
            <p id="verify-token-error" className="ngc-alert" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting || !token}
            aria-describedby={error ? "verify-token-error" : undefined}
            className="ng-btn ng-btn-primary ng-btn-lg ngc-block"
          >
            {submitting && <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />}
            {submitting ? dictionary.verifyTokenSubmitting : dictionary.verifyTokenSubmit}
          </button>
          {/* An expired or already-used link is the common failure here, so the
              way back to sign-in is always offered. */}
          <Link
            href={`${base}/login`}
            className="ngc-quiet justify-self-center"
          >
            {dictionary.forgotPasswordBackToLogin}
          </Link>
        </form>
      )}
    </div>
  )
}
