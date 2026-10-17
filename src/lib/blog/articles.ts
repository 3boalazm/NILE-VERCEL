import type { Locale } from "@/lib/i18n/config"

import { REAL_ARTICLES } from "./real-articles"

/**
 * F-13 — the article model + source seam.
 *
 * The audit's defect was an article page whose "المحتويات" block rendered
 * EMPTY (headings hard-coded to nothing). The structural fix is that the TOC
 * is now GENERATED from the article's own sections (see toc.ts), so it cannot
 * be empty while the article has content.
 *
 * Content source (updated 2026-09-23): the client supplied real, evidence-
 * based editorial content — a 12-study peer-reviewed audit of the catalog's
 * fertility supplements — authored natively per locale for readers
 * researching and comparing before purchase (see real-articles.ts). The
 * project's "no fake blog" rule is therefore satisfied, not bypassed: this IS
 * real, sourced content, and every article carries its references and a
 * medical disclaimer. `getArticles()` now returns it directly, and the
 * clearly-labelled SAMPLE articles below remain available only under
 * MOCK_BLOG_FALLBACK for dev/CI verification runs.
 */
export type ArticleSection = {
  id: string
  heading: string
  paragraphs: string[]
  /** Optional bullet list rendered after the paragraphs. */
  bullets?: string[]
}

export type ArticleSource = {
  /** Reference title (authors, year, journal). */
  title: string
  /** Resolvable link (DOI or publisher/PMC URL). */
  url: string
  /** One-line study-type note in the article's locale. */
  note?: string
}

export type Article = {
  slug: string
  title: string
  excerpt: string
  locale: Locale
  /** Present only on fixture articles; rendered as a visible watermark. */
  sampleNotice?: string
  sections: ArticleSection[]
  /** Peer-reviewed references summarised by the article. */
  sources?: ArticleSource[]
  /** Medical disclaimer rendered at the end of the article. */
  disclaimer?: string
}

const SAMPLE_AR: Article = {
  slug: "how-to-read-a-supplement-label",
  locale: "ar",
  title: "إزاي تقرأ ليبل المكمل الغذائي صح",
  excerpt: "دليل عملي لقراءة بطاقة العبوة: المادة الفعالة، التركيز، الجرعة، وتاريخ الصلاحية — من غير وعود ولا مبالغات.",
  sampleNotice: "محتوى تجريبي لأغراض التحقق التقني فقط — ليس منشورًا تحريريًا حقيقيًا.",
  sections: [
    {
      id: "active-ingredients",
      heading: "المادة الفعالة وتركيزها",
      paragraphs: [
        "أول سطر يستحق الانتباه في أي بطاقة عبوة هو قائمة المواد الفعالة وتركيز كل مادة في الجرعة الواحدة، مش في العبوة كلها. التركيز المكتوب «لكل قرص» أو «لكل كيس» هو الرقم اللي تقدر تقارن بيه منتج بمنتج.",
        "لو التركيز مكتوب «مزيج ملكي» من غير تفصيل لكل مادة، ده معناه إنك مش عارف فعلًا بتاخد إيه وبأي كمية.",
      ],
    },
    {
      id: "serving-size",
      heading: "حجم الجرعة وعدد الجرعات",
      paragraphs: [
        "حجم الجرعة (قرص، كيس، ملعقة) بيحدد معنى كل الأرقام التانية في البطاقة. منتج مكتوب عليه 60 قرص بجرعة قرصين يوميًا معناه عبوة شهر مش شهرين.",
        "قارن سعر العبوة بسعر «الكورس» الكامل عشان المقارنة تبقى عادلة بين المنتجات.",
      ],
    },
    {
      id: "expiry-and-storage",
      heading: "تاريخ الصلاحية وظروف التخزين",
      paragraphs: [
        "تاريخ الصلاحية مش رقم شكلي: بعض المواد الفعالة حساسة للحرارة والرطوبة، وظروف التخزين المكتوبة (بعيد عن الضوء، تحت 25 درجة مثلًا) جزء من صلاحية المنتج نفسه.",
        "اسأل دايمًا عن تاريخ الإنتاج مش بس انتهاء الصلاحية، وخصوصًا في المنتجات المستوردة.",
      ],
    },
    {
      id: "registration",
      heading: "التسجيل والجهات الرقابية",
      paragraphs: [
        "المكملات الغذائية الجادة بتكون مسجلة لدى جهة رقابية مختصة في بلد البيع. وجود رقم التسجيل على العبوة أو لدى الموزع المعتمد بيخلي المنتج قابلًا للتتبع.",
        "غياب أي إشارة للتسجيل علامة تستحق السؤال قبل الشراء، مش بعدها.",
      ],
    },
  ],
}

const SAMPLE_EN: Article = {
  slug: "how-to-read-a-supplement-label",
  locale: "en",
  title: "How to read a supplement label properly",
  excerpt: "A practical guide to reading the pack: active ingredient, strength per serving, dose and expiry — no promises, no hype.",
  sampleNotice: "Sample content for technical verification only — not a real editorial publication.",
  sections: [
    {
      id: "active-ingredients",
      heading: "Active ingredient and strength",
      paragraphs: [
        "The first line worth your attention on any pack is the active-ingredient list with the strength per serving — not per pack. The number printed \"per tablet\" or \"per sachet\" is the one that lets you compare products fairly.",
        "If strengths are hidden inside a \"proprietary blend\", you cannot tell what you are actually taking, or how much.",
      ],
    },
    {
      id: "serving-size",
      heading: "Serving size and servings per pack",
      paragraphs: [
        "Serving size (tablet, sachet, scoop) gives meaning to every other number on the label. A 60-tablet pack with a two-tablet daily dose is a one-month supply, not two.",
        "Compare the price of the full course, not just the pack, for a fair comparison.",
      ],
    },
    {
      id: "expiry-and-storage",
      heading: "Expiry and storage conditions",
      paragraphs: [
        "Expiry is not a formality: several actives are heat- and moisture-sensitive, and the printed storage conditions (away from light, below 25°C, for example) are part of the product's shelf life.",
        "Ask for the production date as well as the expiry, especially on imported products.",
      ],
    },
    {
      id: "registration",
      heading: "Registration and regulators",
      paragraphs: [
        "Serious supplements are registered with the competent authority in the country of sale. A registration number on the pack or held by the authorized distributor makes the product traceable.",
        "The absence of any registration reference is a question to ask before buying, not after.",
      ],
    },
  ],
}

export function getArticles(locale: Locale): Article[] {
  const enabled = process.env.MOCK_BLOG_FALLBACK === "1" || process.env.MOCK_BLOG_FALLBACK === "true"
  const real = REAL_ARTICLES.filter((article) => article.locale === locale)
  if (!enabled) return real
  return [...real, locale === "ar" ? SAMPLE_AR : SAMPLE_EN]
}

export function getArticle(slug: string, locale: Locale): Article | null {
  return getArticles(locale).find((article) => article.slug === slug) ?? null
}

/**
 * Related-article suggestions for the end of an article page: same-locale
 * real articles, current one excluded, newest-first (the array's editorial
 * order), capped. Never includes fixture articles.
 */
export function getRelatedArticles(slug: string, locale: Locale, count = 3): Article[] {
  return getArticles(locale)
    .filter((article) => article.slug !== slug && !article.sampleNotice)
    .slice(0, count)
}
