"use client"

import { useEffect, useRef, useState, type FocusEvent, type FormEvent } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ExternalLinkIcon, Loader2Icon, MessageCircleIcon, ShoppingBagIcon } from "lucide-react"

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
import { ctaButtonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ProductImagePlaceholder } from "./product-image-placeholder"
import { cn } from "@/lib/utils"
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
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8" role="alert">
        <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShoppingBagIcon className="size-6" />
        </div>
        <h1 className="mt-4 font-heading text-2xl font-semibold">{dictionary.cartUnavailableTitle}</h1>
        <p className="mt-2 text-pretty text-muted-foreground">{dictionary.cartUnavailableBody}</p>
        <button type="button" onClick={retryCart} className={cn(ctaButtonVariants({ variant: "onLight" }), "mt-8")}>
          {dictionary.cartUnavailableRetry}
        </button>
      </div>
    )
  }

  if (items.length === 0 && !submitting) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShoppingBagIcon className="size-6" />
        </div>
        <h1 className="mt-4 font-heading text-2xl font-semibold">{dictionary.emptyCartTitle}</h1>
        <p className="mt-2 text-pretty text-muted-foreground">{dictionary.emptyCartBody}</p>
        <Link href={`${base}/products`} className={cn(ctaButtonVariants({ variant: "onLight" }), "mt-8")}>
          {dictionary.emptyCartCta}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {cartStatus === "unavailable" && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm" role="alert">
          <span>{dictionary.cartUnavailableBody}</span>
          <button type="button" onClick={retryCart} className="font-medium text-primary underline underline-offset-2">
            {dictionary.cartUnavailableRetry}
          </button>
        </div>
      )}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-heading text-3xl font-semibold">{dictionary.pageTitle}</h1>
        <Link href={`${base}/cart`} className="text-sm text-muted-foreground hover:text-foreground">
          {dictionary.backToCart}
        </Link>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{dictionary.pageSubtitle}</p>

      {/* F-70: funnel entry beacon — fires once when the checkout renders
          with a non-empty cart. */}
      <TrackBeginCheckout items={items} currency="EGP" value={subtotal} />
      <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-4">
            <h2 className="font-heading text-lg font-semibold">{dictionary.contactTitle}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">{dictionary.formName} *</Label>
                <Input id="name" name="name" autoComplete="name" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="phone">{dictionary.formPhone} *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  required
                  pattern="(\+?20|0)?1[0125][0-9]{8}"
                  title={phonePatternTitle}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">{dictionary.formEmail}</Label>
                <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="company">{dictionary.formCompany}</Label>
                <Input id="company" name="company" autoComplete="organization" />
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="font-heading text-lg font-semibold">{dictionary.shippingTitle}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
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
                  className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
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
              <div className="flex flex-col gap-1.5">
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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="address">{dictionary.formAddress} *</Label>
              <Textarea id="address" name="address" autoComplete="street-address" rows={3} required maxLength={FIELD_LIMITS.streetAddress} onBlur={handleAddressFieldBlur} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notes">{dictionary.formNotes}</Label>
              <Textarea id="notes" name="notes" rows={2} maxLength={FIELD_LIMITS.orderNotes} />
            </div>
          </section>

          {/* F-39: radio groups live in fieldset/legend — the group needs a
              single programmatic name ("Shipping method") that associates
              every option with it; a heading alone does not do that. */}
          <fieldset className="flex flex-col gap-4">
            <legend className="font-heading text-lg font-semibold">{dictionary.shippingMethodTitle}</legend>
            <p className="text-xs text-muted-foreground">{dictionary.fulfillmentCarrierNote}</p>
            {loadingShipping ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2Icon className="size-4 animate-spin" />
                {dictionary.shippingLoadingNote}
              </p>
            ) : shippingMethods.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {shippingError === "fulfillment_selection_changed"
                  ? dictionary.shippingSelectionChangedError
                  : shippingError
                    ? dictionary.shippingErrorGeneric
                    : dictionary.noShippingMethodsNote}
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {shippingMethods.map((method) => {
                  if (!method.mode) return null
                  const labels = FULFILLMENT_LABEL_KEY[method.mode]
                  return (
                    <label
                      key={method.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                        fulfillmentMode === method.mode ? "border-primary bg-primary/5" : "border-border"
                      )}
                    >
                      <input
                        type="radio"
                        name="fulfillmentMode"
                        value={method.mode}
                        checked={fulfillmentMode === method.mode}
                        onChange={() => setFulfillmentMode(method.mode)}
                        className="mt-1"
                      />
                      <span className="flex flex-1 flex-col gap-0.5">
                        <span className="text-sm font-medium">{dictionary[labels.title] as string}</span>
                        <span className="text-xs text-muted-foreground">{dictionary[labels.note] as string}</span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums">
                        {method.priceWithTax === 0 ? dictionary.shippingFreeLabel : `${method.priceWithTax} ${currencyLabel}`}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </fieldset>

          <fieldset className="flex flex-col gap-4">
            <legend className="font-heading text-lg font-semibold">{dictionary.paymentTitle}</legend>
            <div className="flex flex-col gap-3">
              <label
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                  paymentMethod === "cod" ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={(event) => handlePaymentMethodChange("cod", event)}
                  className="mt-1"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{dictionary.paymentCod}</span>
                  <span className="text-xs text-muted-foreground">{dictionary.paymentCodNote}</span>
                </span>
              </label>
              {cardGatewayCode && (
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                    paymentMethod === "card" ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === "card"}
                    onChange={(event) => handlePaymentMethodChange("card", event)}
                    className="mt-1"
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{dictionary.paymentCard}</span>
                    <span className="text-xs text-muted-foreground">{dictionary.paymentCardNote}</span>
                  </span>
                </label>
              )}
              <label
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                  paymentMethod === "bank_transfer" && transferRail === "instapay"
                    ? "border-primary bg-primary/5"
                    : "border-border"
                )}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank_transfer"
                  checked={paymentMethod === "bank_transfer" && transferRail === "instapay"}
                  onChange={(event) => handleTransferRailChange("instapay", event)}
                  className="mt-1"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{dictionary.paymentInstapay}</span>
                  {paymentMethod === "bank_transfer" && transferRail === "instapay" && (
                    <>
                      <span className="text-xs text-muted-foreground">{dictionary.paymentInstapayNote}</span>
                      <span className="flex w-fit items-center gap-2">
                        <span className="text-xs font-medium" dir="ltr">
                          {INSTAPAY_ALIAS}
                        </span>
                        <CopyToClipboardButton
                          value={INSTAPAY_ALIAS}
                          label={dictionary.copyAliasLabel}
                          copiedLabel={dictionary.copiedInstapayLabel}
                        />
                      </span>
                      {/* The exact amount, right where the customer acts on it —
                          no scrolling back to the summary to do the math. */}
                      <p className="text-base font-semibold">
                        {dictionary.transferAmountLabel}{" "}
                        <span className="tabular-nums">
                          {total} {currencyLabel}
                        </span>
                      </p>
                      <a
                        href={INSTAPAY_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex w-fit items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/5 focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        {dictionary.paymentInstapayCta}
                        <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
                      </a>
                    </>
                  )}
                </span>
              </label>
              <label
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                  paymentMethod === "bank_transfer" && transferRail === "vodafone_cash"
                    ? "border-primary bg-primary/5"
                    : "border-border"
                )}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank_transfer"
                  checked={paymentMethod === "bank_transfer" && transferRail === "vodafone_cash"}
                  onChange={(event) => handleTransferRailChange("vodafone_cash", event)}
                  className="mt-1"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{dictionary.paymentVodafone}</span>
                  {paymentMethod === "bank_transfer" && transferRail === "vodafone_cash" && (
                    <>
                      <span className="text-xs text-muted-foreground">{dictionary.paymentVodafoneNote}</span>
                      <span className="flex w-fit items-center gap-2">
                        <span className="text-xs font-semibold tabular-nums" dir="ltr">
                          {VODAFONE_CASH_NUMBER}
                        </span>
                        <CopyToClipboardButton
                          value={VODAFONE_CASH_NUMBER}
                          label={dictionary.copyNumberLabel}
                          copiedLabel={dictionary.copiedVodafoneLabel}
                        />
                      </span>
                      <p className="text-base font-semibold">
                        {dictionary.transferAmountLabel}{" "}
                        <span className="tabular-nums">
                          {total} {currencyLabel}
                        </span>
                      </p>
                    </>
                  )}
                </span>
              </label>
            </div>

            {/* Reconciliation aid (client asked for it, manual by design):
                an OPTIONAL transfer reference. Typed free-form by the
                customer, stored in payment metadata — never a payment signal. */}
            {paymentMethod === "bank_transfer" && (
              <span className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">{dictionary.transferRefLabel}</span>
                <Input name="transferRef" type="text" inputMode="text" autoComplete="off" maxLength={60} placeholder={locale === "en" ? "e.g. TXN-123456" : "مثال: TXN-123456"} />
                <span className="text-xs text-muted-foreground">{dictionary.transferRefNote}</span>
              </span>
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
                className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <MessageCircleIcon className="size-4 text-primary" aria-hidden="true" />
                {dictionary.whatsappReceiptCta}
              </a>
            )}
            {/* Explicit expectation-setting: sending the receipt is NOT a
                payment event — an admin verifies the transfer first. */}
            {paymentMethod === "bank_transfer" && (
              <p className="text-xs leading-relaxed text-muted-foreground">{dictionary.whatsappPendingNote}</p>
            )}
          </fieldset>
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-anti-flash-white p-6 dark:bg-card">
          <h2 className="font-heading text-lg font-semibold">{dictionary.summaryTitle}</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {items.map((item) => (
              <li key={item.lineId} className="flex items-center gap-3">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
                  ) : (
                    <ProductImagePlaceholder />
                  )}
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="line-clamp-1 text-sm font-medium">{item.name}</span>
                  <span className="text-xs text-muted-foreground">
                    × {item.qty}
                    {typeof item.price === "number" && item.qty > 1
                      ? ` · ${item.price} ${currencyLabel} ${dictionary.eachLabel}`
                      : ""}
                  </span>
                </div>
                <span className="shrink-0 text-sm font-medium tabular-nums">
                  {typeof item.price === "number"
                    ? `${item.price * item.qty} ${currencyLabel}`
                    : "—"}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{dictionary.subtotalLabel}</span>
              <span className="font-semibold tabular-nums">
                {subtotal} {currencyLabel}
              </span>
            </div>
            {fulfillmentMode && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{dictionary.summaryFulfillmentLabel}</span>
                <span className="font-medium">
                  {dictionary[FULFILLMENT_LABEL_KEY[fulfillmentMode].title] as string}
                </span>
              </div>
            )}
            {fulfillmentMode && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{dictionary.shippingCostLabel}</span>
                <span className="font-semibold tabular-nums">
                  {shippingCost === 0 ? dictionary.shippingFreeLabel : `${shippingCost} ${currencyLabel}`}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-base">
              <span className="font-medium">{dictionary.totalLabel}</span>
              <span className="font-semibold tabular-nums">
                {total} {currencyLabel}
              </span>
            </div>
          </div>
          {hasUnpricedItems && (
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{dictionary.unpricedNote}</p>
          )}

          <p className="mt-4 text-xs text-muted-foreground">{dictionary.requiredNote}</p>

          {error && (
            /* role="alert" moves focus of assistive tech to the failure the
               moment submit rejects — a quiet red line inside a long aside
               is exactly what a distracted user misses (F-17 sub-fix 5). */
            <p
              role="alert"
              className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <label className="mt-4 flex cursor-pointer items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <input type="checkbox" name="terms" required className="mt-0.5 shrink-0" />
            <span>
              {dictionary.termsAgreePrefix}{" "}
              <Link href={`${base}/terms`} className="font-medium text-primary underline underline-offset-2">
                {dictionary.termsLinkLabel}
              </Link>
            </span>
          </label>

          {/* F-17 sub-fix 1: the submit button is disabled until a shipping
              method is chosen — a gate with no explanation reads as a broken
              button, so the reason is stated right above it. */}
          {!fulfillmentMode && items.length > 0 && (
            <p id="checkout-submit-gate" className="mt-3 text-xs text-muted-foreground">{dictionary.submitGateNote}</p>
          )}
          <button
            type="submit"
            disabled={submitting || cartStatus === "unavailable" || !fulfillmentMode}
            aria-describedby={!fulfillmentMode ? "checkout-submit-gate" : undefined}
            className={cn(ctaButtonVariants({ variant: "onLight" }), "mt-4 w-full justify-center")}
          >
            {submitting ? dictionary.placingOrderCta : dictionary.placeOrderCta}
          </button>
        </aside>
      </form>
    </div>
  )
}
