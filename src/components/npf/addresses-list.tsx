"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { PlusIcon, Trash2Icon, MapPinIcon } from "lucide-react"

import { deleteAddress } from "@/lib/auth/actions"
import { getCommonErrors } from "@/lib/i18n/common-errors"
import type { Address } from "@/lib/auth/types"
import type { Dictionary } from "@/lib/i18n/dictionaries"
import { AddressForm } from "./address-form"
import { reportError } from "@/lib/telemetry/report-error"

type AuthDictionary = Dictionary["auth"]

export function AddressesList({
  locale,
  dictionary,
  addresses,
}: {
  locale: string
  dictionary: AuthDictionary
  addresses: Address[]
}) {
  const [showForm, setShowForm] = useState(addresses.length === 0)
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const common = getCommonErrors(locale)

  function handleDelete(id: string) {
    setDeletingId(id)
    setError(null)
    startTransition(async () => {
      try {
        // `deleteAddress` returns `{ ok: false }` when Vendure refuses, and
        // throws only when the browser itself loses the connection mid-call.
        const result = await deleteAddress(id)
        if (!result.ok) setError(dictionary.deleteAddressError)
        else router.refresh()
      } catch (error) {
        // F-65: a dropped connection here is invisible server-side, so the
        // failure is reported as well as shown (rate-limited, never throws).
        reportError(error, { scope: "client", action: "deleteAddress" })
        // F-64: without this the transition rejected silently — the spinner on
        // the delete button cleared but the address stayed, with no explanation.
        setError(common.networkError)
      } finally {
        setDeletingId(null)
      }
    })
  }

  return (
    <div className="ngc-stack" style={{ ["--ngc-gap" as string]: "20px" }}>
      <div className="ngc-head-row">
        <h1 className="ngc-title ngc-title-sm">{dictionary.addressesTitle}</h1>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="ng-btn ng-btn-primary"
          >
            <PlusIcon className="size-4" />
            {dictionary.addAddressCta}
          </button>
        )}
      </div>

      {error && (
        <p className="ngc-alert" role="alert">
          {error}
        </p>
      )}

      {showForm && (
        <AddressForm locale={locale} dictionary={dictionary} onCancel={() => setShowForm(false)} />
      )}

      {addresses.length === 0 && !showForm ? (
        <div className="ngc-empty ngc-panel" style={{ paddingBlock: "48px", maxInlineSize: "none" }}>
          <span className="ngc-empty-icon" aria-hidden="true">
            <MapPinIcon />
          </span>
          <h2 className="ngc-h2">{dictionary.addressesEmptyTitle}</h2>
          <p className="ngc-sub">{dictionary.addressesEmptyBody}</p>
        </div>
      ) : (
        <ul className="ngc-grid-2">
          {addresses.map((address) => (
            <li key={address.id} className="ngc-panel ngc-stack" style={{ ["--ngc-gap" as string]: "8px" }}>
              <div className="flex items-start justify-between gap-2">
                <span className="ngc-h3">{address.fullName}</span>
                {address.isDefault && (
                  <span className="ngc-status">
                    {dictionary.defaultAddressLabel}
                  </span>
                )}
              </div>
              <p className="ngc-sub">
                {address.streetLine1}, {address.city}, {address.province}
              </p>
              <p className="ngc-mono justify-self-start">
                {address.phoneNumber}
              </p>
              <button
                type="button"
                onClick={() => handleDelete(address.id)}
                disabled={isPending && deletingId === address.id}
                className="ng-btn ngc-btn-danger justify-self-start"
              >
                <Trash2Icon className="size-3.5" />
                {dictionary.deleteAddressCta}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
