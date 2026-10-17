import type { ProductStatus } from "@/lib/products"
import type { Dictionary } from "@/lib/i18n/dictionaries"
import { Badge } from "@/components/ui/badge"

const VARIANT_BY_STATUS: Record<
  ProductStatus,
  "default" | "secondary" | "outline"
> = {
  active: "default",
  launching_soon: "secondary",
  paused: "outline",
}

export function ProductStatusBadge({
  status,
  dictionary,
}: {
  status: ProductStatus
  /** Narrowed so both `Dictionary` and `ClientSafeDictionary` callers fit. */
  dictionary: Pick<Dictionary, "status">
}) {
  if (status === "active") return null

  return (
    <Badge variant={VARIANT_BY_STATUS[status]}>
      {dictionary.status[status]}
    </Badge>
  )
}
