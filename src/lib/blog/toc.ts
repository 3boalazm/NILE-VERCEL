import type { Article } from "./articles"

/**
 * F-13 — table of contents generated FROM the article body.
 *
 * The original defect (report 01, FT-BLOG-002) was a "المحتويات" block that
 * rendered empty because its entries were hard-coded separately from the
 * content. Deriving them from the sections makes emptiness impossible while
 * the article has sections, and keeps anchors/ids in one place: the same
 * `section.id` renders the heading's `id` attribute and the TOC link's href,
 * so a link can never point at a heading that does not exist.
 */
export type TocEntry = { id: string; heading: string }

export function buildToc(article: Article): TocEntry[] {
  return article.sections.map((section) => ({ id: section.id, heading: section.heading }))
}
