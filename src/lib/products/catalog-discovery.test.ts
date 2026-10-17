import { describe, expect, it } from "vitest";
import {
  catalogHref,
  matchesCatalogSearch,
  normalizeCatalogSearch,
  type CatalogContext,
} from "./catalog-discovery";

describe("shared catalog search", () => {
  it.each([
    ["بُرُوكْسِيد بِلْس", "بروكسيد بلس"],
    ["أ إ آ ا", "ا ا ا ا"],
    ["بروكــسيد", "بروكسيد"],
    ["CA—MI / IR", "ca mi ir"],
    ["Próxeed PLUS", "proxeed plus"],
    ["٣٠ ۳۰ 30", "30 30 30"],
    ["  plus\n  proxeed  ", "plus proxeed"],
    ["على", "علي"],
  ])("normalizes %s consistently", (input, expected) => {
    expect(normalizeCatalogSearch(input)).toBe(expected);
  });
  const product = {
    name: "Proxeed Plus",
    nameArabic: "بروكسيد بلس",
    shortDescription: "30 sachets",
  };
  it("matches query tokens regardless of order or language", () => {
    expect(matchesCatalogSearch(product, "PLUS proxeed")).toBe(true);
    expect(matchesCatalogSearch(product, "بِلْس بروكــسيد")).toBe(true);
    expect(matchesCatalogSearch(product, "بروكسيد ٣٠")).toBe(true);
  });
  it("requires every token and never fabricates a spelling or therapeutic match", () => {
    expect(matchesCatalogSearch(product, "proxeed women")).toBe(false);
    expect(matchesCatalogSearch(product, "not-a-real-product")).toBe(false);
  });
  it("handles absent optional copy and empty queries", () => {
    expect(matchesCatalogSearch({ name: "CA-MI" }, "ca mi")).toBe(true);
    expect(matchesCatalogSearch({ name: "CA-MI" }, "")).toBe(true);
  });
});

describe("independent SSR filter removal", () => {
  const state: CatalogContext = {
    query: "بروكسيد Plus",
    category: "supplements",
    need: "mens-health",
    sort: "desc",
  };
  it.each(["query", "category", "need", "sort"] as const)(
    "removes only %s",
    (key) => {
      const url = new URL(catalogHref("ar", state, key), "https://npf.test");
      const fields = {
        query: "q",
        category: "category",
        need: "need",
        sort: "sort",
      };
      expect(url.pathname).toBe("/ar/products");
      for (const field of Object.keys(fields) as (keyof CatalogContext)[]) {
        expect(url.searchParams.get(fields[field])).toBe(
          field === key ? null : state[field],
        );
      }
    },
  );
  it("omits defaults and encodes query values as data", () => {
    expect(
      catalogHref("en", { query: "", category: "", need: "", sort: "asc" }),
    ).toBe("/en/products");
    const query = "<script>alert(1)</script>&token=private";
    const url = new URL(
      catalogHref("en", { ...state, query }),
      "https://npf.test",
    );
    expect(url.searchParams.get("q")).toBe(query);
    expect(url.searchParams.has("token")).toBe(false);
  });
});
