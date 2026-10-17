import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import Image from "next/image"
import type { Metadata } from "next"
import { PackageIcon, ChevronLeftIcon } from "lucide-react"

import { isValidLocale, type Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { requireActiveCustomer } from "@/lib/auth/active-customer"
import { toOrderStatusKey } from "@/lib/auth/types"
import { ctaButtonVariants } from "@/components/ui/button"
import { ProductImagePlaceholder } from "@/components/npf/product-image-placeholder"
import { Reveal } from "@/components/npf/motion/reveal"
import { cn } from "@/lib/utils"

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
      <Reveal className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <PackageIcon className="size-6" />
        </div>
        <h1 className="font-heading text-xl font-semibold">{dictionary.auth.ordersEmptyTitle}</h1>
        <p className="max-w-sm text-pretty text-muted-foreground">{dictionary.auth.ordersEmptyBody}</p>
        <Link href={`${base}/products`} className={cn(ctaButtonVariants({ variant: "onLight" }), "mt-2")}>
          {dictionary.auth.ordersEmptyCta}
        </Link>
      </Reveal>
    )
  }

  return (
    <Reveal className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-semibold">{dictionary.auth.ordersTitle}</h1>
      <ul className="flex flex-col gap-4">
        {customer.orders.map((order) => (
          <li
            key={order.code}
            className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center"
          >
            <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
              {order.firstItemImage ? (
                <Image src={order.firstItemImage} alt="" fill sizes="64px" className="object-cover" />
              ) : (
                <ProductImagePlaceholder />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-medium">
                  {dictionary.auth.orderNumberLabel} {order.code}
                </span>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {dictionary.auth.orderStatus[toOrderStatusKey(order.state)]}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {new Date(order.createdAt).toLocaleDateString(dateLocale)} · {order.itemCount} {dictionary.auth.orderItemsLabel} ·{" "}
                {order.total} {currencyLabel}
              </span>
            </div>
            <Link
              href={`${base}/account/orders/${order.code}`}
              className={cn(ctaButtonVariants({ variant: "outline" }), "shrink-0 justify-center gap-1.5")}
            >
              {dictionary.auth.viewOrderCta}
              <ChevronLeftIcon className="size-3.5 rtl:rotate-180" />
            </Link>
          </li>
        ))}
      </ul>
    </Reveal>
  )
}
