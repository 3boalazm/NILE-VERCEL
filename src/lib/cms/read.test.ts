import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/observability/log", () => ({
  logError: vi.fn(),
  logWarn: vi.fn(),
}))

import { logError } from "@/lib/observability/log"
import { readCms, readCmsList } from "./read"

beforeEach(() => {
  vi.mocked(logError).mockClear()
})

describe("readCms", () => {
  it("passes the value through when the read succeeds", async () => {
    const result = await readCms("home:products", async () => ["a", "b"])
    expect(result).toEqual({ status: "ok", value: ["a", "b"] })
    expect(logError).not.toHaveBeenCalled()
  })

  it("turns a failed read into an unavailable result instead of throwing", async () => {
    // The repositories fail closed by design, so the throw is expected here.
    // What must not happen is the throw escaping into a Server Component
    // render, where it would take the whole page down with it.
    const result = await readCms("home:products", async () => {
      throw new Error("database unreachable")
    })
    expect(result.status).toBe("unavailable")
    if (result.status === "unavailable") {
      expect((result.error as Error).message).toBe("database unreachable")
    }
  })

  it("reports the failure with the operation that failed", async () => {
    await readCms("pdp:product", async () => {
      throw new Error("boom")
    })
    expect(logError).toHaveBeenCalledTimes(1)
    expect(logError).toHaveBeenCalledWith(
      "cms:read",
      expect.any(Error),
      expect.objectContaining({ operation: "pdp:product" }),
    )
  })
})

describe("readCmsList", () => {
  it("returns the items when the read succeeds", async () => {
    const result = await readCmsList("blogs:articles", async () => [1, 2])
    expect(result).toEqual({ items: [1, 2], unavailable: false })
  })

  it("returns an empty list and flags the outage when the read fails", async () => {
    const result = await readCmsList("blogs:articles", async () => {
      throw new Error("cms down")
    })
    expect(result).toEqual({ items: [], unavailable: true })
    expect(logError).toHaveBeenCalledTimes(1)
  })
})
