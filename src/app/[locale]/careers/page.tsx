import { EditorialVisual } from "@/components/care-atlas/editorial-visual"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowLeftIcon, BriefcaseIcon, CalendarClockIcon, MapPinIcon } from "lucide-react"

import { isValidLocale, type Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { ctaButtonVariants } from "@/components/ui/button"
import { Reveal } from "@/components/npf/motion/reveal"
import { buildPageMetadata } from "@/lib/seo/page-metadata"
import { jobRepository, localizeJob } from "@/lib/jobs"
import { formatJobDate, jobTypeLabel } from "@/lib/jobs/format"
import { cn } from "@/lib/utils"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/careers">): Promise<Metadata> {
  const { locale: localeParam } = await params
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "ar"
  const dictionary = getDictionary(locale)
  const hasOpenJobs = (await jobRepository.getOpenJobs()).length > 0
  return buildPageMetadata({
    locale,
    path: "/careers",
    title: dictionary.careers.pageTitle,
    description: dictionary.careers.pageSubtitle,
    // An empty listing is thin content: keep it reachable and linked, but ask
    // crawlers to skip it until there is at least one real opening (F-015).
    noIndex: !hasOpenJobs,
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

  const jobs = (await jobRepository.getOpenJobs()).map((job) => localizeJob(job, locale))

  return (
    <>
      {/* Hero */}
      <section className="bg-anti-flash-white dark:bg-card">
        <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-4 py-20 text-center sm:px-6 lg:px-8">
          <span className="eyebrow text-primary">{dictionary.siteName}</span>
          <h1 className="font-heading text-3xl font-semibold sm:text-4xl">{copy.pageTitle}</h1>
          <p className="max-w-xl text-muted-foreground">{copy.pageSubtitle}</p>
          {jobs.length > 0 && (
            <p className="text-sm font-medium text-primary">
              {jobs.length} {copy.openingsCount}
            </p>
          )}
        </Reveal>
      </section>

      {/* Editorial still life, not a photograph of employees or premises. */}
      <div className="mx-auto mt-12 max-w-5xl px-4 sm:px-6 lg:px-8">
        <EditorialVisual kind="contact" locale={locale} />
      </div>

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <h2 className="font-heading text-xl font-semibold">{copy.whyTitle}</h2>
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">{copy.whyBody}</p>
        </Reveal>

        <Reveal delay={0.08} className="mt-10">
          <h2 className="font-heading text-xl font-semibold">{copy.openPositionsTitle}</h2>
          {jobs.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              {copy.noOpenPositions}
            </div>
          ) : (
            <ul className="mt-4 flex flex-col gap-4">
              {jobs.map((job) => (
                <li key={job.id}>
                  <Link
                    href={`${base}/careers/${job.slug}`}
                    className="group flex h-full flex-col gap-3 rounded-2xl border bg-card p-5 transition-colors hover:border-primary/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-heading text-lg font-semibold leading-snug">{job.title}</h3>
                      <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {jobTypeLabel(job, dictionary)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{job.summary}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <BriefcaseIcon className="size-3.5" aria-hidden="true" />
                        {job.department}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPinIcon className="size-3.5" aria-hidden="true" />
                        {job.location}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarClockIcon className="size-3.5" aria-hidden="true" />
                        {formatJobDate(job.postedAt, locale)}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                      {copy.viewRole}
                      <ArrowLeftIcon className="size-3.5 rtl:rotate-180" aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Reveal>

        <Reveal delay={0.16} className="mt-10 rounded-2xl bg-anti-flash-white p-6 dark:bg-card">
          <h2 className="font-heading text-lg font-semibold">{copy.generalTitle}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{copy.generalBody}</p>
          <a
            href={`mailto:${dictionary.contact.email}?subject=${encodeURIComponent(copy.generalCtaSubject)}`}
            className={cn(ctaButtonVariants({ variant: "onLight" }), "mt-4")}
          >
            {copy.generalCta}
          </a>
        </Reveal>
      </div>
    </>
  )
}
