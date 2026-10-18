import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import { ChevronLeftIcon } from "lucide-react"

import { isValidLocale, type Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { requireActiveCustomer } from "@/lib/auth/active-customer"
import { readOrderByCode } from "@/lib/vendure/active-order"
import { toOrderStatusKey } from "@/lib/auth/types"
import { LineThumb } from "@/components/glass/line-thumb"
import { ReorderButton } from "@/components/npf/reorder-button"
import { Reveal } from "@/components/npf/motion/reveal"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/account/orders/[code]">): Promise<Metadata> {
  const { locale: localeParam } = await params
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "ar"
  return { title: getDictionary(locale).auth.orderDetailTitle, robots: { index: false, follow: false } }
}

export default async function AccountOrderDetailPage({
  params,
}: PageProps<"/[locale]/account/orders/[code]">) {
  const { locale: localeParam, code } = await params
  if (!isValidLocale(localeParam)) notFound()
  const locale: Locale = localeParam
  const dictionary = getDictionary(locale)
  const base = `/${locale}`
  const currencyLabel = locale === "en" ? "EGP" : "ج.م"
  const dateLocale = locale === "en" ? "en-EG" : "ar-EG"

  const customer = await requireActiveCustomer()
  if (!customer) redirect(`/${locale}/login`)

  // Ownership check: `activeCustomer.orders` is resolved by Vendure from
  // the session token itself, not from anything the client supplied — so
  // confirming `code` is in THIS list, before ever fetching the order's
  // full detail by code, is what stops a signed-in customer from viewing
  // another customer's order just by guessing/typing a different code in
  // the URL. readOrderByCode() itself has no ownership check built in.
  const ownedOrder = customer.orders.find((order) => order.code === code)
  if (!ownedOrder) notFound()

  const order = await readOrderByCode(code)
  if (!order) notFound()

  const orderDate = new Date(order.createdAt).toLocaleDateString(dateLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const reorderLines = order.items.map((item) => ({ slug: item.slug, qty: item.qty }))

  return (
    <Reveal className="ngc-stack" style={{ ["--ngc-gap" as string]: "20px" }}>
      <div className="ngc-head-row">
        <div className="ngc-stack" style={{ ["--ngc-gap" as string]: "6px" }}>
          <Link href={`${base}/account/orders`} className="ngc-quiet justify-self-start">
            <ChevronLeftIcon className="size-4 rtl:rotate-180" aria-hidden="true" />
            {dictionary.auth.backToOrders}
          </Link>
          <h1 className="ngc-title ngc-title-sm">
            {dictionary.auth.orderNumberLabel} <span className="ngc-mono" style={{ fontSize: "0.62em", fontWeight: 600 }}>{order.orderNumber}</span>
          </h1>
          <p className="flex flex-wrap items-center gap-2 ngc-sub">
            {orderDate}
            <span className="ngc-status">{dictionary.auth.orderStatus[toOrderStatusKey(ownedOrder.state)]}</span>
          </p>
        </div>
        <ReorderButton locale={locale} dictionary={dictionary.auth} lines={reorderLines} />
      </div>

      <div className="ngc-panel ngc-stack" style={{ ["--ngc-gap" as string]: "20px" }}>
        <dl className="ngc-facts">
          <div>
            <dt>{dictionary.auth.paymentMethodLabel}</dt>
            <dd>
              {order.paymentMethod === "cod"
                ? dictionary.checkout.paymentCod
                : order.paymentMethod === "card"
                  ? dictionary.checkout.paymentCard
                  : dictionary.checkout.paymentBank}
            </dd>
          </div>
          {order.fulfillmentMode && (
            <div>
              <dt>{dictionary.checkout.shippingMethodTitle}</dt>
              <dd>
                {order.fulfillmentMode === "door_to_door"
                  ? dictionary.checkout.fulfillmentDoorToDoor
                  : order.fulfillmentMode === "branch_pickup"
                    ? dictionary.checkout.fulfillmentBranchPickup
                    : dictionary.checkout.fulfillmentCompanyPickup}
              </dd>
            </div>
          )}
          {order.customer.address && (
            <div>
              <dt>{dictionary.checkout.shippingTitle}</dt>
              <dd>
                {order.customer.address}, {order.customer.city}
              </dd>
            </div>
          )}
        </dl>

        <hr className="ngc-divider" />

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
                {typeof item.price === "number" ? `${item.price * item.qty} ${currencyLabel}` : "—"}
              </span>
            </li>
          ))}
        </ul>

        <dl className="ngc-rows">
          <div className="ngc-row">
            <dt>{dictionary.checkout.subtotalLabel}</dt>
            <dd className="ngc-amount">
              {order.subtotal} {currencyLabel}
            </dd>
          </div>
          <div className="ngc-row">
            <dt>{dictionary.checkout.shippingCostLabel}</dt>
            <dd className="ngc-amount">
              {order.shippingCost === 0 ? dictionary.checkout.shippingFreeLabel : `${order.shippingCost} ${currencyLabel}`}
            </dd>
          </div>
          <div className="ngc-row ngc-row-total">
            <dt>{dictionary.checkout.totalLabel}</dt>
            <dd className="ngc-amount">
              {order.total} {currencyLabel}
            </dd>
          </div>
        </dl>
      </div>
    </Reveal>
  )
}
