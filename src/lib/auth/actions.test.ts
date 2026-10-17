import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// requestAccountDeletion persists through Payload; like the contact-action
// tests, stub the transport so these tests cover the action's own logic
// (auth checks, rate limiting, error mapping) and never touch a database.
vi.mock("payload", () => ({ getPayload: vi.fn() }))
vi.mock("@/payload.config", () => ({ default: {} }))

import {
  __getTestCookie,
  __resetTestTransport,
  __setTestCookie,
  __setTestHeader,
} from "../../../test/stubs/next-headers"
import { mockVendureDown, mockVendureFetch, operationNames } from "../../../test/mocks/vendure"
import {
  changePassword,
  confirmEmailAddressChange,
  createAddress,
  deleteAddress,
  login,
  logout,
  register,
  requestAccountDeletion,
  requestPasswordReset,
  resetPassword,
  updateProfile,
  verifyCustomerAccount,
} from "./actions"

const realFetch = global.fetch
let ipCounter = 0

beforeEach(() => {
  vi.stubEnv("TRUSTED_PROXY_HOPS", "1")
  __resetTestTransport()
  // Rate-limit budgets are keyed by IP — isolate every test on its own.
  ipCounter += 1
  __setTestHeader("x-forwarded-for", `10.99.0.${ipCounter}`)
})

afterEach(() => {
  global.fetch = realFetch
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe("login", () => {
  it("returns ok and persists the session token cookie", async () => {
    mockVendureFetch({ Login: () => ({ login: { id: "u1", identifier: "a@x.com" } }) }, { token: "tok1" })
    const result = await login("a@x.com", "secret123")
    expect(result).toEqual({ ok: true })
    expect(__getTestCookie("npf-vendure-token")).toBe("tok1")
  })

  it("passes invalid-credentials through as a code, not ok", async () => {
    mockVendureFetch({
      Login: () => ({ login: { errorCode: "INVALID_CREDENTIALS_ERROR", message: "x" } }),
    })
    expect(await login("a@x.com", "wrong")).toEqual({ ok: false, error: "INVALID_CREDENTIALS_ERROR" })
  })

  it("rate-limits brute force per IP", async () => {
    mockVendureFetch({ Login: () => ({ login: { id: "u1", identifier: "a@x.com" } }) })
    __setTestHeader("x-forwarded-for", "10.10.10.10")
    const results = []
    for (let i = 0; i < 11; i++) results.push(await login("a@x.com", "secret123"))
    expect(results.slice(0, 10).every((r) => r.ok)).toBe(true)
    expect(results[10]).toEqual({ ok: false, error: "rate_limited" })
  })

  it("returns network_error when Vendure is down", async () => {
    mockVendureDown()
    expect(await login("a@x.com", "secret123")).toEqual({ ok: false, error: "network_error" })
  })
})

describe("register", () => {
  it("registers then logs in with the same credentials", async () => {
    const calls = mockVendureFetch({
      RegisterCustomerAccount: () => ({ registerCustomerAccount: { success: true } }),
      Login: () => ({ login: { id: "u1", identifier: "n@x.com" } }),
    })
    const result = await register({ firstName: "N", lastName: "O", email: "n@x.com", password: "secret123" })
    expect(result).toEqual({ ok: true })
    expect(operationNames(calls)).toEqual(["RegisterCustomerAccount", "Login"])
    const input = calls[0].variables.input as Record<string, unknown>
    expect(input.emailAddress).toBe("n@x.com")
    expect(input.phoneNumber).toBeUndefined()
  })

  it("does not attempt login when registration itself fails", async () => {
    const calls = mockVendureFetch({
      RegisterCustomerAccount: () => ({
        registerCustomerAccount: { errorCode: "EMAIL_ADDRESS_CONFLICT_ERROR", message: "x" },
      }),
    })
    const result = await register({ firstName: "N", lastName: "O", email: "n@x.com", password: "secret123" })
    expect(result).toEqual({ ok: false, error: "EMAIL_ADDRESS_CONFLICT_ERROR" })
    expect(calls).toHaveLength(1)
  })

  it("rate-limits account creation per IP", async () => {
    mockVendureFetch({
      RegisterCustomerAccount: () => ({ registerCustomerAccount: { success: true } }),
      Login: () => ({ login: { id: "u1", identifier: "n@x.com" } }),
    })
    __setTestHeader("x-forwarded-for", "10.10.10.11")
    const results = []
    for (let i = 0; i < 6; i++) {
      results.push(await register({ firstName: "N", lastName: "O", email: `n${i}@x.com`, password: "secret123" }))
    }
    expect(results.slice(0, 5).every((r) => r.ok)).toBe(true)
    expect(results[5]).toEqual({ ok: false, error: "rate_limited" })
  })
})

describe("logout", () => {
  it("clears the session cookie even when Vendure is unreachable", async () => {
    __setTestCookie("npf-vendure-token", "tok1")
    mockVendureDown()
    await logout()
    expect(__getTestCookie("npf-vendure-token")).toBeUndefined()
  })
})

describe("updateProfile / addresses", () => {
  it("updateProfile returns ok on success", async () => {
    mockVendureFetch({ UpdateCustomer: () => ({ updateCustomer: { id: "u1" } }) })
    expect(await updateProfile({ firstName: "N", lastName: "O" })).toEqual({ ok: true })
  })

  it("createAddress returns ok on success", async () => {
    mockVendureFetch({ CreateCustomerAddress: () => ({ createCustomerAddress: { id: "a1" } }) })
    const result = await createAddress({ fullName: "N", streetLine1: "S", city: "C", province: "P", phoneNumber: "01012345678" })
    expect(result).toEqual({ ok: true })
  })

  it("createAddress returns network_error when Vendure is down", async () => {
    mockVendureDown()
    const result = await createAddress({ fullName: "N", streetLine1: "S", city: "C", province: "P", phoneNumber: "01012345678" })
    expect(result).toEqual({ ok: false, error: "network_error" })
  })

  it("deleteAddress surfaces success and survives outages", async () => {
    mockVendureFetch({ DeleteCustomerAddress: () => ({ deleteCustomerAddress: { success: true } }) })
    expect(await deleteAddress("a1")).toEqual({ ok: true })
    mockVendureDown()
    expect(await deleteAddress("a1")).toEqual({ ok: false })
  })
})

describe("requestPasswordReset", () => {
  it("returns ok when Vendure accepts the request", async () => {
    const calls = mockVendureFetch({
      RequestPasswordReset: () => ({ requestPasswordReset: { success: true } }),
    })
    expect(await requestPasswordReset("customer@x.com")).toEqual({ ok: true })
    expect(calls[0]?.variables).toEqual({ emailAddress: "customer@x.com" })
  })

  it("returns the SAME ok for an unknown address — no account enumeration", async () => {
    // The security-critical property: Vendure answers InvalidCredentialsError
    // when no verified customer matches. Relaying that to the browser would
    // let anyone discover which emails hold an account, so both outcomes must
    // be indistinguishable from the caller's side.
    mockVendureFetch({
      RequestPasswordReset: () => ({
        requestPasswordReset: { errorCode: "INVALID_CREDENTIALS_ERROR", message: "x" },
      }),
    })
    expect(await requestPasswordReset("nobody@x.com")).toEqual({ ok: true })
  })

  it("normalises the address (trim + lowercase) before sending", async () => {
    const calls = mockVendureFetch({
      RequestPasswordReset: () => ({ requestPasswordReset: { success: true } }),
    })
    await requestPasswordReset("  Customer@X.COM ")
    expect(calls[0]?.variables).toEqual({ emailAddress: "customer@x.com" })
  })

  it("rejects a malformed address without calling Vendure at all", async () => {
    // No handler registered: if fetch were reached the mock would throw
    // "Unhandled Vendure operation", so an empty call log proves short-circuit.
    const calls = mockVendureFetch({})
    expect(await requestPasswordReset("not-an-email")).toEqual({ ok: false, error: "invalid_email" })
    expect(await requestPasswordReset("")).toEqual({ ok: false, error: "invalid_email" })
    expect(calls).toHaveLength(0)
  })

  it("rate-limits reset requests per IP (3 per 15 minutes)", async () => {
    mockVendureFetch({
      RequestPasswordReset: () => ({ requestPasswordReset: { success: true } }),
    })
    __setTestHeader("x-forwarded-for", "10.20.30.40")
    const results = []
    for (let i = 0; i < 4; i++) results.push(await requestPasswordReset("customer@x.com"))
    expect(results.slice(0, 3).every((r) => r.ok)).toBe(true)
    expect(results[3]).toEqual({ ok: false, error: "rate_limited" })
  })

  it("returns network_error when Vendure is down", async () => {
    mockVendureDown()
    expect(await requestPasswordReset("customer@x.com")).toEqual({ ok: false, error: "network_error" })
  })
})

describe("resetPassword", () => {
  it("consumes the token and returns ok", async () => {
    const calls = mockVendureFetch({
      ResetPassword: () => ({ resetPassword: { id: "u1", identifier: "a@x.com" } }),
    })
    expect(await resetPassword("tok", "secret123", "secret123")).toEqual({ ok: true })
    expect(calls[0]?.variables).toEqual({ token: "tok", password: "secret123" })
  })

  it("passes an invalid/expired token code through to the caller", async () => {
    // Unlike the request step, the token holder has already proven mailbox
    // ownership, so the specific reason is safe (and necessary) to show.
    mockVendureFetch({
      ResetPassword: () => ({
        resetPassword: { errorCode: "PASSWORD_RESET_TOKEN_EXPIRED_ERROR", message: "x" },
      }),
    })
    expect(await resetPassword("old", "secret123", "secret123")).toEqual({
      ok: false,
      error: "PASSWORD_RESET_TOKEN_EXPIRED_ERROR",
    })
  })

  it("rejects a mismatched confirmation without calling Vendure", async () => {
    const calls = mockVendureFetch({})
    expect(await resetPassword("tok", "secret123", "different1")).toEqual({
      ok: false,
      error: "password_mismatch",
    })
    expect(calls).toHaveLength(0)
  })

  it("rejects a too-short password without calling Vendure", async () => {
    const calls = mockVendureFetch({})
    expect(await resetPassword("tok", "abc", "abc")).toEqual({ ok: false, error: "password_too_short" })
    expect(calls).toHaveLength(0)
  })

  it("rejects a missing token", async () => {
    expect(await resetPassword("", "secret123", "secret123")).toEqual({
      ok: false,
      error: "invalid_token",
    })
  })

  it("returns network_error when Vendure is down", async () => {
    mockVendureDown()
    expect(await resetPassword("tok", "secret123", "secret123")).toEqual({
      ok: false,
      error: "network_error",
    })
  })
})

describe("email verification (F-52)", () => {
  it("verifies an account token via VerifyCustomerAccount", async () => {
    const calls = mockVendureFetch({
      VerifyCustomerAccount: () => ({ verifyCustomerAccount: { id: "u1", identifier: "a@x.com" } }),
    })
    expect(await verifyCustomerAccount("vtok")).toEqual({ ok: true })
    expect(operationNames(calls)).toEqual(["VerifyCustomerAccount"])
  })

  it("surfaces an invalid verification token as its error code", async () => {
    mockVendureFetch({
      VerifyCustomerAccount: () => ({
        verifyCustomerAccount: { errorCode: "VERIFICATION_TOKEN_INVALID_ERROR", message: "x" },
      }),
    })
    expect(await verifyCustomerAccount("bad")).toEqual({
      ok: false,
      error: "VERIFICATION_TOKEN_INVALID_ERROR",
    })
  })

  it("rejects an empty token without calling Vendure", async () => {
    const calls = mockVendureFetch({})
    expect(await verifyCustomerAccount("")).toEqual({ ok: false, error: "invalid_token" })
    expect(calls).toHaveLength(0)
  })

  it("confirms an address change via UpdateCustomerEmailAddress — NOT VerifyCustomerAccount", async () => {
    // The two token kinds are not interchangeable in Vendure; conflating them
    // would silently break one of the flows.
    const calls = mockVendureFetch({
      UpdateCustomerEmailAddress: () => ({ updateCustomerEmailAddress: { success: true } }),
    })
    expect(await confirmEmailAddressChange("ctok")).toEqual({ ok: true })
    expect(operationNames(calls)).toEqual(["UpdateCustomerEmailAddress"])
  })

  it("returns network_error when Vendure is down", async () => {
    mockVendureDown()
    expect(await verifyCustomerAccount("vtok")).toEqual({ ok: false, error: "network_error" })
    expect(await confirmEmailAddressChange("ctok")).toEqual({ ok: false, error: "network_error" })
  })
})

// ---------------------------------------------------------------------------
// F-63 changePassword / F-58 requestAccountDeletion
// ---------------------------------------------------------------------------
describe("changePassword", () => {
  beforeEach(() => {
    __resetTestTransport()
  })
  afterEach(() => {
    global.fetch = realFetch
  })

  it("rejects a too-short new password without touching Vendure", async () => {
    const calls = mockVendureFetch({})
    const result = await changePassword({ currentPassword: "whatever", newPassword: "123" })
    expect(result).toEqual({ ok: false, error: "validation" })
    expect(calls.length).toBe(0)
  })

  it("maps an in-band InvalidCredentialsError to invalid_credentials", async () => {
    mockVendureFetch({
      UpdateCustomerPassword: () => ({
        updateCustomerPassword: { errorCode: "InvalidCredentialsError", message: "wrong" },
      }),
    })
    __setTestCookie("npf-vendure-token", "tok1")
    const result = await changePassword({ currentPassword: "wrong", newPassword: "longenough" })
    expect(result).toEqual({ ok: false, error: "invalid_credentials" })
  })

  it("returns ok when Vendure reports Success", async () => {
    mockVendureFetch({
      UpdateCustomerPassword: () => ({ updateCustomerPassword: { success: true } }),
    })
    __setTestCookie("npf-vendure-token", "tok1")
    const result = await changePassword({ currentPassword: "right", newPassword: "longenough" })
    expect(result).toEqual({ ok: true })
  })
})

describe("requestAccountDeletion", () => {
  beforeEach(() => {
    __resetTestTransport()
  })
  afterEach(() => {
    global.fetch = realFetch
  })

  it("refuses without the confirmation flag", async () => {
    const result = await requestAccountDeletion({ locale: "ar", confirmed: false })
    expect(result).toEqual({ ok: false, error: "validation" })
  })

  it("refuses without a session", async () => {
    const result = await requestAccountDeletion({ locale: "ar", confirmed: true })
    expect(result).toEqual({ ok: false, error: "not_authenticated" })
  })

  it("records an erasure request against the signed-in customer", async () => {
    mockVendureFetch({
      ActiveCustomer: () => ({
        activeCustomer: {
          id: "c-1",
          firstName: "Test",
          lastName: "Customer",
          emailAddress: "erasure@nilepharmafood.local",
          phoneNumber: null,
          orders: { totalItems: 0, items: [] },
        },
      }),
    })
    __setTestCookie("npf-vendure-token", "tok1")
    const created: { collection?: string; data?: Record<string, unknown> } = {}
    const { getPayload } = await import("payload")
    vi.mocked(getPayload).mockResolvedValue({
      create: vi.fn(async (args: { collection: string; data: Record<string, unknown> }) => {
        created.collection = args.collection
        created.data = args.data
        return { id: "e-1" }
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    const result = await requestAccountDeletion({ locale: "ar", confirmed: true })
    expect(result).toEqual({ ok: true })
    expect(created.collection).toBe("erasure-requests")
    expect(created.data).toMatchObject({
      customerId: "c-1",
      email: "erasure@nilepharmafood.local",
      locale: "ar",
      status: "new",
    })
  })
})
