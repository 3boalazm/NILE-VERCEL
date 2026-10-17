/**
 * F-18/F-70 — cookie-consent state, shared by the banner and the analytics
 * loader. One cookie, one year, SameSite=Lax: `npf-consent=granted|denied`.
 * Absent means "not yet asked", which is what makes the banner appear.
 *
 * Change notifications ride a window CustomEvent so the analytics provider
 * reacts without a reload (grant loads gtag immediately; denial pushes a
 * consent-mode update that stops measurement in-page).
 */
export type ConsentState = "granted" | "denied" | "unknown"

export const CONSENT_COOKIE = "npf-consent"
export const CONSENT_CHANGE_EVENT = "npf-consent-change"

export function getConsent(): ConsentState {
  if (typeof document === "undefined") return "unknown"
  const entry = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${CONSENT_COOKIE}=`))
  if (!entry) return "unknown"
  const value = entry.slice(CONSENT_COOKIE.length + 1)
  return value === "granted" || value === "denied" ? value : "unknown"
}

export function setConsent(state: "granted" | "denied"): void {
  if (typeof document === "undefined") return
  const maxAge = 60 * 60 * 24 * 365
  document.cookie = `${CONSENT_COOKIE}=${state}; path=/; max-age=${maxAge}; SameSite=Lax`
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: state }))
}

export function onConsentChange(listener: (state: ConsentState) => void): () => void {
  if (typeof window === "undefined") return () => {}
  const handler = (event: Event) => listener((event as CustomEvent<ConsentState>).detail)
  window.addEventListener(CONSENT_CHANGE_EVENT, handler)
  return () => window.removeEventListener(CONSENT_CHANGE_EVENT, handler)
}
