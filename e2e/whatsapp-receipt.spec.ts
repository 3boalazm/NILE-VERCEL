import { expect, test, type Page } from "@playwright/test"

import { dictionaries } from "../src/lib/i18n/dictionaries"

/**
 * Manual-transfer WhatsApp receipt hand-off (InstaPay / Vodafone Cash).
 * Guards the promises of the flow:
 *  - the CTA is a plain wa.me LINK to the single confirmation number,
 *    pre-filled from the REAL order (number/total never user input)
 *  - both rails show the CTA in checkout; transfer orders show it on the
 *    confirmation page
 *  - activating the link performs NO shop-api mutation: the order stays
 *    PENDING until an admin verifies the transfer (settlePayment is an
 *    admin-API step, never reachable from this button)
 * Skips cleanly without Vendure, like commerce.spec.ts.
 */
const ar = dictionaries.ar
const en = dictionaries.en
const SHOP_API = process.env.VENDURE_SHOP_API_URL ?? "http://localhost:3001/shop-api"
const WA_BASE = "https://wa.me/201027639857?text="

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
  test.skip(!(await vendureReachable()), `vendure unreachable at ${SHOP_API} — whatsapp-receipt suite skipped`)
})

/** Add the first purchasable product to the cart and open the checkout. */
async function gotoCheckout(page: Page): Promise<void> {
  await page.goto("/ar/products")
  const hrefs = await page
    .locator('a[href^="/ar/products/"]')
    .evaluateAll((elements) =>
      elements
        .map((element) => element.getAttribute("href"))
        .filter((href): href is string => !!href && href.split("/").length === 4)
    )
  for (const href of [...new Set(hrefs)]) {
    await page.goto(href)
    const addButton = page.getByTestId("pdp-add-to-cart")
    if ((await addButton.count()) > 0 && (await addButton.isEnabled())) {
      await addButton.click()
      await expect(addButton).toHaveText(ar.product.addedToCart, { timeout: 15_000 })
      await page.goto("/ar/cart")
      await page.locator('a[href$="/checkout"]').first().click()
      await expect(page).toHaveURL(/\/ar\/checkout\/?$/)
      return
    }
  }
  throw new Error("no purchasable product found in the catalog")
}

test("checkout shows both transfer rails with their rails' details and the WhatsApp CTA", async ({ page }) => {
  await gotoCheckout(page)

  // InstaPay rail: alias + existing IPN link + WhatsApp CTA
  await page.getByRole("radio", { name: en.checkout.paymentInstapay }).check()
  await expect(page.getByText("ahmedkhaled3bsallam@instapay").first()).toBeVisible()
  const instapayButton = page.locator('a[href^="https://ipn.eg/S/ahmedkhaled3bsallam/instapay/"]')
  await expect(instapayButton).toHaveCount(1)
  const cta = page.locator(`a[href^="${WA_BASE}"]`)
  await expect(cta).toHaveCount(1)
  await expect(cta).toContainText(ar.checkout.whatsappReceiptCta)
  // prominent amount + the explicit "confirmed after review" note
  await expect(page.getByText(ar.checkout.transferAmountLabel).first()).toBeVisible()
  await expect(page.getByText(ar.checkout.whatsappPendingNote)).toBeVisible()
  const instapayHref = await cta.getAttribute("href")
  expect(instapayHref).toBeTruthy()
  const instapayMessage = decodeURIComponent(instapayHref!.split("?text=")[1])
  expect(instapayMessage).toContain(`طريقة الدفع: ${ar.checkout.paymentInstapay}`)
  expect(instapayMessage).toMatch(/إجمالي الطلب: \d+/)
  expect(instapayMessage).not.toContain("{")

  // Vodafone Cash rail: wallet number + copy button + same CTA pointing at
  // the same single confirmation number
  await page.getByRole("radio", { name: ar.checkout.paymentVodafone }).check()
  await expect(page.getByText("01091984418").first()).toBeVisible()
  await expect(page.getByRole("button", { name: ar.checkout.copyNumberLabel })).toBeVisible()
  await expect(page.locator(`a[href^="${WA_BASE}"]`)).toHaveCount(1)
  const vodafoneHref = await page.locator(`a[href^="${WA_BASE}"]`).getAttribute("href")
  const vodafoneMessage = decodeURIComponent(vodafoneHref!.split("?text=")[1])
  expect(vodafoneMessage).toContain(`طريقة الدفع: ${ar.checkout.paymentVodafone}`)
  await expect(page.getByText(ar.checkout.transferAmountLabel).first()).toBeVisible()
  await expect(page.getByText(ar.checkout.whatsappPendingNote)).toBeVisible()
  // the InstaPay copy button must not leak into the Vodafone rail
  await expect(page.getByRole("button", { name: ar.checkout.copyAliasLabel })).toBeHidden()
})

test("the WhatsApp CTA is a link, not a payment action — no shop-api mutation on activation", async ({ page }) => {
  await gotoCheckout(page)
  await page.getByRole("radio", { name: ar.checkout.paymentVodafone }).check()

  // abort wa.me (nothing external should be needed) and watch shop-api
  const shopApiCalls: string[] = []
  await page.route("https://wa.me/**", (route) => route.abort())
  page.on("request", (request) => {
    if (request.url().includes("shop-api")) shopApiCalls.push(`${request.method()} ${request.url()}`)
  })

  await page.locator(`a[href^="${WA_BASE}"]`).click()
  await page.waitForTimeout(1_000)

  // the button is a pure anchor: no addPaymentToOrder/settle mutation, no
  // transition — the only shop-api traffic is the page's own polling/read.
  const mutating = shopApiCalls.filter((call) =>
    /addPaymentToOrder|settlePayment|transitionOrderToState|setOrderShippingMethod/.test(call)
  )
  expect(mutating).toEqual([])
})

test("order confirmation shows the CTA for transfer orders with the REAL order number", async ({ page }) => {
  await gotoCheckout(page)
  // pick the InstaPay rail so the order lands on bank_transfer
  await page.getByRole("radio", { name: en.checkout.paymentInstapay }).check()

  await page.locator('input[name="name"]').fill("عميل تجريبي")
  await page.locator('input[name="phone"]').fill("01012345678")
  await page.locator('select[name="governorate"]').selectOption("القليوبية")
  await page.locator('input[name="city"]').fill("العبور")
  await page.locator('textarea[name="address"]').fill("شارع تجريبي 1")
  await page.locator('textarea[name="address"]').blur()
  const shippingOption = page.locator('input[name="fulfillmentMode"]').first()
  await expect(shippingOption).toBeAttached({ timeout: 20_000 })
  await shippingOption.check()
  // reconciliation aid (optional): a typed transfer reference must reach the
  // payment metadata and come back on the confirmation card
  await page.locator('input[name="transferRef"]').fill("TXN-424242")
  await page.locator('input[name="terms"]').check()

  await page.getByRole("button", { name: ar.checkout.placeOrderCta }).click()
  await expect(page).toHaveURL(/\/ar\/checkout\/confirmation\?order=(.+)&?/, { timeout: 30_000 })
  const orderCode = page.url().match(/order=([^&]+)/)![1]

  // reminder card + CTA pre-filled from the CREATED order (URL query is only
  // the gate cookie check — the message must carry the same real code)
  await expect(
    page.getByRole("heading", { name: ar.checkout.confirmation.transferReminderTitle })
  ).toBeVisible()
  const cta = page.locator(`a[href^="${WA_BASE}"]`)
  await expect(cta).toHaveCount(1)
  await expect(cta).toContainText(ar.checkout.whatsappReceiptCta)
  const href = await cta.getAttribute("href")
  const message = decodeURIComponent(href!.split("?text=")[1])
  expect(message).toContain(`رقم الطلب: #${orderCode}`)
  expect(message).toContain(`طريقة الدفع: ${ar.checkout.paymentBank}`)
  expect(message).toMatch(new RegExp(`إجمالي الطلب: \\d+`))
  // prominent amount + post-send expectation inside the reminder card
  await expect(page.getByText(ar.checkout.transferAmountLabel)).toBeVisible()
  await expect(page.getByText(ar.checkout.whatsappPendingNote)).toBeVisible()
  // the typed reference is recorded for reconciliation (metadata round-trip)
  await expect(page.getByText(ar.checkout.transferRefRecordedLabel)).toBeVisible()
  await expect(page.getByText("TXN-424242")).toBeVisible()

  // activating it must not settle/transition anything server-side
  const shopApiCalls: string[] = []
  await page.route("https://wa.me/**", (route) => route.abort())
  page.on("request", (request) => {
    if (request.url().includes("shop-api")) shopApiCalls.push(`${request.method()} ${request.url()}`)
  })
  await cta.click()
  await page.waitForTimeout(1_000)
  expect(
    shopApiCalls.filter((call) => /addPaymentToOrder|settlePayment|transitionOrderToState/.test(call))
  ).toEqual([])
})
