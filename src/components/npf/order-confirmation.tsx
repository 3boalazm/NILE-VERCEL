"use client"

import Link from "next/link"
import Image from "next/image"
import { CheckCircle2Icon, ExternalLinkIcon, MessageCircleIcon, PackageSearchIcon } from "lucide-react"

import {
  INSTAPAY_ALIAS,
  INSTAPAY_URL,
  VODAFONE_CASH_NUMBER,
  paymentWhatsAppUrl,
} from "@/lib/site-config"
import { buildTransferConfirmationMessage } from "@/lib/payments/transfer-message"
import { CopyToClipboardButton } from "./copy-to-clipboard-button"

import type { Order } from "@/lib/cart"
import type { Dictionary } from "@/lib/i18n/dictionaries"
import { ctaButtonVariants } from "@/components/ui/button"
import { ProductImagePlaceholder } from "./product-image-placeholder"
import { TrackPurchase } from "@/components/npf/analytics-events"
import { cn } from "@/lib/utils"

type ConfirmationDictionary = Dictionary["checkout"]["confirmation"]
type CheckoutDictionary = Dictionary["checkout"]

const PAYMENT_LABEL_KEY = {
  cod: "paymentCod",
  bank_transfer: "paymentBank",
  card: "paymentCard",
} as const

const FULFILLMENT_LABEL_KEY = {
  door_to_door: "fulfillmentDoorToDoor",
  branch_pickup: "fulfillmentBranchPickup",
  company_pickup: "fulfillmentCompanyPickup",
} as const

/* F-70: purchase beacon lives inside this client component because the
     order object (transaction id + value + items) only exists here. */
export function NPFOrderConfirmation({
  locale,
  dictionary,
  checkoutDictionary,
  order,
}: {
  locale: string
  dictionary: ConfirmationDictionary
  checkoutDictionary: Pick<
    CheckoutDictionary,
    | "paymentCod"
    | "paymentBank"
    | "paymentBankNote"
    | "paymentInstapayCta"
    | "copyNumberLabel"
    | "copyAliasLabel"
    | "copiedVodafoneLabel"
    | "copiedInstapayLabel"
    | "transferAmountLabel"
    | "transferRefRecordedLabel"
    | "paymentCard"
    | "paymentCardNote"
    | "whatsappPendingNote"
    | "whatsappReceiptCta"
    | "whatsappTransferTemplate"
    | "paymentVodafone"
    | "paymentInstapay"
    | "fulfillmentDoorToDoor"
    | "fulfillmentBranchPickup"
    | "fulfillmentCompanyPickup"
  >
  order: Order | null
}) {
  const base = `/${locale}`

  if (!order) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <PackageSearchIcon className="size-6" />
        </div>
        <h1 className="mt-4 font-heading text-2xl font-semibold">{dictionary.noOrderTitle}</h1>
        <p className="mt-2 text-pretty text-muted-foreground">{dictionary.noOrderBody}</p>
        <Link href={`${base}/products`} className={cn(ctaButtonVariants({ variant: "onLight" }), "mt-8")}>
          {dictionary.noOrderCta}
        </Link>
      </div>
    )
  }

  const currencyLabel = locale === "en" ? "EGP" : "ج.م"
  const orderDate = new Date(order.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      {/* F-70: GA4 purchase — transaction id + value + items, once. */}
      <TrackPurchase
        orderNumber={order.orderNumber}
        total={order.total}
        currency="EGP"
        items={order.items}
      />
      <div className="flex flex-col items-center text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2Icon className="size-8" />
        </div>
        <h1 className="mt-4 font-heading text-2xl font-semibold sm:text-3xl">{dictionary.title}</h1>
        <p className="mt-2 max-w-md text-pretty text-muted-foreground">{dictionary.body}</p>
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-anti-flash-white p-6 dark:bg-card sm:p-8">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-muted-foreground">{dictionary.orderNumberLabel}</dt>
            <dd className="mt-0.5 font-heading text-lg font-semibold">{order.orderNumber}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{dictionary.dateLabel}</dt>
            <dd className="mt-0.5 font-medium">{orderDate}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{dictionary.paymentLabel}</dt>
            <dd className="mt-0.5 font-medium">{checkoutDictionary[PAYMENT_LABEL_KEY[order.paymentMethod]]}</dd>
            {order.paymentMethod === "card" && (
              <dd className="mt-0.5 text-xs text-muted-foreground">{checkoutDictionary.paymentCardNote}</dd>
            )}
          </div>
          {order.fulfillmentMode && (
            <div>
              <dt className="text-xs text-muted-foreground">{dictionary.fulfillmentLabel}</dt>
              <dd className="mt-0.5 font-medium">{checkoutDictionary[FULFILLMENT_LABEL_KEY[order.fulfillmentMode]]}</dd>
            </div>
          )}
        </dl>

        <h2 className="mt-8 font-heading text-base font-semibold">{dictionary.itemsTitle}</h2>
        <ul className="mt-4 flex flex-col divide-y divide-border">
          {order.items.map((item) => (
            <li key={item.lineId} className="flex items-center gap-3 py-3">
              <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
                ) : (
                  <ProductImagePlaceholder />
                )}
              </div>
              <div className="flex flex-1 flex-col">
                <span className="line-clamp-1 text-sm font-medium">{item.name}</span>
                <span className="text-xs text-muted-foreground">× {item.qty}</span>
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
              {order.subtotal} {currencyLabel}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{dictionary.shippingCostLabel}</span>
            <span className="font-semibold tabular-nums">
              {order.shippingCost === 0 ? dictionary.shippingFreeLabel : `${order.shippingCost} ${currencyLabel}`}
            </span>
          </div>
          <div className="flex items-center justify-between text-base">
            <span className="font-medium">{dictionary.totalLabel}</span>
            <span className="font-semibold tabular-nums">
              {order.total} {currencyLabel}
            </span>
          </div>
        </div>
        {order.hasUnpricedItems && (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{dictionary.unpricedNote}</p>
        )}
      </div>

      {/* Manual prepayment (InstaPay / Vodafone Cash): repeat both rails
          from checkout so the customer can actually send the money, with the
          WhatsApp receipt hand-off pre-filled from this order. Only for
          bank_transfer orders. */}
      {order.paymentMethod === "bank_transfer" && (
        <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-start sm:p-8">
          <h2 className="font-heading text-base font-semibold">{dictionary.transferReminderTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{checkoutDictionary.paymentBankNote}</p>

          <div className="mt-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium">{checkoutDictionary.paymentInstapay}</span>
              <span className="text-xs font-medium" dir="ltr">
                {INSTAPAY_ALIAS}
              </span>
              <CopyToClipboardButton
                value={INSTAPAY_ALIAS}
                label={checkoutDictionary.copyAliasLabel}
                copiedLabel={checkoutDictionary.copiedInstapayLabel}
              />
              <a
                href={INSTAPAY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/5 focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {checkoutDictionary.paymentInstapayCta}
                <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium">{checkoutDictionary.paymentVodafone}</span>
              <span className="text-xs font-semibold tabular-nums" dir="ltr">
                {VODAFONE_CASH_NUMBER}
              </span>
              <CopyToClipboardButton
                value={VODAFONE_CASH_NUMBER}
                label={checkoutDictionary.copyNumberLabel}
                copiedLabel={checkoutDictionary.copiedVodafoneLabel}
              />
            </div>

            {/* The exact amount to send, stated where the customer acts. */}
            <p className="text-base font-semibold">
              {checkoutDictionary.transferAmountLabel}{" "}
              <span className="tabular-nums">
                {order.total} {currencyLabel}
              </span>
            </p>
            {order.transferRef && (
              <p className="text-xs text-muted-foreground">
                {checkoutDictionary.transferRefRecordedLabel}{" "}
                <span className="font-medium text-foreground" dir="ltr">
                  {order.transferRef}
                </span>
              </p>
            )}
          </div>

          {/* Receipt hand-off: a plain wa.me link pre-filled from THIS order
              (order number from the created order, never user input). It is
              not a payment path — the order stays PENDING until the admin
              verifies the transfer and settles it. */}
          <a
            href={paymentWhatsAppUrl(
              buildTransferConfirmationMessage(checkoutDictionary.whatsappTransferTemplate, {
                orderNumber: order.orderNumber,
                paymentMethod: checkoutDictionary.paymentBank,
                orderTotal: `${order.total} ${currencyLabel}`,
              })
            )}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(ctaButtonVariants({ variant: "onLight" }), "mt-5")}
          >
            <MessageCircleIcon className="size-4" aria-hidden="true" />
            {checkoutDictionary.whatsappReceiptCta}
          </a>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {checkoutDictionary.whatsappPendingNote}
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-muted-foreground">{dictionary.contactNote}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href={`${base}/contact`} className={cn(ctaButtonVariants({ variant: "outline" }))}>
            {dictionary.contactCta}
          </Link>
          <Link href={`${base}/products`} className={cn(ctaButtonVariants({ variant: "onLight" }))}>
            {dictionary.continueShoppingCta}
          </Link>
        </div>
        <Link href={base} className="mt-2 text-sm text-muted-foreground hover:text-foreground">
          {dictionary.backHomeCta}
        </Link>
      </div>
    </div>
  )
}
