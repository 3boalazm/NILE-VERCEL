"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Loader2Icon, RefreshCwIcon } from "lucide-react"

import { reorderItems } from "@/lib/cart/actions"
import { useCart } from "@/lib/cart"
import { getCommonErrors } from "@/lib/i18n/common-errors"
import type { Dictionary } from "@/lib/i18n/dictionaries"
import { ctaButtonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { reportError } from "@/lib/telemetry/report-error"

type AuthDictionary = Dictionary["auth"]

export function ReorderButton({
  locale,
  dictionary,
  lines,
}: {
  locale: string
  dictionary: AuthDictionary
  lines: Array<{ slug: string; qty: number }>
}) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ added: number; unavailable: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { setItems } = useCart()
  const base = `/${locale}`
  const common = getCommonErrors(locale)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      try {
        const outcome = await reorderItems(lines)
        setItems(outcome.items)
        setResult({ added: outcome.addedSlugs.length, unavailable: outcome.unavailableSlugs.length })
      } catch (error) {
        // F-65: a dropped connection here is invisible server-side, so the
        // failure is reported as well as shown (rate-limited, never throws).
        reportError(error, { scope: "client", action: "reorder" })
        // F-64: a dropped connection used to reject inside the transition with
        // nothing rendered — the button just stopped spinning. `result` stays
        // null, so the button remains and the reorder can be retried.
        setError(common.networkError)
      }
    })
  }

  if (result) {
    const message =
      result.unavailable === 0
        ? locale === "en"
          ? `${result.added} item${result.added === 1 ? "" : "s"} added to cart.`
          : `تمت إضافة ${result.added} منتج للسلة.`
        : locale === "en"
          ? `${result.added} item${result.added === 1 ? "" : "s"} added to cart. ${result.unavailable} item${result.unavailable === 1 ? "" : "s"} currently unavailable.`
          : `تمت إضافة ${result.added} منتج للسلة. ${result.unavailable} منتج مش متاح حاليًا.`

    return (
      <div className="flex flex-col items-start gap-2 sm:items-end" role="status">
        <p className="text-sm text-muted-foreground">{message}</p>
        {result.added > 0 && (
          <Link href={`${base}/cart`} className={cn(ctaButtonVariants({ variant: "onLight" }), "gap-1.5")}>
            {locale === "en" ? "Go to Cart" : "الذهاب للسلة"}
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
      {error && (
        <p id="reorder-error" role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-describedby={error ? "reorder-error" : undefined}
        className={cn(ctaButtonVariants({ variant: "outline" }), "gap-1.5")}
      >
        {isPending ? <Loader2Icon className="size-4 animate-spin" /> : <RefreshCwIcon className="size-4" />}
        {isPending ? dictionary.reorderAdding : dictionary.reorderCta}
      </button>
    </div>
  )
}
