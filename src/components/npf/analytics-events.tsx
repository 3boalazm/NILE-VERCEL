"use client"

import { useEffect, useRef, type FormEvent } from "react"
import { SearchIcon } from "lucide-react"

import { track } from "@/lib/analytics/track"
import type { CartItem } from "@/lib/cart"

/**
 * F-70 — GA4 e-commerce event emitters.
 *
 * Each component is a renderless beacon: it fires exactly once per mount
 * (the ref guard also absorbs React StrictMode's double-invoked effects in
 * dev) and pushes a GA4-shaped event onto the dataLayer. Keeping them as
 * components (not useEffects sprinkled in pages) means the event payload is
 * defined once, next to the analytics contract in docs/ANALYTICS.md.
 *
 * They are unconditional on consent BY DESIGN: `track()` only queues onto
 * window.dataLayer, and the remote gtag script — the thing that would
 * transmit anything — only loads after consent (AnalyticsProvider). Queueing
 * pre-consent is what lets a visitor who consents on the PDP still get a
 * complete funnel for that session.
 */
function useOnce(fn: () => void) {
  const fired = useRef(false)
  useEffect(() => {
    if (fired.current) return
    fired.current = true
    fn()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

const toGaItems = (items: { slug?: string; name: string; qty?: number; price?: number }[]) =>
  items.map((item) => ({
    item_id: item.slug ?? item.name,
    item_name: item.name,
    ...(typeof item.qty === "number" ? { quantity: item.qty } : {}),
    ...(typeof item.price === "number" ? { price: item.price } : {}),
  }))

export function TrackViewItem({
  slug,
  name,
  price,
  category,
  currency,
}: {
  slug: string
  name: string
  price?: number
  category?: string
  currency: string
}) {
  useOnce(() =>
    track("view_item", {
      currency,
      ...(typeof price === "number" ? { value: price } : {}),
      items: [{ item_id: slug, item_name: name, ...(category ? { item_category: category } : {}) }],
    })
  )
  return null
}

export function TrackItemList({
  items,
  currency,
  itemListName,
}: {
  items: { slug: string; name: string }[]
  currency: string
  itemListName?: string
}) {
  useOnce(() =>
    track("view_item_list", {
      currency,
      ...(itemListName ? { item_list_name: itemListName } : {}),
      items: toGaItems(items),
    })
  )
  return null
}

export function TrackBeginCheckout({ items, currency, value }: { items: CartItem[]; currency: string; value: number }) {
  useOnce(() =>
    track("begin_checkout", { currency, value, items: toGaItems(items) })
  )
  return null
}

export function TrackPurchase({
  orderNumber,
  total,
  currency,
  items,
}: {
  orderNumber: string
  total: number
  currency: string
  items: CartItem[]
}) {
  useOnce(() =>
    track("purchase", {
      transaction_id: orderNumber,
      currency,
      value: total,
      items: toGaItems(items),
    })
  )
  return null
}

/**
 * The listing's hero search, as a client form so the query reaches the
 * dataLayer (`search` event) the moment it is submitted — server-rendered
 * markup stays identical to the plain form it replaces.
 */
export function ProductSearchForm({
  action,
  name = "q",
  placeholder,
  cta,
  defaultValue,
}: {
  action: string
  name?: string
  placeholder: string
  cta: string
  defaultValue?: string
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget
    const term = String(new FormData(form).get(name) ?? "").trim()
    if (term) track("search", { search_term: term })
  }
  return (
    <form action={action} method="GET" onSubmit={handleSubmit} className="relative w-full max-w-md pt-1">
      <label className="sr-only" htmlFor="product-search">
        {placeholder}
      </label>
      <SearchIcon className="pointer-events-none absolute inset-y-0 start-4 my-auto size-4 text-muted-foreground" aria-hidden="true" />
      <input
        id="product-search"
        type="search"
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-12 w-full rounded-full border border-foreground/10 bg-background ps-11 pe-4 text-sm shadow-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <button
        type="submit"
        className="absolute inset-y-1.5 end-1.5 rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-primary/90"
      >
        {cta}
      </button>
    </form>
  )
}
