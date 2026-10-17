import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowLeftIcon, BriefcaseIcon, CalendarClockIcon, MapPinIcon, SparklesIcon, UserRoundCheckIcon } from "lucide-react"

import { isValidLocale, type Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { Reveal } from "@/components/npf/motion/reveal"
import { buildPageMetadata } from "@/lib/seo/page-metadata"
import { NPFJobApplicationForm } from "@/components/npf/job-application-form"
import { jobRepository, localizeJob } from "@/lib/jobs"
import { readCms } from "@/lib/cms/read"
import { CatalogUnavailable } from "@/components/npf/catalog-unavailable"
import { formatJobDate, jobTypeLabel } from "@/lib/jobs/format"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/careers/[slug]">): Promise<Metadata> {
  const { locale: localeParam, slug } = await params
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "ar"
  const jobRead = await readCms("careers:metadata", () =>
    jobRepository.getJobBySlug(slug),
  )
  // A CMS outage is not a missing posting: keep the layout's metadata
  // instead of turning the route into a 404 — but do not let a crawler index
  // the "unavailable" notice as if it were the posting.
  if (jobRead.status === "unavailable")
    return { robots: { index: false, follow: true } }
  const job = jobRead.value
  if (!job) return {}
  const localized = localizeJob(job, locale)
  return buildPageMetadata({
    locale,
    path: `/careers/${slug}`,
    title: localized.title,
    description: localized.summary,
  })
}

/**
 * A single posting. `jobs` rows are created in the Payload admin, so this page
 * is the "one page per vacancy" half of the system: description, the two
 * requirement lists, and an application form that posts into the same
 * inquiries inbox the team already works from.
 */
export default async function JobPage({ params }: PageProps<"/[locale]/careers/[slug]">) {
  const { locale: localeParam, slug } = await params
  if (!isValidLocale(localeParam)) notFound()
  const locale: Locale = localeParam
  const dictionary = getDictionary(locale)
  const copy = dictionary.careers
  const base = `/${locale}`

  const jobRead = await readCms("careers:job", () =>
    jobRepository.getJobBySlug(slug),
  )
  // The CMS could not be read. The posting may well exist — this is not a
  // 404 — so the page renders the "unavailable" notice instead.
  if (jobRead.status === "unavailable") {
    return <CatalogUnavailable locale={locale} className="ca-section-pad" />
  }
  const job = jobRead.value
  if (!job) notFound()
  const localized = localizeJob(job, locale)

  const meta = [
    { icon: BriefcaseIcon, label: copy.departmentLabel, value: localized.department },
    { icon: MapPinIcon, label: copy.locationLabel, value: localized.location },
    { icon: UserRoundCheckIcon, label: copy.typeLabel, value: jobTypeLabel(localized, dictionary) },
    ...(localized.experience
      ? [{ icon: SparklesIcon, label: copy.experienceLabel, value: localized.experience }]
      : []),
    { icon: CalendarClockIcon, label: copy.postedLabel, value: formatJobDate(localized.postedAt, locale) },
  ].filter((item) => item.value)

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <Reveal className="flex flex-col gap-5">
        <Link
          href={`${base}/careers`}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3.5 rotate-180 rtl:rotate-0" aria-hidden="true" />
          {copy.backToCareers}
        </Link>
        <h1 className="font-heading text-3xl font-semibold leading-tight text-balance sm:text-4xl">
          {localized.title}
        </h1>
        <p className="text-lg leading-relaxed text-muted-foreground">{localized.summary}</p>

        <dl className="grid grid-cols-1 gap-3 rounded-2xl border bg-card p-5 sm:grid-cols-2">
          {meta.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <div className="flex flex-col">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="text-sm font-medium">{value}</dd>
              </div>
            </div>
          ))}
          {localized.closingDate && (
            <div className="flex items-start gap-3">
              <CalendarClockIcon className="mt-0.5 size-4 shrink-0 text-chart-3" aria-hidden="true" />
              <div className="flex flex-col">
                <dt className="text-xs text-muted-foreground">{copy.closingLabel}</dt>
                <dd className="text-sm font-medium">{formatJobDate(localized.closingDate, locale)}</dd>
              </div>
            </div>
          )}
        </dl>
      </Reveal>

      <Reveal as="section" delay={0.06} className="mt-10 flex flex-col gap-4">
        <h2 className="font-heading text-xl font-semibold">{copy.responsibilitiesTitle}</h2>
        <ul className="flex flex-col gap-3">
          {localized.responsibilities.map((item) => (
            <li key={item} className="flex gap-3 text-pretty leading-relaxed">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal as="section" delay={0.08} className="mt-10 flex flex-col gap-4">
        <h2 className="font-heading text-xl font-semibold">{copy.requirementsTitle}</h2>
        <ul className="flex flex-col gap-3">
          {localized.requirements.map((item) => (
            <li key={item} className="flex gap-3 text-pretty leading-relaxed">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ring" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Reveal>

      {localized.niceToHave && localized.niceToHave.length > 0 && (
        <Reveal as="section" delay={0.1} className="mt-10 rounded-2xl border border-dashed p-5">
          <h2 className="font-heading text-base font-semibold">{copy.niceToHaveTitle}</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
            {localized.niceToHave.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground/60" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      )}

      <section className="mt-14 border-t pt-10">
        <Reveal>
          <h2 className="font-heading text-xl font-semibold">{copy.applyTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy.applyBody}</p>
        </Reveal>
        <Reveal delay={0.06} className="mt-6">
          <NPFJobApplicationForm
            locale={locale}
            dictionary={{ ...copy, ...dictionary.contact }}
            jobTitle={localized.title}
          />
        </Reveal>
        {/* Fallback channel — some applicants prefer plain email over a form. */}
        <p className="mt-6 text-xs text-muted-foreground">
          {copy.orEmailUs}{" "}
          <a href={`mailto:${dictionary.contact.email}`} className="text-primary hover:underline">
            {dictionary.contact.email}
          </a>
        </p>
      </section>
    </div>
  )
}
