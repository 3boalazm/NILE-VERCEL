import { describe, expect, it } from "vitest"

import { dictionaries } from "./dictionaries"

/**
 * F-06 — the same action must carry the same name on every surface.
 *
 * The original finding was copy drifting between surfaces (the same action
 * named differently on the cart vs the order confirmation). The fix unified
 * the labels on shared dictionary keys; these tests pin that contract so a
 * future edit to one surface cannot silently fork the name again.
 *
 * Pairs covered, in BOTH locales (the drift was per-locale copy):
 *   - "continue shopping": cart's link vs order-confirmation's CTA
 *   - "proceed to checkout": the cart CTA names the same noun as the
 *     checkout page itself
 *   - "contact us": shipping-page CTA vs order-confirmation contact CTA
 */
describe("F-06 — same action, same name across surfaces", () => {
  for (const [locale, dict] of Object.entries(dictionaries)) {
    it(`${locale}: "continue shopping" is identical on cart and order confirmation`, () => {
      expect(dict.checkout.confirmation.continueShoppingCta).toBe(dict.cart.continueShopping)
    })

    it(`${locale}: the checkout CTA is the single name for proceeding to checkout`, () => {
      // The cart's single checkout affordance names the same noun as the
      // checkout page's own title ("إتمام الطلب" / "Checkout").
      expect(dict.cart.checkoutCta).toContain(dict.checkout.pageTitle)
    })

    it(`${locale}: "contact us" is identical on shipping and order confirmation`, () => {
      expect(dict.checkout.confirmation.contactCta).toBe(dict.shipping.ctaButton)
    })
  }
})
