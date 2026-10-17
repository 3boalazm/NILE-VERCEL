import Link from "next/link"
import { headers } from "next/headers"
import { ArrowLeftIcon } from "lucide-react"

import { defaultLocale, locales, type Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { ctaButtonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8">
      <span className="eyebrow text-primary">{dictionary.notFound.eyebrow}</span>
      <h1 className="mt-2 font-heading text-3xl font-semibold">{dictionary.notFound.title}</h1>
      <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">
        {dictionary.notFound.body}
      </p>
      <Link
        href={`/${locale}`}
        className={cn(ctaButtonVariants({ variant: "onLight" }), "mt-8")}
      >
        {dictionary.notFound.cta}
        <ArrowLeftIcon className="size-4 rtl:rotate-180" />
      </Link>
    </div>
  )
}
