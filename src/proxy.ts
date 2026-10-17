import { NextResponse, type NextRequest } from "next/server"

import { defaultLocale, locales } from "@/lib/i18n/config"
import { isValidSlug } from "@/lib/validation/identifiers"
import { THEME_COLOR_DARK, THEME_COLOR_LIGHT } from "@/lib/site-config"
import { resolveLegacyPath } from "@/lib/seo/legacy-redirects"

// Matches the shape of a locale code (e.g. "xx", "fr"), not any specific
// supported one — used to tell "/fr/products" (an unsupported locale
// attempt, whose "fr" segment should be replaced) apart from "/products"
// (no locale segment at all, which should get the default one prepended).
const LOCALE_SHAPED_SEGMENT = /^[a-z]{2}$/

// F-54 — the product detail route is `/[locale]/products/[slug]`, so a
// malformed slug (quotes, SQL fragments, traversal, braces) still matches
// the route and reaches rendering. Three layers protect that path:
//
//   1. the repository refuses non-`isValidSlug` lookups (no DB round-trip,
//      no 500 — the actual defect);
//   2. the PDP's generateMetadata throws notFound() so crawlers never see
//      product metadata for a missing page;
//   3. THIS guard: because the products segment ships a loading skeleton,
//      Next streams the shell (HTTP 200) before the page's notFound() can
//      set the status — a soft-404. A slug that fails the shape check never
//      enters rendering at all: it gets a REAL 404 here, with the same
//      branding and wording as global-not-found.tsx (kept as a string
//      literal because middleware cannot render React).
function branded404(locale: string): NextResponse {
  const rtl = locale !== "en"
  const html = `<!doctype html>
<html lang="${rtl ? "ar" : "en"}" dir="${rtl ? "rtl" : "ltr"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>404 — الصفحة غير موجودة | Page not found</title>
<style>
:root { color-scheme: light; }
* { box-sizing: border-box; }
body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px;
  background: ${THEME_COLOR_LIGHT}; color: ${THEME_COLOR_DARK};
  font-family: system-ui, -apple-system, "Segoe UI", Tahoma, sans-serif; text-align: center; }
p.code { margin: 0 0 8px; font-size: clamp(56px, 14vw, 96px); font-weight: 800; line-height: 1; }
h1 { margin: 0 0 8px; font-size: clamp(20px, 4.5vw, 28px); }
p.en { margin: 0 0 24px; font-size: 15px; opacity: 0.8; direction: ltr; }
a.btn { display: inline-block; padding: 10px 22px; border-radius: 999px; text-decoration: none;
  background: ${THEME_COLOR_DARK}; color: ${THEME_COLOR_LIGHT}; font-size: 15px; }
</style>
</head>
<body>
<main>
<p class="code">404</p>
<h1>الصفحة غير موجودة</h1>
<p class="en">Page not found</p>
<a class="btn" href="/${locale}">العودة للرئيسية</a>
</main>
</body>
</html>`
  return new NextResponse(html, {
    status: 404,
    headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex" },
  })
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const legacy = resolveLegacyPath(pathname)
  if (legacy?.kind === "redirect") {
    const url = new URL(legacy.pathname, request.url)
    // Legacy redirects drop the query string.
    url.search = ""
    return NextResponse.redirect(url, legacy.status)
  }
  if (legacy?.kind === "gone" || legacy?.kind === "not-found") {
    return new NextResponse(legacy.kind === "gone" ? "Gone" : "Not Found", {
      status: legacy.status,
      headers: { "content-type": "text/plain; charset=utf-8", "x-robots-tag": "noindex" },
    })
  }

  // Default Next behavior is no trailing slash. With
  // skipTrailingSlashRedirect, this proxy owns that hop so it cannot run
  // ahead of a legacy 301. Query strings are kept here; legacy 301s above
  // already dropped theirs.
  if (pathname.length > 1 && pathname.endsWith("/")) {
    const url = new URL(pathname.replace(/\/+$/, "") + request.nextUrl.search, request.url)
    return NextResponse.redirect(url, 308)
  }

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  )
  if (hasLocale) {
    // F-54 layer 3: a product-slug segment that fails the shape check is a
    // 404-shaped request, decided at the edge before any rendering (and
    // therefore before any streaming can downgrade it to a soft-404).
    const productPath = pathname.match(/^\/(ar|en)\/products\/([^/]+)\/?$/)
    if (productPath) {
      let slug = productPath[2]
      try {
        slug = decodeURIComponent(slug)
      } catch {
        // Percent-encoding that is not even decodable is malformed by
        // definition — never let it reach the renderer.
        return branded404(productPath[1])
      }
      if (!isValidSlug(slug)) return branded404(productPath[1])
    }

    // not-found.js/global-not-found.js can't receive params (confirmed in
    // Next's own docs — this Next 16 canary build has real API differences
    // from training data), so [locale]/not-found.tsx has no way to know
    // which locale 404'd other than reading the original request path back
    // out of a header set here.
    const response = NextResponse.next()
    response.headers.set("x-pathname", pathname)
    return response
  }

  const url = request.nextUrl.clone()
  const [, firstSegment, ...rest] = pathname.split("/")
  const isInvalidLocaleAttempt = firstSegment && LOCALE_SHAPED_SEGMENT.test(firstSegment)
  url.pathname = isInvalidLocaleAttempt
    ? `/${defaultLocale}${rest.length ? `/${rest.join("/")}` : ""}`
    : `/${defaultLocale}${pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  // Skip Next internals, API routes, the Payload admin panel, the service
  // worker's offline fallback page (not locale-prefixed — the service
  // worker precaches and serves it as a standalone route, and a redirect
  // here would 404 both a direct visit and the SW's own precache fetch),
  // and any request for a static file (anything with a file extension —
  // images, favicon, etc.) under public/.
  //
  // The extra matchers are the exception: WordPress and host-suspension
  // paths often end in .php or .cgi. The extension exclusion would skip
  // them, and they must 410 instead of being treated as missing assets
  // that a later rule could redirect. `/admin` (Payload) stays excluded.
  matcher: [
    "/((?!_next|api|admin|offline|.*\\.[\\w]+$).*)",
    "/wp-admin/:path*",
    "/wp-content/:path*",
    "/wp-includes/:path*",
    "/cgi-sys/:path*",
    "/feed",
    "/feed/:path*",
  ],
}
