import type { Locale } from "./config"

/**
 * Copy for the App Router error boundaries — `error.tsx` and
 * `global-error.tsx` (F-02).
 *
 * Both boundaries are Client Components, and `global-error.tsx` replaces the
 * entire document, so neither can receive copy as a prop from a Server
 * Component. They also must not import `dictionaries.ts`: that would inline
 * the whole site's ~1.7k lines of bilingual copy into the client bundle for
 * the sake of six strings (and would worsen the bundle-size finding F-42).
 * This module is the single source of truth for boundary copy instead — it is
 * tiny, dependency-free, and safe to import from a Client Component.
 *
 * The copy deliberately avoids page-specific assumptions and always offers a
 * way forward (retry / home), because a boundary renders precisely when the
 * app has already failed to produce the page the user asked for.
 */
export const ERROR_COPY: Record<
  Locale,
  {
    eyebrow: string
    title: string
    body: string
    retry: string
    homeCta: string
    supportEmailLabel: string
    /** Shown only in `global-error.tsx`, where the styled shell is gone too. */
    fatalBody: string
  }
> = {
  ar: {
    eyebrow: "خطأ غير متوقع",
    title: "حصل خطأ في تحميل الصفحة",
    body: "دي مشكلة مؤقتة من جانبنا — سلتك وبياناتك محفوظين. جرّب تاني، ولو المشكلة استمرت تواصل معانا وهنساعدك.",
    retry: "إعادة المحاولة",
    homeCta: "العودة للصفحة الرئيسية",
    supportEmailLabel: "أو راسلنا على",
    fatalBody:
      "حصل خطأ غير متوقع في الموقع. جرّب إعادة تحميل الصفحة، ولو المشكلة استمرت راسلنا على البريدด้านล่าง.",
  },
  en: {
    eyebrow: "Unexpected error",
    title: "Something went wrong on this page",
    body: "This is a temporary problem on our side — your cart and details are safe. Try again, and if it keeps happening get in touch and we'll help.",
    retry: "Try again",
    homeCta: "Back to Homepage",
    supportEmailLabel: "Or email us at",
    fatalBody:
      "An unexpected error occurred on this site. Try reloading the page, and if it keeps happening contact us at the email below.",
  },
}

/** Same public email the site's Organization schema and contact page use. */
// Re-exported so the address has one definition (site-config.ts): the error
// boundaries, the Organization JSON-LD and the footer must not be able to
// disagree about where a customer writes for help.
export { SUPPORT_EMAIL } from "@/lib/site-config"

/**
 * Resolves boundary copy for a locale, falling back to Arabic (the site's
 * default locale). An error screen must never render `undefined` — it is the
 * one place where a missing string is worse than the original failure.
 */
export function getErrorCopy(locale: string | undefined): (typeof ERROR_COPY)["ar"] {
  return ERROR_COPY[(locale as Locale) in ERROR_COPY ? (locale as Locale) : "ar"]
}
