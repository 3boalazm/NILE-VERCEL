"use client"

import { useEffect, useRef, useState } from "react"
import { CheckIcon, ShoppingCartIcon, TriangleAlertIcon } from "lucide-react"

import type { ProductStatus } from "@/lib/products"
import { useCart } from "@/lib/cart"
import { cn } from "@/lib/utils"

type AddToCartProduct = {
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

type AddToCartLabels = {
  add: string
  added: string
  unavailable: string
  error?: string
}

export function AddToCartButton({
  product,
  quantity = 1,
  variant = "icon",
  tone = "onImage",
  labels,
  className,
}: {
  product: AddToCartProduct
  quantity?: number
  variant?: "icon" | "full"
  /**
   * Idle colours for the icon variant: `onImage` (white outline, for a
   * button floating over a photo) or `onSurface` (border/foreground tokens,
   * for a button sitting on a card surface).
   */
  tone?: "onImage" | "onSurface"
  labels: AddToCartLabels
  className?: string
}) {
  const { addItem } = useCart()
  const [justAdded, setJustAdded] = useState(false)
  const [addError, setAddError] = useState(false)
  const [adding, setAdding] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const unavailable = product.status !== "active" || product.priceSource !== "live"
  const disabled = unavailable || adding

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  async function handleClick() {
    if (disabled) return
    setAdding(true)
    try {
      const { error } = await addItem({ slug: product.slug }, quantity)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (error) {
        setAddError(true)
        timeoutRef.current = setTimeout(() => setAddError(false), 2400)
      } else {
        setJustAdded(true)
        timeoutRef.current = setTimeout(() => setJustAdded(false), 1600)
      }
    } catch {
      setAddError(true)
      timeoutRef.current = setTimeout(() => setAddError(false), 2400)
    } finally { setAdding(false) }
  }

  const title = unavailable
    ? labels.unavailable
    : addError
      ? (labels.error ?? labels.add)
      : justAdded
        ? labels.added
        : labels.add

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        // PDP-primary CTA marker: the PDP also renders related-product cards
        // with their own quick-add buttons, so e2e must be able to target
        // THIS button unambiguously (see e2e/commerce.spec.ts).
        data-testid="pdp-add-to-cart"
        title={title}
        data-state={addError ? "error" : justAdded ? "added" : undefined}
        className={cn("ng-btn ng-btn-primary ng-btn-lg flex-1 sm:flex-initial", className)}
      >
        {addError ? (
          <TriangleAlertIcon aria-hidden="true" />
        ) : justAdded ? (
          <CheckIcon aria-hidden="true" />
        ) : (
          <ShoppingCartIcon aria-hidden="true" />
        )}
        {title}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={title}
      title={title}
      data-tone={tone}
      data-state={addError ? "error" : justAdded ? "added" : undefined}
      className={cn("ngc-cart-btn", className)}
    >
      {addError ? (
        <TriangleAlertIcon aria-hidden="true" />
      ) : justAdded ? (
        <CheckIcon aria-hidden="true" />
      ) : (
        <ShoppingCartIcon aria-hidden="true" />
      )}
    </button>
  )
}
