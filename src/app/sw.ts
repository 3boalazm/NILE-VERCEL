/// <reference lib="webworker" />
import {
  LEGACY_PRIVATE_CACHES,
  isPublicMediaPath,
} from "../lib/pwa/cache-policy"
import {
  CacheFirst,
  ExpirationPlugin,
  NetworkOnly,
  Serwist,
  StaleWhileRevalidate,
} from "serwist"
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist"

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}
declare const self: ServiceWorkerGlobalScope

// Every document and RSC response can contain personalized layout state.
// Offline support is for static assets + a neutral fallback, NEVER page HTML.
const legacyPageCaches = new Set<string>(LEGACY_PRIVATE_CACHES)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => legacyPageCaches.has(key))
            .map((key) => caches.delete(key))
        )
      )
  )
})

/**
 * The last-resort body for a failed navigation, used only when the precached
 * /offline page is not available (first install, or a cache the browser
 * evicted). It is deliberately tiny and self-contained: no fonts, no scripts,
 * no images — just the two sentences a customer needs when the network is
 * down.
 */
const OFFLINE_FALLBACK_HTML = `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>لا يوجد اتصال بالإنترنت</title>
    <style>
      body { font-family: system-ui, sans-serif; background: #f3f5f0; color: #153a35;
             display: flex; min-height: 100vh; align-items: center; justify-content: center;
             margin: 0; padding: 24px; text-align: center; }
      main { max-width: 32rem; }
      h1 { font-size: 1.25rem; margin: 0 0 12px; }
      p { margin: 8px 0; line-height: 1.7; }
      a { color: #153a35; }
    </style>
  </head>
  <body>
    <main>
      <h1>مفيش اتصال بالإنترنت دلوقتي</h1>
      <p>ارجع لما الاتصال يرجع وحاول تاني.</p>
      <p lang="en" dir="ltr">You are offline right now. Reconnect and try again.</p>
      <p><a href="/">الرئيسية · Home</a></p>
    </main>
  </body>
</html>`

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ request, url, sameOrigin }) =>
        sameOrigin &&
        (request.destination === "document" ||
          request.headers.get("RSC") === "1" ||
          url.pathname.startsWith("/api/") ||
          url.pathname.startsWith("/admin")),
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ sameOrigin, url }) =>
        sameOrigin && url.pathname.startsWith("/_next/static/"),
      handler: new CacheFirst({
        cacheName: "npf-static-v2",
        plugins: [
          new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 604800 }),
        ],
      }),
    },
    {
      matcher: ({ request, sameOrigin, url }) =>
        sameOrigin &&
        (request.destination === "image" || request.destination === "font") &&
        isPublicMediaPath(url),
      handler: new StaleWhileRevalidate({
        cacheName: "npf-media-v2",
        plugins: [
          new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 604800 }),
        ],
      }),
    },
    {
      /**
       * Same-origin only — deliberately.
       *
       * The previous version of this rule matched *every* request, so the
       * worker proxied third-party traffic (a Google Fonts stylesheet, an
       * analytics beacon) through its own `fetch()`. That is wrong twice
       * over:
       *
       * 1. The worker's `fetch()` is subject to the page's `connect-src`
       *    policy, so any third-party request the CSP blocks became a failed
       *    fetch *inside the worker* — the browser logged
       *    "no-response :: [url]" and an unhandled rejection, on every
       *    blocked request, forever.
       * 2. A service worker has no business answering for origins it does
       *    not control. Letting the request go to the network untouched is
       *    both faster and the browser's default behaviour.
       *
       * Everything this site serves is same-origin, so nothing is lost.
       */
      matcher: ({ sameOrigin }) => sameOrigin,
      handler: new NetworkOnly(),
    },
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
})

/**
 * A failed request must not become an unhandled rejection.
 *
 * `NetworkOnly` throws `SerwistError("no-response")` when the network does
 * not answer. Thrown from a fetch event, that rejection is what the browser
 * reports as "The FetchEvent for <url> resulted in a network error response:
 * the promise was rejected" — and the page gets the browser's offline error
 * page instead of the site's own.
 *
 * The precache fallback above already answers failed *documents* with the
 * cached /offline page. This handler is the net under it: it covers every
 * other request type (a font, a stylesheet, an image) and the case where the
 * precache itself is unavailable, so a failed request always ends in a real
 * Response — never in a rejected promise.
 */
serwist.setCatchHandler(async ({ request }) => {
  if (request.destination === "document") {
    const offline = await serwist.matchPrecache("/offline")
    if (offline) return offline
    return new Response(OFFLINE_FALLBACK_HTML, {
      status: 503,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  }
  // Not a document: an honest "the upstream did not answer" instead of a
  // network error. The resource fails to load, which is exactly what
  // happened, but nothing is left unhandled.
  return new Response(null, {
    status: 504,
    statusText: "Gateway Timeout",
  })
})

serwist.addEventListeners()
