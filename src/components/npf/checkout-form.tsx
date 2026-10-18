"use client"

import { useEffect, useRef, useState, type FocusEvent, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeftIcon, ExternalLinkIcon, Loader2Icon, MessageCircleIcon, ShoppingBagIcon } from "lucide-react"

import {
  useCart,
  getCardGatewayCode,
  placeOrder,
  getEligibleShippingMethods,
  type EligibleShippingMethod,
  type FulfillmentMode,
  type PaymentMethod,
} from "@/lib/cart"
import type { Dictionary } from "@/lib/i18n/dictionaries"
import { getCommonErrors } from "@/lib/i18n/common-errors"
import { EGYPT_GOVERNORATES, governorateLabel } from "@/lib/egypt-governorates"
import { FIELD_LIMITS } from "@/lib/forms/field-limits"
import { INSTAPAY_ALIAS, INSTAPAY_URL, VODAFONE_CASH_NUMBER, paymentWhatsAppUrl } from "@/lib/site-config"
import { buildTransferConfirmationMessage } from "@/lib/payments/transfer-message"
import { CopyToClipboardButton } from "./copy-to-clipboard-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { LineThumb } from "@/components/glass/line-thumb"
import { reportError } from "@/lib/telemetry/report-error"
import { TrackBeginCheckout } from "@/components/npf/analytics-events"

type CheckoutDictionary = Dictionary["checkout"]

const FULFILLMENT_LABEL_KEY: Record<FulfillmentMode, { title: keyof CheckoutDictionary; note: keyof CheckoutDictionary }> = {
  door_to_door: { title: "fulfillmentDoorToDoor", note: "fulfillmentDoorToDoorNote" },
  branch_pickup: { title: "fulfillmentBranchPickup", note: "fulfillmentBranchPickupNote" },
  company_pickup: { title: "fulfillmentCompanyPickup", note: "fulfillmentCompanyPickupNote" },
}

export function NPFCheckoutForm({
  locale,
  dictionary,
}: {
  locale: string
  dictionary: CheckoutDictionary
}) {
  const { items, subtotal, hasUnpricedItems, clearCart, cartStatus, retryCart } = useCart()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod")
  // Which manual-transfer rail the customer picked (InstaPay vs Vodafone
  // Cash) — UI-only. BOTH rails submit the existing "bank_transfer" payment
  // method downstream; this just switches the displayed instructions.
  const [transferRail, setTransferRail] = useState<"instapay" | "vodafone_cash">("instapay")
  // The card rail appears ONLY when a configured card-gateway PaymentMethod
  // (paymob/kashier) is eligible on the active order — i.e. the merchant
  // actually registered it in /admin. No gateway configured → no rail, and
  // checkout renders exactly as before.
  const [cardGatewayCode, setCardGatewayCode] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    getCardGatewayCode().then((code) => {
      if (!cancelled) setCardGatewayCode(code)
    })
    return () => {
      cancelled = true
    }
  }, [])
  const [fulfillmentMode, setFulfillmentMode] = useState<FulfillmentMode | null>(null)
  const [shippingMethods, setShippingMethods] = useState<EligibleShippingMethod[]>([])
  const [shippingError, setShippingError] = useState<string | null>(null)
  const [loadingShipping, setLoadingShipping] = useState(false)
  const shippingRequestId = useRef(0)
  const [governorate, setGovernorate] = useState("")
  const [city, setCity] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const common = getCommonErrors(locale)
  const router = useRouter()
  const base = `/${locale}`
  const currencyLabel = locale === "en" ? "EGP" : "ج.م"
  const phonePatternTitle =
    locale === "en" ? "A valid Egyptian mobile number, e.g. 01012345678" : "رقم موبايل مصري صحيح، مثال: 01012345678"

  const selectedShipping = shippingMethods.find((method) => method.mode === fulfillmentMode)
  const shippingCost = selectedShipping?.priceWithTax ?? 0
  const total = subtotal + shippingCost

  // paymentMethodOverride covers the payment-method-change handler below:
  // setPaymentMethod's state update hasn't landed yet when this runs in the
  // same event, so the closure's `paymentMethod` would still read stale.
  async function refreshShippingMethods(form: HTMLFormElement, paymentMethodOverride?: PaymentMethod) {
    const requestId = ++shippingRequestId.current
    if (!governorate.trim() || !city.trim()) {
      setLoadingShipping(false)
      setShippingMethods([])
      setShippingError(null)
      setFulfillmentMode(null)
      return
    }

    setLoadingShipping(true)
    const data = new FormData(form)
    try {
      const result = await getEligibleShippingMethods(
        {
          governorate,
          city,
          address: String(data.get("address") ?? ""),
          name: String(data.get("name") ?? ""),
          phone: String(data.get("phone") ?? ""),
          company: String(data.get("company") ?? "") || undefined,
        },
        paymentMethodOverride ?? paymentMethod
      )
      // A slower response for an older address/payment change must not
      // overwrite methods calculated for the latest form state.
      if (requestId !== shippingRequestId.current) return
      setLoadingShipping(false)
      if (result.error) {
        setShippingMethods([])
        setFulfillmentMode(null)
        setShippingError(result.error)
        return
      }
      setShippingError(null)
      setShippingMethods(result.methods)
      setFulfillmentMode((current) =>
        result.methods.some((method) => method.mode === current) ? current : (result.methods[0]?.mode ?? null)
      )
    } catch (error) {
      // F-65: a dropped connection here is invisible server-side, so the
      // failure is reported as well as shown (rate-limited, never throws).
      reportError(error, { scope: "client", action: "loadShippingMethods" })
      if (requestId !== shippingRequestId.current) return
      setLoadingShipping(false)
      setShippingMethods([])
      setFulfillmentMode(null)
      setShippingError("network_error")
    }
  }

  function handleAddressFieldBlur(event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    refreshShippingMethods(event.currentTarget.form as HTMLFormElement)
  }

  // Door-to-door/branch-pickup shipping is 50% cheaper for bank-transfer
  // (prepaid) orders — the price shown must reflect the newly chosen
  // payment method, not just the address, so re-fetch here too. A no-op if
  // no address has been entered yet (refreshShippingMethods' own guard).
  function handlePaymentMethodChange(method: PaymentMethod, event: FormEvent<HTMLInputElement>) {
    setPaymentMethod(method)
    const form = event.currentTarget.form
    if (form) refreshShippingMethods(form, method)
  }

  function handleTransferRailChange(rail: "instapay" | "vodafone_cash", event: FormEvent<HTMLInputElement>) {
    setTransferRail(rail)
    handlePaymentMethodChange("bank_transfer", event)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting || cartStatus === "unavailable" || items.length === 0 || !fulfillmentMode || loadingShipping) return
    setSubmitting(true)
    setError(null)

    const data = new FormData(event.currentTarget)
    try {
      const result = await placeOrder({
        customer: {
          name: String(data.get("name") ?? ""),
          phone: String(data.get("phone") ?? ""),
          email: String(data.get("email") ?? "") || undefined,
          company: String(data.get("company") ?? "") || undefined,
          governorate,
          city,
          address: String(data.get("address") ?? ""),
          notes: String(data.get("notes") ?? "") || undefined,
        },
        paymentMethod,
        fulfillmentMode,
        agreedToTerms: data.get("terms") === "on",
        transferRef: String(data.get("transferRef") ?? "") || undefined,
        expectedTotal: total,
      })

      if (result.error || !result.order) {
        if (result.error === "fulfillment_selection_changed" || result.error === "order_total_changed") {
          setShippingMethods([])
          setFulfillmentMode(null)
          setShippingError("fulfillment_selection_changed")
          setError(result.error === "order_total_changed" ? dictionary.orderTotalChanged : null)
          if (result.error === "order_total_changed") void retryCart()
        } else if (result.error === "invalid_checkout_data") {
          setError(dictionary.orderErrorValidation)
        } else if (result.error === "card_gateway_unavailable") {
          setError(dictionary.orderErrorGeneric)
        } else {
          setError(dictionary.orderErrorGeneric)
        }
        return
      }

      // Card gateways hand off to the gateway's hosted payment page: the
      // order is created (Authorized, settled later by the gateway's SIGNED
      // webhook — never by this code path). The cart clears only once the
      // redirect target is known; a failed hand-off keeps the cart intact.
      if (result.redirectUrl) {
        clearCart()
        window.location.assign(result.redirectUrl)
        return
      }
      clearCart()
      router.push(`${base}/checkout/confirmation?order=${result.order.orderNumber}`)
    } catch (error) {
      // F-65: a dropped connection here is invisible server-side, so the
      // failure is reported as well as shown (rate-limited, never throws).
      reportError(error, { scope: "client", action: "placeOrder" })
      // F-64 — the highest-stakes submit on the site. If the visitor's
      // connection drops while the order is being placed, the action call
      // rejects and no `result` ever arrives. Previously that left the button
      // permanently disabled with the spinner running and no message, which
      // invites a reload-and-resubmit (a duplicate-order risk). The cart is
      // deliberately NOT cleared here: until we see an order number, the only
      // safe assumption is that nothing was placed.
      setError(common.networkError)
    } finally {
      setSubmitting(false)
    }
  }

  if (cartStatus === "unavailable" && items.length === 0 && !submitting) {
    return (
      <div className="ng-wrap ngc-empty" role="alert">
        <span className="ngc-empty-icon" data-tone="danger" aria-hidden="true">
          <ShoppingBagIcon />
        </span>
        <h1 className="ngc-title">{dictionary.cartUnavailableTitle}</h1>
        <p className="ngc-sub">{dictionary.cartUnavailableBody}</p>
        <button type="button" onClick={retryCart} className="ng-btn ng-btn-primary ng-btn-lg">
          {dictionary.cartUnavailableRetry}
        </button>
      </div>
    )
  }

  if (items.length === 0 && !submitting) {
    return (
      <div className="ng-wrap ngc-empty">
        <span className="ngc-empty-icon" aria-hidden="true">
          <ShoppingBagIcon />
        </span>
        <h1 className="ngc-title">{dictionary.emptyCartTitle}</h1>
        <p className="ngc-sub">{dictionary.emptyCartBody}</p>
        <Link href={`${base}/products`} className="ng-btn ng-btn-primary ng-btn-lg">
          {dictionary.emptyCartCta}
          <span className="ng-arrow" aria-hidden="true">↗</span>
        </Link>
      </div>
    )
  }

  const instapayActive = paymentMethod === "bank_transfer" && transferRail === "instapay"
  const vodafoneActive = paymentMethod === "bank_transfer" && transferRail === "vodafone_cash"

  return (
    <div className="ng-wrap ngc-page">
      {cartStatus === "unavailable" && (
        <div className="ngc-alert" role="alert" style={{ marginBlockEnd: "20px" }}>
          <span>{dictionary.cartUnavailableBody}</span>
          <button type="button" onClick={retryCart}>
            {dictionary.cartUnavailableRetry}
          </button>
        </div>
      )}
      <header className="ngc-head">
        <Link href={`${base}/cart`} className="ngc-quiet justify-self-start">
          <ArrowLeftIcon className="size-4 rtl:rotate-180" aria-hidden="true" />
          {dictionary.backToCart}
        </Link>
        <h1 className="ngc-title">{dictionary.pageTitle}</h1>
        <p className="ngc-sub">{dictionary.pageSubtitle}</p>
      </header>

      {/* F-70: funnel entry beacon — fires once when the checkout renders
          with a non-empty cart. */}
      <TrackBeginCheckout items={items} currency="EGP" value={subtotal} />
      <form method="post" onSubmit={handleSubmit} className="ngc-layout">
        <div className="ngc-steps">
          <section className="ngc-panel ngc-step ngc-stack" aria-labelledby="checkout-contact">
            <h2 id="checkout-contact" className="ngc-h2 ngc-step-title">{dictionary.contactTitle}</h2>
            <div className="ngc-grid-2">
              <div className="ngc-field">
                <Label htmlFor="name">{dictionary.formName} *</Label>
                <Input id="name" name="name" autoComplete="name" required />
              </div>
              <div className="ngc-field">
                <Label htmlFor="phone">{dictionary.formPhone} *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  dir="ltr"
                  autoComplete="tel"
                  inputMode="tel"
                  required
                  pattern="(\+?20|0)?1[0125][0-9]{8}"
                  title={phonePatternTitle}
                  className="text-start rtl:text-end"
                />
              </div>
              <div className="ngc-field">
                <Label htmlFor="email">{dictionary.formEmail}</Label>
                <Input id="email" name="email" type="email" dir="ltr" autoComplete="email" inputMode="email" className="text-start rtl:text-end" />
              </div>
              <div className="ngc-field">
                <Label htmlFor="company">{dictionary.formCompany}</Label>
                <Input id="company" name="company" autoComplete="organization" />
              </div>
            </div>
          </section>

          <section className="ngc-panel ngc-step ngc-stack" aria-labelledby="checkout-shipping">
            <h2 id="checkout-shipping" className="ngc-h2 ngc-step-title">{dictionary.shippingTitle}</h2>
            <div className="ngc-grid-2">
              <div className="ngc-field">
                <Label htmlFor="governorate">{dictionary.formGovernorate} *</Label>
                {/* F-17: a select, not free text — Egypt has exactly 27
                    governorates, shipping quotes key on this value, and a
                    typo here used to become an undeliverable order. The
                    change (not just blur) re-quotes shipping because the
                    governorate alone already narrows the method set. */}
                <select
                  id="governorate"
                  name="governorate"
                  autoComplete="address-level1"
                  required
                  value={governorate}
                  onChange={(event) => {
                    setGovernorate(event.target.value)
                    const form = event.currentTarget.form
                    if (form) refreshShippingMethods(form)
                  }}
                  className="ngc-select"
                >
                  <option value="" disabled>
                    {dictionary.formGovernoratePlaceholder}
                  </option>
                  {EGYPT_GOVERNORATES.map((gov) => (
                    <option key={gov.id} value={gov.ar}>
                      {governorateLabel(gov, locale)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ngc-field">
                <Label htmlFor="city">{dictionary.formCity} *</Label>
                <Input
                  id="city"
                  name="city"
                  autoComplete="address-level2"
                  required
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  onBlur={handleAddressFieldBlur}
                />
              </div>
            </div>
            <div className="ngc-field">
              <Label htmlFor="address">{dictionary.formAddress} *</Label>
              <Textarea id="address" name="address" autoComplete="street-address" rows={3} required maxLength={FIELD_LIMITS.streetAddress} onBlur={handleAddressFieldBlur} />
            </div>
            <div className="ngc-field">
              <Label htmlFor="notes">{dictionary.formNotes}</Label>
              <Textarea id="notes" name="notes" rows={2} maxLength={FIELD_LIMITS.orderNotes} />
            </div>
          </section>

          {/* F-39: radio groups live in fieldset/legend — the group needs a
              single programmatic name ("Shipping method") that associates
              every option with it; a heading alone does not do that. */}
          <fieldset className="ngc-panel ngc-step ngc-fieldset">
            <legend className="ngc-h2 ngc-step-title">{dictionary.shippingMethodTitle}</legend>
            <p className="ngc-note">{dictionary.fulfillmentCarrierNote}</p>
            {loadingShipping ? (
              <p className="ngc-loading" role="status">
                <Loader2Icon className="ngc-spin" aria-hidden="true" />
                {dictionary.shippingLoadingNote}
              </p>
            ) : shippingMethods.length === 0 ? (
              <p className={shippingError ? "ngc-alert" : "ngc-loading"}>
                {shippingError === "fulfillment_selection_changed"
                  ? dictionary.shippingSelectionChangedError
                  : shippingError
                    ? dictionary.shippingErrorGeneric
                    : dictionary.noShippingMethodsNote}
              </p>
            ) : (
              <div className="ngc-options">
                {shippingMethods.map((method) => {
                  if (!method.mode) return null
                  const labels = FULFILLMENT_LABEL_KEY[method.mode]
                  return (
                    <label key={method.id} className="ngc-option" data-checked={fulfillmentMode === method.mode}>
                      <input
                        type="radio"
                        name="fulfillmentMode"
                        value={method.mode}
                        checked={fulfillmentMode === method.mode}
                        onChange={() => setFulfillmentMode(method.mode)}
                      />
                      <span className="ngc-option-body">
                        <span className="ngc-option-title">{dictionary[labels.title] as string}</span>
                        <span className="ngc-option-note">{dictionary[labels.note] as string}</span>
                      </span>
                      <span className="ngc-amount ngc-option-price">
                        {method.priceWithTax === 0 ? dictionary.shippingFreeLabel : `${method.priceWithTax} ${currencyLabel}`}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </fieldset>

          <fieldset className="ngc-panel ngc-step ngc-fieldset">
            <legend className="ngc-h2 ngc-step-title">{dictionary.paymentTitle}</legend>
            <div className="ngc-options">
              <label className="ngc-option" data-checked={paymentMethod === "cod"}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={(event) => handlePaymentMethodChange("cod", event)}
                />
                <span className="ngc-option-body">
                  <span className="ngc-option-title">{dictionary.paymentCod}</span>
                  <span className="ngc-option-note">{dictionary.paymentCodNote}</span>
                </span>
              </label>
              {cardGatewayCode && (
                <label className="ngc-option" data-checked={paymentMethod === "card"}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === "card"}
                    onChange={(event) => handlePaymentMethodChange("card", event)}
                  />
                  <span className="ngc-option-body">
                    <span className="ngc-option-title">{dictionary.paymentCard}</span>
                    <span className="ngc-option-note">{dictionary.paymentCardNote}</span>
                  </span>
                </label>
              )}
              <label className="ngc-option" data-checked={instapayActive}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank_transfer"
                  checked={instapayActive}
                  onChange={(event) => handleTransferRailChange("instapay", event)}
                />
                <span className="ngc-option-body">
                  <span className="ngc-option-title">{dictionary.paymentInstapay}</span>
                  {instapayActive && (
                    <>
                      <span className="ngc-option-note">{dictionary.paymentInstapayNote}</span>
                      <span className="ngc-transfer">
                        <span className="ngc-transfer-row">
                          <span className="ngc-mono">{INSTAPAY_ALIAS.split("@")[0]}<wbr />@{INSTAPAY_ALIAS.split("@").slice(1).join("@")}</span>
                          <CopyToClipboardButton
                            value={INSTAPAY_ALIAS}
                            label={dictionary.copyAliasLabel}
                            copiedLabel={dictionary.copiedInstapayLabel}
                          />
                        </span>
                        {/* The exact amount, right where the customer acts on it —
                            no scrolling back to the summary to do the math. */}
                        <span className="ngc-due">
                          <span>{dictionary.transferAmountLabel}</span>
                          <span className="ngc-amount">
                            {total} {currencyLabel}
                          </span>
                        </span>
                        <a
                          href={INSTAPAY_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ngc-pill-btn justify-self-start"
                        >
                          {dictionary.paymentInstapayCta}
                          <ExternalLinkIcon aria-hidden="true" />
                        </a>
                      </span>
                    </>
                  )}
                </span>
              </label>
              <label className="ngc-option" data-checked={vodafoneActive}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank_transfer"
                  checked={vodafoneActive}
                  onChange={(event) => handleTransferRailChange("vodafone_cash", event)}
                />
                <span className="ngc-option-body">
                  <span className="ngc-option-title">{dictionary.paymentVodafone}</span>
                  {vodafoneActive && (
                    <>
                      <span className="ngc-option-note">{dictionary.paymentVodafoneNote}</span>
                      <span className="ngc-transfer">
                        <span className="ngc-transfer-row">
                          <span className="ngc-mono" style={{ fontSize: "var(--ng-t-md)" }}>{VODAFONE_CASH_NUMBER}</span>
                          <CopyToClipboardButton
                            value={VODAFONE_CASH_NUMBER}
                            label={dictionary.copyNumberLabel}
                            copiedLabel={dictionary.copiedVodafoneLabel}
                          />
                        </span>
                        <span className="ngc-due">
                          <span>{dictionary.transferAmountLabel}</span>
                          <span className="ngc-amount">
                            {total} {currencyLabel}
                          </span>
                        </span>
                      </span>
                    </>
                  )}
                </span>
              </label>
            </div>

            {/* Reconciliation aid (client asked for it, manual by design):
                an OPTIONAL transfer reference. Typed free-form by the
                customer, stored in payment metadata — never a payment signal. */}
            {paymentMethod === "bank_transfer" && (
              <div className="ngc-field">
                <Label htmlFor="transferRef">{dictionary.transferRefLabel}</Label>
                <Input
                  id="transferRef"
                  name="transferRef"
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  maxLength={60}
                  aria-describedby="transferRef-note"
                  placeholder={locale === "en" ? "e.g. TXN-123456" : "مثال: TXN-123456"}
                />
                <span id="transferRef-note" className="ngc-note">{dictionary.transferRefNote}</span>
              </div>
            )}

            {/* Manual-transfer receipt hand-off: a plain wa.me LINK pre-filled
                from the live cart — it opens WhatsApp and nothing else. It is
                deliberately NOT a submit path and never touches order/payment
                state; settlement happens after the admin verifies the receipt. */}
            {paymentMethod === "bank_transfer" && (
              <a
                href={paymentWhatsAppUrl(
                  buildTransferConfirmationMessage(dictionary.whatsappTransferCartTemplate, {
                    paymentMethod:
                      transferRail === "instapay" ? dictionary.paymentInstapay : dictionary.paymentVodafone,
                    orderTotal: `${total} ${currencyLabel}`,
                  })
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="ng-btn justify-self-start ngc-block sm:w-auto"
              >
                <MessageCircleIcon aria-hidden="true" />
                {dictionary.whatsappReceiptCta}
              </a>
            )}
            {/* Explicit expectation-setting: sending the receipt is NOT a
                payment event — an admin verifies the transfer first. */}
            {paymentMethod === "bank_transfer" && (
              <p className="ngc-note">{dictionary.whatsappPendingNote}</p>
            )}
          </fieldset>
        </div>

        <aside className="ngc-panel ngc-panel-tint ngc-sticky ngc-stack" style={{ ["--ngc-gap" as string]: "14px" }} aria-labelledby="checkout-summary-title">
          <h2 id="checkout-summary-title" className="ngc-h2">{dictionary.summaryTitle}</h2>
          <ul className="ngc-mini">
            {items.map((item) => (
              <li key={item.lineId}>
                <span className="ngc-thumb ngc-thumb-sm">
                  <LineThumb src={item.image} sizes="52px" />
                </span>
                <span>
                  <span className="ngc-mini-name">{item.name}</span>
                  <span className="ngc-line-meta">
                    × {item.qty}
                    {typeof item.price === "number" && item.qty > 1
                      ? ` · ${item.price} ${currencyLabel} ${dictionary.eachLabel}`
                      : ""}
                  </span>
                </span>
                <span className="ngc-amount">
                  {typeof item.price === "number"
                    ? `${item.price * item.qty} ${currencyLabel}`
                    : "—"}
                </span>
              </li>
            ))}
          </ul>

          <dl className="ngc-rows" style={{ paddingBlockStart: "14px", borderBlockStart: "1px solid var(--ng-hairline)" }}>
            <div className="ngc-row">
              <dt>{dictionary.subtotalLabel}</dt>
              <dd className="ngc-amount">
                {subtotal} {currencyLabel}
              </dd>
            </div>
            {fulfillmentMode && (
              <div className="ngc-row">
                <dt>{dictionary.summaryFulfillmentLabel}</dt>
                <dd style={{ fontWeight: 600, textAlign: "end" }}>
                  {dictionary[FULFILLMENT_LABEL_KEY[fulfillmentMode].title] as string}
                </dd>
              </div>
            )}
            {fulfillmentMode && (
              <div className="ngc-row">
                <dt>{dictionary.shippingCostLabel}</dt>
                <dd className="ngc-amount">
                  {shippingCost === 0 ? dictionary.shippingFreeLabel : `${shippingCost} ${currencyLabel}`}
                </dd>
              </div>
            )}
            <div className="ngc-row ngc-row-total">
              <dt>{dictionary.totalLabel}</dt>
              <dd className="ngc-amount">
                {total} {currencyLabel}
              </dd>
            </div>
          </dl>
          {hasUnpricedItems && <p className="ngc-note">{dictionary.unpricedNote}</p>}

          <p className="ngc-note">{dictionary.requiredNote}</p>

          {error && (
            /* role="alert" moves focus of assistive tech to the failure the
               moment submit rejects — a quiet red line inside a long aside
               is exactly what a distracted user misses (F-17 sub-fix 5). */
            <p role="alert" className="ngc-alert">
              {error}
            </p>
          )}

          <label className="ngc-check">
            <input type="checkbox" name="terms" required />
            <span>
              {dictionary.termsAgreePrefix}{" "}
              <Link href={`${base}/terms`} className="ngc-inline-link">
                {dictionary.termsLinkLabel}
              </Link>
            </span>
          </label>

          {/* F-17 sub-fix 1: the submit button is disabled until a shipping
              method is chosen — a gate with no explanation reads as a broken
              button, so the reason is stated right above it. */}
          {!fulfillmentMode && items.length > 0 && (
            <p id="checkout-submit-gate" className="ngc-info">{dictionary.submitGateNote}</p>
          )}
          <button
            type="submit"
            disabled={submitting || cartStatus === "unavailable" || !fulfillmentMode}
            aria-describedby={!fulfillmentMode ? "checkout-submit-gate" : undefined}
            className="ng-btn ng-btn-primary ng-btn-lg ngc-block"
          >
            {submitting && <Loader2Icon className="ngc-spin" aria-hidden="true" />}
            {submitting ? dictionary.placingOrderCta : dictionary.placeOrderCta}
          </button>
        </aside>
      </form>
    </div>
  )
}
