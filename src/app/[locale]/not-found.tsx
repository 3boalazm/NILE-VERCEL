import Link from "next/link"
import { headers } from "next/headers"
import { ArrowLeftIcon } from "lucide-react"

import { defaultLocale, locales, type Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { Notice } from "@/components/glass/content"

export default async function NotFound() {
  // not-found.tsx can't receive params — the locale is recovered from a
  // header the middleware sets on every matched request (see middleware.ts).
  const headersList = await headers()
  const pathname = headersList.get("x-pathname") ?? ""
  const matchedLocale = locales.find(
    (candidate) => pathname === `/${candidate}` || pathname.startsWith(`/${candidate}/`)
  )
  const locale: Locale = matchedLocale ?? defaultLocale
  const dictionary = getDictionary(locale)

  return (
    <div className="ng-content ng-wrap ng-notice-wrap">
      <Notice titleAs="h1" eyebrow={dictionary.notFound.eyebrow} title={dictionary.notFound.title} body={dictionary.notFound.body}>
        <p className="ng-notice-code" aria-hidden="true" style={{ order: -1 }}>
          404
        </p>
        <div className="ng-hero-cta">
          <Link href={`/${locale}`} className="ng-btn ng-btn-primary ng-btn-lg">
            {dictionary.notFound.cta}
            <ArrowLeftIcon className="size-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
          <Link href={`/${locale}/products`} className="ng-btn ng-btn-lg">
            {dictionary.nav.products}
          </Link>
        </div>
      </Notice>
    </div>
  )
}
