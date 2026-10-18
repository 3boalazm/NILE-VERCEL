import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import { PackageIcon, MapPinIcon, UserIcon, ChevronLeftIcon } from "lucide-react"

import { isValidLocale, type Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { requireActiveCustomer } from "@/lib/auth/active-customer"
import { Reveal } from "@/components/npf/motion/reveal"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/account">): Promise<Metadata> {
  const { locale: localeParam } = await params
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "ar"
  // Personal account area — never indexed.
  return { title: getDictionary(locale).auth.dashboardTitle, robots: { index: false, follow: false } }
}

export default async function AccountDashboardPage({ params }: PageProps<"/[locale]/account">) {
  const { locale: localeParam } = await params
  if (!isValidLocale(localeParam)) notFound()
  const locale: Locale = localeParam
  const dictionary = getDictionary(locale)
  const base = `/${locale}`

  // The layout already redirects if signed out — this fetch is just for
  // display, ownership is enforced once at the layout level.
  const customer = await requireActiveCustomer()
  if (!customer) redirect(`/${locale}/login`)

  const cards = [
    {
      href: `${base}/account/orders`,
      icon: PackageIcon,
      title: dictionary.auth.dashboardOrdersTitle,
      body: dictionary.auth.dashboardOrdersBody,
      count: customer.orders.length,
    },
    {
      href: `${base}/account/addresses`,
      icon: MapPinIcon,
      title: dictionary.auth.dashboardAddressesTitle,
      body: dictionary.auth.dashboardAddressesBody,
    },
    {
      href: `${base}/account/profile`,
      icon: UserIcon,
      title: dictionary.auth.dashboardProfileTitle,
      body: dictionary.auth.dashboardProfileBody,
    },
  ]

  return (
    <Reveal className="ngc-stack" style={{ ["--ngc-gap" as string]: "28px" }}>
      <div className="ngc-head" style={{ marginBlockEnd: 0 }}>
        <span className="ng-eyebrow">{dictionary.auth.dashboardTitle}</span>
        <h1 className="ngc-title">
          {dictionary.auth.dashboardWelcome}{locale === "en" ? "," : "،"} <span className="ng-accent">{customer.firstName}</span>
        </h1>
      </div>

      <div className="ngc-tiles">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="ngc-tile">
            <div className="ngc-tile-top">
              <span className="ngc-tile-icon" aria-hidden="true">
                <card.icon />
              </span>
              {typeof card.count === "number" && <span className="ngc-tile-count">{card.count}</span>}
            </div>
            <div className="ngc-stack" style={{ ["--ngc-gap" as string]: "4px" }}>
              <h2 className="ngc-h3">{card.title}</h2>
              <p className="ngc-sub">{card.body}</p>
            </div>
            <span className="ngc-tile-more">
              {dictionary.auth.dashboardViewAll}
              <ChevronLeftIcon className="size-4 ltr:rotate-180" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </Reveal>
  )
}
