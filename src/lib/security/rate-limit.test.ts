import { describe, expect, it } from "vitest"

import { isRateLimited } from "./rate-limit"

describe("isRateLimited", () => {
  it("allows hits up to the budget, then blocks", () => {
    const key = `test-basic-${Date.now()}`
    expect(isRateLimited(key, 60_000, 3)).toBe(false)
    expect(isRateLimited(key, 60_000, 3)).toBe(false)
    expect(isRateLimited(key, 60_000, 3)).toBe(false)
    expect(isRateLimited(key, 60_000, 3)).toBe(true)
    expect(isRateLimited(key, 60_000, 3)).toBe(true)
  })

  it("tracks keys independently", () => {
    const stamp = Date.now()
    expect(isRateLimited(`test-a-${stamp}`, 60_000, 1)).toBe(false)
    expect(isRateLimited(`test-a-${stamp}`, 60_000, 1)).toBe(true)
    // A different key is unaffected by the first key's exhaustion.
    expect(isRateLimited(`test-b-${stamp}`, 60_000, 1)).toBe(false)
  })

  it("resets once the window slides past", async () => {
    const key = `test-window-${Date.now()}`
    expect(isRateLimited(key, 30, 1)).toBe(false)
    expect(isRateLimited(key, 30, 1)).toBe(true)
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(isRateLimited(key, 30, 1)).toBe(false)
  })
})
