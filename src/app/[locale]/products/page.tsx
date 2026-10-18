import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDiscoveryCopy } from "@/lib/i18n/discovery";
import {
  catalogHref,
  matchesCatalogSearch,
  type CatalogContext,
} from "@/lib/products/catalog-discovery";
import { isValidLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getCareAtlasCopy } from "@/lib/i18n/care-atlas";
import { getCatalogGlassCopy } from "@/lib/i18n/catalog-glass";
import { getExperienceCopy } from "@/lib/i18n/experience";
import {
  productRepository,
  localizeProduct,
  localizeCategory,
  type Product,
} from "@/lib/products";
import { readCmsList } from "@/lib/cms/read";
import { CatalogUnavailable } from "@/components/npf/catalog-unavailable";
import { NEEDS, findNeed, productsForNeed } from "@/lib/products/positioning";
import { NPFProductGrid } from "@/components/npf/product-grid";
import { publicCatalogProduct } from "@/lib/evidence/store";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { commercialSections } from "@/lib/products/commercial-profile";
import { canExposeStatement, publicFieldText } from "@/lib/seo/sku-evidence";
import { careAtlasImage, productTone } from "@/lib/products/presentation";
import { PageIntro, ContactBand, SectionHead } from "@/components/glass/sections";
import { ProductAtlas, type AtlasProduct } from "@/components/glass/product-atlas";
import "../../glass-catalog.css";

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

/** Evidence-gated projection for the client-side atlas: a field that the
 * product page may not show is never serialised to the browser. */
function atlasProduct(raw: Product, localized: Product): AtlasProduct {
  const sections = commercialSections(raw);
  return {
    id: localized.id,
    slug: localized.slug,
    name: localized.name,
    nameArabic: localized.nameArabic,
    categorySlug: localized.categorySlug,
    downloadUrl: localized.downloadUrl,
    image: careAtlasImage(localized) ?? null,
    tone: productTone(localized),
    form: publicFieldText(raw, "form", "PRODUCT_PAGE")
      ? (localized.availableForm?.trim() ?? null)
      : null,
    description: publicFieldText(raw, "shortDescription", "PRODUCT_PAGE")
      ? localized.shortDescription.trim() || null
      : null,
    composition:
      sections.composition && localized.composition?.length
        ? localized.composition.map(({ label, value }) => ({ label, value }))
        : null,
    compositionNote: canExposeStatement(raw, localized.compositionNote, "PRODUCT_PAGE")
      ? (localized.compositionNote ?? null)
      : null,
    usage: sections.usage ? localized.usage?.trim() || null : null,
  };
}

export default async function ProductsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/products">) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const d = getDictionary(locale),
    c = getExperienceCopy(locale),
    g = getCatalogGlassCopy(locale),
    atlas = getCareAtlasCopy(locale),
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
  const publicRaw = rawProducts.map((x) => publicCatalogProduct(x));
  const all = publicRaw.map((x) => localizeProduct(x, locale));
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
  const filtered = Boolean(need || category || query);
  const categoryNames = Object.fromEntries(
    categories.map((x) => [x.slug, x.name]),
  );
  return (
    <>
      <PageIntro
        eyebrow={`${g.catalogEyebrow} · ${d.products.resultsCount(all.length)}`}
        title={atlas.navAtlas}
        body={d.products.pageSubtitle}
      />
      <section className="ng-wrap ng-cat" aria-label={d.products.pageTitle}>
        <div className="ng-cat-bar ng-glass">
          <form action={`${base}/products`} className="ng-cat-search" role="search">
            <label className="ng-cat-query">
              <span className="ng-sr">{c.searchLabel}</span>
              <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
                <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                name="q"
                aria-label={c.searchLabel}
                placeholder={c.search}
                defaultValue={query}
                maxLength={200}
                dir="auto"
              />
            </label>
            {need && <input type="hidden" name="need" value={need.param} />}
            {category && <input type="hidden" name="category" value={category} />}
            <label className="ng-cat-sort">
              <span className="ng-sr">{c.sort}</span>
              <select name="sort" defaultValue={sort} aria-label={c.sort}>
                <option value="asc">{c.ascending}</option>
                <option value="desc">{c.descending}</option>
              </select>
            </label>
            <button type="submit" className="ng-btn ng-btn-primary">
              {d.products.heroSearchCta}
            </button>
          </form>
          <div className="ng-cat-filters">
            <div className="ng-cat-filter-row">
              <span className="ng-cat-filter-label" aria-hidden="true">
                {g.categoryHeading}
              </span>
              <nav aria-label={d.products.categoriesFilterLabel} className="ng-cat-chips">
                <Link
                  className="ng-chip"
                  href={href({ need: need?.param })}
                  aria-current={!category ? "true" : undefined}
                >
                  {d.products.allCategories}
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    className="ng-chip"
                    href={href({ need: need?.param, category: cat.slug })}
                    aria-current={category === cat.slug ? "true" : undefined}
                  >
                    {cat.name}
                  </Link>
                ))}
              </nav>
            </div>
            <details className="ng-cat-needs" open={Boolean(need)}>
              <summary>
                <span>{d.products.needsFilterLabel}</span>
                {need && (
                  <span className="ng-pill ng-pill-soft">
                    {d.home.needs[need.id].title}
                  </span>
                )}
              </summary>
              <nav aria-label={d.products.needsFilterLabel} className="ng-cat-chips">
                <Link
                  className="ng-chip"
                  href={href({ category })}
                  aria-current={!need ? "true" : undefined}
                >
                  {c.all}
                </Link>
                {NEEDS.filter((n) => !n.comingSoon).map((n) => (
                  <Link
                    key={n.id}
                    className="ng-chip"
                    href={href({ need: n.param, category })}
                    aria-current={need?.id === n.id ? "true" : undefined}
                  >
                    {d.home.needs[n.id].title}
                  </Link>
                ))}
              </nav>
            </details>
          </div>
        </div>
        <div className="ng-cat-results">
          <p aria-live="polite" className="ng-num">
            {d.products.resultsCount(products.length)}
          </p>
          {applied.length > 0 && (
            <nav
              className="ng-cat-applied"
              aria-label={copy.applied}
              data-testid="applied-filters"
            >
              {applied.map((filter) => (
                <Link
                  key={filter.key}
                  className="ng-chip"
                  href={catalogHref(locale, state, filter.key)}
                  aria-label={`${copy.remove}: ${filter.label}`}
                >
                  <span dir="auto">{filter.label}</span>
                  <span aria-hidden="true">×</span>
                </Link>
              ))}
            </nav>
          )}
          {filtered && (
            <Link href={`${base}/products`} className="ng-link ng-cat-reset">
              {c.reset}
            </Link>
          )}
        </div>
        {catalogUnavailable ? (
          /* The catalog could not be read. The filters, the search box and
             the page itself still work — only the grid is replaced by an
             honest notice. */
          <CatalogUnavailable locale={locale} />
        ) : products.length === 0 ? (
          <section
            className="ng-cat-empty ng-glass"
            aria-labelledby="catalog-empty-title"
            data-testid="catalog-empty"
          >
            <span className="ng-cat-empty-mark" aria-hidden="true">
              ∅
            </span>
            <div className="ng-stack" style={{ ["--ng-stack" as string]: "12px" }}>
              <h2 id="catalog-empty-title" className="ng-h3">
                {copy.emptyTitle}
              </h2>
              {query && (
                <p className="ng-cat-empty-query" dir="auto">
                  “{query}”
                </p>
              )}
              <p className="ng-body">{copy.emptyBody}</p>
              <div className="ng-hero-cta">
                <Link href={`${base}/products`} className="ng-btn ng-btn-primary">
                  {copy.browse}
                  <span className="ng-arrow" aria-hidden="true">↗</span>
                </Link>
                <Link href={`${base}/contact`} className="ng-btn ng-btn-ghost">
                  {copy.contact}
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <NPFProductGrid
            products={products}
            locale={locale}
            dictionary={d}
            categoryNames={categoryNames}
          />
        )}
      </section>
      {!catalogUnavailable && !filtered && all.length > 1 && (
        <section
          className="ng-wrap ng-section"
          aria-labelledby="atlas-title"
          id="atlas"
        >
          <SectionHead
            eyebrow={g.atlasEyebrow}
            title={g.atlasTitle}
            body={g.atlasBody}
            id="atlas-title"
          />
          <ProductAtlas
            locale={locale}
            products={publicRaw.map((raw, i) => atlasProduct(raw, all[i]))}
          />
        </section>
      )}
      <ContactBand locale={locale} />
    </>
  );
}
