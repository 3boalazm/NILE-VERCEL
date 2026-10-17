import type { Dictionary } from "@/lib/i18n/dictionaries"
import type { Locale } from "@/lib/i18n/config"
import type { Job } from "./types"

/**
 * Display helpers for job postings. Kept outside the components so the
 * listing, the job page and the sitemap all phrase a posting the same way.
 */

/** e.g. "دوام كامل · هجين" — the contract type plus work mode when set. */
export function jobTypeLabel(job: Job, dictionary: Dictionary): string {
  const types = dictionary.careers.types as Record<string, string>
  const modes = dictionary.careers.modes as Record<string, string>
  const parts = [types[job.employmentType] ?? job.employmentType]
  if (job.workMode) parts.push(modes[job.workMode] ?? job.workMode)
  return parts.join(" · ")
}

/**
 * Locale-aware date. Arabic renders the Gregorian calendar with Arabic-Indic
 * digits (ar-EG), English renders en-GB — matching how the rest of the site
 * writes dates for each locale.
 */
export function formatJobDate(value: string | undefined, locale: Locale): string {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}
