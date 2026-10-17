"use client"

import { useEffect, useState } from "react"
import Script from "next/script"

import { getConsent, onConsentChange } from "@/lib/analytics/consent"

/**
 * F-70 — consent-gated GA4.
 *
 * Nothing analytics-related loads until TWO things are true: a measurement id
 * is configured (NEXT_PUBLIC_GA_ID — empty means the site runs with zero
 * analytics, which is how this sandbox and any privacy-review deploy run)
 * AND the visitor granted consent via the banner (F-18). On grant the inline
 * bootstrap creates `window.dataLayer` + `gtag()` and declares Consent Mode
 * v2 defaults, then the remote script loads and drains whatever the event
 * bus queued.
 *
 * Revocation does not wait for a reload: a `consent update` with
 * analytics_storage denied stops GA measuring in-page immediately (consent
 * mode honoured by gtag), and the cookie keeps it off for future visits.
 */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? ""

export function AnalyticsProvider() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const apply = () => {
      const consent = getConsent()
      if (GA_ID && consent === "denied" && typeof window.gtag === "function") {
        window.gtag("consent", "update", { analytics_storage: "denied" })
      }
      setEnabled(Boolean(GA_ID) && consent === "granted")
    }
    apply()
    return onConsentChange(apply)
  }, [])

  if (!enabled) return null

  return (
    <>
      <Script
        id="ga-bootstrap"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('consent','default',{ad_storage:'denied',analytics_storage:'granted',wait_for_update:0});gtag('config','${GA_ID}');`,
        }}
      />
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
    </>
  )
}
