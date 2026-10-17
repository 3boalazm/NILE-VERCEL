"use client"

import { useState } from "react"

import type { ProductStatus } from "@/lib/products"
import { QuantityStepper } from "./quantity-stepper"
import { AddToCartButton } from "./add-to-cart-button"

type Product = {
  id: string
  slug: string
  name: string
  image?: string | null
  priceSource?: "live" | "demo" | "unavailable"
  price?: number
  currency?: string
  sku?: string
  status: ProductStatus
}

export function ProductAddToCart({
  product,
  labels,
}: {
  product: Product
  labels: { add: string; added: string; unavailable: string; quantity: string; error?: string }
}) {
  const [quantity, setQuantity] = useState(1)
  const disabled = product.status !== "active" || product.priceSource !== "live"

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-3">
      {!disabled && (
        <QuantityStepper value={quantity} onChange={setQuantity} label={labels.quantity} />
      )}
      <AddToCartButton
        product={product}
        quantity={quantity}
        variant="full"
        labels={labels}
        className="flex-1"
      />
    </div>
  )
}
