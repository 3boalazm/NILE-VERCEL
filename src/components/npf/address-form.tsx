"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Loader2Icon } from "lucide-react"

import { createAddress } from "@/lib/auth/actions"
import { getCommonErrors } from "@/lib/i18n/common-errors"
import type { Dictionary } from "@/lib/i18n/dictionaries"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { reportError } from "@/lib/telemetry/report-error"

type AuthDictionary = Dictionary["auth"]

export function AddressForm({
  locale,
  dictionary,
  onCancel,
}: {
  locale: string
  dictionary: AuthDictionary
  onCancel: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const common = getCommonErrors(locale)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    const data = new FormData(event.currentTarget)
    try {
      const result = await createAddress({
        fullName: String(data.get("fullName") ?? ""),
        streetLine1: String(data.get("streetLine1") ?? ""),
        city: String(data.get("city") ?? ""),
        province: String(data.get("province") ?? ""),
        phoneNumber: String(data.get("phoneNumber") ?? ""),
      })
      if (!result.ok) {
        setError(dictionary.addressFormError)
        return
      }
      router.refresh()
      onCancel()
    } catch (error) {
      // F-65: a dropped connection here is invisible server-side, so the
      // failure is reported as well as shown (rate-limited, never throws).
      reportError(error, { scope: "client", action: "createAddress" })
      // F-64: connection dropped mid-submit — keep the form open with its
      // values so the address can be re-sent instead of silently lost.
      setError(common.networkError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form method="post" aria-busy={submitting} aria-describedby={error ? "form-feedback" : undefined} onSubmit={handleSubmit} className="ngc-panel ngc-panel-strong ngc-form">
      <h2 className="ngc-h2">{dictionary.addAddressTitle}</h2>
      <div className="ngc-field">
        <Label htmlFor="fullName">{dictionary.addressFormFullName} *</Label>
        <Input id="fullName" name="fullName" required autoComplete="name" />
      </div>
      <div className="ngc-grid-2">
        <div className="ngc-field">
          <Label htmlFor="province">{dictionary.addressFormProvince} *</Label>
          <Input id="province" name="province" required autoComplete="address-level1" />
        </div>
        <div className="ngc-field">
          <Label htmlFor="city">{dictionary.addressFormCity} *</Label>
          <Input id="city" name="city" required autoComplete="address-level2" />
        </div>
      </div>
      <div className="ngc-field">
        <Label htmlFor="streetLine1">{dictionary.addressFormStreet} *</Label>
        <Input id="streetLine1" name="streetLine1" required autoComplete="street-address" />
      </div>
      <div className="ngc-field">
        <Label htmlFor="phoneNumber">{dictionary.addressFormPhone} *</Label>
        <Input id="phoneNumber" name="phoneNumber" type="tel" required autoComplete="tel" />
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
          {submitting ? dictionary.addressFormSubmitting : dictionary.addressFormSubmit}
        </button>
        <button type="button" onClick={onCancel} className="ng-btn ng-btn-ghost">
          {dictionary.cancelCta}
        </button>
      </div>
    </form>
  )
}
