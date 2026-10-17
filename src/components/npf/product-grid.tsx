import type { Product } from "@/lib/products";
import type { Locale } from "@/lib/i18n/config";
import type { ClientSafeDictionary } from "@/lib/i18n/dictionaries";
import { NPFProductCard } from "./product-card";

export function NPFProductGrid({
  products,
  locale,
  dictionary,
  categoryNames,
  headingLevel,
}: {
  products: Product[];
  locale: Locale;
  dictionary: ClientSafeDictionary;
  /** slug → localized category name, used for the card's micro-label fallback. */
  categoryNames?: Record<string, string>;
  headingLevel?: "h2" | "h3";
}) {
  if (products.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        {dictionary.products.empty}
      </p>
    );
  }

  return (
    <div className="ca-catalog-grid">
      {products.map((product, index) => (
        <NPFProductCard
          key={product.id}
          priority={index === 0}
          product={product}
          locale={locale}
          dictionary={dictionary}
          accentIndex={index}
          categoryName={categoryNames?.[product.categorySlug]}
          headingLevel={headingLevel}
        />
      ))}
    </div>
  );
}
