import { afterEach, beforeEach, describe, it, expect, vi } from "vitest"
import {
  __resetTestTransport,
  __setTestHeader,
} from "../../../test/stubs/next-headers"
import { getClientIp, isRateLimited } from "./rate-limit"
beforeEach(() => {
  __resetTestTransport()
  vi.stubEnv("TRUSTED_CLIENT_IP_HEADER", "")
  vi.stubEnv("TRUSTED_PROXY_HOPS", "")
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.useRealTimers()
})
describe("proxy trust boundary", () => {
  it("doesn't trust arbitrary forwarded headers by default", async () => {
    __setTestHeader("x-forwarded-for", "1.2.3.4")
    expect(await getClientIp()).toBe("unknown")
  })
  it("selects from the trusted right side rather than attacker-prepended left side", async () => {
    vi.stubEnv("TRUSTED_PROXY_HOPS", "1")
    __setTestHeader("x-forwarded-for", "1.2.3.4, 10.1.2.3")
    expect(await getClientIp()).toBe("10.1.2.3")
  })
  it("validates explicitly configured overwrite headers", async () => {
    vi.stubEnv("TRUSTED_CLIENT_IP_HEADER", "x-real-ip")
    __setTestHeader("x-real-ip", "invalid")
    expect(await getClientIp()).toBe("unknown")
    __setTestHeader("x-real-ip", "2001:db8::1")
    expect(await getClientIp()).toBe("2001:db8::1")
  })
  it("rejects invalid budgets instead of growing unsafe counters", () => {
    expect(isRateLimited("x", Infinity, 10)).toBe(true)
    expect(isRateLimited("x", 1000, 1000000)).toBe(true)
    expect(isRateLimited("x".repeat(1000), 1000, 10)).toBe(true)
  })
  it("bounds distinct keys without evicting existing counters and reclaims expired entries", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-10-15T10:00:00Z"))
    for (let n = 0; n < 10000; n++)
      expect(isRateLimited(`bound-${n}`, 1000, 1)).toBe(false)
    expect(isRateLimited("new-key", 1000, 1)).toBe(true)
    expect(isRateLimited("bound-0", 1000, 1)).toBe(true)
    vi.advanceTimersByTime(1001)
    expect(isRateLimited("new-key", 1000, 1)).toBe(false)
  })
})
