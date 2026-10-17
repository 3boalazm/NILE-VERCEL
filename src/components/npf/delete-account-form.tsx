"use client"

import { useState, type FormEvent } from "react"
import { Loader2Icon, TriangleAlertIcon } from "lucide-react"

import { requestAccountDeletion } from "@/lib/auth/actions"
import { getCommonErrors } from "@/lib/i18n/common-errors"
import type { Dictionary } from "@/lib/i18n/dictionaries"
import { cn } from "@/lib/utils"
import { reportError } from "@/lib/telemetry/report-error"

type AuthDictionary = Dictionary["auth"]

/**
 * F-58 — account deletion (GDPR erasure) request.
 *
 * Deliberately a *request*, and deliberately saying so: Vendure's shop API
 * exposes no customer-delete mutation (erasure is an admin operation), so any
 * UI that claimed instant deletion would be lying. This form records a
 * verified request server-side (`erasure-requests` collection) that ops
 * executes per docs/OPS.md within the GDPR window; the copy here states the
 * real timeline instead of promising magic. The confirmation checkbox gates
 * the destructive intent, and the whole block is visually a danger zone.
 */
export function DeleteAccountForm({ locale, dictionary }: { locale: string; dictionary: AuthDictionary }) {
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const common = getCommonErrors(locale)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const result = await requestAccountDeletion({ locale, confirmed: true })
      if (result.ok) {
        setDone(true)
      } else if (result.error === "rate_limited") {
        setError(dictionary.deleteAccountRateLimited)
      } else {
        setError(dictionary.deleteAccountError)
      }
    } catch (err) {
      reportError(err, { scope: "client", action: "requestAccountDeletion" })
      setError(common.networkError)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <p role="status" className="rounded-xl border border-border bg-muted/30 p-4 text-sm leading-relaxed">
        {dictionary.deleteAccountSuccess}
      </p>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
    >
      <p className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
        <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
        {dictionary.deleteAccountBody}
      </p>
      <label className="flex cursor-pointer items-start gap-2 text-sm">
        <input type="checkbox" name="confirmed" required className="mt-0.5 shrink-0" />
        {dictionary.deleteAccountConfirmLabel}
      </label>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className={cn(
          "inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-full bg-destructive px-5 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
        )}
      >
        {submitting && <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />}
        {dictionary.deleteAccountCta}
      </button>
    </form>
  )
}
