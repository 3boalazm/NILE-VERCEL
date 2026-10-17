import type { Locale } from "@/lib/i18n/config"

/**
 * Job postings ("الوظائف"). Built 2026-09-24 as a CMS-managed system rather
 * than static copy: the client posts a vacancy from the Payload admin and it
 * appears on /careers immediately, with its own page and application form.
 *
 * The default repository is deliberately **empty** — the site must never
 * invent an opening. Until a real posting is published, the careers page
 * keeps the "no open positions" state it shipped with.
 */

export type EmploymentType = "full-time" | "part-time" | "contract" | "internship"

/** Where the work happens — drives the label, not the copy. */
export type WorkMode = "onsite" | "hybrid" | "remote"

/** "open" is live; the other two never reach the storefront. */
export type JobStatus = "open" | "paused" | "closed"

export type JobTranslation = {
  title?: string
  summary?: string
  responsibilities?: string[]
  requirements?: string[]
  niceToHave?: string[]
  location?: string
  department?: string
}

export type Job = {
  id: string
  slug: string
  title: string
  /** One-line pitch shown on the listing card. */
  summary: string
  department: string
  location: string
  employmentType: EmploymentType
  workMode?: WorkMode
  /** e.g. "3–5 سنوات" — free text so the client can phrase it naturally. */
  experience?: string
  responsibilities: string[]
  requirements: string[]
  niceToHave?: string[]
  status: JobStatus
  /** ISO date; the listing sorts newest first. */
  postedAt: string
  /** Optional — drives a "closing soon" hint and hides stale postings. */
  closingDate?: string
  translations?: { en?: JobTranslation }
}

export type JobRepository = {
  /** Open roles only — the storefront never sees paused/closed postings. */
  getOpenJobs(): Promise<Job[]>
  getJobBySlug(slug: string): Promise<Job | null>
  /** Every posting regardless of status — seeding and the admin. */
  getAllJobs(): Promise<Job[]>
}

/**
 * Same overlay approach as products and articles: base fields are Arabic and
 * the English translation is laid on top. Untranslated fields fall back to the
 * Arabic text instead of blanking out — a partially filled English tab must
 * never render an empty title or an empty requirements list on /en.
 */
export function localizeJob(job: Job, locale: Locale): Job {
  if (locale === "ar") return job
  const t = job.translations?.en
  if (!t) return job
  const merged: Job = { ...job }
  for (const [key, value] of Object.entries(t)) {
    if (value === undefined || value === null) continue
    if (typeof value === "string" && value.trim() === "") continue
    if (Array.isArray(value) && value.length === 0) continue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- key/value pairs come from the typed translation record
    ;(merged as any)[key] = value
  }
  return merged
}

/** True when a posting is open and its closing date (if any) has not passed. */
export function isJobOpen(job: Job, now: Date = new Date()): boolean {
  if (job.status !== "open") return false
  if (!job.closingDate) return true
  const closing = new Date(job.closingDate)
  if (Number.isNaN(closing.getTime())) return true
  // The closing date is inclusive of its whole day: a posting with
  // "2026-09-24" stays visible through 24 September rather than vanishing
  // the moment the clock rolls past midnight (the admin date picker stores
  // the date at 00:00, so a raw comparison would close the role a day early).
  const endOfClosingDay = Date.UTC(
    closing.getUTCFullYear(),
    closing.getUTCMonth(),
    closing.getUTCDate() + 1
  )
  return now.getTime() < endOfClosingDay
}
