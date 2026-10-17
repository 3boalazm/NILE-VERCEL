"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { Loader2Icon, CheckCircle2Icon, TriangleAlertIcon } from "lucide-react"

import type { Dictionary } from "@/lib/i18n/dictionaries"
import { submitContactInquiry } from "@/lib/contact/actions"
import { getCommonErrors } from "@/lib/i18n/common-errors"
import { FIELD_LIMITS } from "@/lib/forms/field-limits"
import { ctaButtonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { reportError } from "@/lib/telemetry/report-error"

/** Only the plain-string slice of the dictionary this form needs — never pass
 * the full Dictionary into a Client Component, it contains functions (e.g.
 * products.resultsCount) that can't cross the server/client boundary. */
type ContactFormDictionary = Dictionary["contact"]

// Upper bound on the message body — server-side validation in
// submitContactInquiry() enforces the same cap, this just keeps the
// textarea honest before anything is sent.

export function NPFContactForm({
  locale,
  dictionary,
  contactEmail,
  initialSubject,
  routing,
  routingTitle,
  routingBody,
  careers,
}: {
  locale: string
  dictionary: ContactFormDictionary
  contactEmail: string
  initialSubject?: string
  /** Quick-pick subjects ("supply request", "scientific enquiry", …) — set the
   * subject field so the team can triage from the first line. */
  routing?: Array<{ label: string; subject: string }>
  routingTitle?: string
  routingBody?: string
  /** Optional escape hatch to the careers page, for people who came here to
   * apply for a job rather than to send a message. */
  careers?: { href: string; label: string }
}) {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(false)
  // Distinct from `error`: a validation/server failure points the visitor at
  // the email address as an alternative channel, while a dropped connection
  // only needs a retry — telling them to email instead would be wrong advice.
  const [networkError, setNetworkError] = useState(false)
  const [messageLength, setMessageLength] = useState(0)
  const common = getCommonErrors(locale)
  const [subject, setSubject] = useState(initialSubject ?? "")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting || submitted) return
    setSubmitting(true)
    setError(false)
    setNetworkError(false)
    const data = new FormData(event.currentTarget)
    try {
      const result = await submitContactInquiry({
        name: String(data.get("name") ?? ""),
        email: String(data.get("email") ?? ""),
        phone: String(data.get("phone") ?? ""),
        company: String(data.get("company") ?? ""),
        subject: String(data.get("subject") ?? ""),
        message: String(data.get("message") ?? ""),
        locale,
      })
      if (!result.ok) {
        setError(true)
        return
      }
      setSubmitted(true)
    } catch (error) {
      // F-65: a dropped connection here is invisible server-side, so the
      // failure is reported as well as shown (rate-limited, never throws).
      reportError(error, { scope: "client", action: "submitContact" })
      // F-64: the visitor's connection dropped mid-submit, so the action call
      // rejected before returning a result. Previously the spinner cleared and
      // the form said nothing at all, which reads as "my message was sent".
      setNetworkError(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-6" role="status">
        <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2Icon className="size-5" />
        </span>
        <p className="font-medium">{dictionary.formSubmittedNotice}</p>
      </div>
    )
  }

  return (
    <form aria-busy={submitting} aria-describedby={error ? "form-feedback" : undefined} onSubmit={handleSubmit} className="flex flex-col gap-4">
      {routing && routing.length > 0 && (
        <fieldset className="flex flex-col gap-3 rounded-2xl border border-dashed p-4">
          <legend className="px-1 text-sm font-medium">{routingTitle}</legend>
          {routingBody && <p className="text-xs text-muted-foreground">{routingBody}</p>}
          <div className="flex flex-wrap gap-2">
            {routing.map((option) => {
              const active = subject === option.subject
              return (
                <button
                  key={option.subject}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSubject(option.subject)}
                  className={cn(
                    "rounded-full border px-3.5 py-2 text-xs font-medium transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {option.label}
                </button>
              )
            })}
            {careers && (
              <Link
                href={careers.href}
                className="rounded-full border border-border px-3.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {careers.label}
              </Link>
            )}
          </div>
        </fieldset>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">{dictionary.formName} *</Label>
          <Input id="name" name="name" required autoComplete="name" maxLength={FIELD_LIMITS.personName} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">{dictionary.formEmail} *</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" maxLength={FIELD_LIMITS.emailAddress} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">{dictionary.formPhone}</Label>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={FIELD_LIMITS.phoneNumber} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="company">{dictionary.formCompany}</Label>
          <Input id="company" name="company" autoComplete="organization" maxLength={FIELD_LIMITS.organization} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="subject">{dictionary.formSubject} *</Label>
        <Input
          id="subject"
          name="subject"
          required
          maxLength={FIELD_LIMITS.subject}
          value={subject}
          onChange={(event) => setSubject(event.currentTarget.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="message">{dictionary.formMessage} *</Label>
        <Textarea
          id="message"
          name="message"
          rows={5}
          required
          maxLength={FIELD_LIMITS.message}
          onChange={(event) => setMessageLength(event.target.value.length)}
        />
        <p className="text-end text-xs tabular-nums text-muted-foreground">
          {messageLength} / {FIELD_LIMITS.message}
        </p>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className={cn(ctaButtonVariants({ variant: "onLight" }), "w-fit disabled:opacity-70")}
      >
        {submitting && <Loader2Icon className="size-4 animate-spin" />}
        {submitting ? dictionary.formSending : dictionary.formSubmit}
      </button>
      {networkError && (
        <p className="flex items-start gap-1.5 text-sm text-destructive" role="alert">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
          {common.networkError}
        </p>
      )}
      {error && (
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-destructive" id="form-feedback" role="alert">
          <TriangleAlertIcon className="size-4 shrink-0" />
          {dictionary.formError}{" "}
          <Link href={`mailto:${contactEmail}`} className="font-medium underline underline-offset-2">
            {contactEmail}
          </Link>
        </p>
      )}
    </form>
  )
}
