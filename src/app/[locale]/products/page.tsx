import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDiscoveryCopy } from "@/lib/i18n/discovery";
import {
  catalogHref,
  matchesCatalogSearch,
  type CatalogContext,
} from "@/lib/products/catalog-discovery";
import { SearchIcon } from "lucide-react";
import { isValidLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { PageIntro, CareContact } from "@/components/care-atlas/sections";
import { getCareAtlasCopy } from "@/lib/i18n/care-atlas";
import { getExperienceCopy } from "@/lib/i18n/experience";
import {
  productRepository,
  localizeProduct,
  localizeCategory,
} from "@/lib/products";
import { readCmsList } from "@/lib/cms/read";
import { CatalogUnavailable } from "@/components/npf/catalog-unavailable";
import { NEEDS, findNeed, productsForNeed } from "@/lib/products/positioning";
import { NPFProductGrid } from "@/components/npf/product-grid";
import { publicCatalogProduct } from "@/lib/evidence/store";
import { buildPageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/products">): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const d = getDictionary(locale);
  return buildPageMetadata({
    locale,
    path: "/products",
    title: d.products.pageTitle,
    description: d.products.pageSubtitle,
  });
}
export default async function ProductsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/products">) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const d = getDictionary(locale),
    c = getExperienceCopy(locale),
    base = `/${locale}`;
  const sp = await searchParams;
  const query = typeof sp.q === "string" ? sp.q.trim().slice(0, 200) : "";
  const need = findNeed(typeof sp.need === "string" ? sp.need : undefined);
  const requestedCategory = typeof sp.category === "string" ? sp.category : "";
  const sort = sp.sort === "desc" || sp.sort === "name-desc" ? "desc" : "asc";
  const [categoryRead, productRead] = await Promise.all([
    readCmsList("products:categories", () =>
      productRepository.getAllCategories(),
    ),
    readCmsList("products:all", () => productRepository.getAllProducts()),
  ]);
  const rawCategories = categoryRead.items;
  const rawProducts = productRead.items;
  const catalogUnavailable = categoryRead.unavailable || productRead.unavailable;
  const categories = rawCategories
    .map((x) => localizeCategory(x, locale))
    .filter((x) => rawProducts.some((p) => p.categorySlug === x.slug));
  const category =
    categories.find((item) => item.slug === requestedCategory)?.slug ?? "";
  const all = rawProducts.map((x) => localizeProduct(publicCatalogProduct(x), locale));
  let products = need ? productsForNeed(all, need) : all;
  if (category) products = products.filter((p) => p.categorySlug === category);
  if (query)
    products = products.filter((product) =>
      matchesCatalogSearch(product, query),
    );
  products = [...products].sort(
    (a, b) => (sort === "asc" ? 1 : -1) * a.name.localeCompare(b.name, locale),
  );
  const state: CatalogContext = {
    query,
    category,
    need: need?.param ?? "",
    sort,
  };
  const href = (values: { need?: string; category?: string }) => {
    return catalogHref(locale, {
      ...state,
      need: values.need ?? "",
      category: values.category ?? "",
    });
  };
  const copy = getDiscoveryCopy(locale);
  const applied = [
    ...(query
      ? [{ key: "query" as const, label: `${copy.query}: ${query}` }]
      : []),
    ...(category
      ? [
          {
            key: "category" as const,
            label: categories.find((item) => item.slug === category)!.name,
          },
        ]
      : []),
    ...(need
      ? [{ key: "need" as const, label: d.home.needs[need.id].title }]
      : []),
    ...(sort === "desc" ? [{ key: "sort" as const, label: c.descending }] : []),
  ];
  const atlas = getCareAtlasCopy(locale);
  return (
    <>
      <PageIntro
        index="02 / THE PRODUCT ATLAS"
        title={atlas.navAtlas}
        body={atlas.atlasBody}
      />
      <section className="ca-catalog-shell ca-section-pad">
        <div className="ca-catalog-ledger">
          <span className="ca-mono">NPF / PRODUCT INDEX</span>
          <span>
            {copy.entire} · {d.products.resultsCount(all.length)}
          </span>
        </div>
        <form
          action={`${base}/products`}
          className="ca-store-search"
          role="search"
        >
          <SearchIcon size={22} aria-hidden="true" />
          <input
            type="search"
            name="q"
            aria-label={c.searchLabel}
            placeholder={c.search}
            defaultValue={query}
            maxLength={200}
          />
          {need && <input type="hidden" name="need" value={need.param} />}
          {category && <input type="hidden" name="category" value={category} />}
          <select name="sort" defaultValue={sort} aria-label={c.sort}>
            <option value="asc">{c.ascending}</option>
            <option value="desc">{c.descending}</option>
          </select>
          <button type="submit" className="ca-solid-link">
            {d.products.heroSearchCta} ↗
          </button>
        </form>
        <div className="ca-catalog-filters">
          <nav aria-label={d.products.categoriesFilterLabel}>
            <Link
              href={href({ need: need?.param })}
              aria-current={!category ? "true" : undefined}
            >
              {d.products.allCategories}
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={href({ need: need?.param, category: cat.slug })}
                aria-current={category === cat.slug ? "true" : undefined}
              >
                {cat.name}
              </Link>
            ))}
          </nav>
          <details open={Boolean(need)}>
            <summary>{d.products.needsFilterLabel}</summary>
            <nav aria-label={d.products.needsFilterLabel}>
              <Link
                href={href({ category })}
                aria-current={!need ? "true" : undefined}
              >
                {c.all}
              </Link>
              {NEEDS.filter((n) => !n.comingSoon).map((n) => (
                <Link
                  key={n.id}
                  href={href({ need: n.param, category })}
                  aria-current={need?.id === n.id ? "true" : undefined}
                >
                  {d.home.needs[n.id].title}
                </Link>
              ))}
            </nav>
          </details>
        </div>
        <div className="ca-results">
          <p aria-live="polite">{d.products.resultsCount(products.length)}</p>
          {(need || category || query) && (
            <Link href={`${base}/products`}>{c.reset} ×</Link>
          )}
        </div>
        {applied.length > 0 && (
          <nav className="ca-applied-filters" aria-label={copy.applied}>
            {applied.map((filter) => (
              <Link
                key={filter.key}
                href={catalogHref(locale, state, filter.key)}
                aria-label={`${copy.remove}: ${filter.label}`}
              >
                <span>{filter.label}</span>
                <span aria-hidden="true">×</span>
              </Link>
            ))}
          </nav>
        )}
        {catalogUnavailable ? (
          /* The catalog could not be read. The filters, the search box and
             the page itself still work — only the grid is replaced by an
             honest notice. */
          <CatalogUnavailable locale={locale} />
        ) : products.length === 0 ? (
          <section
            className="ca-catalog-empty"
            aria-labelledby="catalog-empty-title"
          >
            <span className="ca-empty-symbol" aria-hidden="true">
              ∅
            </span>
            <div>
              <h2 id="catalog-empty-title">{copy.emptyTitle}</h2>
              {query && (
                <p className="ca-empty-query" dir="auto">
                  “{query}”
                </p>
              )}
              <p>{copy.emptyBody}</p>
              <div className="ca-empty-links">
                <Link href={`${base}/products`} className="ca-solid-link">
                  {copy.browse}
                  <span aria-hidden="true">↗</span>
                </Link>
                <Link href={`${base}/contact`} className="ca-line-link">
                  {copy.contact}
                  <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <NPFProductGrid
            products={products}
            locale={locale}
            dictionary={d}
            categoryNames={Object.fromEntries(
              categories.map((x) => [x.slug, x.name]),
            )}
          />
        )}
      </section>
      <CareContact locale={locale} />
    </>
  );
}
