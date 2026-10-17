import { describe, expect, it } from "vitest"

import {
  INSTAPAY_ALIAS,
  PAYMENT_WHATSAPP_NUMBER,
  VODAFONE_CASH_NUMBER,
  paymentWhatsAppUrl,
} from "@/lib/site-config"
import { buildTransferConfirmationMessage } from "@/lib/payments/transfer-message"
import { dictionaries } from "@/lib/i18n/dictionaries"

/**
 * The WhatsApp receipt hand-off (manual InstaPay / Vodafone Cash flow):
 * message is built ONLY from real order facts, the number is the single
 * site-config constant, and the whole thing is a read-only wa.me link —
 * it must never imply payment mutation (settlement is admin-verified).
 */

describe("payment WhatsApp constants", () => {
  it("uses the client-supplied confirmation number as the single source of truth", () => {
    expect(PAYMENT_WHATSAPP_NUMBER).toBe("201027639857")
  })

  it("keeps wa.me's international no-plus format", () => {
    expect(PAYMENT_WHATSAPP_NUMBER).not.toContain("+")
    expect(PAYMENT_WHATSAPP_NUMBER).toMatch(/^\d{11,15}$/)
  })

  it("renders the real rails from site-config (not duplicated literals)", () => {
    expect(INSTAPAY_ALIAS).toBe("ahmedkhaled3bsallam@instapay")
    expect(VODAFONE_CASH_NUMBER).toBe("01091984418")
  })
})

describe("paymentWhatsAppUrl", () => {
  it("targets wa.me/<confirmation-number> with an encoded text param", () => {
    const url = paymentWhatsAppUrl("مرحبا")
    expect(url.startsWith("https://wa.me/201027639857?text=")).toBe(true)
  })

  it("URI-encodes Arabic text so it round-trips exactly", () => {
    const message = "مرحبًا، أود تأكيد تحويل قيمة الطلب."
    const url = paymentWhatsAppUrl(message)
    const encoded = url.split("?text=")[1]
    // raw Arabic must never leak into the URL
    expect(encoded).not.toMatch(/[\u0600-\u06FF]/)
    expect(decodeURIComponent(encoded)).toBe(message)
  })

  it("encodes spaces and newlines (wa.me-safe)", () => {
    const url = paymentWhatsAppUrl("سطر أول\nسطر ثانٍ")
    const encoded = url.split("?text=")[1]
    expect(encoded).not.toMatch(/ |\n/)
    expect(decodeURIComponent(encoded)).toBe("سطر أول\nسطر ثانٍ")
  })

  it("is a pure link builder — same input, same URL, no side effects", () => {
    expect(paymentWhatsAppUrl("x")).toBe(paymentWhatsAppUrl("x"))
  })
})

describe("buildTransferConfirmationMessage (order-confirmation template)", () => {
  const template = dictionaries.ar.checkout.whatsappTransferTemplate
  const templateEn = dictionaries.en.checkout.whatsappTransferTemplate

  it("includes the real order number, payment method and total (ar)", () => {
    const message = buildTransferConfirmationMessage(template, {
      orderNumber: "ORD-4VRJ",
      paymentMethod: "InstaPay / فودافون كاش",
      orderTotal: "5100 ج.م",
    })
    expect(message).toContain("رقم الطلب: #ORD-4VRJ")
    expect(message).toContain("طريقة الدفع: InstaPay / فودافون كاش")
    expect(message).toContain("إجمالي الطلب: 5100 ج.م")
    expect(message).toContain("سأرسل إيصال التحويل هنا")
    // nothing half-rendered
    expect(message).not.toContain("{")
  })

  it("includes the real order facts in English", () => {
    const message = buildTransferConfirmationMessage(templateEn, {
      orderNumber: "ORD-4VRJ",
      paymentMethod: "InstaPay / Vodafone Cash",
      orderTotal: "5100 EGP",
    })
    expect(message).toContain("Order: #ORD-4VRJ")
    expect(message).toContain("Payment method: InstaPay / Vodafone Cash")
    expect(message).toContain("Order total: 5100 EGP")
    expect(message).toContain("I will send the transfer receipt here")
  })

  it("asks for receipt confirmation, never claims auto-verification", () => {
    const message = buildTransferConfirmationMessage(templateEn, {
      orderNumber: "X",
      paymentMethod: "InstaPay",
      orderTotal: "1 EGP",
    })
    expect(message.toLowerCase()).not.toContain("paid")
    expect(message.toLowerCase()).not.toContain("verified")
  })

  it("drops the order-number line when no order exists (checkout stage)", () => {
    const cartTemplate = dictionaries.ar.checkout.whatsappTransferCartTemplate
    const message = buildTransferConfirmationMessage(cartTemplate, {
      paymentMethod: "فودافون كاش",
      orderTotal: "750 ج.م",
    })
    expect(message).not.toContain("رقم الطلب: #")
    expect(message).not.toContain("{")
    expect(message).toContain("طريقة الدفع: فودافون كاش")
    expect(message).toContain("إجمالي الطلب: 750 ج.م")
  })
})

describe("checkout dictionary payment rails (ar/en parity of meaning)", () => {
  it("shows InstaPay and Vodafone Cash as distinct localized methods", () => {
    for (const locale of ["ar", "en"] as const) {
      const checkout = dictionaries[locale].checkout
      expect(checkout.paymentInstapay.length).toBeGreaterThan(0)
      expect(checkout.paymentVodafone.length).toBeGreaterThan(0)
      expect(dictionaries.en.checkout.whatsappReceiptCta).toContain("WhatsApp")
      expect(checkout.whatsappTransferTemplate).toContain("{orderNumber}")
      expect(checkout.whatsappTransferTemplate).toContain("{paymentMethod}")
      expect(checkout.whatsappTransferTemplate).toContain("{orderTotal}")
      expect(checkout.whatsappReceiptCta.length).toBeGreaterThan(0)
      expect(checkout.transferAmountLabel.length).toBeGreaterThan(0)
      expect(checkout.copyAliasLabel.length).toBeGreaterThan(0)
    }
    // per-rail copy feedback is explicit about WHAT was copied
    expect(dictionaries.ar.checkout.copiedVodafoneLabel).toBe("تم نسخ رقم فودافون كاش ✓")
    expect(dictionaries.ar.checkout.copiedInstapayLabel).toBe("تم نسخ عنوان InstaPay ✓")
    expect(dictionaries.en.checkout.copiedVodafoneLabel).toBe("Vodafone Cash number copied ✓")
    expect(dictionaries.en.checkout.copiedInstapayLabel).toBe("InstaPay address copied ✓")
    // sending the receipt never reads as a payment event — admin review is
    expect(dictionaries.ar.checkout.whatsappPendingNote).toContain("بعد مراجعة التحويل")
    expect(dictionaries.en.checkout.whatsappPendingNote).toContain("after we review")
    expect(dictionaries.ar.checkout.whatsappReceiptCta).toContain("واتساب")
    expect(dictionaries.ar.checkout.whatsappReceiptCta).toBe("إرسال إيصال التحويل على واتساب")
    expect(dictionaries.en.checkout.whatsappReceiptCta).toBe("Send Transfer Receipt on WhatsApp")
  })
})
