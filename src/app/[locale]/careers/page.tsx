import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowLeftIcon, BriefcaseIcon, CalendarClockIcon, MapPinIcon } from "lucide-react"

import { isValidLocale, type Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { PageIntro, ContactBand } from "@/components/glass/sections"
import { EditorialFigure } from "@/components/glass/content"
import { Reveal } from "@/components/npf/motion/reveal"
import { buildPageMetadata } from "@/lib/seo/page-metadata"
import { jobRepository, localizeJob } from "@/lib/jobs"
import { readCmsList } from "@/lib/cms/read"
import { formatJobDate, jobTypeLabel } from "@/lib/jobs/format"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/careers">): Promise<Metadata> {
  const { locale: localeParam } = await params
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "ar"
  const dictionary = getDictionary(locale)
  const jobRead = await readCmsList("careers:metadata", () =>
    jobRepository.getOpenJobs(),
  )
  const hasOpenJobs = jobRead.items.length > 0
  return buildPageMetadata({
    locale,
    path: "/careers",
    title: dictionary.careers.pageTitle,
    description: dictionary.careers.pageSubtitle,
    // An empty listing is thin content: keep it reachable and linked, but ask
    // crawlers to skip it until there is at least one real opening (F-015).
    // A CMS outage is the same situation — the listing is not real content
    // right now.
    noIndex: jobRead.unavailable || !hasOpenJobs,
    follow: true,
  })
}

/**
 * Careers. The openings list is CMS-driven (`jobs` collection) — it renders
 * whatever the client publishes in the admin, and falls back to the original
 * "no open positions" state while the collection is empty. No postings are
 * ever hardcoded here.
 */
export default async function CareersPage({ params }: PageProps<"/[locale]/careers">) {
  const { locale: localeParam } = await params
  if (!isValidLocale(localeParam)) notFound()
  const locale: Locale = localeParam
  const dictionary = getDictionary(locale)
  const copy = dictionary.careers
  const base = `/${locale}`

  const jobRead = await readCmsList("careers:jobs", () =>
    jobRepository.getOpenJobs(),
  )
  const jobs = jobRead.items.map((job) => localizeJob(job, locale))

  return (
    <div className="ng-content">
      <PageIntro eyebrow={dictionary.siteName} title={copy.pageTitle} body={copy.pageSubtitle}>
        {jobs.length > 0 && (
          <span className="ng-pill">
            {`${jobs.length} ${copy.openingsCount}`}
          </span>
        )}
      </PageIntro>

      <div className="ng-wrap ng-band-tight">
        <div className="ng-split">
          <div className="ng-stack" style={{ ["--ng-stack" as string]: "clamp(20px, 3vw, 32px)" }}>
            <Reveal className="ng-tile">
              <h2 className="ng-h3">{copy.whyTitle}</h2>
              <p className="ng-body">{copy.whyBody}</p>
            </Reveal>
            {/* Editorial still life, not a photograph of employees or premises. */}
            <EditorialFigure kind="contact" locale={locale} sizes="(min-width: 900px) 40vw, 100vw" />
          </div>

          <div className="ng-stack" style={{ ["--ng-stack" as string]: "clamp(20px, 3vw, 32px)" }}>
            <Reveal as="section" aria-labelledby="careers-open" className="ng-stack" style={{ ["--ng-stack" as string]: "16px" }}>
              <h2 id="careers-open" className="ng-h2">
                {copy.openPositionsTitle}
              </h2>
              {jobs.length === 0 ? (
                <div className="ng-empty">{copy.noOpenPositions}</div>
              ) : (
                <ul className="ng-jobs">
                  {jobs.map((job) => (
                    <li key={job.id}>
                      <Link href={`${base}/careers/${job.slug}`} className="ng-tile ng-job">
                        <div className="ng-job-head">
                          <h3 className="ng-h4">{job.title}</h3>
                          <span className="ng-pill">{jobTypeLabel(job, dictionary)}</span>
                        </div>
                        <p className="ng-body ng-small">{job.summary}</p>
                        <div className="ng-meta-row">
                          <span>
                            <BriefcaseIcon className="size-3.5" aria-hidden="true" />
                            {job.department}
                          </span>
                          <span>
                            <MapPinIcon className="size-3.5" aria-hidden="true" />
                            {job.location}
                          </span>
                          <span>
                            <CalendarClockIcon className="size-3.5" aria-hidden="true" />
                            {formatJobDate(job.postedAt, locale)}
                          </span>
                        </div>
                        <span className="ng-more">
                          {copy.viewRole}
                          <ArrowLeftIcon className="size-3.5" aria-hidden="true" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Reveal>

            <Reveal delay={0.08} className="ng-callout ng-callout-info">
              <h2 className="ng-h4">{copy.generalTitle}</h2>
              <p className="ng-body ng-small">{copy.generalBody}</p>
              <div className="ng-hero-cta">
                <a
                  href={`mailto:${dictionary.contact.email}?subject=${encodeURIComponent(copy.generalCtaSubject)}`}
                  className="ng-btn ng-btn-primary"
                >
                  {copy.generalCta}
                  <span className="ng-arrow" aria-hidden="true">↗</span>
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
      <ContactBand locale={locale} />
    </div>
  )
}
