import type { Locale } from "@/lib/i18n/config";

/** Search tolerance, not a recommendation or fuzzy medical matching service. */
export function normalizeCatalogSearch(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/\u0640/g, "")
    .replace(/ى/g, "ي")
    .replace(/[٠-٩۰-۹]/g, (digit) =>
      String(digit.charCodeAt(0) - (digit <= "٩" ? 0x660 : 0x6f0)),
    )
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function matchesCatalogSearch(
  product: {
    name: string;
    nameArabic?: string | null;
    shortDescription?: string | null;
  },
  query: string,
): boolean {
  const tokens = normalizeCatalogSearch(query).split(/\s+/).filter(Boolean);
  const content = normalizeCatalogSearch(
    `${product.name} ${product.nameArabic ?? ""} ${product.shortDescription ?? ""}`,
  );
  return tokens.every((token) => content.includes(token));
}

export type CatalogContext = {
  query: string;
  category: string;
  need: string;
  sort: "asc" | "desc";
};
export function catalogHref(
  locale: Locale,
  context: CatalogContext,
  remove?: keyof CatalogContext,
): string {
  const query = new URLSearchParams();
  if (context.query && remove !== "query")
    query.set("q", context.query.slice(0, 200));
  if (context.category && remove !== "category")
    query.set("category", context.category);
  if (context.need && remove !== "need") query.set("need", context.need);
  if (context.sort === "desc" && remove !== "sort") query.set("sort", "desc");
  return `/${locale}/products${query.size ? `?${query}` : ""}`;
}
