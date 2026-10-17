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
    <Reveal className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">{dictionary.auth.dashboardTitle}</h1>
        <p className="mt-1 text-muted-foreground">
          {dictionary.auth.dashboardWelcome}{locale === "en" ? "," : "،"} {customer.firstName}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <card.icon className="size-5" />
              </div>
              {typeof card.count === "number" && (
                <span className="text-sm font-semibold tabular-nums text-muted-foreground">{card.count}</span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="font-heading text-base font-medium">{card.title}</h2>
              <p className="text-sm text-muted-foreground">{card.body}</p>
            </div>
            <span className="mt-auto flex items-center gap-1 text-sm font-medium text-primary">
              {dictionary.auth.dashboardViewAll}
              <ChevronLeftIcon className="size-3.5 rtl:rotate-180" />
            </span>
          </Link>
        ))}
      </div>
    </Reveal>
  )
}
