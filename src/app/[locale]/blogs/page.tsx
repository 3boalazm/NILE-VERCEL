import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowLeftIcon, NewspaperIcon } from "lucide-react"

import { isValidLocale, type Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { ctaButtonVariants } from "@/components/ui/button"
import { Reveal } from "@/components/npf/motion/reveal"
import { buildPageMetadata } from "@/lib/seo/page-metadata"
import { articleRepository, localizeArticle } from "@/lib/articles"
import { localizeProduct, productRepository } from "@/lib/products"
import { readCmsList } from "@/lib/cms/read"
import { evidenceTierLabel, TIER_BADGE_CLASS, TIER_ORDER } from "@/lib/articles/evidence-tier"
import { cn } from "@/lib/utils"

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
    <>
      {/* Hero */}
      <section className="bg-anti-flash-white dark:bg-card">
        <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-4 py-20 text-center sm:px-6 lg:px-8">
          <span className="eyebrow text-primary">{dictionary.siteName}</span>
          <h1 className="font-heading text-3xl font-semibold sm:text-4xl">{dictionary.blogs.pageTitle}</h1>
          <p className="max-w-xl text-balance text-muted-foreground">{dictionary.blogs.pageSubtitle}</p>
          {ordered.length > 0 && (
            <p className="text-sm font-medium text-primary">
              {ordered.length} {dictionary.blogs.articlesCount}
            </p>
          )}
        </Reveal>
      </section>

      {ordered.length === 0 ? (
        <Reveal
          as="div"
          className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-24 text-center sm:px-6 lg:px-8"
        >
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <NewspaperIcon className="size-6" />
          </div>
          <h2 className="font-heading text-xl font-semibold">{dictionary.blogs.comingSoonTitle}</h2>
          <p className="max-w-md text-pretty leading-relaxed text-muted-foreground">
            {dictionary.blogs.comingSoonBody}
          </p>
          <Link href={`${base}/products`} className={cn(ctaButtonVariants({ variant: "onLight" }), "mt-2")}>
            {dictionary.blogs.cta}
          </Link>
        </Reveal>
      ) : (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ordered.map((article, index) => {
              const product = productBySlug.get(article.productSlug)
              return (
                <Reveal as="li" key={article.id} delay={(index % 6) * 0.06} className="h-full">
                  <article className="group flex h-full flex-col gap-4 rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-sm transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl">
                    <span
                      className={cn(
                        "w-fit rounded-full border px-3 py-1 text-xs font-medium",
                        TIER_BADGE_CLASS[article.evidenceTier]
                      )}
                    >
                      {evidenceTierLabel(article.evidenceTier, dictionary)}
                    </span>
                    <h2 className="font-heading text-lg font-semibold leading-snug text-balance">
                      <Link href={`${base}/blogs/${article.slug}`} className="after:absolute after:inset-0">
                        {article.title}
                      </Link>
                    </h2>
                    <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{article.summary}</p>
                    <div className="mt-auto flex flex-col gap-1 border-t pt-4 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{article.source.journal}</span>
                      <span>
                        {article.source.authors.split(",")[0]} · {article.source.year}
                      </span>
                      {product && <span className="text-primary">{product.name}</span>}
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                      {dictionary.blogs.readArticle}
                      <ArrowLeftIcon className="size-3.5 rtl:rotate-180" aria-hidden="true" />
                    </span>
                  </article>
                </Reveal>
              )
            })}
          </ul>
        </section>
      )}
    </>
  )
}
