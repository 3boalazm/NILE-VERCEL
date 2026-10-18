import { describe, expect, it } from "vitest";

import { CATALOG_GLASS_COPY, getCatalogGlassCopy } from "./catalog-glass";

describe("catalog glass copy", () => {
  it("ar and en expose the same keys", () => {
    expect(Object.keys(CATALOG_GLASS_COPY.ar).sort()).toEqual(
      Object.keys(CATALOG_GLASS_COPY.en).sort(),
    );
  });

  it("every string is non-empty in both locales", () => {
    for (const locale of ["ar", "en"] as const) {
      for (const [key, value] of Object.entries(CATALOG_GLASS_COPY[locale])) {
        expect(value.trim().length, `${locale}.${key}`).toBeGreaterThan(0);
      }
    }
  });

  it("resolves the requested locale", () => {
    expect(getCatalogGlassCopy("en")).toBe(CATALOG_GLASS_COPY.en);
    expect(getCatalogGlassCopy("ar")).toBe(CATALOG_GLASS_COPY.ar);
  });
});
