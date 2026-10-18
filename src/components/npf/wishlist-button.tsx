"use client"

import { HeartIcon } from "lucide-react"

import { useWishlist } from "@/lib/wishlist"
import { cn } from "@/lib/utils"

export function WishlistButton({
  slug,
  addLabel,
  removeLabel,
  variant = "overlay",
  className,
}: {
  slug: string
  addLabel: string
  removeLabel: string
  variant?: "overlay" | "inline"
  className?: string
}) {
  const { isWishlisted, toggle } = useWishlist()
  const active = isWishlisted(slug)
  const title = active ? removeLabel : addLabel

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        toggle(slug)
      }}
      aria-label={title}
      aria-pressed={active}
      title={title}
      data-variant={variant}
      className={cn("ngc-wish", className)}
    >
      <HeartIcon aria-hidden="true" />
    </button>
  )
}
