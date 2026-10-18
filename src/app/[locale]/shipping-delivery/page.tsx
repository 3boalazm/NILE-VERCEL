import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

import { isValidLocale, type Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { PageIntro, SectionHead } from "@/components/glass/sections"
import "@/app/glass-content.css"
import { Reveal } from "@/components/npf/motion/reveal"
import { buildPageMetadata } from "@/lib/seo/page-metadata"
import { MECS_BRANCHES, MECS_CARRIER, mecsTelHref } from "@/lib/shipping/mecs"

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
    <div className="ng-content">
      <PageIntro eyebrow={dictionary.siteName} title={shipping.pageTitle} body={shipping.pageSubtitle} />

      <div className="ng-wrap ng-band-tight">
        <Reveal as="figure" className="ng-editorial ng-editorial-wide">
          <div className="ng-editorial-media">
            <Image
              src="/shipping-van.jpg"
              alt={shipping.pageTitle}
              width={2000}
              height={2000}
              sizes="(min-width: 1340px) 1280px, 100vw"
              style={{ objectPosition: "50% 78%" }}
              priority
            />
          </div>
        </Reveal>
      </div>

      <section className="ng-wrap ng-band-tight" aria-labelledby="shipping-zones">
        <div className="ng-split ng-split-even" style={{ marginBlockEnd: "clamp(20px, 3vw, 32px)" }}>
          <Reveal className="ng-callout ng-callout-info">
            <p className="ng-h4" id="shipping-zones">
              {shipping.carrierLine}
            </p>
          </Reveal>
          <Reveal delay={0.04} className="ng-empty" style={{ textAlign: "start" }}>
            <p className="ng-small">{shipping.disclaimer}</p>
          </Reveal>
        </div>

        <Reveal
          delay={0.06}
          className="ng-table-frame"
          tabIndex={0}
          role="region"
          aria-labelledby="shipping-zones"
        >
          <table className="ng-table ng-table-stack">
            <thead>
              <tr>
                <th scope="col" style={{ inlineSize: "4rem" }}>{shipping.zoneHeader}</th>
                <th scope="col">{shipping.areasHeader}</th>
                <th scope="col" style={{ inlineSize: "8rem" }}>{shipping.oneWayHeader}</th>
                <th scope="col" style={{ inlineSize: "8rem" }}>{shipping.roundTripHeader}</th>
              </tr>
            </thead>
            <tbody>
              {shipping.zones.map((row) => (
                <tr key={row.zone}>
                  <td data-label={shipping.zoneHeader} className="ng-num" style={{ fontWeight: 700, color: "var(--ng-brand)" }}>
                    {row.zone}
                  </td>
                  <td data-label={shipping.areasHeader}>{row.areas}</td>
                  <td data-label={shipping.oneWayHeader} className="ng-nowrap ng-num" style={{ fontWeight: 600 }}>
                    {formatPrice(row.oneWay)}
                  </td>
                  <td data-label={shipping.roundTripHeader} className="ng-nowrap ng-num" style={{ fontWeight: 600 }}>
                    {formatPrice(row.roundTrip)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </section>

      <section className="ng-wrap ng-band-tight">
        <div className="ng-split ng-split-even">
          <Reveal as="section" className="ng-tile">
            <h2 className="ng-h4">{shipping.deliveryTimeTitle}</h2>
            <ul className="ng-bullets ng-small">
              <li>{shipping.deliveryTimeZone1}</li>
              <li>{shipping.deliveryTimeOthers}</li>
            </ul>
          </Reveal>
          <Reveal as="section" delay={0.06} className="ng-tile">
            <h2 className="ng-h4">{shipping.prepaidTitle}</h2>
            <p className="ng-body ng-small">{shipping.prepaidBody}</p>
          </Reveal>
        </div>
      </section>

      {/* MECS branch locator — the branch_pickup fulfilment option's real
          drop-off points. Data from the carrier's own site (see mecs.ts). */}
      <section className="ng-wrap ng-band" aria-labelledby="shipping-branches">
        <SectionHead title={shipping.branchesTitle} body={shipping.branchesNote} id="shipping-branches" />
        {/* One native disclosure per governorate: 26 groups / 60+ branches
            would otherwise be a very long scroll on a phone. Works without JS,
            and browser find-in-page opens the matching group. */}
        <div className="ng-acc ng-branch-acc" style={{ marginBlockStart: "clamp(24px, 4vw, 40px)" }}>
          {MECS_BRANCHES.map((group) => (
            <details key={group.governorateEn}>
              <summary>
                <span className="ng-branch-sum">
                  <span>{locale === "ar" ? group.governorateAr : group.governorateEn}</span>
                  <small lang={locale === "ar" ? "en" : "ar"} dir={locale === "ar" ? "ltr" : "rtl"}>
                    {locale === "ar" ? group.governorateEn : group.governorateAr}
                  </small>
                </span>
                <span className="ng-pill ng-pill-soft ng-num">{group.branches.length}</span>
              </summary>
              <ul className="ng-branches">
                {group.branches.map((branch) => (
                  <li key={`${group.governorateEn}-${branch.name}`} className="ng-tile">
                    <h3 className="ng-small" style={{ fontWeight: 600, color: "var(--ng-ink)", margin: 0 }}>
                      {branch.name}
                    </h3>
                    {locale === "ar" ? (
                      <p className="ng-muted ng-small">{branch.addressAr}</p>
                    ) : (
                      <p className="ng-muted ng-small" dir="ltr">
                        {branch.address}
                      </p>
                    )}
                    {branch.phones.length > 0 && (
                      <p className="ng-phones">
                        {branch.phones.map((phone) => (
                          <a key={phone} href={mecsTelHref(phone)}>
                            {shipping.branchesCallLabel}&nbsp;<span dir="ltr">{phone}</span>
                          </a>
                        ))}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </section>

      <section className="ng-wrap" style={{ paddingBlockEnd: "clamp(56px, 8vw, 112px)" }}>
        <Reveal className="ng-cta ng-glass ng-stack" style={{ ["--ng-stack" as string]: "18px" }}>
          <p className="ng-lead">{shipping.cta}</p>
          <div className="ng-hero-cta">
            <Link href={`${base}/contact`} className="ng-btn ng-btn-primary ng-btn-lg">
              {shipping.ctaButton}
              <span className="ng-arrow" aria-hidden="true">↗</span>
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
