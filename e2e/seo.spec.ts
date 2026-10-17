import { expect, test } from "@playwright/test"

/**
 * Redirects and crawl files are served by this app's proxy and metadata
 * routes. They do not prove the public host is serving this app.
 */
test("legacy product URL is one 301 with no query on the destination", async ({ request }) => {
  const response = await request.get("/product/proxeed-plus?utm=spam", { maxRedirects: 0 })
  expect(response.status()).toBe(301)
  const location = response.headers().location ?? ""
  const url = new URL(location, "http://localhost:3000")
  expect(url.pathname).toBe("/ar/products/proxeed-plus")
  expect(url.search).toBe("")
})

test("trailing-slash legacy URL uses the same hop", async ({ request }) => {
  const response = await request.get("/product/pulse-oximeter-ca-mi-o2-easy/", { maxRedirects: 0 })
  expect(response.status()).toBe(301)
  const url = new URL(response.headers().location ?? "", "http://localhost:3000")
  expect(url.pathname).toBe("/ar/products/ca-mi-pulse-oximeter")
})

test("unknown and unconfirmed product URLs are not redirected to the catalog", async ({ request }) => {
  const unknown = await request.get("/product/does-not-exist", { maxRedirects: 0 })
  expect(unknown.status()).toBe(404)
  const thermometer = await request.get("/product/t-onedigital-ir-thermometer", { maxRedirects: 0 })
  expect(thermometer.status()).toBe(404)
  expect(thermometer.headers().location).toBeUndefined()
})

test("spam and trash URLs are gone, not redirected to a product", async ({ request }) => {
  const spam = await request.get("/term-paper-writer-reviews", { maxRedirects: 0 })
  expect(spam.status()).toBe(410)
  expect(spam.headers().location).toBeUndefined()
  const trash = await request.get("/home__trashed/store__trashed", { maxRedirects: 0 })
  expect(trash.status()).toBe(410)
})

test("robots.txt blocks admin and api without blocking the public catalog", async ({ request }) => {
  const response = await request.get("/robots.txt")
  expect(response.status()).toBe(200)
  const body = await response.text()
  expect(body).toContain("Disallow: /admin")
  expect(body).toContain("Disallow: /api")
  expect(body).not.toContain("Disallow: /ar")
  expect(body).not.toContain("Disallow: /en")
  expect(body).not.toContain("Disallow: /products")
  expect(body).toContain("Sitemap: https://nilepharmafood.com/sitemap.xml")
})

test("arabic PDP heading is the stored Arabic name and device schema has no brand", async ({ page }) => {
  await page.goto("/ar/products/proxeed-plus")
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("بروكسيد بلس")
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/i)

  await page.goto("/en/products/proxeed-plus")
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Proxeed Plus")

  await page.goto("/ar/products/ca-mi-pulse-oximeter")
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("جهاز قياس تشبع الأكسجين CA-MI")
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents()
  const product = blocks.map((block) => JSON.parse(block) as { "@type"?: string; brand?: unknown; name?: string }).find(
    (block) => block["@type"] === "Product"
  )
  expect(product?.name).toBe("جهاز قياس تشبع الأكسجين CA-MI")
  expect(product?.brand).toBeUndefined()
  expect(JSON.stringify(product)).not.toContain("Alfasigma")
  expect(JSON.stringify(product)).not.toContain("PreOrder")
})
