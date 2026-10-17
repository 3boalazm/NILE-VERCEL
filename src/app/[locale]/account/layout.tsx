import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { LayoutDashboardIcon, PackageIcon, MapPinIcon, UserIcon } from "lucide-react"

import { isValidLocale, type Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { requireActiveCustomer } from "@/lib/auth/active-customer"
import { LogoutButton } from "@/components/npf/logout-button"

export default async function AccountLayout({
  children,
  params,
}: LayoutProps<"/[locale]/account">) {
  const { locale: localeParam } = await params
  if (!isValidLocale(localeParam)) notFound()
  const locale: Locale = localeParam
  const dictionary = getDictionary(locale)
  const base = `/${locale}`

  // Server-side ownership check on every account page, not just at the
  // client — a signed-out visitor (or an expired/cleared session cookie)
  // is redirected before any account data is fetched, let alone rendered.
  const customer = await requireActiveCustomer()
  if (!customer) redirect(`/${locale}/login?redirect=${encodeURIComponent(`${base}/account`)}`)

  const navLinks = [
    { href: `${base}/account`, label: dictionary.auth.dashboardTitle, icon: LayoutDashboardIcon },
    { href: `${base}/account/orders`, label: dictionary.auth.ordersTitle, icon: PackageIcon },
    { href: `${base}/account/addresses`, label: dictionary.auth.addressesTitle, icon: MapPinIcon },
    { href: `${base}/account/profile`, label: dictionary.auth.profileTitle, icon: UserIcon },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="flex flex-row gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex shrink-0 items-center gap-2.5 rounded-xl border border-border px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors hover:bg-muted lg:shrink"
            >
              <link.icon className="size-4 shrink-0 text-primary" />
              {link.label}
            </Link>
          ))}
          <LogoutButton
            locale={locale}
            label={dictionary.auth.logoutCta}
            className="shrink-0 lg:shrink"
          />
        </aside>
        <div>{children}</div>
      </div>
    </div>
  )
}
