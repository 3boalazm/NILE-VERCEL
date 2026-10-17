/**
 * F-11 — environment validation tests.
 *
 * The point of these is the *failure* shape: a fresh clone must be told every
 * problem at once, in words that name the variable and the fix, instead of
 * throwing on the first one and then again after each restart (the behaviour
 * that made the build "succeed only with workarounds").
 */
import { describe, expect, it, vi, afterEach } from "vitest"

import {
  isBuildPhase,
  parseEnvForBuild,
  parseEnvOrThrow,
  payloadEnvSchema,
  payloadEnvWarnings,
  vendureEnvSchema,
  vendureEnvWarnings,
  warnEnvIssues,
} from "./env"

const SECRET = "s".repeat(40)

const goodPayload = {
  PAYLOAD_SECRET: SECRET,
  DATABASE_URI: "postgres://npf:npf@localhost:5432/npf",
}

const goodVendure = {
  DB_HOST: "localhost",
  DB_PORT: "5432",
  DB_NAME: "npf",
  DB_USERNAME: "npf",
  DB_PASSWORD: "npf",
  DB_SCHEMA: "public",
  COOKIE_SECRET: SECRET,
  SUPERADMIN_USERNAME: "superadmin",
  SUPERADMIN_PASSWORD: "Str0ng!Pass",
  STOREFRONT_URL: "https://nilepharmafood.com",
  SMTP_HOST: "smtp.example.com",
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("payloadEnvSchema", () => {
  it("parses a minimal valid environment and fills documented defaults", () => {
    const env = parseEnvOrThrow(payloadEnvSchema, "payload", goodPayload)
    expect(env.PAYLOAD_SECRET).toBe(SECRET)
    // F-71: the pool size is now an explicit, bounded number rather than
    // whatever pg happens to default to.
    expect(env.DATABASE_POOL_MAX).toBe(10)
    expect(env.SMTP_PORT).toBe(587)
    expect(env.SMTP_SECURE).toBe(false)
  })

  it("accepts the textual booleans deployments actually use", () => {
    expect(parseEnvOrThrow(payloadEnvSchema, "payload", { ...goodPayload, SMTP_SECURE: "true" }).SMTP_SECURE).toBe(true)
    expect(parseEnvOrThrow(payloadEnvSchema, "payload", { ...goodPayload, SMTP_SECURE: "1" }).SMTP_SECURE).toBe(true)
    expect(parseEnvOrThrow(payloadEnvSchema, "payload", { ...goodPayload, SMTP_SECURE: "" }).SMTP_SECURE).toBe(false)
    expect(parseEnvOrThrow(payloadEnvSchema, "payload", { ...goodPayload, SMTP_SECURE: "yes" }).SMTP_SECURE).toBe(true)
  })

  it("rejects a non-postgres connection string with an actionable message", () => {
    expect(() =>
      parseEnvOrThrow(payloadEnvSchema, "payload", { ...goodPayload, DATABASE_URI: "mysql://npf@localhost/npf" })
    ).toThrowError(/DATABASE_URI must be a postgres/)
  })

  it("rejects a short PAYLOAD_SECRET (it signs JWTs and encrypts fields)", () => {
    expect(() => parseEnvOrThrow(payloadEnvSchema, "payload", { ...goodPayload, PAYLOAD_SECRET: "short" })).toThrowError(
      /PAYLOAD_SECRET must be at least 32 characters/
    )
  })

  it("reports EVERY problem at once and points at .env.example", () => {
    let message = ""
    try {
      parseEnvOrThrow(payloadEnvSchema, "payload", { PAYLOAD_SECRET: "short", DATABASE_URI: "nope" })
    } catch (error) {
      message = error instanceof Error ? error.message : String(error)
    }
    expect(message).toContain("[payload] environment validation failed")
    expect(message).toMatch(/PAYLOAD_SECRET/)
    expect(message).toMatch(/DATABASE_URI/)
    expect(message).toContain(".env.example")
  })

  it("turns a non-numeric pool size into an error, not NaN", () => {
    expect(() =>
      parseEnvOrThrow(payloadEnvSchema, "payload", { ...goodPayload, DATABASE_POOL_MAX: "lots" })
    ).toThrowError(/DATABASE_POOL_MAX must be a number/)
    // A fractional pool size is a different mistake with its own message —
    // per-check messages are the point (see intVar's comment in env.ts).
    expect(() =>
      parseEnvOrThrow(payloadEnvSchema, "payload", { ...goodPayload, DATABASE_POOL_MAX: "2.5" })
    ).toThrowError(/DATABASE_POOL_MAX must be a whole number/)
  })

  it("bounds the pool size so a typo cannot exhaust Postgres", () => {
    expect(() => parseEnvOrThrow(payloadEnvSchema, "payload", { ...goodPayload, DATABASE_POOL_MAX: "9999" })).toThrowError(
      /DATABASE_POOL_MAX must be at most 200/
    )
  })
})

describe("vendureEnvSchema", () => {
  it("parses a full environment, coercing the numeric vars", () => {
    const env = parseEnvOrThrow(vendureEnvSchema, "vendure", goodVendure)
    expect(env.DB_PORT).toBe(5432)
    expect(env.PORT).toBe(3000)
    expect(env.VENDURE_SERVER_PORT).toBe(3001)
    expect(env.DATABASE_POOL_MAX).toBe(10)
  })

  it("keeps the NaN-port class of bug out: DB_PORT must be numeric and in range", () => {
    // `+process.env.DB_PORT` used to hand the pg driver NaN; an empty string
    // coerces to 0, which now fails the range check with a readable message.
    expect(() => parseEnvOrThrow(vendureEnvSchema, "vendure", { ...goodVendure, DB_PORT: "" })).toThrowError(
      /DB_PORT must be at least 1/
    )
    expect(() => parseEnvOrThrow(vendureEnvSchema, "vendure", { ...goodVendure, DB_PORT: "not-a-port" })).toThrowError(
      /DB_PORT must be a number/
    )
    expect(() => parseEnvOrThrow(vendureEnvSchema, "vendure", { ...goodVendure, DB_PORT: "99999" })).toThrowError(
      /DB_PORT must be at most 65535/
    )
  })

  it("defaults DB_PORT/DB_SCHEMA when unset instead of producing undefined", () => {
    const withoutPortAndSchema: Record<string, string> = { ...goodVendure }
    delete withoutPortAndSchema.DB_PORT
    delete withoutPortAndSchema.DB_SCHEMA
    const env = parseEnvOrThrow(vendureEnvSchema, "vendure", withoutPortAndSchema)
    expect(env.DB_PORT).toBe(5432)
    expect(env.DB_SCHEMA).toBe("public")
  })

  it("rejects an unknown APP_ENV rather than silently disabling dev mode", () => {
    expect(() => parseEnvOrThrow(vendureEnvSchema, "vendure", { ...goodVendure, APP_ENV: "prod" })).toThrowError(
      /APP_ENV/
    )
    expect(parseEnvOrThrow(vendureEnvSchema, "vendure", { ...goodVendure, APP_ENV: "dev" }).APP_ENV).toBe("dev")
  })

  it("enforces super-admin password strength outside dev (F-57)", () => {
    // APP_ENV unset or "dev" keeps the DX-friendly fixture (11 chars).
    expect(parseEnvOrThrow(vendureEnvSchema, "vendure", goodVendure).SUPERADMIN_PASSWORD).toBe("Str0ng!Pass")
    expect(
      parseEnvOrThrow(vendureEnvSchema, "vendure", { ...goodVendure, APP_ENV: "dev" }).SUPERADMIN_PASSWORD
    ).toBe("Str0ng!Pass")

    // Anything else ("production", "staging", ...) is a real deployment: the
    // credential that unlocks the whole shop must clear the strength bar.
    const weak = [
      "Str0ng!Pass", // 11 chars — under the 12 minimum
      "alllowercase1!", // no uppercase
      "ALLUPPERCASE1!", // no lowercase
      "NoDigitsHere!!", // no digit
      "N0SymbolHere123", // no symbol
    ]
    for (const pw of weak) {
      expect(() =>
        parseEnvOrThrow(vendureEnvSchema, "vendure", { ...goodVendure, APP_ENV: "production", SUPERADMIN_PASSWORD: pw })
      ).toThrowError(/SUPERADMIN_PASSWORD must be 12\+ characters/)
    }

    expect(
      parseEnvOrThrow(vendureEnvSchema, "vendure", {
        ...goodVendure,
        APP_ENV: "production",
        SUPERADMIN_PASSWORD: "Str0ng!Passw0rd",
      }).SUPERADMIN_PASSWORD
    ).toBe("Str0ng!Passw0rd")
  })
})

describe("the build phase is not a request", () => {
  it("recognises the build phase and leaves every other phase alone", () => {
    const previous = process.env.NEXT_PHASE
    try {
      process.env.NEXT_PHASE = "phase-production-build"
      expect(isBuildPhase()).toBe(true)
      process.env.NEXT_PHASE = "phase-development-server"
      expect(isBuildPhase()).toBe(false)
      delete process.env.NEXT_PHASE
      expect(isBuildPhase()).toBe(false)
    } finally {
      if (previous === undefined) delete process.env.NEXT_PHASE
      else process.env.NEXT_PHASE = previous
    }
  })

  it("compiles without secrets instead of refusing to build", () => {
    // A build machine (CI runner, Vercel build container) frequently has no
    // production secrets yet. The app still has to compile there — the
    // validation that must not be skipped is the one a *request* runs.
    const env = parseEnvForBuild(payloadEnvSchema, "payload", {})
    expect(env.PAYLOAD_SECRET.length).toBeGreaterThanOrEqual(32)
    expect(env.DATABASE_URI).toMatch(/^postgres(ql)?:\/\//)
  })

  it("keeps the real values when the environment has them", () => {
    const env = parseEnvForBuild(payloadEnvSchema, "payload", goodPayload)
    expect(env.PAYLOAD_SECRET).toBe(SECRET)
    expect(env.DATABASE_URI).toBe(goodPayload.DATABASE_URI)
  })

  it("still rejects a value that is present but wrong", () => {
    // A placeholder covers a *missing* variable. It must never paper over a
    // typo — a mysql:// URI in DATABASE_URI is a real mistake, and hiding it
    // behind a placeholder would move the failure to a deploy nobody can see.
    expect(() =>
      parseEnvForBuild(payloadEnvSchema, "payload", { ...goodPayload, DATABASE_URI: "mysql://npf@localhost/npf" })
    ).toThrowError(/DATABASE_URI must be a postgres/)
    expect(() => parseEnvForBuild(payloadEnvSchema, "payload", { ...goodPayload, PAYLOAD_SECRET: "" })).toThrowError(
      /PAYLOAD_SECRET must be at least 32 characters/
    )
  })

  it("says out loud which values it had to stand in for", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {})
    parseEnvForBuild(payloadEnvSchema, "payload", {})
    const message = spy.mock.calls.map((call) => String(call[0])).join("|")
    expect(message).toMatch(/PAYLOAD_SECRET/)
    expect(message).toMatch(/DATABASE_URI/)
  })
})

describe("warnings for optional-but-consequential gaps", () => {
  it("refuses to boot without super-admin credentials (Vendure would default to superadmin/superadmin)", () => {
    // Not a warning: `superadminCredentials` is optional in Vendure's type but
    // defaults to a published credential pair at runtime, so "unset" must be a
    // hard failure. This is also the check that would have caught the
    // SUPERADMIN_USER/SUPERADMIN_PASS naming mismatch in .env.example.
    expect(() =>
      parseEnvOrThrow(vendureEnvSchema, "vendure", {
        ...goodVendure,
        SUPERADMIN_USERNAME: undefined,
        SUPERADMIN_PASSWORD: undefined,
      })
    ).toThrowError(/SUPERADMIN_USERNAME is required/)
    expect(() =>
      parseEnvOrThrow(vendureEnvSchema, "vendure", { ...goodVendure, SUPERADMIN_PASSWORD: "short" })
    ).toThrowError(/SUPERADMIN_PASSWORD must be at least 8 characters/)
  })

  it("warns about devMode mail when SMTP_HOST is missing, and not when it is set", () => {
    const without = parseEnvOrThrow(vendureEnvSchema, "vendure", { ...goodVendure, SMTP_HOST: undefined })
    expect(vendureEnvWarnings(without).map((w) => w.name)).toContain("SMTP_HOST")

    const withSmtp = parseEnvOrThrow(vendureEnvSchema, "vendure", goodVendure)
    expect(vendureEnvWarnings(withSmtp).map((w) => w.name)).not.toContain("SMTP_HOST")
    expect(vendureEnvWarnings(withSmtp)).toHaveLength(0)
  })

  it("warns on the Payload side about unsent CMS mail", () => {
    const env = parseEnvOrThrow(payloadEnvSchema, "payload", goodPayload)
    expect(payloadEnvWarnings(env).map((w) => w.name)).toEqual(expect.arrayContaining(["SMTP_HOST", "STOREFRONT_URL"]))
  })

  it("prints each warning only once per process", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {})
    const env = parseEnvOrThrow(payloadEnvSchema, "payload", goodPayload)
    warnEnvIssues("payload-dedupe", payloadEnvWarnings(env))
    warnEnvIssues("payload-dedupe", payloadEnvWarnings(env))
    expect(spy).toHaveBeenCalledTimes(2) // two distinct issues, once each
    expect(spy.mock.calls.map((c) => String(c[0])).join("|")).toMatch(/SMTP_HOST/)
  })
})
