"use client"

import Link from "next/link"
import { ShoppingCartIcon } from "lucide-react"

import { useCart } from "@/lib/cart"
import { Button } from "@/components/ui/button"

export function CartIndicator({ href, label }: { href: string; label: string }) {
  const { itemCount } = useCart()

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      nativeButton={false}
      render={<Link href={href} />}
    >
      <span className="relative inline-flex">
        <ShoppingCartIcon className="size-5" />
        {itemCount > 0 && (
          <span className="absolute -end-2 -top-2 flex size-4 items-center justify-center rounded-full bg-primary text-[0.6rem] font-semibold text-primary-foreground">
            {itemCount > 9 ? "9+" : itemCount}
          </span>
        )}
      </span>
    </Button>
  )
}
