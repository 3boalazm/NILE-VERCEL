"use client"

import { useEffect, useRef, useState } from "react"
import { CheckIcon, ShoppingCartIcon, TriangleAlertIcon } from "lucide-react"

import type { ProductStatus } from "@/lib/products"
import { useCart } from "@/lib/cart"
import { cn } from "@/lib/utils"
import { ctaButtonVariants } from "@/components/ui/button"

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
        className={cn(
          ctaButtonVariants({ variant: "outline" }),
          "flex-1 justify-center sm:flex-initial",
          justAdded && "border-primary text-primary",
          addError && "border-destructive text-destructive",
          className
        )}
      >
        {addError ? (
          <TriangleAlertIcon className="size-4" />
        ) : justAdded ? (
          <CheckIcon className="size-4" />
        ) : (
          <ShoppingCartIcon className="size-4" />
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
      className={cn(
        // 44px everywhere: it sits next to a 44px primary CTA on the card,
        // and a 36-40px round target is exactly what the mobile audit flagged.
        "inline-flex size-11 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
        addError
          ? "border-destructive bg-destructive text-white"
          : justAdded
            ? "border-primary bg-primary text-primary-foreground"
            : tone === "onSurface"
              ? "border-border text-foreground hover:bg-muted"
              : "border-white/30 text-white hover:bg-white/15",
        disabled && "pointer-events-none opacity-40",
        className
      )}
    >
      {addError ? (
        <TriangleAlertIcon className="size-4" />
      ) : justAdded ? (
        <CheckIcon className="size-4" />
      ) : (
        <ShoppingCartIcon className="size-4" />
      )}
    </button>
  )
}
