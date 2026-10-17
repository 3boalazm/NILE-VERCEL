import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import { __resetTestTransport, __setTestHeader } from "../../../test/stubs/next-headers"

// Payload itself is stubbed: these tests cover the action's validation,
// rate limiting, and data mapping — not Payload's own persistence.
vi.mock("payload", () => ({ getPayload: vi.fn() }))
vi.mock("@/payload.config", () => ({ default: {} }))

import { getPayload } from "payload"

import type { submitContactInquiry as SubmitContactInquiry } from "./actions"

const getPayloadMock = vi.mocked(getPayload)
let submitContactInquiry: typeof SubmitContactInquiry
let ipCounter = 100

const validInput = {
  name: "  Ahmed  ",
  email: "ahmed@example.com",
  phone: "01012345678",
  company: "Test Co",
  subject: "Info request",
  message: "Please send details.",
  locale: "ar",
}

beforeAll(async () => {
  ;({ submitContactInquiry } = await import("./actions"))
})

beforeEach(() => {
  vi.stubEnv("TRUSTED_PROXY_HOPS", "1")
  __resetTestTransport()
  ipCounter += 1
  __setTestHeader("x-forwarded-for", `10.99.1.${ipCounter}`)
  getPayloadMock.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe("validation", () => {
  it("rejects blank required fields without touching Payload", async () => {
    const result = await submitContactInquiry({ ...validInput, name: "   " })
    expect(result).toEqual({ ok: false, error: "validation" })
    expect(getPayloadMock).not.toHaveBeenCalled()
  })

  it("rejects malformed emails", async () => {
    expect(await submitContactInquiry({ ...validInput, email: "not-an-email" })).toEqual({
      ok: false,
      error: "validation",
    })
  })

  it("rejects overlong input", async () => {
    const result = await submitContactInquiry({ ...validInput, message: "x".repeat(2001) })
    expect(result).toEqual({ ok: false, error: "validation" })
  })
})

describe("rate limiting", () => {
  it("blocks the 6th submission within the window", async () => {
    getPayloadMock.mockResolvedValue({ create: vi.fn().mockResolvedValue({ id: "1" }) } as never)
    __setTestHeader("x-forwarded-for", "10.10.10.12")
    const results = []
    for (let i = 0; i < 6; i++) results.push(await submitContactInquiry(validInput))
    expect(results.slice(0, 5).every((r) => r.ok)).toBe(true)
    expect(results[5]).toEqual({ ok: false, error: "rate_limited" })
  })
})

describe("persistence mapping", () => {
  it("trims, normalizes locale, and stamps new inquiries", async () => {
    const create = vi.fn().mockResolvedValue({ id: "1" })
    getPayloadMock.mockResolvedValue({ create } as never)
    const result = await submitContactInquiry({ ...validInput, locale: "en" })
    expect(result).toEqual({ ok: true })
    expect(create).toHaveBeenCalledTimes(1)
    expect(create).toHaveBeenCalledWith({
      collection: "inquiries",
      data: {
        name: "Ahmed",
        email: "ahmed@example.com",
        phone: "01012345678",
        company: "Test Co",
        locale: "en",
        subject: "Info request",
        message: "Please send details.",
        status: "new",
      },
      overrideAccess: true,
    })
  })

  it("coerces unknown locales to ar and drops blank optionals", async () => {
    const create = vi.fn().mockResolvedValue({ id: "1" })
    getPayloadMock.mockResolvedValue({ create } as never)
    await submitContactInquiry({ ...validInput, locale: "fr", phone: "", company: "  " })
    const passed = create.mock.calls[0][0] as { data: Record<string, unknown> }
    expect(passed.data.locale).toBe("ar")
    expect(passed.data.phone).toBeUndefined()
    expect(passed.data.company).toBeUndefined()
  })

  it("returns server_error when persistence throws", async () => {
    getPayloadMock.mockRejectedValue(new Error("db down"))
    const result = await submitContactInquiry(validInput)
    expect(result).toEqual({ ok: false, error: "server_error" })
  })
})
