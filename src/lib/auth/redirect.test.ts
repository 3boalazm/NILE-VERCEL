import { describe, expect, it } from "vitest"

import { getSafeLoginRedirect } from "./redirect"

describe("getSafeLoginRedirect", () => {
  it.each([
    "https://evil.example/phishing",
    "//evil.example/phishing",
    "javascript:alert(1)",
    "data:text/html,phishing",
    "/\\\\evil.example/phishing",
    "/ar/%2f%2fevil.example/phishing",
    "/ar/%252f%252fevil.example/phishing",
    "/en/account",
    "not-a-path",
  ])("rejects unsafe or wrong-locale destination %s", (redirect) => {
    expect(getSafeLoginRedirect(redirect, "ar")).toBe("/ar/account")
  })

  it.each([
    "/ar/account",
    "/ar/account/orders",
    "/ar/checkout?step=shipping",
    "/ar/products?q=proxeed%20plus",
  ])("accepts a safe same-locale path %s", (redirect) => {
    expect(getSafeLoginRedirect(redirect, "ar")).toBe(redirect)
  })

  it("falls back when percent encoding is malformed", () => {
    expect(getSafeLoginRedirect("/ar/%E0%A4%A", "ar")).toBe("/ar/account")
  })
})
