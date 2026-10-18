"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { HeartIcon, MenuIcon, ShoppingBagIcon, UserIcon } from "lucide-react"
import type { Locale } from "@/lib/i18n/config"
import { useCart } from "@/lib/cart"
import { LocaleSwitcher } from "@/components/npf/locale-switcher"
import { ThemeToggle } from "@/components/npf/theme-toggle"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

type NavLink = { href: string; label: string }

export type GlassHeaderProps = {
  locale: Locale
  links: NavLink[]
  account: NavLink
  labels: {
    site: string
    contact: string
    wishlist: string
    cart: string
    menu: string
    light: string
    dark: string
  }
}

/**
 * Floating glass header. The bar is the only persistent blurred layer on
 * desktop; it gains depth once the page scrolls under it.
 */
export function GlassHeader({ locale, links, account, labels }: GlassHeaderProps) {
  const base = `/${locale}`
  const pathname = usePathname()
  const { itemCount } = useCart()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <header className="ng-header" data-scrolled={scrolled}>
      <div className="ng-header-bar">
        <Link href={base} className="ng-brand" aria-label={labels.site}>
          {/* eslint-disable-next-line @next/next/no-img-element -- local vector logo */}
          <img src="/npf-logo.svg" alt="" width={29} height={34} />
        </Link>

        <nav className="ng-nav" aria-label={labels.site}>
          {links.map((link) => (
            <Link key={link.href} href={link.href} aria-current={isActive(link.href) ? "page" : undefined}>
              {link.label}
            </Link>
          ))}
          <Link href={`${base}/contact`} aria-current={isActive(`${base}/contact`) ? "page" : undefined}>
            {labels.contact}
          </Link>
        </nav>

        <div className="ng-actions">
          <Link href={account.href} aria-label={account.label} title={account.label} className="ng-icon-btn ng-desktop-only">
            <UserIcon size={20} aria-hidden="true" />
          </Link>
          <Link href={`${base}/wishlist`} aria-label={labels.wishlist} title={labels.wishlist} className="ng-icon-btn ng-desktop-only">
            <HeartIcon size={20} aria-hidden="true" />
          </Link>
          <Link href={`${base}/cart`} aria-label={labels.cart} title={labels.cart} className="ng-icon-btn">
            <ShoppingBagIcon size={20} aria-hidden="true" />
            {itemCount > 0 && <span className="ng-badge-dot">{itemCount > 9 ? "9+" : itemCount}</span>}
          </Link>
          <LocaleSwitcher locale={locale} />
          <span className="ng-desktop-only">
            <ThemeToggle lightLabel={labels.light} darkLabel={labels.dark} />
          </span>
          <Sheet>
            <SheetTrigger
              render={<button type="button" className="ng-icon-btn ng-mobile-only" aria-label={labels.menu} />}
            >
              <MenuIcon size={22} aria-hidden="true" />
            </SheetTrigger>
            <SheetContent side={locale === "ar" ? "right" : "left"} className="ng-menu-sheet">
              <SheetHeader>
                <SheetTitle>
                  <span className="ng-sr">{labels.site}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element -- local vector logo */}
                  <img src="/npf-logo.svg" alt="" width={36} height={42} aria-hidden="true" className="ng-menu-logo" />
                </SheetTitle>
              </SheetHeader>
              <nav className="ng-menu-links" aria-label={labels.menu}>
                {[
                  ...links,
                  { href: `${base}/contact`, label: labels.contact },
                  account,
                  { href: `${base}/wishlist`, label: labels.wishlist },
                  { href: `${base}/cart`, label: labels.cart },
                ].map((link) => (
                  <SheetClose key={link.href} render={<Link href={link.href} />}>
                    <span>{link.label}</span>
                    <span aria-hidden="true">{locale === "ar" ? "←" : "→"}</span>
                  </SheetClose>
                ))}
              </nav>
              <div className="ng-menu-foot">
                <a href="mailto:info@nilepharmafood.com" className="ng-link">
                  info@nilepharmafood.com
                </a>
                <ThemeToggle lightLabel={labels.light} darkLabel={labels.dark} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
