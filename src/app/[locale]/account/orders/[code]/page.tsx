import Link from "next/link"
import Image from "next/image"
import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import { ChevronLeftIcon } from "lucide-react"

import { isValidLocale, type Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { requireActiveCustomer } from "@/lib/auth/active-customer"
import { readOrderByCode } from "@/lib/vendure/active-order"
import { toOrderStatusKey } from "@/lib/auth/types"
import { ProductImagePlaceholder } from "@/components/npf/product-image-placeholder"
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
    <Reveal className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href={`${base}/account/orders`}
            className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeftIcon className="size-3.5 rotate-180 rtl:rotate-0" />
            {dictionary.auth.backToOrders}
          </Link>
          <h1 className="font-heading text-2xl font-semibold">
            {dictionary.auth.orderNumberLabel} {order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {orderDate} · {dictionary.auth.orderStatus[toOrderStatusKey(ownedOrder.state)]}
          </p>
        </div>
        <ReorderButton locale={locale} dictionary={dictionary.auth} lines={reorderLines} />
      </div>

      <div className="rounded-2xl border border-border bg-anti-flash-white p-6 dark:bg-card">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">{dictionary.auth.paymentMethodLabel}</dt>
            <dd className="mt-0.5 font-medium">
              {order.paymentMethod === "cod" ? dictionary.checkout.paymentCod : dictionary.checkout.paymentBank}
            </dd>
          </div>
          {order.fulfillmentMode && (
            <div>
              <dt className="text-xs text-muted-foreground">{dictionary.checkout.shippingMethodTitle}</dt>
              <dd className="mt-0.5 font-medium">
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
              <dt className="text-xs text-muted-foreground">{dictionary.checkout.shippingTitle}</dt>
              <dd className="mt-0.5 font-medium">
                {order.customer.address}, {order.customer.city}
              </dd>
            </div>
          )}
        </dl>

        <ul className="mt-6 flex flex-col divide-y divide-border">
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
                {typeof item.price === "number" ? `${item.price * item.qty} ${currencyLabel}` : "—"}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{dictionary.checkout.subtotalLabel}</span>
            <span className="font-semibold tabular-nums">
              {order.subtotal} {currencyLabel}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{dictionary.checkout.shippingCostLabel}</span>
            <span className="font-semibold tabular-nums">
              {order.shippingCost === 0 ? dictionary.checkout.shippingFreeLabel : `${order.shippingCost} ${currencyLabel}`}
            </span>
          </div>
          <div className="flex items-center justify-between text-base">
            <span className="font-medium">{dictionary.checkout.totalLabel}</span>
            <span className="font-semibold tabular-nums">
              {order.total} {currencyLabel}
            </span>
          </div>
        </div>
      </div>
    </Reveal>
  )
}
