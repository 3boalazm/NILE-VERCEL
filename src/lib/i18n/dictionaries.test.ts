import { describe, expect, it } from "vitest"

import { dictionaries } from "./dictionaries"

type AnyFunction = (...args: never[]) => unknown
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue } | AnyFunction

// Every leaf path in the tree, e.g. "checkout.termsAgreePrefix" or
// "privacy.sections[].title" (array indices collapse to `[]` — locale
// parity is about shape, not about both sides having 10 sections).
function keyPaths(value: JsonValue, prefix = ""): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => keyPaths(item, `${prefix}[]`))
  }
  if (value !== null && typeof value === "object" && typeof value !== "function") {
    return Object.entries(value).flatMap(([key, child]) =>
      keyPaths(child, prefix ? `${prefix}.${key}` : key)
    )
  }
  return [prefix]
}

describe("dictionaries", () => {
  it("ar and en expose the exact same key paths (no missing translations)", () => {
    const arPaths = new Set(keyPaths(dictionaries.ar as unknown as JsonValue))
    const enPaths = new Set(keyPaths(dictionaries.en as unknown as JsonValue))
    const missingInEn = [...arPaths].filter((path) => !enPaths.has(path))
    const missingInAr = [...enPaths].filter((path) => !arPaths.has(path))
    expect({ missingInEn, missingInAr }).toEqual({ missingInEn: [], missingInAr: [] })
  })

  it("products.resultsCount stays the only function-valued field", () => {
    // The full Dictionary crosses into Client Components in narrowed
    // slices; any second function-valued field would silently break that
    // contract (see ClientSafeDictionary's doc comment).
    const functionPaths = (locale: JsonValue): string[] => {
      const found: string[] = []
      const walk = (value: JsonValue, prefix: string) => {
        if (typeof value === "function") {
          found.push(prefix)
          return
        }
        if (Array.isArray(value)) {
          value.forEach((item) => walk(item, `${prefix}[]`))
        } else if (value !== null && typeof value === "object") {
          Object.entries(value).forEach(([key, child]) =>
            walk(child, prefix ? `${prefix}.${key}` : key)
          )
        }
      }
      walk(locale, "")
      return found
    }
    for (const locale of [dictionaries.ar, dictionaries.en]) {
      expect(functionPaths(locale as unknown as JsonValue)).toEqual(["products.resultsCount"])
    }
  })
})
