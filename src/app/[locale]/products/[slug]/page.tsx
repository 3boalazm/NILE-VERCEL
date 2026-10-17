import { DossierNav } from "@/components/care-atlas/dossier-nav";
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
import { ChevronLeftIcon, CheckIcon, FileDownIcon } from "lucide-react";

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
import { careAtlasImage } from "@/lib/products/presentation";
import { getCareAtlasCopy } from "@/lib/i18n/care-atlas";
import { NPFProductThumbnailGallery } from "@/components/npf/product-thumbnail-gallery";
import { ProductStatusBadge } from "@/components/npf/product-status-badge";
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
  const stored = await productRepository.getProductBySlug(slug);
  if (!stored) notFound();
  const raw = publicCatalogProduct(stored);
  return { locale, raw, product: localizeProduct(raw, locale) };
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/products/[slug]">): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;
  if (!isValidLocale(localeParam)) return {};
  const stored = await productRepository.getProductBySlug(slug);
  // F-54: decide the 404 as early as possible.
  if (!stored) notFound();
  const rawProduct = publicCatalogProduct(stored);
  const product = localizeProduct(rawProduct, localeParam as Locale);
  return productPageMetadata(product, localeParam as Locale, rawProduct);
}

export default async function ProductDetailPage({
  params,
}: PageProps<"/[locale]/products/[slug]">) {
  const { locale: localeParam, slug } = await params;
  const { locale, raw, product } = await loadProduct(localeParam, slug);
  const dictionary = getDictionary(locale);
  const base = `/${locale}`;

  const [rawCategory, rawRelated, rawArticles] = await Promise.all([
    productRepository.getCategoryBySlug(product.categorySlug),
    productRepository.getProductsByCategory(product.categorySlug),
    articleRepository.getArticlesByProduct(product.slug),
  ]);
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
    d = dictionary;
  const anchors = [
    ...(sections.benefits ? [{ id: "overview", label: d.product.keyBenefits }] : []),
    ...(sections.composition && product.composition?.length
      ? [
          {
            id: "composition",
            label:
              product.categorySlug === "medical-devices"
                ? c.specifications
                : c.composition,
          },
        ]
      : []),
    ...(sections.usage ? [{ id: "usage", label: c.usage }] : []),
    ...(sections.science ||
    (canExposeField(raw, "clinicalReferences", "PRODUCT_PAGE") && product.clinicalReferences?.length)
      ? [{ id: "evidence", label: d.product.scientificInfo }]
      : []),
    ...(product.downloadUrl ? [{ id: "downloads", label: c.leaflet }] : []),
  ];
  return (
    <article className="ca-pdp ca-section-pad">
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
      <nav aria-label="Breadcrumb" className="ca-breadcrumb">
        <Link href={base}>{d.nav.home}</Link>
        <ChevronLeftIcon
          size={14}
          className="rtl:rotate-180"
          aria-hidden="true"
        />
        <Link href={`${base}/products`}>{d.products.pageTitle}</Link>
        {category && (
          <>
            <ChevronLeftIcon
              size={14}
              className="rtl:rotate-180"
              aria-hidden="true"
            />
            {/* Text only. A category filter is not a canonical parent. */}
            <span>{category.name}</span>
          </>
        )}
        <span aria-current="page">{heading}</span>
      </nav>
      <div className="ca-pdp-cover">
        <div className="ca-pdp-gallery">
          <div className="ca-section-index">
            <span className="ca-mono">NPF / PRODUCT FILE</span>
            <ProductStatusBadge status={product.status} dictionary={d} />
          </div>
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
        <div className="ca-pdp-summary">
          {category && (
            <Link
              className="ca-eyebrow"
              href={`${base}/products?category=${category.slug}`}
            >
              {category.name}
            </Link>
          )}
          <h1 dir={locale === "ar" ? "rtl" : "ltr"}>{heading}</h1>
          {locale === "ar" && latinName && latinName !== heading && (
            <p className="ca-pdp-note" lang="en" dir="ltr">
              {latinName}
            </p>
          )}
          {locale === "en" && product.nameArabic && product.nameArabic !== heading && (
            <p className="ca-pdp-note" lang="ar" dir="rtl">
              {product.nameArabic}
            </p>
          )}
          {intro && <p className="ca-pdp-lead">{intro}</p>}
          <div className="ca-pdp-price">
            {typeof product.price === "number" ? (
              <>
                <strong>
                  {product.price} {locale === "en" ? "EGP" : "ج.م"}
                </strong>
                <span>
                  {product.priceSource === "demo" ? ui.priceDemo : ui.priceLive}
                </span>
              </>
            ) : (
              <p>{ui.priceUnavailable}</p>
            )}
          </div>
          <div className="ca-pdp-actions">
            <Link
              href={`${base}/contact?product=${encodeURIComponent(product.slug)}`}
              className="ca-solid-link"
            >
              {d.product.requestInfoCta} ↗
            </Link>
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
              addLabel={d.product.addToWishlist}
              removeLabel={d.product.removeFromWishlist}
            />
          </div>
          <ProductCommercialFacts
            facts={facts}
            dictionary={d.product}
            productsHref={`${base}/products`}
          />
          <p className="ca-pdp-note">{c.medicalNote}</p>
        </div>
      </div>
      <div className="ca-product-dossier">
        <DossierNav
          anchors={anchors}
          label={getDiscoveryCopy(locale).reading}
        />
        <div className="ca-dossier-content">
          {sections.benefits && (
          <section id="overview" className="ca-dossier-section">
            <h2>{d.product.keyBenefits}</h2>
            <ul className="ca-benefit-list">
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
            <section id="composition" className="ca-dossier-section">
              <h2>
                {product.categorySlug === "medical-devices"
                  ? c.specifications
                  : c.composition}
              </h2>
              {canExposeStatement(raw, product.compositionNote, "PRODUCT_PAGE") && (
                <p className="ca-composition-context">
                  {product.compositionNote}
                </p>
              )}
              <table className="ca-dossier-table">
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
            <section id="usage" className="ca-dossier-section">
              <h2>{c.usage}</h2>
              <p className="ca-dossier-prose">{product.usage}</p>
            </section>
          )}
          {(sections.science ||
            (canExposeField(raw, "clinicalReferences", "PRODUCT_PAGE") && product.clinicalReferences?.length)) && (
            <section id="evidence" className="ca-dossier-section">
              <h2>{d.product.scientificInfo}</h2>
              {sections.science && product.scientificInfo && (
                <details className="ca-long-read">
                  <summary>
                    {locale === "ar"
                      ? "اقرأ المعلومات العلمية كاملة"
                      : "Read the full scientific information"}
                    <span aria-hidden="true">+</span>
                  </summary>
                  <p className="ca-dossier-prose">{product.scientificInfo}</p>
                </details>
              )}
              {canExposeField(raw, "clinicalReferences", "PRODUCT_PAGE") && product.clinicalReferences?.length ? (
                <>
                  <h3>{d.product.referencesTitle}</h3>
                  <ol className="ca-reference-list">
                    {product.clinicalReferences.map((ref) => (
                      <li key={ref.title}>
                        <strong>{ref.title}</strong>
                        <small>
                          {[ref.authors, ref.year].filter(Boolean).join(" · ")}
                        </small>
                        {ref.url && /^https?:\/\//.test(ref.url) && (
                          <a
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
            <section id="downloads" className="ca-dossier-section">
              <h2>{d.product.downloads}</h2>
              <a
                href={product.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ca-dossier-download"
              >
                <FileDownIcon size={30} aria-hidden="true" />
                <span>
                  {d.product.downloadLeaflet}
                  <small>{c.newWindow}</small>
                </span>
                <span aria-hidden="true">↗</span>
              </a>
            </section>
          )}
          {sections.existingFaq && product.faq?.length ? (
            <section className="ca-dossier-section">
              <h2>{d.product.faqTitle}</h2>
              {product.faq.map((faq) => (
                <details className="ca-long-read" key={faq.question}>
                  <summary>
                    {faq.question}
                    <span aria-hidden="true">+</span>
                  </summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </section>
          ) : null}
        </div>
      </div>
      {relatedArticles.length > 0 && (
        <section className="ca-related">
          <h2>{dictionary.blogs.pageTitle}</h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {relatedArticles.map((article) => (
              <li key={article.id}>
                <Link
                  href={`/${locale}/blogs/${article.slug}`}
                  className="flex h-full flex-col gap-2 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
                >
                  <span
                    className={`w-fit rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${TIER_BADGE_CLASS[article.evidenceTier]}`}
                  >
                    {evidenceTierLabel(article.evidenceTier, dictionary)}
                  </span>
                  <span className="font-medium leading-snug text-balance">
                    {article.title}
                  </span>
                  <span className="mt-auto text-xs text-muted-foreground">
                    {article.source.journal} · {article.source.year}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {relatedProducts.length > 0 && (
        <section className="ca-related">
          <div className="ca-section-index">
            <span className="ca-mono">CONTINUE EXPLORING</span>
          </div>
          <h2>{d.product.relatedTitle}</h2>
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
