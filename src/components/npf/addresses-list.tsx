"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { PlusIcon, Trash2Icon, MapPinIcon } from "lucide-react"

import { deleteAddress } from "@/lib/auth/actions"
import { getCommonErrors } from "@/lib/i18n/common-errors"
import type { Address } from "@/lib/auth/types"
import type { Dictionary } from "@/lib/i18n/dictionaries"
import { ctaButtonVariants } from "@/components/ui/button"
import { AddressForm } from "./address-form"
import { cn } from "@/lib/utils"
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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">{dictionary.addressesTitle}</h1>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className={cn(ctaButtonVariants({ variant: "onLight" }), "gap-1.5")}
          >
            <PlusIcon className="size-4" />
            {dictionary.addAddressCta}
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {showForm && (
        <AddressForm locale={locale} dictionary={dictionary} onCancel={() => setShowForm(false)} />
      )}

      {addresses.length === 0 && !showForm ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MapPinIcon className="size-6" />
          </div>
          <h2 className="font-heading text-lg font-semibold">{dictionary.addressesEmptyTitle}</h2>
          <p className="max-w-sm text-pretty text-muted-foreground">{dictionary.addressesEmptyBody}</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <li key={address.id} className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium">{address.fullName}</span>
                {address.isDefault && (
                  <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {dictionary.defaultAddressLabel}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {address.streetLine1}, {address.city}, {address.province}
              </p>
              <p className="text-sm text-muted-foreground" dir="ltr">
                {address.phoneNumber}
              </p>
              <button
                type="button"
                onClick={() => handleDelete(address.id)}
                disabled={isPending && deletingId === address.id}
                className="mt-2 flex w-fit items-center gap-1.5 text-sm font-medium text-destructive hover:underline disabled:opacity-50"
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
