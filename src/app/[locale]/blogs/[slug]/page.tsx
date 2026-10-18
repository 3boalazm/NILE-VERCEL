import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowLeftIcon, ExternalLinkIcon, FileTextIcon, TriangleAlertIcon } from "lucide-react"

import { isValidLocale, type Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { Toc } from "@/components/glass/content"
import { Reveal } from "@/components/npf/motion/reveal"
import { buildPageMetadata } from "@/lib/seo/page-metadata"
import { articleRepository, localizeArticle } from "@/lib/articles"
import { localizeProduct, productRepository } from "@/lib/products"
import { readCms, readCmsList } from "@/lib/cms/read"
import { CatalogUnavailable } from "@/components/npf/catalog-unavailable"
import { evidenceTierLabel, TIER_ORDER } from "@/lib/articles/evidence-tier"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/blogs/[slug]">): Promise<Metadata> {
  const { locale: localeParam, slug } = await params
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "ar"
  const articleRead = await readCms("blogs:metadata", () =>
    articleRepository.getArticleBySlug(slug),
  )
  // A CMS outage is not a missing article: keep the layout's metadata
  // instead of turning the route into a 404 — but do not let a crawler index
  // the "unavailable" notice as if it were the article.
  if (articleRead.status === "unavailable")
    return { robots: { index: false, follow: true } }
  const article = articleRead.value
  if (!article) return {}
  const localized = localizeArticle(article, locale)
  return buildPageMetadata({
    locale,
    path: `/blogs/${slug}`,
    title: localized.title,
    description: localized.summary,
  })
}

/**
 * A single research write-up. The layout deliberately separates the three
 * things a reader (or a regulator) needs to tell apart: the verified citation,
 * NPF's summary of the findings, and the limits of the evidence — the caveat
 * gets its own emphasised block rather than a trailing sentence.
 */
export default async function ArticlePage({ params }: PageProps<"/[locale]/blogs/[slug]">) {
  const { locale: localeParam, slug } = await params
  if (!isValidLocale(localeParam)) notFound()
  const locale: Locale = localeParam
  const dictionary = getDictionary(locale)
  const base = `/${locale}`
  const copy = dictionary.blogs

  const articleRead = await readCms("blogs:article", () =>
    articleRepository.getArticleBySlug(slug),
  )
  // The CMS could not be read. The article may well exist, so this is not a
  // 404 — the page renders the "unavailable" notice instead.
  if (articleRead.status === "unavailable") {
    return (
      <div className="ng-wrap ng-notice-wrap">
        <CatalogUnavailable locale={locale} />
      </div>
    )
  }
  const article = articleRead.value
  if (!article) notFound()
  const localized = localizeArticle(article, locale)

  const [productRead, siblingRead] = await Promise.all([
    readCmsList("blogs:related-products", () =>
      productRepository.getAllProducts(),
    ),
    readCmsList("blogs:siblings", () =>
      articleRepository.getArticlesByProduct(localized.productSlug),
    ),
  ])
  const products = productRead.items
  const siblings = siblingRead.items
  const product = products.find((item) => item.slug === localized.productSlug)
  const localizedProduct = product ? localizeProduct(product, locale) : undefined
  const related = siblings
    .map((item) => localizeArticle(item, locale))
    .filter((item) => item.slug !== localized.slug)
    .sort((a, b) => TIER_ORDER[a.evidenceTier] - TIER_ORDER[b.evidenceTier])

  const doiUrl = localized.source.doi
    ? `https://doi.org/${localized.source.doi.replace(/^https?:\/\/doi\.org\//, "")}`
    : undefined
  const sourceUrl = localized.source.url ?? doiUrl
  const pubmedUrl = localized.source.pubmedId
    ? localized.source.pubmedId.startsWith("PMC")
      ? `https://pmc.ncbi.nlm.nih.gov/articles/${localized.source.pubmedId}/`
      : `https://pubmed.ncbi.nlm.nih.gov/${localized.source.pubmedId}/`
    : undefined

  // F-13 — the table of contents is generated from the sections this page
  // actually renders (same ids on both ends), so it can never be empty or
  // point at a heading that does not exist.
  const toc = [
    { id: "findings", heading: copy.findingsLabel },
    { id: "caveat", heading: copy.caveatLabel },
    { id: "source", heading: copy.sourceLabel },
    ...(localizedProduct ? [{ id: "product", heading: copy.productCta }] : []),
    ...(related.length > 0 ? [{ id: "related", heading: copy.relatedArticles }] : []),
  ]

  return (
    <div className="ng-content">
      <article>
        <header className="ng-wrap ng-page-intro" style={{ paddingBlockEnd: "clamp(20px, 3vw, 36px)" }}>
          <Link href={`${base}/blogs`} className="ng-back">
            <ArrowLeftIcon className="size-4" aria-hidden="true" />
            {copy.backToBlog}
          </Link>
          <span className="ng-tier" data-tier={localized.evidenceTier}>
            <span className="ng-sr">{copy.evidenceLabel}: </span>
            {evidenceTierLabel(localized.evidenceTier, dictionary)}
          </span>
          <h1 className="ng-h1" style={{ fontSize: "var(--ng-t-2xl)", maxInlineSize: "30ch" }}>
            {localized.title}
          </h1>
          <p className="ng-lead">{localized.summary}</p>
        </header>

        <div className="ng-wrap ng-reader" style={{ paddingBlockEnd: "clamp(48px, 7vw, 96px)" }}>
          <Toc title={copy.tocTitle} entries={toc} />
          <div className="ng-reader-main">
            {/* Key findings */}
            <Reveal as="section" className="ng-stack" style={{ ["--ng-stack" as string]: "16px" }} aria-labelledby="findings">
              <h2 id="findings" className="ng-h3">
                {copy.findingsLabel}
              </h2>
              <ul className="ng-bullets">
                {localized.keyFindings.map((finding) => (
                  <li key={finding}>{finding}</li>
                ))}
              </ul>
            </Reveal>

            {/* Caveat — visually separated on purpose */}
            <Reveal as="section" delay={0.04} className="ng-callout" aria-labelledby="caveat">
              <div className="ng-callout-title">
                <span className="ng-callout-icon">
                  <TriangleAlertIcon className="size-5" aria-hidden="true" />
                </span>
                <h2 id="caveat" className="ng-h4">
                  {copy.caveatLabel}
                </h2>
              </div>
              <p className="ng-body">{localized.caveat}</p>
            </Reveal>

            {/* Source */}
            <Reveal as="section" delay={0.06} className="ng-tile" aria-labelledby="source">
              <h2 id="source" className="ng-h4 ng-section-title">
                <FileTextIcon className="size-5" aria-hidden="true" />
                {copy.sourceLabel}
              </h2>
              <div className="ng-cite">
                <p>{localized.source.title}</p>
                <p>{localized.source.authors}</p>
                <p>
                  {localized.source.journal} · <span className="ng-num">{localized.source.year}</span>
                </p>
                <p>{localized.source.type}</p>
                {localized.source.doi && <p dir="ltr">DOI: {localized.source.doi}</p>}
              </div>
              {(sourceUrl || pubmedUrl) && (
                <div className="ng-hero-cta">
                  {sourceUrl && (
                    <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="ng-btn">
                      {copy.viewSource}
                      <ExternalLinkIcon className="size-4" aria-hidden="true" />
                    </a>
                  )}
                  {pubmedUrl && (
                    <a href={pubmedUrl} target="_blank" rel="noopener noreferrer" className="ng-btn ng-btn-ghost">
                      PubMed
                      <ExternalLinkIcon className="size-4" aria-hidden="true" />
                    </a>
                  )}
                </div>
              )}
            </Reveal>

            {localizedProduct && (
              <Reveal as="section" delay={0.08} aria-labelledby="product">
                <h2 id="product" className="ng-sr">
                  {copy.productCta}
                </h2>
                <Link href={`${base}/products/${localizedProduct.slug}`} className="ng-btn ng-btn-primary ng-btn-lg">
                  <span>
                    {copy.productCta}: <bdi dir="ltr">{localizedProduct.name}</bdi>
                  </span>
                  <span className="ng-arrow" aria-hidden="true">↗</span>
                </Link>
              </Reveal>
            )}

            {related.length > 0 && (
              <section className="ng-stack" style={{ ["--ng-stack" as string]: "16px" }} aria-labelledby="related">
                <h2 id="related" className="ng-h3">
                  {copy.relatedArticles}
                </h2>
                <ul className="ng-posts">
                  {related.map((item) => (
                    <li key={item.id}>
                      <article className="ng-tile ng-post">
                        <span className="ng-tier" data-tier={item.evidenceTier}>
                          {evidenceTierLabel(item.evidenceTier, dictionary)}
                        </span>
                        <h3 className="ng-h4" style={{ fontSize: "var(--ng-t-md)" }}>
                          <Link href={`${base}/blogs/${item.slug}`}>{item.title}</Link>
                        </h3>
                        <div className="ng-post-foot">
                          <span>
                            {item.source.journal} · <span className="ng-num">{item.source.year}</span>
                          </span>
                        </div>
                      </article>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </article>
    </div>
  )
}
