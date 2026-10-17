"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HomeIcon, MenuIcon, PackageIcon, ShoppingCartIcon } from "lucide-react"

import { getDirection, type Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/dictionaries"
import { useCart } from "@/lib/cart"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

/**
 * Mobile-only tab bar (hidden `lg:` and up, where the full header nav takes
 * over) — the four highest-frequency actions per ADR-017's mobile-UX pass.
 * "More" duplicates the header's secondary links rather than sharing its
 * `links` array, since the header isn't set up to expose it and this keeps
 * the two components independent.
 */
export function NPFBottomNav({
  locale,
  dictionary,
  isSignedIn,
}: {
  locale: Locale
  /**
   * Narrowed on purpose — the full `Dictionary` includes function-valued
   * fields elsewhere in the tree (e.g. products.resultsCount), and Next.js
   * rejects ANY function reachable inside a Prop crossing into a Client
   * Component, even one this component never reads. `nav`/`siteName`/
   * `wishlist`/`auth` are all plain-string objects, so a plain object built
   * from just those survives serialization.
   */
  dictionary: Pick<Dictionary, "nav" | "siteName" | "wishlist" | "auth">
  isSignedIn: boolean
}) {
  const base = `/${locale}`
  const pathname = usePathname()
  const { itemCount } = useCart()
  const drawerSide = getDirection(locale) === "rtl" ? "right" : "left"

  const isActive = (href: string) => (href === base ? pathname === base : pathname.startsWith(href))

  const moreLinks = [
    { href: `${base}/about`, label: dictionary.nav.about },
    { href: `${base}/story`, label: dictionary.nav.story },
    { href: `${base}/quality-sourcing`, label: dictionary.nav.quality },
    { href: `${base}/careers`, label: dictionary.nav.careers },
    { href: `${base}/contact`, label: dictionary.nav.contact },
    { href: `${base}/wishlist`, label: dictionary.wishlist.navLabel },
    { href: isSignedIn ? `${base}/account` : `${base}/login`, label: isSignedIn ? dictionary.auth.accountNavLabel : dictionary.auth.loginNavLabel },
  ]

  // Active tab = colour + weight + a short bar along the top edge, so the
  // state doesn't rely on colour alone (mobile audit).
  const tabClass = (active: boolean) =>
    cn(
      "relative flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[0.65rem] font-medium outline-none transition-colors focus-visible:bg-primary/5",
      "before:absolute before:top-0 before:h-0.5 before:w-8 before:rounded-b-full before:bg-primary before:transition-opacity before:content-['']",
      active ? "font-semibold text-primary before:opacity-100" : "text-muted-foreground before:opacity-0"
    )

  return (
    <nav
      className="fixed inset-x-3 bottom-2 z-40 rounded-2xl border border-border bg-background/95 shadow-xl backdrop-blur-xl pb-[env(safe-area-inset-bottom)] lg:hidden dark:bg-card"
      aria-label={dictionary.siteName}
    >
      <div className="mx-auto flex max-w-7xl items-stretch">
        <Link href={base} className={tabClass(isActive(base))} aria-current={isActive(base) ? "page" : undefined}>
          <HomeIcon className="size-5" />
          {dictionary.nav.home}
        </Link>
        <Link
          href={`${base}/products`}
          className={tabClass(isActive(`${base}/products`))}
          aria-current={isActive(`${base}/products`) ? "page" : undefined}
        >
          <PackageIcon className="size-5" />
          {dictionary.nav.products}
        </Link>
        <Link
          href={`${base}/cart`}
          className={tabClass(isActive(`${base}/cart`))}
          aria-current={isActive(`${base}/cart`) ? "page" : undefined}
        >
          <span className="relative inline-flex">
            <ShoppingCartIcon className="size-5" />
            {itemCount > 0 && (
              <span className="absolute -end-2 -top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[0.6rem] font-semibold text-primary-foreground">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </span>
          {dictionary.nav.cart}
        </Link>

        <Sheet>
          <SheetTrigger render={<button type="button" className={tabClass(false)} />}>
            <MenuIcon className="size-5" />
            {dictionary.nav.openMenu}
          </SheetTrigger>
          <SheetContent side={drawerSide} closeLabel={dictionary.nav.closeMenu}>
            <SheetHeader>
              <SheetTitle>{dictionary.siteName}</SheetTitle>
            </SheetHeader>
            <nav aria-label={dictionary.nav.mainNavLabel} className="flex flex-col gap-1 px-4">
              {moreLinks.map((link) => (
                // SheetClose (same as the header drawer): without it the
                // sheet stays open after navigation, since the layout —
                // and this component's state — doesn't remount between pages.
                <SheetClose
                  key={link.href}
                  render={
                    <Link
                      href={link.href}
                      className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
                    >
                      {link.label}
                    </Link>
                  }
                />
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}
