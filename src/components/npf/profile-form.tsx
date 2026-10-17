"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Loader2Icon, PencilIcon } from "lucide-react"

import { updateProfile } from "@/lib/auth/actions"
import { getCommonErrors } from "@/lib/i18n/common-errors"
import type { Customer } from "@/lib/auth/types"
import type { Dictionary } from "@/lib/i18n/dictionaries"
import { ctaButtonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { reportError } from "@/lib/telemetry/report-error"

type AuthDictionary = Dictionary["auth"]

export function ProfileForm({
  locale,
  customer,
  dictionary,
}: {
  locale: string
  customer: Customer
  dictionary: AuthDictionary
}) {
  const [editing, setEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const router = useRouter()
  const common = getCommonErrors(locale)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    const data = new FormData(event.currentTarget)
    try {
      const result = await updateProfile({
        firstName: String(data.get("firstName") ?? "").trim(),
        lastName: String(data.get("lastName") ?? "").trim(),
      })
      if (!result.ok) {
        setError(dictionary.profileSaveError)
        return
      }
      setEditing(false)
      setSaved(true)
      router.refresh()
    } catch (error) {
      // F-65: a dropped connection here is invisible server-side, so the
      // failure is reported as well as shown (rate-limited, never throws).
      reportError(error, { scope: "client", action: "updateProfile" })
      // F-64: connection dropped mid-submit. Stay in edit mode with the typed
      // values intact so the save can simply be retried.
      setError(common.networkError)
    } finally {
      setSubmitting(false)
    }
  }

  if (!editing) {
    return (
      <div className="flex flex-col gap-6">
        <dl className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <dt className="text-sm text-muted-foreground">{dictionary.profileNameLabel}</dt>
            <dd className="font-medium">{`${customer.firstName} ${customer.lastName}`.trim()}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <dt className="text-sm text-muted-foreground">{dictionary.profileEmailLabel}</dt>
            <dd className="font-medium" dir="ltr">
              {customer.email}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <dt className="text-sm text-muted-foreground">{dictionary.profilePhoneLabel}</dt>
            <dd className="font-medium" dir="ltr">
              {customer.phone || dictionary.profileNotProvided}
            </dd>
          </div>
        </dl>
        <p className="text-xs text-muted-foreground">{dictionary.profileEmailPhoneNote}</p>
        {saved && <p className="text-sm text-primary">{dictionary.profileSaved}</p>}
        <button
          type="button"
          onClick={() => {
            setSaved(false)
            setEditing(true)
          }}
          className={cn(ctaButtonVariants({ variant: "outline" }), "w-fit gap-1.5")}
        >
          <PencilIcon className="size-3.5" />
          {dictionary.profileEditCta}
        </button>
      </div>
    )
  }

  return (
    <form aria-busy={submitting} aria-describedby={error ? "form-feedback" : undefined} onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="firstName">{dictionary.profileFirstName} *</Label>
          <Input id="firstName" name="firstName" defaultValue={customer.firstName} required autoComplete="given-name" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lastName">{dictionary.profileLastName} *</Label>
          <Input id="lastName" name="lastName" defaultValue={customer.lastName} required autoComplete="family-name" />
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive" id="form-feedback" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className={cn(ctaButtonVariants({ variant: "onLight" }), "gap-2")}
        >
          {submitting && <Loader2Icon className="size-4 animate-spin" />}
          {submitting ? dictionary.profileSaving : dictionary.profileSaveCta}
        </button>
        <button type="button" onClick={() => setEditing(false)} className={cn(ctaButtonVariants({ variant: "outline" }))}>
          {dictionary.cancelCta}
        </button>
      </div>
    </form>
  )
}
