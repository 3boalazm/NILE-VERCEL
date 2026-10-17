"use client"

import { useState, type FormEvent } from "react"
import { Loader2Icon, CheckCircle2Icon, TriangleAlertIcon } from "lucide-react"

import type { Dictionary } from "@/lib/i18n/dictionaries"
import { submitContactInquiry } from "@/lib/contact/actions"
import { ctaButtonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

/** Plain-string slice only — the full Dictionary carries functions. */
type ApplyDictionary = Dictionary["careers"] & Dictionary["contact"]

const MAX_MESSAGE_LENGTH = 2000

/**
 * Application form for a single posting. Deliberately reuses
 * `submitContactInquiry` instead of adding a second write path: applications
 * land in the same `inquiries` collection the team already triages, with the
 * role name baked into the subject so they can be filtered there. No new
 * table, no new rate-limit surface, no duplicate spam defense.
 */
export function NPFJobApplicationForm({
  locale,
  dictionary,
  jobTitle,
}: {
  locale: string
  dictionary: ApplyDictionary
  jobTitle: string
}) {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(false)
  const [messageLength, setMessageLength] = useState(0)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting || submitted) return
    setSubmitting(true)
    setError(false)
    const data = new FormData(event.currentTarget)
    const result = await submitContactInquiry({
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      company: "",
      subject: `${dictionary.applySubjectPrefix} ${jobTitle}`.slice(0, 200),
      message: String(data.get("message") ?? ""),
      locale,
    })
    setSubmitting(false)
    if (!result.ok) {
      setError(true)
      return
    }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-6">
        <CheckCircle2Icon className="size-5 text-primary" aria-hidden="true" />
        <p className="text-sm leading-relaxed">{dictionary.formSubmittedNotice}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="apply-name">{dictionary.formName}</Label>
          <Input id="apply-name" name="name" required autoComplete="name" maxLength={120} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="apply-email">{dictionary.formEmail}</Label>
          <Input id="apply-email" name="email" type="email" required autoComplete="email" maxLength={254} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="apply-phone">{dictionary.formPhone}</Label>
        <Input id="apply-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="apply-message">{dictionary.formMessage}</Label>
        <Textarea
          id="apply-message"
          name="message"
          required
          rows={6}
          maxLength={MAX_MESSAGE_LENGTH}
          onChange={(event) => setMessageLength(event.currentTarget.value.length)}
        />
        <span className="self-end text-xs text-muted-foreground">
          {messageLength}/{MAX_MESSAGE_LENGTH}
        </span>
      </div>

      {error && (
        <p className="flex items-center gap-2 text-sm text-destructive">
          <TriangleAlertIcon className="size-4" aria-hidden="true" />
          {dictionary.formError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className={cn(ctaButtonVariants({ variant: "onLight" }), "w-fit disabled:opacity-60")}
      >
        {submitting && <Loader2Icon className="me-2 size-4 animate-spin" aria-hidden="true" />}
        {submitting ? dictionary.formSending : dictionary.applyCta}
      </button>
    </form>
  )
}
