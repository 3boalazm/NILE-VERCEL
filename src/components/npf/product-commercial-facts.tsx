import Link from "next/link"

import type { Dictionary } from "@/lib/i18n/dictionaries"
import type { CommercialFact } from "@/lib/products/commercial-profile"

/**
 * Factual product information only. Brand, manufacturer, and generated
 * FAQ sections are not part of this component. Empty facts render nothing.
 */
export function ProductCommercialFacts({
  facts,
  dictionary,
  productsHref,
}: {
  facts: readonly CommercialFact[]
  dictionary: Dictionary["product"]
  productsHref: string
}) {
  if (facts.length === 0) return null
  const labels: Record<CommercialFact["key"], string> = {
    category: dictionary.category,
    form: dictionary.availableForm,
    sku: dictionary.sku,
    availability: dictionary.availability,
    brand: dictionary.brand,
    manufacturer: dictionary.manufacturer,
  }

  return (
    <section className="flex flex-col gap-3" aria-labelledby="product-information">
      <h2 id="product-information" className="font-heading text-base font-medium">
        {dictionary.informationTitle}
      </h2>
      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        {facts.map((fact) => (
          <div key={fact.key}>
            <dt className="text-muted-foreground">{labels[fact.key]}</dt>
            <dd className="font-medium">{fact.value}</dd>
          </div>
        ))}
      </dl>
      <Link href={productsHref} className="w-fit text-sm font-medium text-primary hover:underline">
        {dictionary.backToProducts}
      </Link>
    </section>
  )
}
