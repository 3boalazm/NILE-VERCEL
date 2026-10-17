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
import { ctaButtonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
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
      <div className="flex flex-col gap-4 text-center" role="status">
        <CheckCircle2Icon className="mx-auto size-8 text-primary" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-muted-foreground">
          {dictionary.forgotPasswordSuccess}
        </p>
        <Link
          href={`${base}/login`}
          className={cn(ctaButtonVariants({ variant: "onLight" }), "justify-center gap-2")}
        >
          <ArrowLeftIcon className="size-4 rtl:rotate-180" aria-hidden="true" />
          {dictionary.forgotPasswordBackToLogin}
        </Link>
      </div>
    )
  }

  const errorId = "forgot-password-error"

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
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
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className={cn(ctaButtonVariants({ variant: "onLight" }), "w-full justify-center gap-2")}
      >
        {submitting && <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />}
        {submitting ? dictionary.forgotPasswordSubmitting : dictionary.forgotPasswordSubmit}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href={`${base}/login`} className="font-medium text-primary hover:underline">
          {dictionary.forgotPasswordBackToLogin}
        </Link>
      </p>
    </form>
  )
}
