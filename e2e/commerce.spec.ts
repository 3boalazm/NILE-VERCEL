import { expect, test, type Page } from "@playwright/test"

import { dictionaries } from "../src/lib/i18n/dictionaries"

/**
 * Commerce suite — needs a running Vendure with the NPF catalog seeded
 * (slugs matching Payload), the `manual-settlement` payment method, and
 * the npf-shipping methods. Skips itself cleanly when Vendure is
 * unreachable, so plain `npx playwright test` stays green on a
 * Payload-only machine and in CI.
 */
const ar = dictionaries.ar
const SHOP_API = process.env.VENDURE_SHOP_API_URL ?? "http://localhost:3001/shop-api"

async function vendureReachable(): Promise<boolean> {
  try {
    const response = await fetch(SHOP_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "{ __typename }" }),
    })
    return response.ok
  } catch {
    return false
  }
}

test.beforeAll(async () => {
  test.skip(!(await vendureReachable()), `vendure unreachable at ${SHOP_API} — commerce suite skipped`)
})

// First catalog product whose PDP has an ENABLED add-to-cart button —
// skips paused/launching_soon products regardless of catalog order.
async function gotoPurchasableProduct(page: Page): Promise<void> {
  await page.goto("/ar/products")
  const hrefs = await page
    .locator('a[href^="/ar/products/"]')
    .evaluateAll((elements) =>
      elements
        .map((element) => element.getAttribute("href"))
        .filter((href): href is string => !!href && href.split("/").length === 4)
    )
  const unique = [...new Set(hrefs)]
  expect(unique.length).toBeGreaterThan(0)
  for (const href of unique) {
    await page.goto(href)
    // Scope to the PDP's own CTA (data-testid): the page also renders
    // related-product cards whose quick-add buttons share the same label.
    const addButton = page.getByTestId("pdp-add-to-cart")
    if ((await addButton.count()) > 0 && (await addButton.isEnabled())) return
  }
  throw new Error("no purchasable product found in the catalog")
}

test("guest can place an order", async ({ page }) => {
  await gotoPurchasableProduct(page)
  // PDP-primary CTA (related-product cards below share the label).
  await page.getByTestId("pdp-add-to-cart").click()
  // The button flips to its "added" state only after the server action
  // succeeds — doubles as our wait for the cart write.
  await expect(page.getByTestId("pdp-add-to-cart")).toHaveText(ar.product.addedToCart, {

    timeout: 15_000,
  })

  await page.goto("/ar/cart")
  await page.locator('a[href$="/checkout"]').first().click()
  await expect(page).toHaveURL(/\/ar\/checkout\/?$/)

  await page.locator('input[name="name"]').fill("عميل تجريبي")
  await page.locator('input[name="phone"]').fill("01012345678")
  // Governorate is a <select> (F-17: fixed list of Egypt's 27 governorates,
  // shipping quotes key on it) — selectOption, not fill. Its value is the
  // Arabic name (gov.ar); picking it re-quotes shipping via onChange.
  await page.locator('select[name="governorate"]').selectOption("القليوبية")
  await page.locator('input[name="city"]').fill("العبور")
  await page.locator('textarea[name="address"]').fill("شارع تجريبي 1")
  // Shipping methods load on address blur.
  await page.locator('textarea[name="address"]').blur()
  const shippingOption = page.locator('input[name="fulfillmentMode"]').first()
  await expect(shippingOption).toBeAttached({ timeout: 20_000 })
  await shippingOption.check()
  await page.locator('input[name="terms"]').check()

  await page.getByRole("button", { name: ar.checkout.placeOrderCta }).click()
  await expect(page).toHaveURL(/\/ar\/checkout\/confirmation\?order=.+/, { timeout: 30_000 })
  await expect(
    page.getByRole("heading", { name: ar.checkout.confirmation.title })
  ).toBeVisible()
})

test("confirmation without proof-of-purchase shows the empty state", async ({ page }) => {
  // Fresh browser context: no `npf_last_order` cookie, no customer
  // session — a guessed code must leak nothing (see the view gate in
  // checkout/confirmation/page.tsx).
  await page.goto("/ar/checkout/confirmation?order=NOTAREALCODE")
  await expect(
    page.getByRole("heading", { name: ar.checkout.confirmation.noOrderTitle })
  ).toBeVisible()
})
