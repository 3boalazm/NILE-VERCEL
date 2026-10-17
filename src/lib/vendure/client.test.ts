import { afterEach, describe, expect, it, vi } from "vitest"

import { VENDURE_REQUEST_TIMEOUT_MS, vendureRequest } from "./client"

const realFetch = global.fetch

afterEach(() => {
  global.fetch = realFetch
  vi.useRealTimers()
})

describe("vendureRequest", () => {
  it("aborts a hung request and reports an explicit timeout", async () => {
    vi.useFakeTimers()
    global.fetch = vi.fn((_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")))
      })
    ) as typeof fetch

    const request = vendureRequest<{ ok: boolean }>("query Test { ok }", {}, undefined)
    const rejection = expect(request).rejects.toMatchObject({
      code: "timeout",
      name: "VendureRequestError",
    })
    await vi.advanceTimersByTimeAsync(VENDURE_REQUEST_TIMEOUT_MS)

    await rejection
  })
})
