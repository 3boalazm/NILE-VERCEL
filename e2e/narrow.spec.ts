import { expect, test } from "@playwright/test"

import { dictionaries } from "../src/lib/i18n/dictionaries"

/**
 * F-32 — 320px is the narrowest phone viewport still in the wild
 * (iPhone SE 1st gen, small Androids). The UX audit found overlays and a few
 * grids assuming ≥360px. These tests pin the contract at 320×640:
 *
 *   - no page may scroll horizontally;
 *   - the mobile-menu sheet (Radix Sheet → role="dialog") must stay fully
 *     inside the viewport, and the document behind it must not gain a
 *     horizontal scrollbar while it is open.
 *
 * Runs against the same no-Vendure server as smoke.spec.ts.
 */
const ar = dictionaries.ar

/** Pages that render fully without Vendure (catalog via MOCK_CATALOG_FALLBACK). */
const PAGES = [
  "/ar",
  "/ar/products",
  "/ar/products/proxeed-plus",
  "/ar/blogs",
  "/ar/story",
  "/ar/about",
  "/ar/contact",
]

test.describe("narrow 320px viewport (F-32)", () => {
  test.use({ viewport: { width: 320, height: 640 } })

  for (const path of PAGES) {
    test(`${path} has no horizontal overflow`, async ({ page }) => {
      await page.goto(path)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      )
      expect(overflow, `${path} overflows horizontally by ${overflow}px`).toBeLessThanOrEqual(1)
    })
  }

  test("the mobile-menu sheet stays inside the viewport", async ({ page }) => {
    await page.goto("/ar")
    // At 320px two triggers share the label (header hamburger + bottom tab
    // bar); the F-32 target is the header's sheet.
    await page.getByRole("banner").getByRole("button", { name: ar.nav.openMenu }).click()

    // Address the sheet by its accessible name (the site name, per its
    // aria-labelledby).
    const sheet = page.getByRole("dialog", { name: ar.siteName })
    await expect(sheet).toBeVisible()

    // The sheet slides in, so measure once the transition has settled rather
    // than mid-flight (a frame captured early sits a pixel or two off-screen).
    await expect
      .poll(async () => {
        const box = await sheet.boundingBox()
        return box !== null && box.x >= -1 && box.x + box.width <= 321
      })
      .toBe(true)

    // Opening the overlay must not make the document scrollable sideways.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(overflow, `document overflows by ${overflow}px while the sheet is open`).toBeLessThanOrEqual(1)

    await page.keyboard.press("Escape")
    await expect(sheet).toBeHidden()
  })
})

test.describe("F-27 — laptop band 1280–1439px", () => {
  for (const width of [1280, 1439]) {
    test.describe(`viewport ${width}px`, () => {
      test.use({ viewport: { width, height: 900 } })

      for (const path of ["/ar", "/en", "/ar/products", "/en/products"]) {
        test(`${path} has no horizontal overflow at ${width}px`, async ({ page }) => {
          await page.goto(path)
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth
          )
          expect(overflow, `${path} overflows at ${width}px by ${overflow}px`).toBeLessThanOrEqual(1)
        })
      }
    })
  }
})
