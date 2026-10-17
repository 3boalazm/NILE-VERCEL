import { expect, test } from "@playwright/test"

/**
 * F-14 — the offline promise, end to end: with the service worker active and
 * the network cut, navigating to a never-visited page must land on the
 * branded /offline fallback — not Chrome's dinosaur error page.
 *
 * The unit/probe layer proves the wiring (sw.js contains the fallback entry,
 * /offline answers 200); only a real browser can prove the SW intercepts a
 * document navigation while offline. Skips when the environment cannot
 * register service workers (plain http://localhost DOES register — secure
 * context — so this runs in CI and in this sandbox's vendored Chromium).
 */
test("offline navigation lands on the branded fallback", async ({ page, context }) => {
  await page.goto("/ar")

  // Wait until the SW is controlling the page (Serwist uses clientsClaim +
  // skipWaiting, so this settles within a beat of registration).
  await page.waitForFunction(
    () => navigator.serviceWorker !== undefined && navigator.serviceWorker.controller !== null,
    undefined,
    { timeout: 15_000 }
  )

  await context.setOffline(true)
  try {
    // A document that is NOT precached → the fallbacks.entries matcher kicks
    // in and answers with the precached /offline document.
    await page.goto("/ar/terms", { waitUntil: "load", timeout: 15_000 })
    await expect(page.getByRole("heading", { name: "لا يوجد اتصال بالإنترنت" })).toBeVisible()
  } finally {
    await context.setOffline(false)
  }
})
