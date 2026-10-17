import type { Locale } from "./config"

/**
 * Failure copy that is not page-specific (F-64).
 *
 * Server actions already return a structured `{ ok: false, error }` when the
 * *upstream* (Vendure/Payload) is unreachable. What they cannot report is the
 * case where the *browser's own* connection drops mid-submit: the action call
 * itself rejects, so a client component that merely `await`s it never reaches
 * its `setError(...)` line — the spinner stays on, the button stays disabled,
 * and the visitor gets no explanation and no way to retry. That silent
 * dead-end is the defect; every submitting surface now catches and reports it
 * with these strings.
 *
 * Kept in its own module rather than in `dictionaries.ts` on purpose: those
 * components receive a narrowed dictionary slice as a prop, and importing the
 * full ~1.7k-line dictionary into a Client Component would inline the entire
 * site's copy into the browser bundle (see F-42's bundle-size complaint).
 * This file is a handful of strings, so it is cheap to ship.
 */
export const COMMON_ERRORS: Record<Locale, { networkError: string; retry: string }> = {
  ar: {
    networkError: "انقطع الاتصال بالإنترنت. تأكد من الشبكة وجرّب تاني — مفيش حاجة اتفقدت.",
    retry: "إعادة المحاولة",
  },
  en: {
    networkError: "Connection lost. Check your network and try again — nothing was lost.",
    retry: "Try again",
  },
}

/**
 * Resolves the strings for a locale, falling back to Arabic (the site's
 * default locale) for anything unexpected — an error message must never
 * render as `undefined` on the one screen where the user most needs it.
 */
export function getCommonErrors(locale: string): (typeof COMMON_ERRORS)["ar"] {
  return COMMON_ERRORS[(locale as Locale) in COMMON_ERRORS ? (locale as Locale) : "ar"]
}
