"use client"

import Image from "next/image"
import { useState } from "react"

import { ProductImagePlaceholder } from "@/components/npf/product-image-placeholder"

/**
 * Line-item thumbnail for cart, checkout, confirmation and order pages.
 *
 * Vendure returns `featuredAsset.preview` as an ABSOLUTE asset-server URL
 * (e.g. http://localhost:3001/assets/...). `next/image`'s default loader
 * throws on any host missing from `images.remotePatterns`, and a throw inside
 * a line item took the whole cart/checkout down to the error boundary. Local
 * paths keep the optimiser; absolute URLs render unoptimised, and a URL the
 * browser cannot load (CSP, 404) falls back to the neutral placeholder.
 */
export function LineThumb({ src, sizes = "52px" }: { src?: string | null; sizes?: string }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return <ProductImagePlaceholder />
  const absolute = /^https?:\/\//.test(src)
  return (
    <Image
      src={src}
      alt=""
      fill
      sizes={sizes}
      unoptimized={absolute}
      onError={() => setFailed(true)}
    />
  )
}
