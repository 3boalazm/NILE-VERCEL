/**
 * F-65 — error pipeline tests.
 *
 * The three guarantees that matter are tested directly: the Sentry envelope
 * shape (that IS the integration — there is no SDK to lean on), the flood
 * guard, and "never throws", including when the transport itself fails.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  buildSentryEnvelope,
  parseSentryDsn,
  reportError,
  resetErrorRateLimit,
  takeRateLimitSlot,
} from "./report-error"

const DSN = "https://abc123@o456.ingest.sentry.io/789"

const envSnapshot = { ...process.env }

beforeEach(() => {
  resetErrorRateLimit()
  delete process.env.SENTRY_DSN
  delete process.env.NEXT_PUBLIC_SENTRY_DSN
  delete process.env.NPF_ERROR_ENDPOINT
  delete process.env.NEXT_PUBLIC_ERROR_ENDPOINT
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(console, "warn").mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  process.env = { ...envSnapshot }
})

describe("parseSentryDsn", () => {
  it("extracts the ingest envelope URL and public key", () => {
    expect(parseSentryDsn(DSN)).toEqual({
      envelopeUrl: "https://o456.ingest.sentry.io/api/789/envelope/",
      publicKey: "abc123",
      projectId: "789",
    })
  })

  it("rejects things that are not DSNs instead of posting to a garbage URL", () => {
    expect(parseSentryDsn("")).toBeNull()
    expect(parseSentryDsn("abc123@o456.ingest.sentry.io/789")).toBeNull()
    expect(parseSentryDsn("https://o456.ingest.sentry.io/789")).toBeNull() // no key
    expect(parseSentryDsn("not a url")).toBeNull()
  })
})

describe("buildSentryEnvelope", () => {
  const error = { name: "TypeError", message: "cannot read x", stack: "TypeError: cannot read x\n    at foo (/app/x.js:12:5)\n    at bar (/app/y.js:3:1)" }

  it("emits exactly three newline-separated JSON lines (header, item header, item)", () => {
    const lines = buildSentryEnvelope({ dsn: DSN, error, context: { scope: "error-boundary", path: "/ar/cart" } }).split("\n")
    expect(lines).toHaveLength(3)
    for (const line of lines) expect(() => JSON.parse(line)).not.toThrow()
  })

  it("carries a 32-hex event id shared by the header and the item", () => {
    const lines = buildSentryEnvelope({ dsn: DSN, error, context: { scope: "client" } }).split("\n")
    const header = JSON.parse(lines[0])
    const item = JSON.parse(lines[2])
    expect(header.event_id).toMatch(/^[0-9a-f]{32}$/)
    expect(item.event_id).toBe(header.event_id)
    expect(header.dsn).toBe(DSN)
    expect(lines[1]).toBe(JSON.stringify({ type: "event" }))
  })

  it("maps the error, tags and stack frames into the event payload", () => {
    const item = JSON.parse(
      buildSentryEnvelope({
        dsn: DSN,
        error: { ...error, digest: "2486947167" },
        context: { scope: "error-boundary", path: "/ar/cart", action: "placeOrder", extra: { step: "shipping" } },
        environment: "staging",
      }).split("\n")[2]
    )
    expect(item.platform).toBe("javascript")
    expect(item.level).toBe("error")
    expect(item.environment).toBe("staging")
    expect(item.transaction).toBe("/ar/cart")
    expect(item.exception.values[0]).toMatchObject({ type: "TypeError", value: "cannot read x" })
    // Sentry wants frames bottom-up: the outermost caller last becomes first.
    expect(item.exception.values[0].stacktrace.frames[0].function).toBe("bar")
    expect(item.exception.values[0].stacktrace.frames[0].lineno).toBe(3)
    expect(item.tags).toEqual({ scope: "error-boundary", action: "placeOrder", next_digest: "2486947167" })
    expect(item.extra).toEqual({ step: "shipping" })
  })
})

describe("takeRateLimitSlot (flood guard)", () => {
  it("allows 20 per minute and drops the rest", () => {
    const t0 = 1_000_000
    for (let i = 0; i < 20; i++) expect(takeRateLimitSlot(t0 + i)).toBe(true)
    expect(takeRateLimitSlot(t0 + 21)).toBe(false)
    expect(takeRateLimitSlot(t0 + 22)).toBe(false)
  })

  it("reopens the window after a minute and reports what it suppressed", () => {
    const t0 = 1_000_000
    for (let i = 0; i < 20; i++) takeRateLimitSlot(t0 + i)
    takeRateLimitSlot(t0 + 21) // dropped
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    expect(takeRateLimitSlot(t0 + 60_001)).toBe(true)
    expect(warn.mock.calls.map((c) => String(c[0])).join("|")).toMatch(/dropped 1 error report/)
  })
})

describe("reportError", () => {
  it("logs one consistent JSON record when no transport is configured", () => {
    reportError(new Error("boom"), { scope: "server-action", action: "resetPassword", path: "/ar/reset-password" })
    const output = (console.error as unknown as { mock: { calls: unknown[][] } }).mock.calls.map((c) => String(c[0])).join("\n")
    const record = JSON.parse(output)
    expect(record).toMatchObject({ level: "error", scope: "server-action", action: "resetPassword", path: "/ar/reset-password" })
    expect(record.error).toEqual({ name: "Error", message: "boom" })
  })

  it("posts a Sentry envelope when SENTRY_DSN is set", async () => {
    process.env.SENTRY_DSN = DSN
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal("fetch", fetchMock)

    reportError(new Error("render crash"), { scope: "error-boundary", path: "/ar" })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain("https://o456.ingest.sentry.io/api/789/envelope/")
    expect(url).toContain("sentry_key=abc123")
    expect(JSON.stringify(init.headers)).toContain("application/x-sentry-envelope")
    expect(String(init.body).split("\n")).toHaveLength(3)
  })

  it("warns and still logs when the DSN is malformed rather than posting nowhere", () => {
    process.env.SENTRY_DSN = "garbage"
    reportError(new Error("x"), { scope: "client" })
    const warns = (console.warn as unknown as { mock: { calls: unknown[][] } }).mock.calls.map((c) => String(c[0])).join("|")
    expect(warns).toMatch(/not a valid DSN/)
    expect(console.error).toHaveBeenCalled()
  })

  it("posts the normalized record to NPF_ERROR_ENDPOINT when set", () => {
    process.env.NPF_ERROR_ENDPOINT = "https://logs.internal/npf"
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal("fetch", fetchMock)

    reportError(new Error("db down"), { scope: "route-handler", path: "/api/contact" })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe("https://logs.internal/npf")
    expect(JSON.parse(String(init.body))).toMatchObject({ scope: "route-handler", error: { message: "db down" } })
  })

  it("never throws — whatever is handed to it", () => {
    const circular: Record<string, unknown> = { name: "loop" }
    circular.self = circular
    expect(() => reportError(undefined)).not.toThrow()
    expect(() => reportError(null)).not.toThrow()
    expect(() => reportError("a string")).not.toThrow()
    expect(() => reportError(42)).not.toThrow()
    expect(() => reportError({ no: "message" })).not.toThrow()
    expect(() => reportError(circular)).not.toThrow()
    expect(() => reportError(new Error("with digest"), { extra: { circular } })).not.toThrow()
  })

  it("never throws when the transport itself fails", () => {
    process.env.SENTRY_DSN = DSN
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")))
    expect(() => reportError(new Error("x"), { scope: "client" })).not.toThrow()

    vi.stubGlobal("fetch", () => {
      throw new Error("sync throw")
    })
    expect(() => reportError(new Error("y"), { scope: "client" })).not.toThrow()
  })

  it("suppresses beyond the rate limit but leaves a local trace", () => {
    for (let i = 0; i < 20; i++) reportError(new Error(`e${i}`), { scope: "client" })
    ;(console.error as unknown as { mock: { calls: unknown[][] } }).mock.calls.length = 0
    reportError(new Error("one too many"), { scope: "client" })
    expect(console.error).not.toHaveBeenCalled()
    const warns = (console.warn as unknown as { mock: { calls: unknown[][] } }).mock.calls.map((c) => String(c[0])).join("|")
    expect(warns).toMatch(/suppressed \(rate limit\)/)
  })

  it("keeps Next's digest so a browser report can be tied to the server log", () => {
    const error = Object.assign(new Error("render crash"), { digest: "2486947167" })
    reportError(error, { scope: "error-boundary" })
    const output = (console.error as unknown as { mock: { calls: unknown[][] } }).mock.calls.map((c) => String(c[0])).join("\n")
    expect(JSON.parse(output).digest).toBe("2486947167")
  })
})
