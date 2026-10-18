"use client"

import Link from "next/link"
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
import { LineThumb } from "@/components/glass/line-thumb"
import { TrackPurchase } from "@/components/npf/analytics-events"

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
      <div className="ng-wrap ngc-empty">
        <span className="ngc-empty-icon" aria-hidden="true">
          <PackageSearchIcon />
        </span>
        <h1 className="ngc-title">{dictionary.noOrderTitle}</h1>
        <p className="ngc-sub">{dictionary.noOrderBody}</p>
        <Link href={`${base}/products`} className="ng-btn ng-btn-primary ng-btn-lg">
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
    <div className="ng-wrap ngc-page" style={{ maxInlineSize: "52rem" }}>
      {/* F-70: GA4 purchase — transaction id + value + items, once. */}
      <TrackPurchase
        orderNumber={order.orderNumber}
        total={order.total}
        currency="EGP"
        items={order.items}
      />
      <div className="ngc-hero-check">
        <span className="ngc-empty-icon" data-tone="ok" aria-hidden="true">
          <CheckCircle2Icon />
        </span>
        <h1 className="ngc-title">{dictionary.title}</h1>
        <p className="ngc-sub" style={{ marginInline: "auto" }}>{dictionary.body}</p>
      </div>

      <div className="ngc-stack" style={{ ["--ngc-gap" as string]: "20px" }}>
        <section className="ngc-panel ngc-panel-strong ngc-stack" style={{ ["--ngc-gap" as string]: "20px" }}>
          <dl className="ngc-facts">
            <div>
              <dt>{dictionary.orderNumberLabel}</dt>
              <dd className="ngc-fact-key ngc-mono">{order.orderNumber}</dd>
            </div>
            <div>
              <dt>{dictionary.dateLabel}</dt>
              <dd>{orderDate}</dd>
            </div>
            <div>
              <dt>{dictionary.paymentLabel}</dt>
              <dd>{checkoutDictionary[PAYMENT_LABEL_KEY[order.paymentMethod]]}</dd>
              {order.paymentMethod === "card" && (
                <dd className="ngc-note">{checkoutDictionary.paymentCardNote}</dd>
              )}
            </div>
            {order.fulfillmentMode && (
              <div>
                <dt>{dictionary.fulfillmentLabel}</dt>
                <dd>{checkoutDictionary[FULFILLMENT_LABEL_KEY[order.fulfillmentMode]]}</dd>
              </div>
            )}
          </dl>

          <hr className="ngc-divider" />

          <h2 className="ngc-h3">{dictionary.itemsTitle}</h2>
          <ul className="ngc-mini">
            {order.items.map((item) => (
              <li key={item.lineId}>
                <span className="ngc-thumb ngc-thumb-sm">
                  <LineThumb src={item.image} sizes="52px" />
                </span>
                <span>
                  <span className="ngc-mini-name">{item.name}</span>
                  <span className="ngc-line-meta">× {item.qty}</span>
                </span>
                <span className="ngc-amount">
                  {typeof item.price === "number"
                    ? `${item.price * item.qty} ${currencyLabel}`
                    : "—"}
                </span>
              </li>
            ))}
          </ul>

          <dl className="ngc-rows">
            <div className="ngc-row">
              <dt>{dictionary.subtotalLabel}</dt>
              <dd className="ngc-amount">
                {order.subtotal} {currencyLabel}
              </dd>
            </div>
            <div className="ngc-row">
              <dt>{dictionary.shippingCostLabel}</dt>
              <dd className="ngc-amount">
                {order.shippingCost === 0 ? dictionary.shippingFreeLabel : `${order.shippingCost} ${currencyLabel}`}
              </dd>
            </div>
            <div className="ngc-row ngc-row-total">
              <dt>{dictionary.totalLabel}</dt>
              <dd className="ngc-amount">
                {order.total} {currencyLabel}
              </dd>
            </div>
          </dl>
          {order.hasUnpricedItems && <p className="ngc-note">{dictionary.unpricedNote}</p>}
        </section>

        {/* Manual prepayment (InstaPay / Vodafone Cash): repeat both rails
            from checkout so the customer can actually send the money, with the
            WhatsApp receipt hand-off pre-filled from this order. Only for
            bank_transfer orders. */}
        {order.paymentMethod === "bank_transfer" && (
          <section className="ngc-panel ngc-panel-tint ngc-stack" style={{ ["--ngc-gap" as string]: "14px" }} aria-labelledby="transfer-reminder-title">
            <h2 id="transfer-reminder-title" className="ngc-h2">{dictionary.transferReminderTitle}</h2>
            <p className="ngc-sub">{checkoutDictionary.paymentBankNote}</p>

            <div className="ngc-grid-2">
              <div className="ngc-transfer">
                <span className="ngc-option-title">{checkoutDictionary.paymentInstapay}</span>
                <span className="ngc-mono">{INSTAPAY_ALIAS.split("@")[0]}<wbr />@{INSTAPAY_ALIAS.split("@").slice(1).join("@")}</span>
                <span className="ngc-actions">
                  <CopyToClipboardButton
                    value={INSTAPAY_ALIAS}
                    label={checkoutDictionary.copyAliasLabel}
                    copiedLabel={checkoutDictionary.copiedInstapayLabel}
                  />
                  <a href={INSTAPAY_URL} target="_blank" rel="noopener noreferrer" className="ngc-pill-btn">
                    {checkoutDictionary.paymentInstapayCta}
                    <ExternalLinkIcon aria-hidden="true" />
                  </a>
                </span>
              </div>
              <div className="ngc-transfer">
                <span className="ngc-option-title">{checkoutDictionary.paymentVodafone}</span>
                <span className="ngc-mono" style={{ fontSize: "var(--ng-t-md)" }}>{VODAFONE_CASH_NUMBER}</span>
                <span className="ngc-actions">
                  <CopyToClipboardButton
                    value={VODAFONE_CASH_NUMBER}
                    label={checkoutDictionary.copyNumberLabel}
                    copiedLabel={checkoutDictionary.copiedVodafoneLabel}
                  />
                </span>
              </div>
            </div>

            {/* The exact amount to send, stated where the customer acts. */}
            <p className="ngc-due">
              <span>{checkoutDictionary.transferAmountLabel}</span>
              <span className="ngc-amount">
                {order.total} {currencyLabel}
              </span>
            </p>
            {order.transferRef && (
              <p className="ngc-note">
                {checkoutDictionary.transferRefRecordedLabel}{" "}
                <span className="ngc-mono">{order.transferRef}</span>
              </p>
            )}

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
              className="ng-btn ng-btn-lg ngc-wa ngc-block"
            >
              <MessageCircleIcon aria-hidden="true" />
              {checkoutDictionary.whatsappReceiptCta}
            </a>
            <p className="ngc-note">{checkoutDictionary.whatsappPendingNote}</p>
          </section>
        )}

        <div className="ngc-stack ngc-center" style={{ ["--ngc-gap" as string]: "12px", paddingBlockStart: "12px" }}>
          <p className="ngc-sub" style={{ marginInline: "auto" }}>{dictionary.contactNote}</p>
          <div className="ngc-actions ngc-center">
            <Link href={`${base}/contact`} className="ng-btn">
              {dictionary.contactCta}
            </Link>
            <Link href={`${base}/products`} className="ng-btn ng-btn-primary">
              {dictionary.continueShoppingCta}
            </Link>
          </div>
          <Link href={base} className="ngc-quiet justify-self-center">
            {dictionary.backHomeCta}
          </Link>
        </div>
      </div>
    </div>
  )
}
