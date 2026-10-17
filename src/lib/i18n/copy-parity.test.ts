import { describe, expect, it } from "vitest"

import { COMMON_ERRORS, getCommonErrors } from "./common-errors"
import { ERROR_COPY, getErrorCopy, SUPPORT_EMAIL } from "./error-copy"

/**
 * `dictionaries.test.ts` already enforces ar/en key parity for the main
 * dictionary. These two modules live outside it on purpose — they are imported
 * by Client Components (error boundaries and submitting forms), where pulling
 * in the full ~1.7k-line dictionary would bloat the browser bundle. That
 * separation means they lose the main dictionary's parity guard, so the same
 * discipline is re-asserted here.
 */
const leafKeys = (value: Record<string, unknown>): string[] =>
  Object.entries(value)
    .flatMap(([key, child]) =>
      child !== null && typeof child === "object" && !Array.isArray(child)
        ? Object.keys(child as Record<string, unknown>).map((k) => `${key}.${k}`)
        : [key]
    )
    .sort()

describe("client-safe copy modules", () => {
  it("ar and en expose the same keys in ERROR_COPY", () => {
    expect(leafKeys(ERROR_COPY.ar)).toEqual(leafKeys(ERROR_COPY.en))
  })

  it("ar and en expose the same keys in COMMON_ERRORS", () => {
    expect(leafKeys(COMMON_ERRORS.ar)).toEqual(leafKeys(COMMON_ERRORS.en))
  })

  it("every string is non-empty in both locales", () => {
    for (const [name, table] of [
      ["ERROR_COPY", ERROR_COPY],
      ["COMMON_ERRORS", COMMON_ERRORS],
    ] as const) {
      for (const locale of ["ar", "en"] as const) {
        for (const [key, value] of Object.entries(table[locale])) {
          expect(typeof value, `${name}.${locale}.${key}`).toBe("string")
          expect((value as string).trim().length, `${name}.${locale}.${key}`).toBeGreaterThan(0)
        }
      }
    }
  })

  it("resolves the requested locale and falls back to Arabic otherwise", () => {
    // Arabic is the site's default locale; an unexpected value must never
    // render `undefined` on the one screen where the user most needs copy.
    expect(getErrorCopy("en")).toBe(ERROR_COPY.en)
    expect(getErrorCopy("ar")).toBe(ERROR_COPY.ar)
    expect(getErrorCopy("fr")).toBe(ERROR_COPY.ar)
    expect(getErrorCopy(undefined)).toBe(ERROR_COPY.ar)

    expect(getCommonErrors("en")).toBe(COMMON_ERRORS.en)
    expect(getCommonErrors("ar")).toBe(COMMON_ERRORS.ar)
    expect(getCommonErrors("zz")).toBe(COMMON_ERRORS.ar)
  })

  it("support email is a plausible address (it is rendered as a mailto: link)", () => {
    expect(SUPPORT_EMAIL).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
  })
})
