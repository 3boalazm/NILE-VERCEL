import { ProductChapters } from "@/components/glass/product-chapters";
import { SectionHead } from "@/components/glass/sections";
import { getCatalogGlassCopy } from "@/lib/i18n/catalog-glass";
import "../../../glass-catalog.css";
import { getDiscoveryCopy } from "@/lib/i18n/discovery";
import { getExperienceCopy } from "@/lib/i18n/experience";
import { safeJsonLd } from "@/lib/products/structured-data";
import Link from "next/link";
import { publicCatalogProduct } from "@/lib/evidence/store";
import { articleRepository, localizeArticle } from "@/lib/articles";
import { evidenceTierLabel, TIER_BADGE_CLASS } from "@/lib/articles/evidence-tier";
import { productPageMetadata } from "@/lib/seo/product-metadata";
import { commercialFacts, commercialSections } from "@/lib/products/commercial-profile";
import { ProductCommercialFacts } from "@/components/npf/product-commercial-facts";
import { catalogProductFaqJsonLd, productImageAlt } from "@/lib/seo/growth";
import { productHeading } from "@/lib/seo/product-identity";
import { canExposeField, canExposeStatement, publicFieldText } from "@/lib/seo/sku-evidence";
import { selectRelatedProducts } from "@/lib/content/links";
import { buildBreadcrumbJsonLd, buildProductJsonLd } from "@/lib/seo/product-schema";
import { TrackViewItem } from "@/components/npf/analytics-events";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CheckIcon, FileDownIcon } from "lucide-react";

import {
  isValidLocale,
  getDirection,
  type Locale,
} from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import {
  productRepository,
  localizeProduct,
  localizeCategory,
} from "@/lib/products";
import { readCms, readCmsList } from "@/lib/cms/read";
import { CatalogUnavailable } from "@/components/npf/catalog-unavailable";
import { careAtlasImage, productTone } from "@/lib/products/presentation";
import { getCareAtlasCopy } from "@/lib/i18n/care-atlas";
import { NPFProductThumbnailGallery } from "@/components/npf/product-thumbnail-gallery";
import { NPFProductGrid } from "@/components/npf/product-grid";
import { ProductAddToCart } from "@/components/npf/product-add-to-cart";
import { WishlistButton } from "@/components/npf/wishlist-button";

/**
 * A product page is rendered from the live Payload catalog and the root
 * layout reads request cookies for the cart/customer session. This is a
 * request-time route by design — it is not a build-time snapshot. Making the
 * choice explicit is important when the build has no database: an empty
 * `generateStaticParams()` result makes Next classify this as an empty static
 * route, whose generated shell cannot use the session cookies at runtime.
 *
 * The catalog is read by loadProduct() from the actual request. Missing or
 * invalid runtime DATABASE_URI / PAYLOAD_SECRET still fails closed; build
 * environments do not need to enumerate product slugs at all.
 */
export const dynamic = "force-dynamic"

async function loadProduct(localeParam: string, slug: string) {
  if (!isValidLocale(localeParam)) notFound();
  const locale: Locale = localeParam;
  const stored = await readCms("pdp:product", () =>
    productRepository.getProductBySlug(slug),
  );
  // The CMS could not be read. The product may well exist — this is NOT a
  // 404, and answering 404 here would let a database outage deindex a real
  // product page. The page renders an honest "unavailable" notice instead.
  if (stored.status === "unavailable") return { status: "unavailable" as const, locale };
  if (!stored.value) notFound();
  const raw = publicCatalogProduct(stored.value);
  return {
    status: "ok" as const,
    locale,
    raw,
    product: localizeProduct(raw, locale),
  };
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/products/[slug]">): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;
  if (!isValidLocale(localeParam)) return {};
  const stored = await readCms("pdp:metadata", () =>
    productRepository.getProductBySlug(slug),
  );
  // The catalog is unavailable: the page itself renders the notice, so the
  // metadata falls back to the layout's defaults instead of failing the
  // whole route — but a crawler must not index the notice as the product.
  if (stored.status === "unavailable")
    return { robots: { index: false, follow: true } };
  // F-54: decide the 404 as early as possible.
  if (!stored.value) notFound();
  const rawProduct = publicCatalogProduct(stored.value);
  const product = localizeProduct(rawProduct, localeParam as Locale);
  return productPageMetadata(product, localeParam as Locale, rawProduct);
}

export default async function ProductDetailPage({
  params,
}: PageProps<"/[locale]/products/[slug]">) {
  const { locale: localeParam, slug } = await params;
  const loaded = await loadProduct(localeParam, slug);
  if (loaded.status === "unavailable") {
    return <div className="ng-wrap ng-section"><CatalogUnavailable locale={loaded.locale} /></div>;
  }
  const { locale, raw, product } = loaded;
  const dictionary = getDictionary(locale);
  const base = `/${locale}`;

  // The three side reads are supplementary (category label, related
  // products, related write-ups). A CMS hiccup must not delete the product
  // page itself, so each one degrades to "nothing to show" instead of
  // throwing.
  const [categoryRead, relatedRead, articlesRead] = await Promise.all([
    readCms("pdp:category", () =>
      productRepository.getCategoryBySlug(product.categorySlug),
    ),
    readCmsList("pdp:related", () =>
      productRepository.getProductsByCategory(product.categorySlug),
    ),
    readCmsList("pdp:articles", () =>
      articleRepository.getArticlesByProduct(product.slug),
    ),
  ]);
  const rawCategory = categoryRead.status === "ok" ? categoryRead.value : null;
  const rawRelated = relatedRead.items;
  const rawArticles = articlesRead.items;
  const relatedArticles = rawArticles.map((article) =>
    localizeArticle(article, locale),
  );
  const category = rawCategory
    ? localizeCategory(rawCategory, locale)
    : rawCategory;
  const relatedProducts = selectRelatedProducts(
    product,
    rawRelated.map((item) => localizeProduct(publicCatalogProduct(item), locale)),
  );

  const ui = getExperienceCopy(locale);
  const heading = productHeading(product, locale);
  const imageAlt = productImageAlt(product, locale, raw);
  const faqJsonLd = catalogProductFaqJsonLd(raw);
  const latinName = product.name.trim();
  const intro = publicFieldText(raw, "shortDescription", "PRODUCT_PAGE")
    ? product.shortDescription.trim()
    : null;
  const sections = commercialSections(raw);
  const facts = commercialFacts(
    product,
    {
      categoryName: category?.name,
      availability: dictionary.status[product.status],
    },
    raw,
  );
  const productJsonLd = buildProductJsonLd(
    product,
    locale,
    dictionary.siteName,
    category?.name,
    raw,
  );
  const breadcrumbJsonLd = buildBreadcrumbJsonLd({
    locale,
    heading,
    homeLabel: dictionary.nav.home,
    productsLabel: dictionary.products.pageTitle,
    categoryName: category?.name,
  });

  const c = getCareAtlasCopy(locale),
    g = getCatalogGlassCopy(locale),
    d = dictionary;
  const showReferences = Boolean(
    canExposeField(raw, "clinicalReferences", "PRODUCT_PAGE") &&
      product.clinicalReferences?.length,
  );
  const compositionLabel =
    product.categorySlug === "medical-devices" ? c.specifications : c.composition;
  const anchors = [
    ...(sections.benefits ? [{ id: "overview", label: d.product.keyBenefits }] : []),
    ...(sections.composition && product.composition?.length
      ? [{ id: "composition", label: compositionLabel }]
      : []),
    ...(sections.usage ? [{ id: "usage", label: c.usage }] : []),
    ...(sections.science || showReferences
      ? [{ id: "evidence", label: d.product.scientificInfo }]
      : []),
    ...(product.downloadUrl ? [{ id: "downloads", label: c.leaflet }] : []),
    ...(sections.existingFaq && product.faq?.length
      ? [{ id: "faq", label: d.product.faqTitle }]
      : []),
  ];
  const inquiryHref = `${base}/contact?product=${encodeURIComponent(product.slug)}`;
  const priced = typeof product.price === "number";
  return (
    <article className="ng-pdp">
      {/* F-70: GA4 view_item beacon (queues pre-consent, transmits post). */}
      <TrackViewItem
        slug={product.slug}
        name={product.name}
        price={product.price}
        category={category?.name}
        currency="EGP"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />
      {faqJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }}
        />
      ) : null}
      <div className="ng-wrap">
        <nav aria-label="Breadcrumb" className="ng-crumbs">
          <ol>
            <li>
              <Link href={base}>{d.nav.home}</Link>
            </li>
            <li>
              <Link href={`${base}/products`}>{d.products.pageTitle}</Link>
            </li>
            {category && (
              <li>
                {/* Text only. A category filter is not a canonical parent. */}
                <span>{category.name}</span>
              </li>
            )}
            <li>
              <span aria-current="page">{heading}</span>
            </li>
          </ol>
        </nav>
        <div className="ng-pdp-cover">
          <div className="ng-pdp-gallery" data-tone={productTone(product)}>
            {product.status !== "active" && (
              <span className="ng-pill ng-pdp-status">{d.status[product.status]}</span>
            )}
            <NPFProductThumbnailGallery
              images={[
                careAtlasImage(product),
                product.image,
                ...(product.gallery ?? []),
              ].filter((src, i, all) => all.indexOf(src) === i)}
              alt={imageAlt}
              dir={getDirection(locale)}
            />
          </div>
          <div className="ng-pdp-summary ng-glass">
            {category && (
              <Link
                className="ng-eyebrow ng-pdp-cat"
                href={`${base}/products?category=${category.slug}`}
              >
                {category.name}
              </Link>
            )}
            <h1 className="ng-pdp-title" dir={locale === "ar" ? "rtl" : "ltr"}>
              {heading}
            </h1>
            {locale === "ar" && latinName && latinName !== heading && (
              <p className="ng-pdp-alt" lang="en" dir="ltr">
                {latinName}
              </p>
            )}
            {locale === "en" && product.nameArabic && product.nameArabic !== heading && (
              <p className="ng-pdp-alt" lang="ar" dir="rtl">
                {product.nameArabic}
              </p>
            )}
            {intro && <p className="ng-pdp-lead">{intro}</p>}
            <div className="ng-pdp-price" data-priced={priced || undefined}>
              {priced ? (
                <>
                  <p className="ng-price ng-num">
                    {product.price!.toLocaleString(locale === "ar" ? "ar-EG" : "en-US")}
                    <small>{locale === "en" ? "EGP" : "ج.م"}</small>
                  </p>
                  <p className="ng-pdp-price-note">
                    {product.priceSource === "demo" ? ui.priceDemo : ui.priceLive}
                  </p>
                </>
              ) : (
                <>
                  <p className="ng-pdp-price-na">{ui.priceUnavailable}</p>
                  <p className="ng-pdp-price-note">{g.priceOnRequestBody}</p>
                </>
              )}
            </div>
            <div className="ng-pdp-actions">
              <div className="ng-pdp-buy">
                <ProductAddToCart
                  product={{
                    id: product.id,
                    slug: product.slug,
                    name: product.name,
                    image: product.image,
                    price: product.price,
                    priceSource: product.priceSource,
                    currency: product.currency,
                    sku: product.sku,
                    status: product.status,
                  }}
                  labels={{
                    add: d.product.addToCart,
                    added: d.product.addedToCart,
                    unavailable: d.product.unavailableForOrder,
                    error: d.product.addToCartError,
                    quantity: d.product.quantity,
                  }}
                />
                <WishlistButton
                  slug={product.slug}
                  variant="inline"
                  className="ng-pdp-wish"
                  addLabel={d.product.addToWishlist}
                  removeLabel={d.product.removeFromWishlist}
                />
              </div>
              <Link
                href={inquiryHref}
                className={`ng-btn ${priced ? "ng-btn-ghost" : "ng-btn-primary"} ng-pdp-inquiry`}
              >
                {d.product.requestInfoCta}
                <span className="ng-arrow" aria-hidden="true">↗</span>
              </Link>
            </div>
            <div className="ng-pdp-facts">
              <ProductCommercialFacts
                facts={facts}
                dictionary={d.product}
                productsHref={`${base}/products`}
              />
            </div>
            <p className="ng-pdp-medical">{c.medicalNote}</p>
          </div>
        </div>
      </div>
      <div className="ng-wrap ng-pdp-dossier" data-dossier data-has-index={anchors.length > 0 || undefined}>
        <ProductChapters
          anchors={anchors}
          label={getDiscoveryCopy(locale).reading}
          title={g.chaptersTitle}
        />
        <div className="ng-pdp-chapters">
          {sections.benefits && (
            <section id="overview" className="ng-pdp-section ng-glass">
              <h2 className="ng-h3">{d.product.keyBenefits}</h2>
              <ul className="ng-pdp-benefits">
                {product.keyBenefits.map((benefit) => (
                  <li key={benefit}>
                    <CheckIcon size={18} aria-hidden="true" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {sections.composition && product.composition?.length ? (
            <section id="composition" className="ng-pdp-section ng-glass">
              <h2 className="ng-h3">{compositionLabel}</h2>
              {canExposeStatement(raw, product.compositionNote, "PRODUCT_PAGE") && (
                <p className="ng-body">{product.compositionNote}</p>
              )}
              <table className="ng-spec-table">
                <tbody>
                  {product.composition.map((item) => (
                    <tr key={item.label}>
                      <th scope="row">{item.label}</th>
                      <td dir="ltr">{item.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : null}
          {sections.usage && (
            <section id="usage" className="ng-pdp-section ng-glass">
              <h2 className="ng-h3">{c.usage}</h2>
              <p className="ng-pdp-prose">{product.usage}</p>
            </section>
          )}
          {(sections.science || showReferences) && (
            <section id="evidence" className="ng-pdp-section ng-glass">
              <h2 className="ng-h3">{d.product.scientificInfo}</h2>
              {sections.science && product.scientificInfo && (
                <div className="ng-acc">
                  <details>
                    <summary>{g.readFullScience}</summary>
                    <p className="ng-pdp-prose">{product.scientificInfo}</p>
                  </details>
                </div>
              )}
              {showReferences ? (
                <>
                  <h3 className="ng-pdp-subhead">{d.product.referencesTitle}</h3>
                  <ol className="ng-pdp-refs">
                    {product.clinicalReferences!.map((ref) => (
                      <li key={ref.title}>
                        <strong dir="auto">{ref.title}</strong>
                        <small dir="auto">
                          {[ref.authors, ref.year].filter(Boolean).join(" · ")}
                        </small>
                        {ref.url && /^https?:\/\//.test(ref.url) && (
                          <a
                            className="ng-link"
                            href={ref.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {d.product.referencesViewSource} ↗
                          </a>
                        )}
                      </li>
                    ))}
                  </ol>
                </>
              ) : null}
            </section>
          )}
          {product.downloadUrl && (
            <section id="downloads" className="ng-pdp-section ng-glass">
              <h2 className="ng-h3">{d.product.downloads}</h2>
              <a
                href={product.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ng-pdf"
              >
                <span className="ng-pdf-icon" aria-hidden="true">
                  <FileDownIcon size={22} />
                </span>
                <span className="ng-pdf-text">
                  <strong>{d.product.downloadLeaflet}</strong>
                  <small>{c.newWindow}</small>
                </span>
                <span aria-hidden="true">↗</span>
              </a>
            </section>
          )}
          {sections.existingFaq && product.faq?.length ? (
            <section id="faq" className="ng-pdp-section ng-glass">
              <h2 className="ng-h3">{d.product.faqTitle}</h2>
              <div className="ng-acc">
                {product.faq.map((faq) => (
                  <details key={faq.question}>
                    <summary>{faq.question}</summary>
                    <p>{faq.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}
          <aside className="ng-pdp-ask" aria-labelledby="pdp-ask-title">
            <div>
              <h2 id="pdp-ask-title" className="ng-h3">
                {g.inquiryHeading}
              </h2>
              <p className="ng-body">{g.inquiryBody}</p>
            </div>
            <Link href={inquiryHref} className="ng-btn ng-btn-primary">
              {c.askProduct}
              <span className="ng-arrow" aria-hidden="true">↗</span>
            </Link>
          </aside>
        </div>
      </div>
      {relatedArticles.length > 0 && (
        <section className="ng-wrap ng-section-tight" aria-labelledby="pdp-articles">
          <div className="ng-stack" style={{ ["--ng-stack" as string]: "12px", marginBlockEnd: 24 }}>
            <span className="ng-eyebrow">{g.relatedArticlesEyebrow}</span>
            <h2 id="pdp-articles" className="ng-h3">
              {dictionary.blogs.pageTitle}
            </h2>
          </div>
          <ul className="ng-pdp-articles">
            {relatedArticles.map((article) => (
              <li key={article.id}>
                <Link href={`/${locale}/blogs/${article.slug}`} className="ng-pdp-article ng-glass">
                  <span
                    className={`ng-pdp-tier rounded-full border ${TIER_BADGE_CLASS[article.evidenceTier]}`}
                  >
                    {evidenceTierLabel(article.evidenceTier, dictionary)}
                  </span>
                  <strong>{article.title}</strong>
                  <small>
                    {[article.source.journal, article.source.year]
                      .filter(Boolean)
                      .join(" · ")}
                  </small>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {relatedProducts.length > 0 && (
        <section className="ng-wrap ng-section" aria-labelledby="pdp-related">
          <SectionHead
            eyebrow={g.relatedProductsEyebrow}
            title={d.product.relatedTitle}
            id="pdp-related"
            split={false}
          />
          <NPFProductGrid
            products={relatedProducts}
            locale={locale}
            dictionary={d}
            headingLevel="h3"
            categoryNames={
              category ? { [category.slug]: category.name } : undefined
            }
          />
        </section>
      )}
    </article>
  );
}
