"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HomeIcon, LayoutGridIcon, ShoppingBagIcon, UserIcon } from "lucide-react"
import type { Locale } from "@/lib/i18n/config"
import { useCart } from "@/lib/cart"

type DockProps = {
  locale: Locale
  labels: { home: string; products: string; cart: string; account: string; nav: string }
  accountHref: string
}

/** Mobile bottom dock — four highest-frequency destinations. Hidden ≥ 960px. */
export function GlassDock({ locale, labels, accountHref }: DockProps) {
  const base = `/${locale}`
  const pathname = usePathname()
  const { itemCount } = useCart()
  const items = [
    { href: base, label: labels.home, icon: HomeIcon, exact: true },
    { href: `${base}/products`, label: labels.products, icon: LayoutGridIcon },
    { href: `${base}/cart`, label: labels.cart, icon: ShoppingBagIcon, badge: itemCount },
    { href: accountHref, label: labels.account, icon: UserIcon },
  ]
  return (
    <nav className="ng-dock" aria-label={labels.nav}>
      {items.map(({ href, label, icon: Icon, exact, badge }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined}>
            <span style={{ position: "relative", display: "inline-grid" }}>
              <Icon size={20} aria-hidden="true" />
              {badge ? <span className="ng-badge-dot">{badge > 9 ? "9+" : badge}</span> : null}
            </span>
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
