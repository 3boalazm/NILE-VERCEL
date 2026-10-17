"use client"

import { useId, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowUpRightIcon,
  ArrowRightIcon,
  HeartPulseIcon,
  MicroscopeIcon,
  SparklesIcon,
} from "lucide-react"
import type { Locale } from "@/lib/i18n/config"
import type { Product } from "@/lib/products/types"
import { NEEDS, productsForNeed } from "@/lib/products/positioning"
import { getArtDirectionCopy } from "@/lib/i18n/art-direction"

const icons = [HeartPulseIcon, SparklesIcon, MicroscopeIcon]
export function NeedExplorer({
  products,
  locale,
}: {
  products: Product[]
  locale: Locale
}) {
  const c = getArtDirectionCopy(locale)
  const groups = NEEDS.filter((n) => !n.comingSoon)
  const [selected, setSelected] = useState(groups[0].param)
  const panelId = useId()
  const labels = [c.men, c.women, c.devices]
  return (
    <div className="need-explorer">
      <div className="need-explorer-rail">
        <span className="prism-kicker">{c.field}</span>
        <div className="need-options">
          {groups.map((group, index) => {
            const Icon = icons[index]
            const active = selected === group.param
            return (
              <button
                key={group.id}
                type="button"
                aria-pressed={active}
                aria-controls={panelId}
                onClick={() => setSelected(group.param)}
                className={`need-option ${active ? "is-selected" : ""}`}
              >
                <span className="need-option-icon">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span>{labels[index]}</span>
                <ArrowRightIcon
                  className="size-4 rtl:rotate-180"
                  aria-hidden="true"
                />
              </button>
            )
          })}
        </div>
        <p className="need-rail-note">{c.pathIntro}</p>
        <Link href={`/${locale}/products`} className="prism-text-link">
          {c.all}
          <ArrowUpRightIcon className="size-4" aria-hidden="true" />
        </Link>
        <noscript>
          <div className="flex flex-col gap-3">
            {groups.map((group, index) => (
              <Link
                key={group.id}
                href={`/${locale}/products?need=${group.param}`}
              >
                {labels[index]}
              </Link>
            ))}
          </div>
        </noscript>
      </div>
      <div
        id={panelId}
        className="need-explorer-panels"
        aria-live="polite"
        aria-atomic="false"
      >
        {groups.map((group, index) => {
          const matches = productsForNeed(products, group)
          return (
            <section
              key={group.id}
              hidden={selected !== group.param}
              aria-label={labels[index]}
              className={`need-panel need-panel-${index}`}
            >
              <div className="need-panel-head">
                <span>
                  {labels[index]}
                  <small>
                    {String(matches.length).padStart(2, "0")} / {c.available}
                  </small>
                </span>
                <Link
                  href={`/${locale}/products?need=${group.param}`}
                  className="need-round-link"
                  aria-label={`${c.viewRange}: ${labels[index]}`}
                >
                  <ArrowUpRightIcon className="size-5" aria-hidden="true" />
                </Link>
              </div>
              <div className="need-product-editorial">
                {matches.slice(0, 3).map((product, productIndex) => (
                  <Link
                    key={product.id}
                    href={`/${locale}/products/${product.slug}`}
                    className={`need-product need-product-${productIndex}`}
                  >
                    <div className="need-product-art">
                      {product.image && (
                        <Image
                          src={product.image}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 23vw, (min-width: 640px) 33vw, 70vw"
                          className="object-cover"
                        />
                      )}
                      <span className="need-product-index" aria-hidden="true">
                        0{productIndex + 1}
                      </span>
                      <span className="need-product-open">
                        <ArrowUpRightIcon
                          className="size-5"
                          aria-hidden="true"
                        />
                      </span>
                    </div>
                    <div className="need-product-caption">
                      <h3>{product.name}</h3>
                      <p>{product.availableForm}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
