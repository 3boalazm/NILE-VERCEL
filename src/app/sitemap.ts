import type { MetadataRoute } from "next"

import { PUBLISHED_CONTENT } from "@/lib/content/registry"
import { listEvidenceDecisions, listEvidenceRecords } from "@/lib/evidence/store"
import { productRepository, MockProductRepository } from "@/lib/products"
import type { Product } from "@/lib/products"
import { articleRepository } from "@/lib/articles"
import type { Article } from "@/lib/articles"
import { jobRepository } from "@/lib/jobs"
import type { Job } from "@/lib/jobs"
import { locales } from "@/lib/i18n/config"
import { absoluteUrl } from "@/lib/seo/site"
import { buildSitemapEntries } from "@/lib/seo/sitemap-entries"

function localizedEntry(path: string) {
  const languages = Object.fromEntries(locales.map((locale) => [locale, absoluteUrl(`/${locale}${path}`)]))
  return locales.map((locale) => ({ url: absoluteUrl(`/${locale}${path}`), alternates: { languages } }))
}

/**
 * The sitemap is generated per request, not baked into the build.
 *
 * It is built from the live catalog (Payload/Postgres), and the catalog is
 * the one thing the *build* cannot always see: a build container may have no
 * DATABASE_URI, or a database it cannot reach. Pre-rendering the sitemap made
 * the build depend on that reachability — and, worse, a sitemap built from a
 * catalog the build machine could not read would ship without the product
 * URLs, which is exactly the part crawlers need.
 *
 * Generating it per request costs one function invocation per crawler fetch
 * (a few per day) and removes the whole class of failure: the sitemap always
 * lists the products that are actually published, and the build needs no
 * database at all.
 */
export const dynamic = "force-dynamic"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let products: Product[]
  try {
    products = await productRepository.getAllProducts()
  } catch (error) {
    // The Payload repository fails closed by default (no mock data in
    // production); reaching this catch means the database is genuinely down.
    // sitemap.xml is a crawler convenience — when the mock fallback is
    // EXPLICITLY enabled (dev/CI offline browsing, MOCK_CATALOG_FALLBACK=1)
    // we keep serving static routes + eligible mock slug URLs.
    //
    // Without it, the sitemap degrades to the static routes only: a 500 for
    // /sitemap.xml tells a crawler "the whole site is broken", while a
    // sitemap without the product URLs just means "the products are not
    // listed right now" — and it still advertises no mock URL, which is what
    // failing closed was protecting.
    if (process.env.MOCK_CATALOG_FALLBACK !== "1" && process.env.MOCK_CATALOG_FALLBACK !== "true") {
      console.error(`[sitemap] product repository failed (${error instanceof Error ? error.message : error}); serving the static routes only`)
      products = []
    } else {
      console.error(`[sitemap] product repository failed (${error instanceof Error ? error.message : error}); falling back to the mock catalog (MOCK_CATALOG_FALLBACK enabled)`)
      products = await new MockProductRepository().getAllProducts()
    }
  }

  // Articles and jobs are CMS content and a crawler convenience: an outage
  // degrades to "no URLs for them" instead of failing the whole sitemap. The
  // listing routes are only advertised once there is something real to index
  // (an empty listing is noindex).
  let articles: Article[] = []
  try {
    articles = await articleRepository.getPublishedArticles()
  } catch (error) {
    console.error(`[sitemap] article repository failed (${error instanceof Error ? error.message : error})`)
  }
  let jobs: Job[] = []
  try {
    jobs = await jobRepository.getOpenJobs()
  } catch (error) {
    console.error(`[sitemap] job repository failed (${error instanceof Error ? error.message : error})`)
  }

  return [
    ...buildSitemapEntries(products, PUBLISHED_CONTENT, listEvidenceRecords(), listEvidenceDecisions()),
    ...(articles.length > 0 ? localizedEntry("/blogs") : []),
    ...articles.flatMap((article) => localizedEntry(`/blogs/${article.slug}`)),
    ...(jobs.length > 0 ? localizedEntry("/careers") : []),
    ...jobs.flatMap((job) => localizedEntry(`/careers/${job.slug}`)),
  ]
}
