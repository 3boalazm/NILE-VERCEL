import Link from "next/link"
import { CloudOffIcon } from "lucide-react"

import { Notice } from "@/components/glass/content"

import { getCatalogNoticeCopy } from "@/lib/i18n/catalog-copy"
import type { Locale } from "@/lib/i18n/config"

/**
 * The "catalog unavailable" notice.
 *
 * Rendered where the product grid would have been when the CMS cannot be
 * read (database unreachable, runtime env missing, migration pending). The
 * rest of the page — hero, navigation, editorial content, contact details,
 * footer — keeps rendering, so a backend outage costs the customer the
 * product list and nothing else.
 *
 * It is deliberately *not* the error boundary: the boundary replaces the
 * whole page, this replaces one section. The difference matters — a customer
 * who cannot see the products can still read about the brand, find the phone
 * number and send a message.
 *
 * Server Component on purpose: no interactivity is needed, and it keeps the
 * client bundle free of the notice's markup.
 */
export function CatalogUnavailable({
  locale,
  className,
}: {
  locale: Locale
  className?: string
}) {
  const copy = getCatalogNoticeCopy(locale)
  return (
    <Notice
      className={className}
      role="status"
      aria-live="polite"
      data-catalog-state="unavailable"
      mark={<CloudOffIcon className="size-7" />}
      eyebrow={copy.eyebrow}
      title={copy.title}
      body={copy.body}
    >
      <div className="ng-hero-cta">
        <Link href={`/${locale}/contact`} className="ng-btn ng-btn-primary">
          {copy.contactCta}
          <span className="ng-arrow" aria-hidden="true">↗</span>
        </Link>
        <Link href={`/${locale}/products`} className="ng-btn ng-btn-ghost">
          {copy.browseCta}
        </Link>
      </div>
    </Notice>
  )
}
