"use client"

/**
 * Route-level error boundary (F-02).
 *
 * Before this file existed, any render-time throw inside the `[locale]` tree
 * surfaced as Next's unstyled default (or a blank dead-end), so a single
 * upstream hiccup looked like the whole site had crashed. This boundary keeps
 * the localized shell — header, footer, theme, direction — and replaces only
 * the failed segment with a designed, actionable panel.
 *
 * Deliberate choices:
 * - No `Reveal`/framer-motion here: animation wrappers are a plausible source
 *   of the very failure being reported, so the boundary stays dependency-light.
 * - Copy comes from `error-copy.ts`, not `dictionaries.ts` — a Client
 *   Component importing the full dictionary would inline the whole site's
 *   bilingual copy into the client bundle.
 * - `error.digest` is shown so a support message can be tied to the server log
 *   entry Next.js already emits for the same throw.
 */

import { useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react"

import { getErrorCopy, SUPPORT_EMAIL } from "@/lib/i18n/error-copy"
import { reportError } from "@/lib/telemetry/report-error"
import { isValidLocale, defaultLocale, type Locale } from "@/lib/i18n/config"
import { Notice } from "@/components/glass/content"

export default function LocaleError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  // error.tsx receives no `params`, so the locale is read from the router —
  // the same recovery strategy not-found.tsx uses via the pathname header.
  const params = useParams<{ locale?: string }>()
  const raw = typeof params?.locale === "string" ? params.locale : undefined
  const locale: Locale = raw && isValidLocale(raw) ? raw : defaultLocale
  const copy = getErrorCopy(locale)

  useEffect(() => {
    // F-65: Next logs the throw server-side with the same digest; this sends it
    // to the error pipeline (Sentry/endpoint when configured, structured
    // console record otherwise) so failures that only happen in the browser —
    // hydration crashes, client-only throws — reach the team at all. The
    // digest is included so a browser report can be tied to its server log
    // line, and the locale so a language-specific failure is identifiable.
    reportError(error, { scope: "error-boundary", extra: { locale } })
  }, [error, locale])

  return (
    <div className="ng-content ng-wrap ng-notice-wrap">
      <Notice
        role="alert"
        titleAs="h1"
        tone="danger"
        mark={<AlertTriangleIcon className="size-7" />}
        eyebrow={copy.eyebrow}
        title={copy.title}
        body={copy.body}
      >
        <div className="ng-hero-cta">
          <button type="button" onClick={retry} className="ng-btn ng-btn-primary ng-btn-lg">
            <RefreshCwIcon className="size-4" aria-hidden="true" />
            {copy.retry}
          </button>
          <Link href={`/${locale}`} className="ng-btn ng-btn-lg">
            {copy.homeCta}
          </Link>
        </div>
        <p className="ng-body ng-small">
          {copy.supportEmailLabel}{" "}
          <a dir="ltr" href={`mailto:${SUPPORT_EMAIL}`} className="ng-link">
            {SUPPORT_EMAIL}
          </a>
        </p>
        {error?.digest && (
          <p className="ng-notice-ref" dir="ltr">
            ref: {error.digest}
          </p>
        )}
      </Notice>
    </div>
  )
}
