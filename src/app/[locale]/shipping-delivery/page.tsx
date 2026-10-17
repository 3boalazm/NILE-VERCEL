import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

import { isValidLocale, type Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { ctaButtonVariants } from "@/components/ui/button"
import { Reveal } from "@/components/npf/motion/reveal"
import { buildPageMetadata } from "@/lib/seo/page-metadata"
import { MECS_BRANCHES, MECS_CARRIER, mecsTelHref } from "@/lib/shipping/mecs"
import { cn } from "@/lib/utils"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/shipping-delivery">): Promise<Metadata> {
  const { locale: localeParam } = await params
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "ar"
  const dictionary = getDictionary(locale)
  return buildPageMetadata({
    locale,
    path: "/shipping-delivery",
    title: dictionary.shipping.pageTitle,
    description: dictionary.shipping.pageSubtitle,
  })
}

export default async function ShippingDeliveryPage({
  params,
}: PageProps<"/[locale]/shipping-delivery">) {
  const { locale: localeParam } = await params
  if (!isValidLocale(localeParam)) notFound()
  const locale: Locale = localeParam
  const dictionary = getDictionary(locale)
  const base = `/${locale}`
  const shipping = dictionary.shipping

  const formatPrice = (value: number | null) =>
    value === null ? shipping.free : `${value.toLocaleString("en-US")} ${shipping.currency}`

  return (
    <>
      {/* Hero */}
      <section className="bg-anti-flash-white dark:bg-card">
        <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-4 py-20 text-center sm:px-6 lg:px-8">
          <span className="eyebrow text-primary">{dictionary.siteName}</span>
          <h1 className="font-heading text-3xl font-semibold sm:text-4xl">{shipping.pageTitle}</h1>
          <p className="max-w-xl text-muted-foreground">{shipping.pageSubtitle}</p>
        </Reveal>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal as="div" className="relative aspect-21/9 overflow-hidden rounded-2xl">
          <Image
            src="/shipping-van.jpg"
            alt={shipping.pageTitle}
            fill
            sizes="(min-width: 1024px) 56rem, 100vw"
            className="object-cover"
            priority
          />
        </Reveal>

        <Reveal
          delay={0.06}
          as="div"
          className="mt-6 rounded-2xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground"
        >
          {shipping.disclaimer}
        </Reveal>

        {/* The contracted carrier — customers should know who delivers. */}
        <Reveal delay={0.07} as="div" className="mt-4 flex items-center gap-3 rounded-2xl border bg-primary/5 p-4">
          <p className="text-sm font-medium">{shipping.carrierLine}</p>
        </Reveal>

        <Reveal delay={0.08} as="div" className="mt-10 overflow-x-auto rounded-2xl border">
          <table className="w-full text-start text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="w-16 px-4 py-3 text-start font-medium">{shipping.zoneHeader}</th>
                <th className="px-4 py-3 text-start font-medium">{shipping.areasHeader}</th>
                <th className="w-28 px-4 py-3 text-start font-medium">{shipping.oneWayHeader}</th>
                <th className="w-28 px-4 py-3 text-start font-medium">{shipping.roundTripHeader}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {shipping.zones.map((row) => (
                <tr key={row.zone}>
                  <td className="px-4 py-3 align-top font-medium text-muted-foreground">{row.zone}</td>
                  <td className="px-4 py-3 align-top text-pretty leading-relaxed">{row.areas}</td>
                  <td className="px-4 py-3 align-top whitespace-nowrap font-medium">
                    {formatPrice(row.oneWay)}
                  </td>
                  <td className="px-4 py-3 align-top whitespace-nowrap font-medium">
                    {formatPrice(row.roundTrip)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <Reveal delay={0.12} as="section">
            <h2 className="font-heading text-lg font-semibold">{shipping.deliveryTimeTitle}</h2>
            <ul className="mt-2 flex flex-col gap-1 text-pretty leading-relaxed text-muted-foreground">
              <li>{shipping.deliveryTimeZone1}</li>
              <li>{shipping.deliveryTimeOthers}</li>
            </ul>
          </Reveal>
          <Reveal delay={0.16} as="section">
            <h2 className="font-heading text-lg font-semibold">{shipping.prepaidTitle}</h2>
            <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">{shipping.prepaidBody}</p>
          </Reveal>
        </div>

        {/* MECS branch locator — the branch_pickup fulfilment option's real
            drop-off points. Data from the carrier's own site (see mecs.ts). */}
        <Reveal delay={0.18} as="section" className="mt-12">
          <h2 className="font-heading text-xl font-semibold">{shipping.branchesTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{shipping.branchesNote}</p>
          <div className="mt-6 flex flex-col gap-8">
            {MECS_BRANCHES.map((group) => (
              <div key={group.governorateEn} className="flex flex-col gap-3">
                <h3 className="font-heading text-base font-semibold">
                  {group.governorateAr}
                  <span className="ms-2 text-sm font-normal text-muted-foreground">{group.governorateEn}</span>
                </h3>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {group.branches.map((branch) => (
                    <li key={`${group.governorateEn}-${branch.name}`} className="rounded-xl border p-4">
                      <p className="text-sm font-medium">{branch.name}</p>
                      {locale === "ar" ? (
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{branch.addressAr}</p>
                      ) : (
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground" dir="ltr">
                          {branch.address}
                        </p>
                      )}
                      {branch.phones.length > 0 && (
                        <p className="mt-2 flex flex-wrap gap-2">
                          {branch.phones.map((phone) => (
                            <a
                              key={phone}
                              href={mecsTelHref(phone)}
                              className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium tabular-nums transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                            >
                              {shipping.branchesCallLabel} {phone}
                            </a>
                          ))}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.2} as="div" className="mt-12 flex flex-col items-start gap-4">
          <p className="text-muted-foreground">{shipping.cta}</p>
          <Link href={`${base}/contact`} className={cn(ctaButtonVariants({ variant: "onLight" }))}>
            {shipping.ctaButton}
          </Link>
        </Reveal>
      </div>
    </>
  )
}
