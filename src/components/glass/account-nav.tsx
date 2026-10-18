"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboardIcon, MapPinIcon, PackageIcon, UserIcon } from "lucide-react"
import type { ReactNode } from "react"

const ICONS = {
  dashboard: LayoutDashboardIcon,
  orders: PackageIcon,
  addresses: MapPinIcon,
  profile: UserIcon,
} as const

/**
 * Account section navigation. A client component only so the current page can
 * carry `aria-current="page"` (layouts do not receive the pathname). Order
 * detail pages keep "Orders" current. Server-rendered links, so no-JS works.
 */
export function AccountNav({
  label,
  links,
  children,
}: {
  label: string
  links: { href: string; label: string; icon: keyof typeof ICONS }[]
  children?: ReactNode
}) {
  const pathname = usePathname()
  const root = links[0]?.href
  return (
    <nav className="ngc-account-nav" aria-label={label}>
      {links.map((link) => {
        const Icon = ICONS[link.icon]
        const current =
          link.href === root ? pathname === link.href : pathname === link.href || pathname.startsWith(`${link.href}/`)
        return (
          <Link key={link.href} href={link.href} aria-current={current ? "page" : undefined}>
            <Icon aria-hidden="true" />
            {link.label}
          </Link>
        )
      })}
      {children}
    </nav>
  )
}
