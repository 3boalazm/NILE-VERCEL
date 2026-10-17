import { afterEach, describe, expect, it } from "vitest"

import { degradeToMock, mockFallbackEnabled } from "./mock-fallback"

function withEnv(value: string | undefined, fn: () => void) {
  const previous = process.env.MOCK_CATALOG_FALLBACK
  if (value === undefined) delete process.env.MOCK_CATALOG_FALLBACK
  else process.env.MOCK_CATALOG_FALLBACK = value
  try {
    fn()
  } finally {
    if (previous === undefined) delete process.env.MOCK_CATALOG_FALLBACK
    else process.env.MOCK_CATALOG_FALLBACK = previous
  }
}

afterEach(() => {
  delete process.env.MOCK_CATALOG_FALLBACK
})

describe("mockFallbackEnabled", () => {
  it("is disabled when unset", () => {
    withEnv(undefined, () => expect(mockFallbackEnabled()).toBe(false))
  })

  it("is disabled for arbitrary values", () => {
    withEnv("0", () => expect(mockFallbackEnabled()).toBe(false))
    withEnv("false", () => expect(mockFallbackEnabled()).toBe(false))
    withEnv("", () => expect(mockFallbackEnabled()).toBe(false))
  })

  it("is enabled only for explicit opt-ins", () => {
    withEnv("1", () => expect(mockFallbackEnabled()).toBe(true))
    withEnv("true", () => expect(mockFallbackEnabled()).toBe(true))
    withEnv("yes", () => expect(mockFallbackEnabled()).toBe(true))
  })
})

describe("degradeToMock", () => {
  it("fails closed by default (no mock data in production)", () => {
    const cause = new Error("db down")
    withEnv(undefined, () => {
      expect(() => degradeToMock("getAllProducts", cause)).toThrow("db down")
    })
  })

  it("re-wraps non-Error failures when failing closed", () => {
    withEnv(undefined, () => {
      expect(() => degradeToMock("getAllProducts", "plain string")).toThrow("plain string")
    })
  })

  it("returns (does not throw) when the fallback is explicitly enabled", () => {
    withEnv("1", () => {
      expect(() => degradeToMock("getAllProducts", new Error("db down"))).not.toThrow()
    })
  })
})
