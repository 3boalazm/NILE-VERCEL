/**
 * Single source of truth for the site's public identity.
 *
 * `https://nilepharmafood.com` was hard-coded in six files (layout metadata,
 * the PDP's JSON-LD, robots.ts, sitemap.ts, the open-redirect guard, and the
 * Organization schema) with no shared constant. That is how canonical URLs,
 * hreflang, sitemap entries and structured data drift apart: each one is edited
 * separately, and nothing fails when they disagree. F-45 needed an absolute
 * origin for `og:url`/canonical, so the value now lives here once.
 *
 * Deliberately a constant and NOT an environment variable: this is the site's
 * canonical identity for SEO. A staging deployment that emitted canonicals,
 * hreflang and sitemap URLs pointing at *itself* would compete with production
 * in search results; the standard practice is for every environment to declare
 * the production origin as canonical. `STOREFRONT_URL` (see .env.example) is the
 * separate, environment-specific value used for links inside transactional
 * email — those must point at whichever origin the customer is actually on.
 */
export const SITE_URL = "https://nilepharmafood.com"

/** Absolute URL helper: `absoluteUrl("/ar/products")` → `https://…/ar/products`. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`
}

/** Support address, also used by the error boundaries (`error-copy.ts`). */
export const SUPPORT_EMAIL = "info@nilepharmafood.com"

/** Organization logo referenced by the site-wide JSON-LD. */
export const ORG_LOGO_URL = absoluteUrl("/npf-logo.svg")

/**
 * Brand surface colours, read from `globals.css` rather than guessed, so the
 * `theme-color` meta tag matches what is actually painted at the top of the
 * page (F-68):
 *
 *   light — header is `bg-anti-flash-white/85` (#f5f8fa) over the #f7fafa canvas
 *   dark  — header is `dark:bg-card/85` (#0a2240) over the #06172d canvas
 *
 * The manifest's own `theme_color` stays `#0a2240` (the declared brand colour
 * used for the Android splash); the meta tag below follows the rendered surface
 * per colour scheme, which is what the browser chrome blends with.
 */
export const THEME_COLOR_LIGHT = "#f5f8fa"
export const THEME_COLOR_DARK = "#0a2240"

/** Manifest/PWA splash background (the light canvas token). */
export const BACKGROUND_COLOR = "#f7fafa"

/**
 * F-23 — the company's real social profiles.
 *
 * Not invented: these are the URLs the company's own live site publishes in
 * its Organization `sameAs` (nilepharmafood.com, fetched 2026-09-22:
 * facebook.com/NPFEG + instagram.com/npf.eg), plus the LinkedIn company page
 * confirmed live (linkedin.com/company/nilepharmafood). The Facebook page was
 * independently verified to exist (~102k followers, "Nile Pharma Food,
 * El-Qalag, Al Qalyubiyah"). Note that docs/testing report 20 quotes OLDER
 * handles (…/nilepharmafood) from the legacy WordPress install — the live
 * sameAs above supersedes them, so do not "correct" these back.
 *
 * Rendered by the footer (F-23: the site had social *copy* but zero links) and
 * echoed into the Organization JSON-LD `sameAs` so search engines can tie the
 * profiles to the entity.
 */
export const SOCIAL_LINKS = [
  { platform: "facebook", href: "https://www.facebook.com/NPFEG" },
  { platform: "instagram", href: "https://www.instagram.com/npf.eg/" },
  { platform: "linkedin", href: "https://www.linkedin.com/company/nilepharmafood" },
] as const

/** Verified Organization fields passed to the JSON-LD builder (profiles only). */
export const ORG_VERIFIED_FIELDS = { sameAs: SOCIAL_LINKS.map((link) => link.href) }

/**
 * Homepage / site-wide share image, used by both the root layout's metadata and
 * the homepage's own `generateMetadata`. It has to be declared once: Next
 * replaces `openGraph` wholesale per route segment, so a homepage that set its
 * own openGraph *without* an image would silently lose the og:image it
 * currently inherits — the exact regression F-45 is meant to remove, not add.
 */
export const HOME_SHARE_IMAGE = {
  url: "/products/proxeed-plus.jpg",
  width: 1000,
  height: 1000,
} as const

/**
 * Homepage/site description, per locale. Shared by the root layout's metadata
 * and the homepage's own `generateMetadata` (F-45) so the two cannot drift: the
 * description appears in `<meta name="description">`, `og:description` and
 * `twitter:description`, and a mismatch between them is exactly the kind of
 * thing nobody notices until a share preview looks wrong.
 *
 * Claims kept to the two that are already established elsewhere on the site
 * (authorized distributor of Alfasigma; NFSA registration) — no invented
 * certifications or partner claims.
 */
export const SITE_DESCRIPTION = {
  ar: "نايل فارما فود — الموزّع الرسمي المعتمد لمنتجات Alfasigma الإيطالية في مصر. مكملات غذائية وأجهزة طبية مسجّلة لدى الهيئة القومية لسلامة الغذاء.",
  en: "Nile Pharma Food — the official authorized distributor of Alfasigma (Italy) products in Egypt. Food supplements and medical devices registered with the National Food Safety Authority.",
} as const

/**
 * Business payment rails for the manual (prepayment) method shown at checkout
 * and on the order confirmation. InstaPay alias + link and the Vodafone Cash
 * wallet are the client's real collection details (supplied 2026-09-23);
 * displayed to customers on purpose — they are the destination money is sent
 * TO, not secrets. Kept here so checkout, confirmation and docs cannot drift.
 */
export const VODAFONE_CASH_NUMBER = "01091984418"
export const INSTAPAY_ALIAS = "ahmedkhaled3bsallam@instapay"
export const INSTAPAY_URL = "https://ipn.eg/S/ahmedkhaled3bsallam/instapay/3hM5gW"

/** Business WhatsApp contact (live-site number, no "+" — wa.me's requirement). */
export const WHATSAPP_NUMBER = "201024442340"

/** WhatsApp deep link with a pre-filled greeting, used by blog CTAs and the receipt hand-off. */
export function whatsappUrl(text: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}

/**
 * WhatsApp destination for payment-transfer receipt confirmation — the number
 * the client uses to receive receipts for InstaPay / Vodafone Cash transfers.
 * Client-supplied 2026-09-23. Deliberately distinct from WHATSAPP_NUMBER (the
 * general support line): single source of truth for the payment flow, imported
 * by checkout, the order confirmation and the message builder — never inlined.
 */
export const PAYMENT_WHATSAPP_NUMBER = "201027639857"

/**
 * wa.me deep link for the payment-receipt flow: opens the WhatsApp app on
 * mobile and WhatsApp Web on desktop (wa.me handles both). The pre-filled
 * text is URI-encoded; the number stays in wa.me's international no-"+"
 * format. Read-only by design — it is a plain link, it can never mutate an
 * order or mark a payment PAID (admin verifies the transfer first).
 */
export function paymentWhatsAppUrl(text: string): string {
  return `https://wa.me/${PAYMENT_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}
