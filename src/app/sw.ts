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
    { matcher: () => true, handler: new NetworkOnly() },
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
serwist.addEventListeners()
