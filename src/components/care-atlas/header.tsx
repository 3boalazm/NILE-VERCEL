"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { HeartIcon, UserIcon } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { CartIndicator } from "@/components/npf/cart-indicator";
import { LocaleSwitcher } from "@/components/npf/locale-switcher";
import { ThemeToggle } from "@/components/npf/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type NavLink = { href: string; label: string };
export function AtlasHeader({
  locale,
  links,
  account,
  labels,
}: {
  locale: Locale;
  links: NavLink[];
  account: NavLink;
  labels: {
    site: string;
    contact: string;
    wishlist: string;
    cart: string;
    menu: string;
    light: string;
    dark: string;
  };
}) {
  const base = `/${locale}`;
  const pathname = usePathname();
  const home = pathname === base || pathname === `${base}/`;
  const [floating, setFloating] = useState(false);
  useEffect(() => {
    if (!home || typeof IntersectionObserver === "undefined") return;
    const hero = document.querySelector(".ca-hero");
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setFloating(
          !entry.isIntersecting && entry.boundingClientRect.bottom <= 0,
        );
      },
      { threshold: 0 },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, [home, pathname]);
  return (
    <header
      className={`ca-header ${home ? "ca-header-home" : "ca-header-inner"} ${home && floating ? "ca-header-float" : ""}`}
    >
      <Link href={base} className="ca-brand" aria-label={labels.site}>
        {/* eslint-disable-next-line @next/next/no-img-element -- original vector mark, without wordmark */}
        <img src="/npf-mark-white.svg" alt="" width={40} height={48} />
      </Link>
      <nav className="ca-desktop-nav" aria-label={labels.site}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={pathname.startsWith(link.href) ? "page" : undefined}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="ca-header-actions">
        <Link href={`${base}/contact`} className="ca-contact-top">
          {labels.contact}
          <span aria-hidden="true">↗</span>
        </Link>
        <Link
          href={account.href}
          aria-label={account.label}
          className="ca-header-icon ca-desktop-tool"
        >
          <UserIcon size={18} aria-hidden="true" />
        </Link>
        <Link
          href={`${base}/wishlist`}
          aria-label={labels.wishlist}
          className="ca-header-icon ca-desktop-tool"
        >
          <HeartIcon size={18} aria-hidden="true" />
        </Link>
        <CartIndicator href={`${base}/cart`} label={labels.cart} />
        <LocaleSwitcher locale={locale} />
        <span className="ca-desktop-tool">
          <ThemeToggle lightLabel={labels.light} darkLabel={labels.dark} />
        </span>
        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                className="ca-menu-button"
                aria-label={labels.menu}
              />
            }
          >
            <span />
            <span />
          </SheetTrigger>
          <SheetContent
            side={locale === "ar" ? "right" : "left"}
            className="ca-menu-sheet"
          >
            <SheetHeader>
              <SheetTitle>
                <span className="sr-only">{labels.site}</span>
                {/* eslint-disable-next-line @next/next/no-img-element -- original local mark */}
                <img
                  src="/npf-mark-white.svg"
                  alt=""
                  width={36}
                  height={43}
                  aria-hidden="true"
                />
              </SheetTitle>
            </SheetHeader>
            <nav className="ca-menu-links" aria-label={labels.menu}>
              {[
                ...links,
                { href: `${base}/contact`, label: labels.contact },
                account,
                { href: `${base}/wishlist`, label: labels.wishlist },
                { href: `${base}/cart`, label: labels.cart },
              ].map((link, i) => (
                <SheetClose key={link.href} render={<Link href={link.href} />}>
                  <span className="ca-mono">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{link.label}</span>
                  <span aria-hidden="true">↗</span>
                </SheetClose>
              ))}
            </nav>
            <div className="ca-menu-utilities">
              <a href="mailto:info@nilepharmafood.com">
                info@nilepharmafood.com
              </a>
              <ThemeToggle lightLabel={labels.light} darkLabel={labels.dark} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
