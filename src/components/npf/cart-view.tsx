"use client"

import Link from "next/link"
import Image from "next/image"
import { ShoppingBagIcon, Trash2Icon } from "lucide-react"

import { useCart } from "@/lib/cart"
import type { Dictionary } from "@/lib/i18n/dictionaries"
import { ctaButtonVariants } from "@/components/ui/button"
import { ProductImagePlaceholder } from "./product-image-placeholder"
import { QuantityStepper } from "./quantity-stepper"
import { cn } from "@/lib/utils"

type CartDictionary = Dictionary["cart"]

export function NPFCartView({
  locale,
  dictionary,
}: {
  locale: string
  dictionary: CartDictionary
}) {
  const { items, subtotal, hasUnpricedItems, isPending, cartStatus, retryCart, updateQty, removeItem } = useCart()
  const base = `/${locale}`
  const currencyLabel = locale === "en" ? "EGP" : "ج.م"

  if (cartStatus === "unavailable" && items.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8" role="alert">
        <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShoppingBagIcon className="size-6" />
        </div>
        <h1 className="mt-4 font-heading text-2xl font-semibold">{dictionary.unavailableTitle}</h1>
        <p className="mt-2 text-pretty text-muted-foreground">{dictionary.unavailableBody}</p>
        <button type="button" onClick={retryCart} className={cn(ctaButtonVariants({ variant: "onLight" }), "mt-8")}>
          {dictionary.unavailableRetry}
        </button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShoppingBagIcon className="size-6" />
        </div>
        <h1 className="mt-4 font-heading text-2xl font-semibold">{dictionary.emptyTitle}</h1>
        <p className="mt-2 text-pretty text-muted-foreground">{dictionary.emptyBody}</p>
        <Link href={`${base}/products`} className={cn(ctaButtonVariants({ variant: "onLight" }), "mt-8")}>
          {dictionary.emptyCta}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-semibold">{dictionary.pageTitle}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {items.length} {dictionary.itemsCountSuffix}
      </p>

      {cartStatus === "unavailable" && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm" role="alert">
          <span>{dictionary.unavailableBody}</span>
          <button type="button" onClick={retryCart} className="font-medium text-primary underline underline-offset-2">
            {dictionary.unavailableRetry}
          </button>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <ul className="flex flex-col gap-4">
          {items.map((item) => (
            <li
              key={item.productId}
              className="flex gap-4 rounded-2xl border border-border bg-anti-flash-white p-4 dark:bg-card"
            >
              <Link
                href={`${base}/products/${item.slug}`}
                className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-muted"
              >
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />
                ) : (
                  <ProductImagePlaceholder />
                )}
              </Link>

              <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`${base}/products/${item.slug}`}
                    className="font-heading text-base font-semibold hover:underline"
                  >
                    {item.name}
                  </Link>
                  <button
                    type="button"
                    aria-label={dictionary.removeLabel}
                    title={dictionary.removeLabel}
                    onClick={() => removeItem(item.lineId)}
                    disabled={isPending}
                    className="-m-2.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-destructive max-lg:-m-3.5 max-lg:size-11 disabled:pointer-events-none disabled:opacity-40"
                  >
                    <Trash2Icon className="size-4" />
                  </button>
                </div>

                <p className="text-sm font-medium text-foreground">
                  {typeof item.price === "number"
                    ? `${item.price} ${currencyLabel}`
                    : dictionary.priceOnRequest}
                </p>

                <div className="mt-auto flex items-center justify-between gap-3">
                  <QuantityStepper
                    value={item.qty}
                    onChange={(qty) => updateQty(item.lineId, qty)}
                    label={dictionary.quantityLabel}
                    disabled={isPending}
                  />
                  {typeof item.price === "number" && (
                    <span className="text-sm font-semibold tabular-nums">
                      {item.price * item.qty} {currencyLabel}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-2xl border border-border bg-anti-flash-white p-6 dark:bg-card">
          <h2 className="font-heading text-lg font-semibold">{dictionary.summaryTitle}</h2>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{dictionary.subtotalLabel}</span>
            <span className="font-semibold tabular-nums">
              {subtotal} {currencyLabel}
            </span>
          </div>
          {hasUnpricedItems && (
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {dictionary.unpricedNote}
            </p>
          )}
          <Link
            href={`${base}/checkout`}
            className={cn(ctaButtonVariants({ variant: "onLight" }), "mt-6 w-full justify-center")}
          >
            {dictionary.checkoutCta}
          </Link>
          <Link
            href={`${base}/products`}
            className="mt-3 block text-center text-sm text-muted-foreground hover:text-foreground"
          >
            {dictionary.continueShopping}
          </Link>
        </aside>
      </div>
    </div>
  )
}
