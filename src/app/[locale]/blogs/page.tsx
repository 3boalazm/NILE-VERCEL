import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowLeftIcon, NewspaperIcon } from "lucide-react"

import { isValidLocale, type Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { PageIntro } from "@/components/glass/sections"
import { Notice } from "@/components/glass/content"
import { Reveal } from "@/components/npf/motion/reveal"
import { buildPageMetadata } from "@/lib/seo/page-metadata"
import { articleRepository, localizeArticle } from "@/lib/articles"
import { localizeProduct, productRepository } from "@/lib/products"
import { readCmsList } from "@/lib/cms/read"
import { evidenceTierLabel, TIER_ORDER } from "@/lib/articles/evidence-tier"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/blogs">): Promise<Metadata> {
  const { locale: localeParam } = await params
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "ar"
  const dictionary = getDictionary(locale)
  const articleRead = await readCmsList("blogs:metadata", () =>
    articleRepository.getPublishedArticles(),
  )
  return buildPageMetadata({
    locale,
    path: "/blogs",
    title: dictionary.blogs.pageTitle,
    description: dictionary.blogs.pageSubtitle,
    // Indexable only once real articles exist; while the listing is still an
    // empty state it stays noindex + out of the sitemap so crawlers don't read
    // a "coming soon" page as thin content. A CMS outage is treated like the
    // empty state: the page is not real content right now, so it is not
    // advertised as such.
    noIndex: articleRead.unavailable || articleRead.items.length === 0,
  })
}

/**
 * Article listing. Previously a permanent empty state (there was no article
 * content anywhere in the project). It now renders the published research
 * write-ups, grouped by the product they belong to; the empty state is still
 * what a visitor sees until at least one article is published.
 */
export default async function BlogsPage({ params }: PageProps<"/[locale]/blogs">) {
  const { locale: localeParam } = await params
  if (!isValidLocale(localeParam)) notFound()
  const locale: Locale = localeParam
  const dictionary = getDictionary(locale)
  const base = `/${locale}`

  const [articleRead, productRead] = await Promise.all([
    readCmsList("blogs:articles", () =>
      articleRepository.getPublishedArticles(),
    ),
    readCmsList("blogs:products", () => productRepository.getAllProducts()),
  ])
  const articles = articleRead.items
  const products = productRead.items
  const productBySlug = new Map(products.map((product) => [product.slug, localizeProduct(product, locale)]))

  // Strongest evidence first, then newest — the ordering the reviews recommend
  // and the one the article pages assume when they list related write-ups.
  const ordered = [...articles]
    .map((article) => localizeArticle(article, locale))
    .sort((a, b) => {
      const tier = TIER_ORDER[a.evidenceTier] - TIER_ORDER[b.evidenceTier]
      if (tier !== 0) return tier
      return Number(b.source.year) - Number(a.source.year)
    })

  return (
    <div className="ng-content">
      <PageIntro eyebrow={dictionary.siteName} title={dictionary.blogs.pageTitle} body={dictionary.blogs.pageSubtitle}>
        {ordered.length > 0 && (
          <span className="ng-pill">
            {`${ordered.length} ${dictionary.blogs.articlesCount}`}
          </span>
        )}
      </PageIntro>

      {ordered.length === 0 ? (
        <div className="ng-wrap ng-notice-wrap">
          <Notice
            mark={<NewspaperIcon className="size-7" />}
            title={dictionary.blogs.comingSoonTitle}
            body={dictionary.blogs.comingSoonBody}
          >
            <div className="ng-hero-cta">
              <Link href={`${base}/products`} className="ng-btn ng-btn-primary">
                {dictionary.blogs.cta}
                <span className="ng-arrow" aria-hidden="true">↗</span>
              </Link>
            </div>
          </Notice>
        </div>
      ) : (
        <section className="ng-wrap ng-band-tight" style={{ paddingBlockEnd: "clamp(56px, 8vw, 112px)" }} aria-label={dictionary.blogs.pageTitle}>
          <ul className="ng-posts">
            {ordered.map((article, index) => {
              const product = productBySlug.get(article.productSlug)
              return (
                <Reveal as="li" key={article.id} delay={(index % 6) * 0.05}>
                  <article className="ng-tile ng-post">
                    <span className="ng-tier" data-tier={article.evidenceTier}>
                      {evidenceTierLabel(article.evidenceTier, dictionary)}
                    </span>
                    <h2 className="ng-h4">
                      <Link href={`${base}/blogs/${article.slug}`}>{article.title}</Link>
                    </h2>
                    <p className="ng-body ng-small ng-post-sum">{article.summary}</p>
                    <div className="ng-post-foot">
                      <strong>{article.source.journal}</strong>
                      <span>
                        {article.source.authors.split(",")[0]} · <span className="ng-num">{article.source.year}</span>
                      </span>
                      {product && <span className="ng-post-product">{product.name}</span>}
                    </div>
                    <span className="ng-more" aria-hidden="true">
                      {dictionary.blogs.readArticle}
                      <ArrowLeftIcon className="size-3.5" />
                    </span>
                  </article>
                </Reveal>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
