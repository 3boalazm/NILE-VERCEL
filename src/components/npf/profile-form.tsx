"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Loader2Icon, PencilIcon } from "lucide-react"

import { updateProfile } from "@/lib/auth/actions"
import { getCommonErrors } from "@/lib/i18n/common-errors"
import type { Customer } from "@/lib/auth/types"
import type { Dictionary } from "@/lib/i18n/dictionaries"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
      <div className="ngc-stack">
        <dl className="ngc-kv">
          <div>
            <dt>{dictionary.profileNameLabel}</dt>
            <dd>{`${customer.firstName} ${customer.lastName}`.trim()}</dd>
          </div>
          <div>
            <dt>{dictionary.profileEmailLabel}</dt>
            <dd dir="ltr">
              {customer.email}
            </dd>
          </div>
          <div>
            <dt>{dictionary.profilePhoneLabel}</dt>
            <dd dir="ltr">
              {customer.phone || dictionary.profileNotProvided}
            </dd>
          </div>
        </dl>
        <p className="ngc-note">{dictionary.profileEmailPhoneNote}</p>
        {saved && <p role="status" className="ngc-ok">{dictionary.profileSaved}</p>}
        <button
          type="button"
          onClick={() => {
            setSaved(false)
            setEditing(true)
          }}
          className="ng-btn justify-self-start"
        >
          <PencilIcon className="size-3.5" />
          {dictionary.profileEditCta}
        </button>
      </div>
    )
  }

  return (
    <form method="post" aria-busy={submitting} aria-describedby={error ? "form-feedback" : undefined} onSubmit={handleSubmit} className="ngc-panel ngc-form">
      <div className="ngc-grid-2">
        <div className="ngc-field">
          <Label htmlFor="firstName">{dictionary.profileFirstName} *</Label>
          <Input id="firstName" name="firstName" defaultValue={customer.firstName} required autoComplete="given-name" />
        </div>
        <div className="ngc-field">
          <Label htmlFor="lastName">{dictionary.profileLastName} *</Label>
          <Input id="lastName" name="lastName" defaultValue={customer.lastName} required autoComplete="family-name" />
        </div>
      </div>

      {error && (
        <p className="ngc-alert" id="form-feedback" role="alert">
          {error}
        </p>
      )}

      <div className="ngc-actions">
        <button
          type="submit"
          disabled={submitting}
          className="ng-btn ng-btn-primary"
        >
          {submitting && <Loader2Icon className="size-4 animate-spin" />}
          {submitting ? dictionary.profileSaving : dictionary.profileSaveCta}
        </button>
        <button type="button" onClick={() => setEditing(false)} className="ng-btn ng-btn-ghost">
          {dictionary.cancelCta}
        </button>
      </div>
    </form>
  )
}
