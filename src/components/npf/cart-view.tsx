"use client"

import Link from "next/link"
import { ArrowLeftIcon, ShoppingBagIcon, Trash2Icon } from "lucide-react"

import { useCart } from "@/lib/cart"
import type { Dictionary } from "@/lib/i18n/dictionaries"
import { LineThumb } from "@/components/glass/line-thumb"
import { QuantityStepper } from "./quantity-stepper"

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
      <div className="ng-wrap ngc-empty" role="alert">
        <span className="ngc-empty-icon" data-tone="danger" aria-hidden="true">
          <ShoppingBagIcon />
        </span>
        <h1 className="ngc-title">{dictionary.unavailableTitle}</h1>
        <p className="ngc-sub">{dictionary.unavailableBody}</p>
        <button type="button" onClick={retryCart} className="ng-btn ng-btn-primary ng-btn-lg">
          {dictionary.unavailableRetry}
        </button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="ng-wrap ngc-empty">
        <span className="ngc-empty-icon" aria-hidden="true">
          <ShoppingBagIcon />
        </span>
        <h1 className="ngc-title">{dictionary.emptyTitle}</h1>
        <p className="ngc-sub">{dictionary.emptyBody}</p>
        <Link href={`${base}/products`} className="ng-btn ng-btn-primary ng-btn-lg">
          {dictionary.emptyCta}
          <span className="ng-arrow" aria-hidden="true">↗</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="ng-wrap ngc-page">
      <header className="ngc-head">
        <h1 className="ngc-title">{dictionary.pageTitle}</h1>
        <p className="ngc-sub">
          <span className="ngc-amount">{items.length}</span> {dictionary.itemsCountSuffix}
        </p>
      </header>

      {cartStatus === "unavailable" && (
        <div className="ngc-alert" role="alert" style={{ marginBlockEnd: "20px" }}>
          <span>{dictionary.unavailableBody}</span>
          <button type="button" onClick={retryCart}>
            {dictionary.unavailableRetry}
          </button>
        </div>
      )}

      <div className="ngc-layout">
        <ul className="ngc-lines">
          {items.map((item) => (
            <li key={item.productId} className="ngc-line">
              <Link href={`${base}/products/${item.slug}`} className="ngc-thumb" tabIndex={-1} aria-hidden="true">
                <LineThumb src={item.image} sizes="108px" />
              </Link>

              <div className="ngc-line-body">
                <div className="ngc-line-top">
                  <Link href={`${base}/products/${item.slug}`} className="ngc-line-name">
                    {item.name}
                  </Link>
                  <button
                    type="button"
                    aria-label={`${dictionary.removeLabel}: ${item.name}`}
                    title={dictionary.removeLabel}
                    onClick={() => removeItem(item.lineId)}
                    disabled={isPending}
                    className="ngc-icon-btn"
                  >
                    <Trash2Icon aria-hidden="true" />
                  </button>
                </div>

                <p className="ngc-line-meta" style={{ margin: 0 }}>
                  {typeof item.price === "number" ? (
                    <span className="ngc-amount" style={{ fontWeight: 600, color: "inherit" }}>
                      {item.price} {currencyLabel}
                    </span>
                  ) : (
                    dictionary.priceOnRequest
                  )}
                </p>

                <div className="ngc-line-foot">
                  <QuantityStepper
                    value={item.qty}
                    onChange={(qty) => updateQty(item.lineId, qty)}
                    label={dictionary.quantityLabel}
                    disabled={isPending}
                  />
                  {typeof item.price === "number" && (
                    <span className="ngc-amount" style={{ fontSize: "var(--ng-t-md)" }}>
                      {item.price * item.qty} {currencyLabel}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="ngc-panel ngc-panel-tint ngc-sticky ngc-stack" style={{ ["--ngc-gap" as string]: "16px" }} aria-labelledby="cart-summary-title">
          <h2 id="cart-summary-title" className="ngc-h2">{dictionary.summaryTitle}</h2>
          <dl className="ngc-rows">
            <div className="ngc-row ngc-row-total">
              <dt>{dictionary.subtotalLabel}</dt>
              <dd className="ngc-amount">
                {subtotal} {currencyLabel}
              </dd>
            </div>
          </dl>
          {hasUnpricedItems && <p className="ngc-note">{dictionary.unpricedNote}</p>}
          <Link href={`${base}/checkout`} className="ng-btn ng-btn-primary ng-btn-lg ngc-block">
            {dictionary.checkoutCta}
            <ArrowLeftIcon className="ltr:rotate-180" aria-hidden="true" />
          </Link>
          <Link href={`${base}/products`} className="ngc-quiet justify-self-center">
            {dictionary.continueShopping}
          </Link>
        </aside>
      </div>
    </div>
  )
}
