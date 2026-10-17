"use client"

import { useSyncExternalStore } from "react"
import Link from "next/link"

import { getConsent, onConsentChange, setConsent } from "@/lib/analytics/consent"
import type { Dictionary } from "@/lib/i18n/dictionaries"
import { cn } from "@/lib/utils"

/**
 * F-18 — the cookie-consent banner the privacy policy always promised but
 * the site never had (the old "FIXED" for F-18 was a false positive: the
 * harness matched the word "موافقة" inside privacy *copy*, not a consent
 * gate). Real gate now: no cookie → banner; accept → `npf-consent=granted`
 * and the analytics provider may load; reject → `denied` and nothing
 * third-party ever loads. Both buttons are equal-weight on purpose — a
 * hidden/rejected-reject is a dark pattern and invalid consent under GDPR.
 *
 * Essential cookies (session, cart, consent itself, locale) need no consent
 * and are never gated; the body copy says exactly what consent enables.
 */
export function CookieConsentBanner({
  locale,
  dictionary,
}: {
  locale: string
  dictionary: Dictionary["consent"]
}) {
  const base = `/${locale}`
  // useSyncExternalStore, not useState+effect: the cookie is external state
  // (it can change from this banner or a future preferences page), the
  // server snapshot is always "unknown" so SSR and hydration render the
  // banner hidden, and the client snapshot decides visibility with zero
  // extra render passes.
  const consent = useSyncExternalStore(onConsentChange, getConsent, () => "unknown" as const)
  const visible = consent === "unknown"

  if (!visible) return null

  function decide(state: "granted" | "denied") {
    setConsent(state)
  }

  return (
    <div
      role="region"
      aria-labelledby="consent-title"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-2xl border border-border bg-background p-5 shadow-xl sm:inset-x-6"
    >
      <h2 id="consent-title" className="font-heading text-base font-semibold">
        {dictionary.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{dictionary.body}</p>
      <p className="mt-2 text-sm">
        <Link href={`${base}/privacy-policy`} className="font-medium text-primary underline underline-offset-2">
          {dictionary.more}
        </Link>
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => decide("granted")}
          className={cn(
            "inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50"
          )}
        >
          {dictionary.accept}
        </button>
        <button
          type="button"
          onClick={() => decide("denied")}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-border bg-card px-5 text-sm font-medium transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {dictionary.reject}
        </button>
      </div>
    </div>
  )
}
