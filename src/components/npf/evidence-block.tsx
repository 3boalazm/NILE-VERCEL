import Link from "next/link"
import { ArrowLeftIcon, FileDownIcon, FlaskConicalIcon } from "lucide-react"

import type { Product } from "@/lib/products"
import type { Locale } from "@/lib/i18n/config"
import { productHeading } from "@/lib/seo/product-identity"
import { canExposeField, catalogHasPublicEvidence } from "@/lib/seo/sku-evidence"
import type { Dictionary } from "@/lib/i18n/dictionaries"
import { Reveal } from "./motion/reveal"

/**
 * "What does evidence-based mean?" — the audit's evidence section. Explains
 * the claim in plain words and backs it with the two things we actually
 * have on file: a count of the published references cited across the
 * catalog, and the official product leaflets (PDF). Everything here is
 * derived from catalog data, nothing is asserted that isn't already on a
 * product page.
 */
export function EvidenceBlock({
  products,
  locale,
  dictionary,
}: {
  products: Product[]
  locale: Locale
  dictionary: Dictionary
}) {
  if (!catalogHasPublicEvidence(products)) return null
  const base = `/${locale}`
  const copy = dictionary.home
  // Distinct published references across the catalog — two products citing
  // the same paper count once, so the number can't inflate as lines grow.
  const referenceCount = new Set(
    products
      .filter((product) => canExposeField(product, "clinicalReferences", "MEDICAL_CONTENT"))
      .flatMap((product) =>
        (product.clinicalReferences ?? []).map((reference) => (reference.url ?? reference.title).trim().toLowerCase())
      )
  ).size
  const leaflets = products.filter((product) => canExposeField(product, "leaflet", "EDITORIAL_CONTENT"))
  const withScience = products.filter((product) => canExposeField(product, "scientificInfo", "EDITORIAL_CONTENT")).slice(0, 3)

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
      <Reveal className="flex flex-col gap-5">
        <span className="eyebrow inline-flex w-fit items-center gap-2 text-primary">
          <FlaskConicalIcon className="size-3.5" aria-hidden="true" />
          {copy.evidenceEyebrow}
        </span>
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{copy.evidenceTitle}</h2>
        <p className="max-w-xl text-pretty leading-relaxed text-muted-foreground">{copy.evidenceBody}</p>
        {referenceCount > 0 && (
          <div className="flex items-baseline gap-3 pt-2">
            <span className="font-heading text-5xl font-semibold tabular-nums text-primary">{referenceCount}</span>
            <span className="max-w-[14rem] text-sm leading-snug text-muted-foreground">{copy.evidenceReferencesLabel}</span>
          </div>
        )}
        {withScience.length > 0 && (
          <ul className="flex flex-wrap gap-2 pt-1">
            {withScience.map((product) => (
              <li key={product.id}>
                <Link
                  href={`${base}/products/${product.slug}`}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-muted"
                >
                  {productHeading(product, locale)}
                  <span className="text-muted-foreground">· {copy.evidenceProductCta}</span>
                  <ArrowLeftIcon className="size-3.5 rtl:rotate-180" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Reveal>

      {leaflets.length > 0 && (
        <Reveal delay={0.1} className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h3 className="font-heading text-lg font-semibold">{copy.evidenceLeafletsTitle}</h3>
          <ul className="divide-y divide-border">
            {leaflets.map((product) => (
              <li key={product.id}>
                <a
                  href={product.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex min-h-14 items-center justify-between gap-4 py-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span className="flex flex-col">
                    <span className="font-medium">{productHeading(product, locale)}</span>
                    <span className="text-xs text-muted-foreground">{copy.evidenceLeafletCta} · PDF</span>
                  </span>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <FileDownIcon className="size-4" aria-hidden="true" />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
      )}
    </div>
  )
}
