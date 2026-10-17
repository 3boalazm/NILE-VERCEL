import { describe, it, expect } from "vitest"

import {
  buildHealthReport,
  classifyHost,
  safeErrorCode,
  type Reachability,
} from "./health"

const GOOD_SECRET = "x".repeat(32)

function env(overrides: Record<string, string | undefined> = {}) {
  return {
    NODE_ENV: "production",
    PAYLOAD_SECRET: GOOD_SECRET,
    DATABASE_URI: "postgresql://user:pass@db.example.com:5432/npf",
    ...overrides,
  }
}

const reachable: Reachability = "ok"

describe("classifyHost", () => {
  it("separates localhost from a private range from a public host", () => {
    expect(classifyHost("localhost")).toBe("localhost")
    expect(classifyHost("127.0.0.1")).toBe("localhost")
    expect(classifyHost("10.1.2.3")).toBe("private")
    expect(classifyHost("192.168.0.5")).toBe("private")
    expect(classifyHost("172.16.4.1")).toBe("private")
    expect(classifyHost("db.internal")).toBe("private")
    expect(classifyHost("db.example.com")).toBe("public")
    expect(classifyHost("")).toBe("unknown")
  })
})

describe("safeErrorCode", () => {
  it("keeps the code and drops everything else", () => {
    expect(safeErrorCode({ code: "ECONNREFUSED" })).toBe("ECONNREFUSED")
    expect(safeErrorCode(new TypeError("failed"))).toBe("TypeError")
    // A message that could carry a host or a password never survives.
    expect(safeErrorCode(new Error("connect ECONNREFUSED 10.0.0.5:5432"))).toBe("Error")
    expect(safeErrorCode(null)).toBe("unknown")
  })
})

describe("buildHealthReport", () => {
  it("is ok when the environment is complete and the database answers", async () => {
    const report = await buildHealthReport({
      env: env(),
      readCatalogCount: async () => 8,
      probe: async () => reachable,
    })
    expect(report.status).toBe("ok")
    expect(report.problems).toEqual([])
    expect(report.catalog).toEqual({ ok: true, products: 8, error: null })
    expect(report.cms.databaseHostKind).toBe("public")
  })

  it("names the missing variable instead of failing silently", async () => {
    const report = await buildHealthReport({
      env: env({ PAYLOAD_SECRET: undefined, DATABASE_URI: undefined }),
      readCatalogCount: async () => 0,
      probe: async () => reachable,
    })
    expect(report.status).toBe("degraded")
    expect(report.problems).toContain("PAYLOAD_SECRET is not set")
    expect(report.problems).toContain("DATABASE_URI is not set")
    expect(report.cms.secretConfigured).toBe(false)
    expect(report.cms.databaseConfigured).toBe(false)
  })

  it("rejects a secret shorter than the schema's floor", async () => {
    const report = await buildHealthReport({
      env: env({ PAYLOAD_SECRET: "too-short" }),
      readCatalogCount: async () => 0,
      probe: async () => reachable,
    })
    expect(report.problems.join(" ")).toContain("32 characters")
    expect(report.cms.secretValid).toBe(false)
  })

  it("flags a localhost database only for a deployed function", async () => {
    const deployed = await buildHealthReport({
      env: env({ DATABASE_URI: "postgresql://u:p@localhost:5432/npf" }),
      readCatalogCount: async () => 3,
      probe: async () => reachable,
    })
    expect(deployed.problems.join(" ")).toContain("localhost")
    expect(deployed.cms.databaseHostKind).toBe("localhost")

    const local = await buildHealthReport({
      env: env({
        NODE_ENV: "development",
        DATABASE_URI: "postgresql://u:p@localhost:5432/npf",
      }),
      readCatalogCount: async () => 3,
      probe: async () => reachable,
    })
    expect(local.problems.join(" ")).not.toContain("localhost")
  })

  it("reports an unreachable database and an unreadable catalog", async () => {
    const report = await buildHealthReport({
      env: env(),
      readCatalogCount: async () => {
        throw Object.assign(new Error("connect ECONNREFUSED 10.0.0.5:5432"), {
          code: "ECONNREFUSED",
        })
      },
      probe: async () => "unreachable",
    })
    expect(report.status).toBe("degraded")
    expect(report.cms.databaseReachable).toBe("unreachable")
    expect(report.catalog.ok).toBe(false)
    // The error is reduced to its code: no host, no port, no message.
    expect(report.catalog.error).toBe("ECONNREFUSED")
    expect(JSON.stringify(report)).not.toContain("10.0.0.5")
  })

  it("distinguishes an unseeded database from a broken one", async () => {
    const report = await buildHealthReport({
      env: env(),
      readCatalogCount: async () => 0,
      probe: async () => reachable,
    })
    expect(report.problems.join(" ")).toContain("seed")
    expect(report.catalog.products).toBe(0)
  })

  it("keeps a missing Vendure API a note, not a problem", async () => {
    const report = await buildHealthReport({
      env: env(),
      readCatalogCount: async () => 8,
      probe: async () => reachable,
    })
    expect(report.status).toBe("ok")
    expect(report.notes.join(" ")).toContain("VENDURE_SHOP_API_URL")
    expect(report.problems).toEqual([])
  })

  it("never echoes a secret, a host or a port", async () => {
    const report = await buildHealthReport({
      env: env({ DATABASE_URI: "postgresql://admin:s3cr3t@db.internal.example.com:6543/npf" }),
      readCatalogCount: async () => 8,
      probe: async () => reachable,
    })
    const serialised = JSON.stringify(report)
    expect(serialised).not.toContain("s3cr3t")
    expect(serialised).not.toContain("db.internal.example.com")
    expect(serialised).not.toContain("6543")
    expect(serialised).not.toContain(GOOD_SECRET)
  })
})
