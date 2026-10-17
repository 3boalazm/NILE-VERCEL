import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";
import { withSerwist } from "@serwist/turbopack";

const IS_PROD = process.env.NODE_ENV === "production";

/**
 * F-11 — Content-Security-Policy, scoped per surface.
 *
 * This replaces the previous "CSP deliberately omitted" comment. That comment
 * was right about the risk (an untested CSP breaks the site rather than
 * securing it) and wrong about the only available options: the policy does not
 * have to be one-size-fits-all, and it can now be tested in a real browser —
 * `scripts/probe-manual-checks.mjs` loads the storefront, the contact page
 * (which frames Google Maps) and /admin and fails on any
 * `securitypolicyviolation`, so this ships verified rather than hoped-for.
 *
 * What is actually locked down here: plugin/object content (`object-src
 * 'none'`), `<base>` hijacking, cross-origin form posts, framing of this site
 * (`frame-ancestors`, defence-in-depth next to X-Frame-Options), which origins
 * may be framed *by* this site (only Google Maps), where the page may connect
 * to (same origin + Google Analytics — so a compromised dependency cannot
 * silently exfiltrate to an arbitrary host), and mixed content in production.
 *
 * What is NOT locked down yet, on purpose: `script-src` still carries
 * `'unsafe-inline'`. Next.js's App Router emits per-page inline `<script>`
 * flight payloads and `src/app/[locale]/layout.tsx` has a static pre-paint
 * theme bootstrap, so removing it requires per-request **nonces**, which
 * `headers()` in next.config cannot produce (it is not per-request) — that
 * needs middleware plus a nonce-aware audit of Serwist's registration and
 * Payload admin's own inline bootstrap. Tracked as the F-11 follow-up in
 * DECISIONS.md rather than left implicit: XSS mitigation from this policy is
 * therefore partial, and nobody should read "CSP shipped" as "XSS closed".
 *
 * Rollout switches (see .env.example):
 *   NPF_CSP_MODE=enforce|report-only|off   default enforce
 *   NPF_CSP_REPORT_URI=<uri>               optional violation reporting
 */
const CSP_MODE = (process.env.NPF_CSP_MODE ?? "enforce").toLowerCase();
const CSP_REPORT_URI = process.env.NPF_CSP_REPORT_URI ?? "";
const CSP_HEADER_KEY =
  CSP_MODE === "report-only" ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy";

function cspValue(surface: "storefront" | "admin"): string {
  const isAdmin = surface === "admin";
  return [
    "default-src 'self'",
    [
      "script-src 'self' 'unsafe-inline'",
      // Payload's admin bundle needs eval/blob workers in development; the
      // production build does not, so it is not granted there.
      isAdmin && !IS_PROD ? "'unsafe-eval'" : "",
      isAdmin ? "blob:" : "",
      // Analytics hosts are allow-listed even when GA is not configured
      // (F-70 ships env-gated) so enabling it is not also a CSP change.
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
    ]
      .filter(Boolean)
      .join(" "),
    "style-src 'self' 'unsafe-inline'",
    // `https:` for images is deliberate: product imagery can legitimately be
    // served from an asset host or CDN, and a blocked product photo is a
    // visible, revenue-affecting regression. Images are not script-executable.
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    [
      "connect-src 'self'",
      // Next's dev/HMR websocket and Payload admin's live reload.
      !IS_PROD ? "ws: wss:" : "",
      "https://www.google-analytics.com",
      "https://*.google-analytics.com",
      "https://*.analytics.google.com",
    ]
      .filter(Boolean)
      .join(" "),
    // Only the contact page frames anything: an embedded Google Map. Payment
    // gateways (npf-payment-gateways.ts) redirect to a hosted page rather than
    // framing it, so they need no frame-src entry — if that changes, add the
    // gateway origin here and nothing else.
    "frame-src 'self' https://maps.google.com https://www.google.com",
    "frame-ancestors 'self'",
    // Serwist's service worker plus Payload admin's blob workers.
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    IS_PROD ? "upgrade-insecure-requests" : "",
    CSP_REPORT_URI ? `report-uri ${CSP_REPORT_URI}` : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function cspHeaders(surface: "storefront" | "admin") {
  return CSP_MODE === "off" ? [] : [{ key: CSP_HEADER_KEY, value: cspValue(surface) }];
}

const nextConfig: NextConfig = {
  // Stop advertising the exact framework/version via X-Powered-By — minor
  // fingerprinting hardening, zero functional impact.
  poweredByHeader: false,
  images: {
    // F-67: AVIF was never enabled, so the optimizer only ever emitted WebP.
    // AVIF is typically 20-30% smaller again at equal quality on the product
    // photography this catalogue is built from. Order matters — the first
    // format the browser accepts from `Accept` wins, so AVIF is offered first
    // with WebP as the fallback and the source format last.
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // F-42: lucide-react ships hundreds of icon modules; the per-icon ESM
    // imports already tree-shake at bundle time, but this hint lets Next
    // rewrite the barrel imports during compilation — smaller intermediate
    // chunks and a faster build without touching a single import site.
    optimizePackageImports: ["lucide-react"],
    // F-73: with the root layout nested under `[locale]`, routes that match no
    // segment used to fall back to Next's default 404 — an empty
    // `__next_error__` shell that only becomes a page once client JS hydrates.
    // This flag lets `src/app/global-not-found.tsx` serve that case as real,
    // static, JS-free HTML. Flagged experimental in Next 16.3.3 (default
    // false); if it ever graduates or is removed, the file is simply inert and
    // the fallback returns — re-check on the next framework bump.
    globalNotFound: true,
  },
  allowedDevOrigins: process.env.NPF_PREVIEW_MODE === "1" ? ["*.e2b.app"] : [],
  // Next's built-in slash redirect runs before proxy. Leaving it on would
  // turn `/product/proxeed-plus/` into a 308 and then a 301. Proxy strips
  // the slash itself, and sends confirmed legacy paths to the canonical
  // PDP in that same response.
  skipTrailingSlashRedirect: true,
  async headers() {
    return [
      {
        // Admin surfaces get their own policy: Payload's panel and its
        // graphql-playground route (/api/graphql-playground) are HTML apps with
        // inline bootstrap needs the storefront policy does not grant. Next
        // applies every matching rule cumulatively and a browser enforces the
        // *intersection* of multiple CSP headers, so the storefront rule below
        // explicitly excludes /admin and /api rather than relying on ordering.
        source: "/admin/:path*",
        headers: cspHeaders("admin"),
      },
      {
        source: "/api/:path*",
        headers: cspHeaders("admin"),
      },
      {
        source: "/((?!admin(?:/|$)|api(?:/|$)).*)",
        headers: cspHeaders("storefront"),
      },
      {
        // F-48 — belt-and-braces with the robots.txt disallow: search
        // engines that already know an admin URL must see a noindex
        // directive ON the response (robots.txt alone cannot de-index).
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        // F-43 — public static assets get a short fresh window plus
        // stale-while-revalidate: repeat visits and prefetchers get instant
        // responses while revalidation happens in the background. Hashed
        // build output under /_next/static is already immutable via Next's
        // own header. (.js is deliberately absent — the service worker
        // script keeps its strict no-cache rule below.)
        source: "/:path*.(jpg|jpeg|png|webp|avif|gif|svg|ico|woff|woff2|mp4)",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" }],
      },
      {
        // Never let the browser (or an intermediate cache) cache the service
        // worker script itself — users must always pick up a new version on
        // the next visit rather than being stuck on a stale one.
        source: "/serwist/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
      {
        // Baseline security headers on every route. CSP lives in the scoped
        // rules above (storefront vs admin).
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          ...(process.env.NPF_PREVIEW_MODE === "1" ? [] : [{ key: "X-Frame-Options", value: "SAMEORIGIN" }]),
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/:locale(ar|en)/reset-password",
        headers: [{key:"Referrer-Policy",value:"no-referrer"}, {key:"Cache-Control",value:"private, no-store, max-age=0"}],
      },
    ];
  },
};

const payloadConfig = withPayload(nextConfig);

/**
 * withPayload() unconditionally appends its own headers() rule for
 * `source: "/:path*"` — Accept-CH/Critical-CH/Vary: Sec-CH-Prefers-Color-Scheme,
 * for its admin UI's dark-mode SSR (node_modules/@payloadcms/next/dist/withPayload/
 * withPayload.js). No option exists to scope or disable it (checked withPayload's
 * actual signature: only `devBundleServerPackages`). This makes every route on the
 * site — product pages, images, api routes, the service worker script, everything —
 * carry Critical-CH's "the browser must retry the request with this hint" contract,
 * which only actually matters for the admin panel's own SSR dark-mode detection.
 *
 * Next's headers() rules are cumulative, not most-specific-wins: a request matches
 * BOTH this file's own `/serwist/sw.js` rule above AND Payload's separate `/:path*`
 * catch-all, and both sets of headers get sent together (confirmed by dumping the
 * built .next/routes-manifest.json — two distinct entries, each applied). So
 * filtering headers *off* the SW-specific entry is a no-op — that entry never had
 * Accept-CH etc. to begin with; they live entirely in Payload's catch-all. The fix
 * is to stop the catch-all from matching `/serwist/sw.js` at all, via a
 * negative-lookahead `source` rewrite (the same exclusion idiom Next's own
 * middleware matchers use).
 *
 * NOTE: this does NOT fix service worker registration failing in a production
 * build (see DECISIONS.md ADR-028) — that turned out to be unrelated. Kept anyway
 * because it's an independently correct fix: Payload's admin-only headers
 * shouldn't leak onto an unrelated static asset.
 */
const withPayloadHeaders = payloadConfig.headers
payloadConfig.headers = async () => {
  const entries = (await withPayloadHeaders?.()) ?? []
  return entries.map((entry) =>
    entry.source === "/:path*"
      ? { ...entry, source: "/((?!serwist/sw\\.js).*)" }
      : entry
  )
}

export default withSerwist(payloadConfig);
