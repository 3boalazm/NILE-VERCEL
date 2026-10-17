import type { Dictionary } from "@/lib/i18n/dictionaries"
import type { EvidenceTier } from "./types"

/**
 * Maps an evidence tier onto its dictionary label. Kept next to the type
 * rather than inside a component so the listing, the article page and any
 * future email/RSS output all describe a tier identically.
 */
export function evidenceTierLabel(tier: EvidenceTier, dictionary: Dictionary): string {
  const copy = dictionary.blogs
  switch (tier) {
    case "direct-rct":
      return copy.tierDirectRct
    case "direct-other":
      return copy.tierDirectOther
    case "systematic-review":
      return copy.tierSystematicReview
    default:
      return copy.tierIngredient
  }
}

/** Colour class per tier — the strongest evidence reads as the most solid. */
export const TIER_BADGE_CLASS: Record<EvidenceTier, string> = {
  "direct-rct": "border-primary/30 bg-primary/10 text-primary",
  "direct-other": "border-chart-3/40 bg-chart-3/10 text-foreground",
  "systematic-review": "border-chart-2/40 bg-chart-2/10 text-foreground",
  ingredient: "border-border bg-muted text-muted-foreground",
}

/** Ordering weight so the strongest studies lead their product group. */
export const TIER_ORDER: Record<EvidenceTier, number> = {
  "direct-rct": 0,
  "direct-other": 1,
  "systematic-review": 2,
  ingredient: 3,
}
