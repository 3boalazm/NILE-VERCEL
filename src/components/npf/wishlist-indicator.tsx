"use client"

import Link from "next/link"
import { HeartIcon } from "lucide-react"

import { useWishlist } from "@/lib/wishlist"
import { Button } from "@/components/ui/button"

export function WishlistIndicator({
  href,
  label,
  className,
}: {
  href: string
  label: string
  className?: string
}) {
  const { slugs } = useWishlist()
  const count = slugs.length

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      className={className}
      nativeButton={false}
      render={<Link href={href} />}
    >
      <span className="relative inline-flex">
        <HeartIcon className="size-5" />
        {count > 0 && (
          <span className="absolute -end-2 -top-2 flex size-4 items-center justify-center rounded-full bg-primary text-[0.6rem] font-semibold text-primary-foreground">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </span>
    </Button>
  )
}
