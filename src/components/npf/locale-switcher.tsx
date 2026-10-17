"use client"

import { Suspense } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import type { Locale } from "@/lib/i18n/config"
import { localizedDiscoveryHref } from "@/lib/products/discovery"

function LocaleLink({ locale, href }: { locale: Locale; href: string }) {
  const target = locale === "ar" ? "en" : "ar"
  return (
    <Link
      href={href}
      hrefLang={target}
      lang={target}
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
      aria-label={
        target === "ar" ? "AR — التبديل إلى العربية" : "EN — Switch to English"
      }
    >
      {target.toUpperCase()}
    </Link>
  )
}
function ContextSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname()
  const search = useSearchParams()
  return (
    <LocaleLink
      locale={locale}
      href={localizedDiscoveryHref(
        pathname,
        search.toString(),
        locale === "ar" ? "en" : "ar"
      )}
    />
  )
}
export function LocaleSwitcher({ locale }: { locale: Locale }) {
  return (
    <Suspense
      fallback={
        <LocaleLink
          locale={locale}
          href={`/${locale === "ar" ? "en" : "ar"}`}
        />
      }
    >
      <ContextSwitcher locale={locale} />
    </Suspense>
  )
}
