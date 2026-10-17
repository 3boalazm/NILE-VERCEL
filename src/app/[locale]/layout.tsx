import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { MotionConfig } from "framer-motion"
import { SerwistProvider } from "@/components/providers/serwist-provider"

import "../globals.css"
import "../care-atlas.css"
import "../care-atlas-motion.css"
import "../care-atlas-editorial.css"
import "../care-atlas-discovery.css"
import { DirectionProvider } from "@/components/ui/direction"
import { AnalyticsProvider } from "@/components/npf/analytics-provider"
import { CookieConsentBanner } from "@/components/npf/cookie-consent-banner"
import { NPFHeader } from "@/components/npf/header"
import { NPFFooter } from "@/components/npf/footer"
import { InstallPrompt } from "@/components/npf/install-prompt"
import { getDirection, isValidLocale, locales, type Locale } from "@/lib/i18n/config"
import { getExperienceCopy } from "@/lib/i18n/experience"
import { mockFallbackEnabled } from "@/lib/products/mock-fallback"
import { getDictionary } from "@/lib/i18n/dictionaries"
import {
  absoluteUrl,
  HOME_SHARE_IMAGE,
  SITE_DESCRIPTION,
  ORG_VERIFIED_FIELDS,
  THEME_COLOR_DARK,
  THEME_COLOR_LIGHT,
} from "@/lib/site-config"
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/lib/seo/entity-schema"
import { withStoredTradeAlternate } from "@/lib/seo/growth"
import { CANONICAL_ORIGIN } from "@/lib/seo/site"
import { CartProvider } from "@/lib/cart"
import { readActiveOrderItems } from "@/lib/vendure/active-order"
import { getActiveCustomer } from "@/lib/auth/active-customer"

const fontSans = localFont({
  src: [
    {
      path: "../fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/ibm-plex-sans-arabic-arabic-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/ibm-plex-sans-arabic-arabic-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
  preload: false,
});

const fontPlexMono = localFont({
  src: "../fonts/ibm-plex-mono-latin-500-normal.woff2",
  variable: "--font-plex-mono",
  display: "swap",
  preload: false,
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Site description moved to site-config.ts: the homepage's own
// generateMetadata (F-45) needs the identical string, and two copies of
// marketing copy is how the meta description and og:description end up
// disagreeing.
const OG_LOCALE: Record<Locale, string> = { ar: "ar_EG", en: "en_US" }

/**
 * F-68 — `theme-color` and the Apple PWA metas.
 *
 * Exported as `generateViewport` (not a static `viewport`) because Next moved
 * these out of `metadata`: viewport keys are not re-read on client navigation,
 * which is exactly right for a colour the browser chrome paints, and the Apple
 * web-app title should follow the locale.
 *
 * Colours are the measured header surfaces per scheme (see site-config.ts), so
 * the browser chrome blends with the page top instead of showing a band of a
 * colour the site does not use.
 *
 * Note where each key lives in Next 16.3.3 — it differs from Next 13/14:
 * `themeColor` is a Viewport key, but `appleWebApp` is declared on the
 * **Metadata** interface (node_modules/next/dist/lib/metadata/types/
 * metadata-interface.d.ts:614 vs :341), so the Apple PWA metas
 * (`apple-mobile-web-app-capable` / `-status-bar-style` / `-title`) are set in
 * generateMetadata below. Putting appleWebApp here does not type-check.
 */
export async function generateViewport(): Promise<Viewport> {
  return {
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: THEME_COLOR_LIGHT },
      { media: "(prefers-color-scheme: dark)", color: THEME_COLOR_DARK },
    ],
  }
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "ar";
  const siteName = getDictionary(locale).siteName;
  const description = SITE_DESCRIPTION[locale];

  return {
    metadataBase: new URL(CANONICAL_ORIGIN),
    // F-68: standalone iOS home-screen behaviour + status-bar colour + title.
    // Previously absent, so "Add to Home Screen" on an iPhone produced a plain
    // bookmark that opened in Safari with no title of its own.
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: siteName,
    },
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description,
    // No default hreflang here. Next replaces `alternates` only when a page
    // sets it, so a homepage language map on the layout would mark cart,
    // checkout, account, and other noindex routes as homepage alternates.
    // Every indexable page sets its own canonical and languages.
    openGraph: {
      siteName,
      title: siteName,
      description,
      locale: OG_LOCALE[locale],
      type: "website",
      // F-45 parity: default og:url = the locale homepage. Any page that sets
      // its own openGraph (buildPageMetadata or manual) overrides wholesale.
      url: absoluteUrl(`/${locale}`),
      images: [HOME_SHARE_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description,
      images: [HOME_SHARE_IMAGE.url],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale: localeParam } = await params
  // F-73: do NOT notFound() here. This layout is the ROOT layout (the app
  // follows the [locale] i18n pattern), and a notFound() thrown from a root
  // layout has no layout above it to render into — Next falls back to the
  // empty `__next_error__` shell, which is exactly the JS-free blank 404 this
  // wave removed. Every page validates its own locale param and throws
  // notFound() itself (audited: all of them do), which renders the branded
  // [locale]/not-found.tsx INSIDE this layout with a real 404 status. So the
  // layout falls back to the default locale purely to be able to render the
  // chrome around that page-level 404.
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "ar"
  const direction = getDirection(locale)
  const dictionary = getDictionary(locale)
  const ui = getExperienceCopy(locale)
  // Both reads are independent (and render-safe — neither writes the
  // session cookie, see their doc comments), so they run in parallel:
  // sequential awaits would stack both Vendure latencies onto every page
  // render. The header uses `customer` to show Login vs. My Account
  // without every page needing its own auth check just for the header.
  const [initialCartItems, customer] = await Promise.all([readActiveOrderItems(), getActiveCustomer()])
  // Keyed by CUSTOMER IDENTITY ONLY (`guest` vs `customer:<id>`). Two
  // earlier variants of this key both backfired by remounting the provider —
  // and the entire subtree under it, wiping the AddToCartButton's "تمت
  // الإضافة" / error feedback in the same frame it was set:
  //   1. cart contents in the key → every addToCart/updateQty revalidation
  //      (the action revalidates the layout) remounted the tree;
  //   2. the Vendure session-token hash in the key → a guest's FIRST add
  //      flips sessionKey "anonymous" → sha256(token) and remounted again
  //      (second and later adds worked — the flaky "first click does
  //      nothing visually" bug).
  // Client mutations already sync state via setItems(); retryCart() pulls
  // authoritative data when the cart degrades; login/logout still remount
  // with fresh server data because the identity flips. Full page loads
  // remount everything regardless. (See provider.tsx's session comment.)
  const cartProviderKey = customer ? `customer:${customer.id}` : "guest"

  return (
    <html
      lang={locale}
      dir={direction}
      className={`${fontSans.variable} ${fontPlexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Runs before paint: (1) `js` marks that JavaScript is executing —
            the scroll-reveal CSS in globals.css only hides content under
            `html.js`, so no-JS visitors (and crawlers) always get fully
            visible HTML; (2) applies the stored/system theme with no flash —
            mirrors what next-themes does internally, without adding the
            dependency. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){var c=document.documentElement.classList;c.add('js');try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;c.toggle('dark',d)}catch(e){}})()",
          }}
        />
        {/* Organization and WebSite use the stored trade name, origin, logo,
            and the contact email already shown on the site. No search target
            is passed. Legal fields stay out until each value is verified. */}
        {[
          buildOrganizationJsonLd({
            name: dictionary.siteName,
            email: "info@nilepharmafood.com",
            logoPath: "/npf-logo.svg",
            // F-23 companion: ties the verified social profiles to the entity.
            verified: ORG_VERIFIED_FIELDS,
          }),
          buildWebSiteJsonLd({ name: dictionary.siteName }),
        ].map((data) => {
          const json = data["@type"] === "Organization" ? withStoredTradeAlternate(data, locale) : data
          return (
            <script
              key={String(json["@type"])}
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
            />
          )
        })}
      </head>
      <body
        className={`ca-site flex min-h-screen flex-col antialiased ${mockFallbackEnabled() || process.env.NPF_PREVIEW_MODE === "1" ? "ca-with-notice" : ""}`}
      >
        <a href="#main-content" className="skip-link">
          {ui.skip}
        </a>
        {(mockFallbackEnabled() || process.env.NPF_PREVIEW_MODE === "1") && (
          <div className="preview-notice" role="note">
            {ui.preview}
          </div>
        )}
        <SerwistProvider swUrl="/serwist/sw.js">
          <DirectionProvider direction={direction}>
            <MotionConfig reducedMotion="user">
              <CartProvider
                key={cartProviderKey}
                initialState={initialCartItems}
              >
                <NPFHeader
                  locale={locale}
                  dictionary={dictionary}
                  isSignedIn={Boolean(customer)}
                />
                <main
                  id="main-content"
                  tabIndex={-1}
                  className="min-w-0 flex-1"
                >
                  {children}
                </main>
                <NPFFooter locale={locale} dictionary={dictionary} />
                <InstallPrompt dictionary={dictionary.installPrompt} />
              </CartProvider>
            </MotionConfig>
          </DirectionProvider>
        </SerwistProvider>
        {/* F-70: renders nothing (and loads nothing third-party) until a
            measurement id is configured AND consent was granted. */}
        <AnalyticsProvider />
        {/* F-18: the consent gate itself; appears only while unanswered. */}
        <CookieConsentBanner locale={locale} dictionary={dictionary.consent} />
      </body>
    </html>
  );
}
