import { afterEach, beforeEach, describe, it, expect, vi } from "vitest"
import {
  __resetTestTransport,
  __setTestHeader,
} from "../../../test/stubs/next-headers"
import { mockVendureFetch, mockVendureDown } from "../../../test/mocks/vendure"
import { requestPasswordReset, resetPassword } from "./password-reset"
const realFetch = global.fetch
let ip = 0
beforeEach(() => {
  __resetTestTransport()
  vi.stubEnv("PASSWORD_RESET_ENABLED", "true")
  vi.stubEnv("NPF_PREVIEW_MODE", "0")
  vi.stubEnv("TRUSTED_PROXY_HOPS", "1")
  __setTestHeader("x-forwarded-for", `10.77.1.${++ip}`)
})
afterEach(() => {
  global.fetch = realFetch
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})
describe("account recovery", () => {
  it("fails visibly unavailable unless delivery is explicitly enabled", async () => {
    vi.stubEnv("PASSWORD_RESET_ENABLED", "false")
    mockVendureDown()
    expect(await requestPasswordReset("a@example.com")).toEqual({
      ok: false,
      error: "unavailable",
    })
    expect(global.fetch).not.toHaveBeenCalled()
  })
  it("disables recovery mutations in design preview", async () => {
    vi.stubEnv("NPF_PREVIEW_MODE", "1")
    expect(await resetPassword("a".repeat(32), "secret123")).toEqual({
      ok: false,
      error: "unavailable",
    })
  })
  it("returns the same request acknowledgement for known/unknown accounts", async () => {
    mockVendureFetch({
      ResetRequest: () => ({ requestPasswordReset: { success: true } }),
    })
    expect(await requestPasswordReset("a@example.com")).toEqual({ ok: true })
    mockVendureFetch({
      ResetRequest: () => ({
        requestPasswordReset: { errorCode: "UNKNOWN_USER" },
      }),
    })
    expect(await requestPasswordReset("nobody@example.com")).toEqual({
      ok: true,
    })
  })
  it("handles transport failures and invalid tokens without success claims", async () => {
    mockVendureDown()
    expect(await requestPasswordReset("a@example.com")).toEqual({
      ok: false,
      error: "network",
    })
    mockVendureFetch({
      ResetConfirm: () => ({
        resetPassword: { errorCode: "PASSWORD_RESET_TOKEN_EXPIRED_ERROR" },
      }),
    })
    expect(await resetPassword("a".repeat(32), "secret123")).toEqual({
      ok: false,
      error: "invalid_token",
    })
  })
  it("confirms reset and rejects malformed values before transport", async () => {
    mockVendureFetch({ ResetConfirm: () => ({ resetPassword: { id: "u1" } }) })
    expect(await resetPassword("a".repeat(32), "secret123")).toEqual({
      ok: true,
    })
    expect(await resetPassword("<bad>", "short")).toEqual({
      ok: false,
      error: "validation",
    })
  })
  it("throttles repeated reset requests", async () => {
    mockVendureFetch({
      ResetRequest: () => ({ requestPasswordReset: { success: true } }),
    })
    for (let n = 0; n < 5; n++)
      expect((await requestPasswordReset("a@example.com")).ok).toBe(true)
    expect(await requestPasswordReset("a@example.com")).toEqual({
      ok: false,
      error: "rate_limited",
    })
  })
})
