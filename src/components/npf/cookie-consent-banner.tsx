"use client"

import { useSyncExternalStore } from "react"
import Link from "next/link"

import { getConsent, onConsentChange, setConsent } from "@/lib/analytics/consent"
import type { Dictionary } from "@/lib/i18n/dictionaries"

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
    <div role="region" aria-labelledby="consent-title" className="ngc-float">
      <h2 id="consent-title">{dictionary.title}</h2>
      <p>
        {dictionary.body}{" "}
        <Link href={`${base}/privacy-policy`} className="ngc-inline-link">
          {dictionary.more}
        </Link>
      </p>
      <div className="ngc-float-actions">
        <button type="button" onClick={() => decide("granted")} className="ng-btn ng-btn-primary">
          {dictionary.accept}
        </button>
        <button type="button" onClick={() => decide("denied")} className="ng-btn">
          {dictionary.reject}
        </button>
      </div>
    </div>
  )
}
