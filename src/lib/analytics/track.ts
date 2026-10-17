/**
 * F-70 — the analytics event bus.
 *
 * `track()` pushes GTM/GA4-style events onto `window.dataLayer`. That is the
 * whole trick: the dataLayer exists from the first inline bootstrap (see
 * AnalyticsProvider), so events recorded BEFORE the remote gtag script loads
 * (i.e. before consent, or while it downloads) are queued and consumed when
 * it does — nothing is lost and nothing is sent pre-consent, because the
 * remote script itself only loads once consent is granted.
 *
 * Server-safe: no-ops during SSR.
 */
export type AnalyticsEventName =
  | "view_item_list"
  | "view_item"
  | "add_to_cart"
  | "remove_from_cart"
  | "begin_checkout"
  | "purchase"
  | "search"

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
    gtag?: (...args: unknown[]) => void
  }
}

export function track(event: AnalyticsEventName, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return
  const dataLayer = (window.dataLayer = window.dataLayer || [])
  dataLayer.push({ event, ...params })
}
