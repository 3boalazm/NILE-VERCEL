import { notFound, redirect } from "next/navigation"

import { isValidLocale, type Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { requireActiveCustomer } from "@/lib/auth/active-customer"
import { LogoutButton } from "@/components/npf/logout-button"
import { AccountNav } from "@/components/glass/account-nav"

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
    { href: `${base}/account`, label: dictionary.auth.dashboardTitle, icon: "dashboard" as const },
    { href: `${base}/account/orders`, label: dictionary.auth.ordersTitle, icon: "orders" as const },
    { href: `${base}/account/addresses`, label: dictionary.auth.addressesTitle, icon: "addresses" as const },
    { href: `${base}/account/profile`, label: dictionary.auth.profileTitle, icon: "profile" as const },
  ]

  return (
    <div className="ng-wrap ngc-page">
      <div className="ngc-account">
        <AccountNav label={dictionary.auth.dashboardTitle} links={navLinks}>
          <LogoutButton locale={locale} label={dictionary.auth.logoutCta} />
        </AccountNav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}
