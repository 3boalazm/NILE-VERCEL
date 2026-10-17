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
      className={cn(
        // 36px visual on desktop, 44px tap target on touch screens (mobile audit).
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 max-lg:size-11",
        variant === "overlay"
          ? "border border-white/30 text-white hover:bg-white/15"
          : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground",
        active && (variant === "overlay" ? "border-destructive bg-destructive/80" : "border-destructive/30 text-destructive"),
        className
      )}
    >
      <HeartIcon className={cn("size-4", active && "fill-current")} />
    </button>
  )
}
