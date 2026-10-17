import { expect, test } from "@playwright/test"

/** Works against a seeded catalog or explicit design preview. No real order
 * or contact submission is made by this suite. */
test("language switch preserves discovery but drops reset/redirect tokens", async ({ page }) => {
  await page.goto("/ar/products?need=men&q=proxeed&sort=name-desc&token=private&redirect=https://example.invalid")
  const switcher = page.locator("header").getByRole("link", { name: /English/ })
  await expect(switcher).toHaveAttribute("href", "/en/products?q=proxeed&need=men&sort=name-desc")
  await switcher.click()
  await expect(page).toHaveURL(/\/en\/products\?q=proxeed&need=men&sort=name-desc$/)
})

test("a product inquiry carries a verified subject to contact", async ({ page }) => {
  await page.goto("/en/contact?product=proxeed-plus")
  await expect(page.locator('input[name="subject"]')).toHaveValue("Product inquiry: Proxeed Plus")
  await page.goto("/en/contact?product=not-a-real-product")
  await expect(page.locator('input[name="subject"]')).toHaveValue("")
})

test("mobile menu can be opened and dismissed by keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/en")
  const opener = page.locator("header").getByRole("button", { name: "Open menu", exact: true })
  await opener.click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toBeHidden()
  await expect(opener).toBeFocused()
})

test("skip link is the first keyboard target and reaches the main content", async ({ page }) => {
  await page.goto("/en")
  await page.keyboard.press("Tab")
  await expect(page.locator(".skip-link")).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(page.locator("#main-content")).toBeFocused()
})

test("explicit preview labels demo money and publishes no demo offer", async ({ page }) => {
  test.skip(process.env.NPF_PREVIEW_MODE !== "1", "Preview-only acceptance contract")
  await page.goto("/en/products/proxeed-plus")
  await expect(page.getByRole("note").first()).toContainText("Design preview")
  await expect(page.getByRole("button", { name: "Currently unavailable to order", exact: true }).first()).toBeDisabled()
  const schema = await page.locator('script[type="application/ld+json"]').evaluateAll(elements =>
    elements.map(el => JSON.parse(el.textContent || "{}")).find(data => data["@type"] === "Product")
  )
  expect(schema).not.toHaveProperty("offers")
  expect(schema).not.toHaveProperty("brand")
})

test("disabled mail recovery is explicit, not a fake success form", async ({ page }) => {
  test.skip(process.env.PASSWORD_RESET_ENABLED === "true" && process.env.NPF_PREVIEW_MODE !== "1", "Delivery enabled on this deployment")
  await page.goto("/en/forgot-password")
  await expect(page.getByRole("note").last()).toContainText("currently unavailable")
  await expect(page.getByRole("link", { name: /Contact us/ }).last()).toBeVisible()
  await expect(page.locator('input[name="email"]')).toHaveCount(0)
})

test("production worker purges legacy private pages and serves a neutral offline fallback", async ({ page, context }) => {
  test.skip(!process.env.CI && process.env.NPF_PREVIEW_MODE !== "1", "Worker registration is deliberately disabled in next dev")
  await page.goto("/offline")
  await page.evaluate(async () => {
    for (const name of ["pages", "pages-rsc", "others"]) {
      const cache = await caches.open(name)
      await cache.put("/en/account", new Response("PRIVATE_LEGACY_SENTINEL"))
    }
  })
  await page.goto("/en")
  await page.evaluate(async () => { await navigator.serviceWorker.ready })
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
  expect(await page.evaluate(() => caches.keys())).not.toEqual(expect.arrayContaining(["pages"]))
  await page.goto("/en/cart")
  const cached = await page.evaluate(async () => {
    const urls: string[] = []
    for (const name of await caches.keys()) urls.push(...(await (await caches.open(name)).keys()).map(req => req.url))
    return urls
  })
  expect(cached.some(url => /\/en\/(account|cart|checkout|login)(?:[/?]|$)/.test(url))).toBe(false)
  await context.setOffline(true)
  try {
    await page.goto("/en/account")
    await expect(page.locator("body")).not.toContainText("PRIVATE_LEGACY_SENTINEL")
    await expect(page.locator("body")).toContainText("For your privacy")
  } finally { await context.setOffline(false) }
})
