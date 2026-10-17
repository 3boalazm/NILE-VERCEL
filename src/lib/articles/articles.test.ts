import { describe, expect, it } from "vitest"

import { mockArticles } from "./mock-repository"
import { MockArticleRepository } from "./repository"
import { localizeArticle } from "./types"

/**
 * The article list is the one place where a mistake is expensive: a reader
 * treats what is written here as the published record. These tests pin three
 * things — that every approved row is live, that the internal review notes
 * (which quote the numbers that were wrong) never reach reader-facing text,
 * and that the two topic-only sources stay detached from any product.
 */
const repository = new MockArticleRepository()

/** Everything a reader can actually see, in both locales. */
function publicText(article: (typeof mockArticles)[number]): string {
  const en = article.translations?.en
  return JSON.stringify({
    title: article.title,
    summary: article.summary,
    keyFindings: article.keyFindings,
    caveat: article.caveat,
    source: article.source,
    en: en
      ? {
          title: en.title,
          summary: en.summary,
          keyFindings: en.keyFindings,
          caveat: en.caveat,
        }
      : undefined,
  })
}

describe("articles", () => {
  it("publishes every approved row through every public read path", async () => {
    expect(mockArticles.length).toBe(12)
    expect(mockArticles.every((article) => article.status === "published")).toBe(true)
    const published = await repository.getPublishedArticles()
    expect(published.map((article) => article.slug).sort()).toEqual(
      mockArticles.map((article) => article.slug).sort()
    )
  })

  it("resolves every article by slug", async () => {
    for (const article of mockArticles) {
      expect((await repository.getArticleBySlug(article.slug))?.id).toBe(article.id)
    }
  })

  it("keeps every article's internal review note out of reader-facing text", () => {
    const corrected = mockArticles.filter((article) => article.reviewNote)
    // Seven rows were corrected against the publisher record; the notes stay
    // as the internal audit trail, and none of them may leak.
    expect(corrected.length).toBe(7)
    for (const article of corrected) {
      const note = article.reviewNote as string
      expect(note.trim().length).toBeGreaterThan(20)
      expect(publicText(article)).not.toContain(note)
    }
  })

  it("carries the corrected Cochrane citation and never the submitted numbers", () => {
    const cochrane = mockArticles.find((article) => article.slug.includes("cochrane"))
    expect(cochrane).toBeDefined()
    // Author and journal were wrong in the source list; the DOI was right.
    expect(cochrane?.source.authors).toContain("de Ligny")
    expect(cochrane?.source.doi).toBe("10.1002/14651858.CD007411.pub5")
    // The submitted ORs (4.21 / 3.43) must never reach reader-facing text —
    // they survive only inside the internal review note that documents the
    // correction. The rendered page is checked separately, but this catches a
    // regression at the data layer first.
    expect(publicText(cochrane!)).not.toContain("4.21")
    expect(publicText(cochrane!)).not.toContain("3.43")
    expect(cochrane?.reviewNote).toContain("4.21")
    expect(cochrane?.keyFindings.join(" ")).toContain("1.43")
  })

  it("publishes the two non-supporting sources without a product link", async () => {
    // The female-infertility composition review and the IVF review contradict
    // or do not relate to the products they were filed under, so they are
    // topic-only: no product page may present them as its evidence.
    for (const slug of [
      "vitagliano-2021-supplement-composition",
      "hart-2024-nutritional-supplements-ivf",
    ]) {
      const article = mockArticles.find((row) => row.slug === slug)
      expect(article?.productSlug).toBe("")
      expect(await repository.getArticlesByProduct(slug)).toEqual([])
    }
    expect((await repository.getArticlesByProduct("proxerex")).map((a) => a.slug)).not.toContain(
      "vitagliano-2021-supplement-composition"
    )
    expect((await repository.getArticlesByProduct("ellamuselle")).map((a) => a.slug)).not.toContain(
      "hart-2024-nutritional-supplements-ivf"
    )
  })

  it("keeps every article self-consistent: a caveat, a source, and findings", () => {
    for (const article of mockArticles) {
      expect(article.caveat.trim().length).toBeGreaterThan(40)
      expect(article.source.doi || article.source.url).toBeTruthy()
      expect(article.keyFindings.length).toBeGreaterThan(0)
      expect(article.title.trim()).not.toBe("")
      // A body of writing that never states its own limits is what we refuse.
      expect(article.caveat.trim()).not.toBe("")
      if (article.translations?.en) {
        expect(article.translations.en.keyFindings?.length ?? 0).toBeGreaterThan(0)
        expect((article.translations.en.caveat ?? "").trim().length).toBeGreaterThan(40)
      }
    }
  })

  it("localizes to English without dropping the source fields", () => {
    const article = mockArticles.find((row) => row.slug === "micic-2019-sperm-parameters-trial")
    expect(article).toBeDefined()
    const en = localizeArticle(article!, "en")
    expect(en.title).not.toBe(article!.title)
    expect(en.source.authors).toBe(article!.source.authors)
    expect(en.source.doi).toBe(article!.source.doi)
    expect(localizeArticle(article!, "ar").title).toBe(article!.title)
  })
})
