import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import { PackageIcon, ChevronLeftIcon } from "lucide-react"

import { isValidLocale, type Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { requireActiveCustomer } from "@/lib/auth/active-customer"
import { toOrderStatusKey } from "@/lib/auth/types"
import { LineThumb } from "@/components/glass/line-thumb"
import { Reveal } from "@/components/npf/motion/reveal"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/account/orders">): Promise<Metadata> {
  const { locale: localeParam } = await params
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "ar"
  return { title: getDictionary(locale).auth.ordersTitle, robots: { index: false, follow: false } }
}

export default async function AccountOrdersPage({ params }: PageProps<"/[locale]/account/orders">) {
  const { locale: localeParam } = await params
  if (!isValidLocale(localeParam)) notFound()
  const locale: Locale = localeParam
  const dictionary = getDictionary(locale)
  const base = `/${locale}`
  const currencyLabel = locale === "en" ? "EGP" : "ج.م"
  const dateLocale = locale === "en" ? "en-EG" : "ar-EG"

  const customer = await requireActiveCustomer()
  if (!customer) redirect(`/${locale}/login`)

  if (customer.orders.length === 0) {
    return (
      <Reveal className="ngc-panel ngc-empty" style={{ maxInlineSize: "none", paddingBlock: "56px" }}>
        <span className="ngc-empty-icon" aria-hidden="true">
          <PackageIcon />
        </span>
        <h1 className="ngc-title ngc-title-sm">{dictionary.auth.ordersEmptyTitle}</h1>
        <p className="ngc-sub">{dictionary.auth.ordersEmptyBody}</p>
        <Link href={`${base}/products`} className="ng-btn ng-btn-primary">
          {dictionary.auth.ordersEmptyCta}
        </Link>
      </Reveal>
    )
  }

  return (
    <Reveal className="ngc-stack" style={{ ["--ngc-gap" as string]: "20px" }}>
      <h1 className="ngc-title ngc-title-sm">{dictionary.auth.ordersTitle}</h1>
      <ul className="ngc-lines">
        {customer.orders.map((order) => (
          <li key={order.code} className="ngc-panel ngc-order">
            <span className="ngc-thumb ngc-thumb-sm" style={{ inlineSize: "64px" }}>
              <LineThumb src={order.firstItemImage} sizes="64px" />
            </span>
            <div className="ngc-stack" style={{ ["--ngc-gap" as string]: "6px" }}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="ngc-h3">
                  {dictionary.auth.orderNumberLabel} <span className="ngc-mono">{order.code}</span>
                </span>
                <span className="ngc-status">{dictionary.auth.orderStatus[toOrderStatusKey(order.state)]}</span>
              </div>
              <span className="ngc-line-meta">
                {new Date(order.createdAt).toLocaleDateString(dateLocale)} · {order.itemCount} {dictionary.auth.orderItemsLabel} ·{" "}
                <span className="ngc-amount">
                  {order.total} {currencyLabel}
                </span>
              </span>
            </div>
            <Link href={`${base}/account/orders/${order.code}`} className="ng-btn">
              {dictionary.auth.viewOrderCta}
              <ChevronLeftIcon className="size-4 ltr:rotate-180" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </Reveal>
  )
}
