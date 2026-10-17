import { describe, it, expect } from "vitest"
import { getEmailTransportConfig } from "./transport-config"
const valid = {
  VENDURE_EMAIL_ENABLED: "true",
  SMTP_HOST: "smtp.example.test",
  SMTP_USER: "sender",
  SMTP_PASS: "test-only-not-a-credential",
  SMTP_FROM: "help@example.test",
  STOREFRONT_URL: "https://npf.example.test",
}
describe("SMTP release gate", () => {
  it("does not silently open a dev mailbox in production", () => {
    expect(getEmailTransportConfig({})).toBeNull()
  })
  it("requires complete credentials when enabled", () => {
    expect(() =>
      getEmailTransportConfig({ VENDURE_EMAIL_ENABLED: "true" })
    ).toThrow("SMTP_HOST")
  })
  it("requires HTTPS storefront and TLS transport", () => {
    expect(getEmailTransportConfig(valid)).toMatchObject({
      port: 587,
      secure: false,
      requireTLS: true,
      tls: { rejectUnauthorized: true },
    })
    expect(
      getEmailTransportConfig({ ...valid, SMTP_PORT: "465" })
    ).toMatchObject({ secure: true })
    expect(() =>
      getEmailTransportConfig({
        ...valid,
        STOREFRONT_URL: "http://example.test",
      })
    ).toThrow()
    expect(() =>
      getEmailTransportConfig({ ...valid, SMTP_PORT: "25" })
    ).toThrow()
  })
  it("rejects header injection and credential-bearing links", () => {
    expect(() =>
      getEmailTransportConfig({
        ...valid,
        SMTP_FROM: "a@example.test\r\nBcc:x@example.test",
      })
    ).toThrow()
    expect(() =>
      getEmailTransportConfig({
        ...valid,
        STOREFRONT_URL: "https://user:pass@example.test",
      })
    ).toThrow()
  })
})
