import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowLeftIcon, ExternalLinkIcon, FileTextIcon, TriangleAlertIcon } from "lucide-react"

import { isValidLocale, type Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { ctaButtonVariants } from "@/components/ui/button"
import { Reveal } from "@/components/npf/motion/reveal"
import { buildPageMetadata } from "@/lib/seo/page-metadata"
import { articleRepository, localizeArticle } from "@/lib/articles"
import { localizeProduct, productRepository } from "@/lib/products"
import { evidenceTierLabel, TIER_BADGE_CLASS, TIER_ORDER } from "@/lib/articles/evidence-tier"
import { cn } from "@/lib/utils"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/blogs/[slug]">): Promise<Metadata> {
  const { locale: localeParam, slug } = await params
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "ar"
  const article = await articleRepository.getArticleBySlug(slug)
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

  const article = await articleRepository.getArticleBySlug(slug)
  if (!article) notFound()
  const localized = localizeArticle(article, locale)

  const [products, siblings] = await Promise.all([
    productRepository.getAllProducts(),
    articleRepository.getArticlesByProduct(localized.productSlug),
  ])
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

  return (
    <>
      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <Reveal className="flex flex-col gap-5">
          <Link
            href={`${base}/blogs`}
            className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="size-3.5 rotate-180 rtl:rotate-0" aria-hidden="true" />
            {copy.backToBlog}
          </Link>

          <span
            className={cn(
              "w-fit rounded-full border px-3 py-1 text-xs font-medium",
              TIER_BADGE_CLASS[localized.evidenceTier]
            )}
          >
            {evidenceTierLabel(localized.evidenceTier, dictionary)}
          </span>

          <h1 className="font-heading text-3xl font-semibold leading-tight text-balance sm:text-4xl">
            {localized.title}
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">{localized.summary}</p>
        </Reveal>

        {/* Key findings */}
        <Reveal as="section" delay={0.06} className="mt-12 flex flex-col gap-4">
          <h2 className="font-heading text-xl font-semibold">{copy.findingsLabel}</h2>
          <ul className="flex flex-col gap-3">
            {localized.keyFindings.map((finding) => (
              <li key={finding} className="flex gap-3 text-pretty leading-relaxed">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                <span>{finding}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Caveat — visually separated on purpose */}
        <Reveal
          as="section"
          delay={0.08}
          className="mt-10 rounded-2xl border border-chart-3/40 bg-chart-3/5 p-5 sm:p-6"
        >
          <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
            <TriangleAlertIcon className="size-4 text-chart-3" aria-hidden="true" />
            {copy.caveatLabel}
          </h2>
          <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">{localized.caveat}</p>
        </Reveal>

        {/* Source */}
        <Reveal as="section" delay={0.1} className="mt-10 rounded-2xl border bg-card p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
            <FileTextIcon className="size-4 text-primary" aria-hidden="true" />
            {copy.sourceLabel}
          </h2>
          <dl className="mt-4 flex flex-col gap-1.5 text-sm">
            <dd className="font-medium leading-snug">{localized.source.title}</dd>
            <dd className="text-muted-foreground">{localized.source.authors}</dd>
            <dd className="text-muted-foreground">
              {localized.source.journal} · {localized.source.year}
            </dd>
            <dd className="text-muted-foreground">{localized.source.type}</dd>
            {localized.source.doi && <dd className="text-muted-foreground">DOI: {localized.source.doi}</dd>}
          </dl>
          {(sourceUrl || pubmedUrl) && (
            <div className="mt-4 flex flex-wrap gap-3">
              {sourceUrl && (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  {copy.viewSource}
                  <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
                </a>
              )}
              {pubmedUrl && (
                <a
                  href={pubmedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  PubMed
                  <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
                </a>
              )}
            </div>
          )}
        </Reveal>

        {localizedProduct && (
          <Reveal as="div" delay={0.12} className="mt-10">
            <Link
              href={`${base}/products/${localizedProduct.slug}`}
              className={cn(ctaButtonVariants({ variant: "onLight" }), "w-fit")}
            >
              {copy.productCta}: {localizedProduct.name}
            </Link>
          </Reveal>
        )}
      </article>

      {related.length > 0 && (
        <section className="border-t bg-anti-flash-white/60 dark:bg-card/40">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="font-heading text-xl font-semibold">{copy.relatedArticles}</h2>
            <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {related.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`${base}/blogs/${item.slug}`}
                    className="flex h-full flex-col gap-2 rounded-2xl border bg-card p-5 transition-colors hover:border-primary/30"
                  >
                    <span
                      className={cn(
                        "w-fit rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                        TIER_BADGE_CLASS[item.evidenceTier]
                      )}
                    >
                      {evidenceTierLabel(item.evidenceTier, dictionary)}
                    </span>
                    <span className="font-medium leading-snug text-balance">{item.title}</span>
                    <span className="mt-auto text-xs text-muted-foreground">
                      {item.source.journal} · {item.source.year}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  )
}
