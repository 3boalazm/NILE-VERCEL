import { describe, expect, it, vi } from "vitest"

import { handleUnhandledRejection } from "./instrumentation"

describe("F-72 handleUnhandledRejection", () => {
  it("never throws, whatever the reason is", () => {
    // The handler runs where a throw would become a NEW unhandled rejection
    // (or, pre-F-72, would terminate the process). These are exactly the
    // shapes Payload's init quirk and friends produce.
    const reasons = [undefined, null, "plain string", 42, { code: "x" }, new Error("real"), new Error()]
    for (const reason of reasons) {
      expect(() => handleUnhandledRejection(reason)).not.toThrow()
    }
  })

  it("logs through the structured pipeline with the reason's identity", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    const err = new Error("boom")
    handleUnhandledRejection(err)
    expect(spy).toHaveBeenCalled()
    const line = spy.mock.calls.map((c) => c.join(" ")).join("\n")
    expect(line).toContain("process:unhandledRejection")
    expect(line).toContain("boom")
    spy.mockRestore()
  })

  it("names the undefined-reason quirk explicitly (the Payload-init case)", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    handleUnhandledRejection(undefined)
    const line = spy.mock.calls.map((c) => c.join(" ")).join("\n")
    expect(line).toContain('"reasonType":"undefined"')
    spy.mockRestore()
  })
})
