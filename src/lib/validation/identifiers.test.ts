import { describe, expect, it } from "vitest"

import { ORDER_CODE_PATTERN, SLUG_PATTERN, isValidOrderCode, isValidSlug } from "./identifiers"

describe("isValidSlug (F-54)", () => {
  it("accepts the kebab-case slugs the catalog actually uses", () => {
    for (const slug of ["proxeed-plus", "pxp-30", "a", "ft-journey-mobile", "zinc-1000-mg-tablets"]) {
      expect(isValidSlug(slug)).toBe(true)
    }
  })

  it("rejects path/SQL/GraphQL metacharacters that used to reach the DB and 500", () => {
    for (const bad of [
      "'",
      "%27",
      "1 OR 1=1",
      "proxeed'--",
      "../admin",
      "a/b",
      "slug with space",
      "{ id }",
      "UPPER-Slug", // not kebab-lower
      "-leading-dash",
      "trailing-dash-",
      "",
    ]) {
      expect(isValidSlug(bad)).toBe(false)
    }
  })

  it("bounds the length so a 4 KB URL cannot become a 4 KB query parameter", () => {
    expect(isValidSlug("a".repeat(80))).toBe(true)
    expect(isValidSlug("a".repeat(81))).toBe(false)
  })

  it("keeps hyphen runs finite (pattern sanity, not just length)", () => {
    // 13 segments is the documented ceiling — enough for descriptive slugs,
    // small enough that the regex stays linear-time on hostile input.
    expect(SLUG_PATTERN.test(Array(13).fill("a").join("-"))).toBe(true)
    expect(SLUG_PATTERN.test(Array(14).fill("a").join("-"))).toBe(false)
  })
})

describe("isValidOrderCode (F-54)", () => {
  it("accepts Vendure-shaped order codes", () => {
    // Vendure's default generator emits uppercase alphanumerics; dashes are
    // allowed for human-formatted codes on invoices/emails.
    for (const code of ["PXP-30", "AB123", "NPF-2026-0001", "ordercode1", "A1B2C3"]) {
      expect(isValidOrderCode(code)).toBe(true)
    }
  })

  it("rejects malformed codes at the transport edge instead of in Postgres", () => {
    for (const bad of [
      "",
      "A",
      "AB",
      "ABC",
      "ABCD", // minimum total length is 5
      "1 OR 1=1",
      "code'--",
      "co de12",
      "{ code }",
      "-ABC12", // must start alphanumeric
      "A".repeat(25), // max total length is 24
      "../etc/passwd",
    ]) {
      expect(isValidOrderCode(bad)).toBe(false)
    }
  })

  it("is case-insensitive for the lookup but anchored to the code alphabet", () => {
    expect(ORDER_CODE_PATTERN.test("pxp-30")).toBe(true)
    expect(ORDER_CODE_PATTERN.test("pxp:30")).toBe(false)
  })
})
