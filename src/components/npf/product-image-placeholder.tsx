import { PackageIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export function ProductImagePlaceholder({
  className,
}: {
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex aspect-square w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50 text-muted-foreground",
        className
      )}
      aria-hidden="true"
    >
      <PackageIcon className="size-10 opacity-40" strokeWidth={1.25} />
    </div>
  )
}
