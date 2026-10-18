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
    return (
      <div className="ng-wrap ng-notice-wrap">
        <CatalogUnavailable locale={locale} />
      </div>
    )
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
    <div className="ng-content ng-wrap" style={{ paddingBlock: "clamp(24px, 4vw, 56px) clamp(56px, 8vw, 112px)" }}>
      <Reveal className="ng-stack" style={{ ["--ng-stack" as string]: "18px", maxInlineSize: "76ch" }}>
        <Link href={`${base}/careers`} className="ng-back">
          <ArrowLeftIcon className="size-4" aria-hidden="true" />
          {copy.backToCareers}
        </Link>
        <h1 className="ng-h1" style={{ fontSize: "var(--ng-t-2xl)" }}>
          {localized.title}
        </h1>
        <p className="ng-lead">{localized.summary}</p>
      </Reveal>

      <Reveal as="div" delay={0.04} className="ng-glass" style={{ marginBlockStart: "clamp(24px, 4vw, 40px)" }}>
        <dl className="ng-facts">
          {meta.map(({ icon: Icon, label, value }) => (
            <div key={label}>
              <dt>
                <span className="ng-facts-icon">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span>{label}</span>
              </dt>
              <dd>{value}</dd>
            </div>
          ))}
          {localized.closingDate && (
            <div>
              <dt>
                <span className="ng-facts-icon">
                  <CalendarClockIcon className="size-4" aria-hidden="true" />
                </span>
                <span>{copy.closingLabel}</span>
              </dt>
              <dd>{formatJobDate(localized.closingDate, locale)}</dd>
            </div>
          )}
        </dl>
      </Reveal>

      <div className="ng-split" style={{ marginBlockStart: "clamp(32px, 5vw, 64px)" }}>
        <div className="ng-stack" style={{ ["--ng-stack" as string]: "clamp(28px, 4vw, 40px)" }}>
          <Reveal as="section" className="ng-stack" style={{ ["--ng-stack" as string]: "14px" }}>
            <h2 className="ng-h3">{copy.responsibilitiesTitle}</h2>
            <ul className="ng-bullets">
              {localized.responsibilities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Reveal>

          <Reveal as="section" delay={0.06} className="ng-stack" style={{ ["--ng-stack" as string]: "14px" }}>
            <h2 className="ng-h3">{copy.requirementsTitle}</h2>
            <ul className="ng-bullets">
              {localized.requirements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Reveal>

          {localized.niceToHave && localized.niceToHave.length > 0 && (
            <Reveal as="section" delay={0.08} className="ng-empty" style={{ textAlign: "start" }}>
              <h2 className="ng-h4">{copy.niceToHaveTitle}</h2>
              <ul className="ng-bullets ng-bullets-quiet ng-small" style={{ marginBlockStart: 12 }}>
                {localized.niceToHave.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Reveal>
          )}
        </div>

        <section className="ng-glass ng-form-panel" aria-labelledby="job-apply">
          <div className="ng-stack" style={{ ["--ng-stack" as string]: "8px" }}>
            <h2 id="job-apply" className="ng-h3">
              {copy.applyTitle}
            </h2>
            <p className="ng-body ng-small">{copy.applyBody}</p>
          </div>
          <NPFJobApplicationForm
            locale={locale}
            dictionary={{ ...copy, ...dictionary.contact }}
            jobTitle={localized.title}
          />
          {/* Fallback channel — some applicants prefer plain email over a form. */}
          <p className="ng-muted ng-small">
            {copy.orEmailUs}{" "}
            <a href={`mailto:${dictionary.contact.email}`} className="ng-link" dir="ltr">
              {dictionary.contact.email}
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
