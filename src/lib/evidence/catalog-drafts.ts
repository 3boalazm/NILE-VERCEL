import { compositionSnapshot } from "./project"
import type { EvidenceDossier, FactField } from "./types"
import { addDraftFact, addDraftSource, emptyDossier } from "./workflow"
import { createServerGrant, type EvidenceActor } from "./access"

/**
 * Drafts built from leaflet files already in this repository.
 * Nothing here is approved. The actor can edit a draft and cannot review.
 * There is no human reviewer in the user model.
 */
const AT = "2026-09-24T00:00:00.000Z"
const ACTOR_ID = "repository-acquisition"

const NOT_APPROVED =
  "Draft only. No human reviewer. Not an approval. Re-read on 2026-09-24. Catalog was not changed. Approval authority is unavailable, so this record stays DRAFT and was not moved to UNDER_REVIEW. PRIVATE EVIDENCE STORAGE REQUIRED. The public repository path is not the locator and is not authority."

function editor(): EvidenceActor {
  const grant = createServerGrant(ACTOR_ID, ["edit"])
  if (!grant) throw new Error("acquisition grant")
  return { kind: "internal", grant }
}

function must<T>(result: { ok: true; value: T } | { ok: false; reason: string }): T {
  if (!result.ok) throw new Error(result.reason)
  return result.value
}

function source(
  dossier: EvidenceDossier,
  id: string,
  title: string,
  locator: string,
  note: string
): EvidenceDossier {
  return must(
    addDraftSource(
      dossier,
      {
        id,
        sourceType: "OFFICIAL_LEAFLET",
        title,
        locator,
        notes: `${NOT_APPROVED} ${note}`,
      },
      editor(),
      AT
    )
  )
}

function fact(
  dossier: EvidenceDossier,
  id: string,
  field: FactField,
  reviewedValue: string,
  sourceId: string,
  note: string,
  reviewedValueEn?: string
): EvidenceDossier {
  return must(
    addDraftFact(
      dossier,
      {
        id,
        field,
        reviewedValue,
        reviewedValueEn,
        sourceId,
        note: `${NOT_APPROVED} ${note}`,
      },
      editor(),
      AT
    )
  )
}

const WOMEN_COMPOSITION = [
  { label: "L-Carnitine", value: "500 mg" },
  { label: "Acetyl-L-Carnitine", value: "250 mg" },
  { label: "L-Arginine", value: "500 mg" },
  { label: "N-Acetyl Cysteine", value: "50 mg" },
  { label: "حديد", value: "7 mg" },
  { label: "زنك", value: "5 mg" },
  { label: "بيتا كاروتين", value: "4.8 mg" },
  { label: "فيتامين C", value: "90 mg" },
  { label: "فيتامين E", value: "30 mg" },
  { label: "فيتامين B5", value: "6 mg" },
  { label: "فيتامين B6", value: "2 mg" },
  { label: "حمض الفوليك", value: "200 µg" },
  { label: "نحاس", value: "0.5 mg" },
  { label: "سيلينيوم", value: "27.5 µg" },
  { label: "فيتامين D3", value: "5 µg" },
  { label: "فيتامين B12", value: "2.5 µg" },
] as const

const WOMEN_COMPOSITION_EN = [
  { label: "L-Carnitine", value: "500 mg" },
  { label: "Acetyl-L-Carnitine", value: "250 mg" },
  { label: "L-Arginine", value: "500 mg" },
  { label: "N-Acetyl Cysteine", value: "50 mg" },
  { label: "Iron", value: "7 mg" },
  { label: "Zinc", value: "5 mg" },
  { label: "Beta-carotene", value: "4.8 mg" },
  { label: "Vitamin C", value: "90 mg" },
  { label: "Vitamin E", value: "30 mg" },
  { label: "Vitamin B5", value: "6 mg" },
  { label: "Vitamin B6", value: "2 mg" },
  { label: "Folic acid", value: "200 µg" },
  { label: "Copper", value: "0.5 mg" },
  { label: "Selenium", value: "27.5 µg" },
  { label: "Vitamin D3", value: "5 µg" },
  { label: "Vitamin B12", value: "2.5 µg" },
] as const

function plus(): EvidenceDossier {
  const id = "src-proxeed-plus-leaflet"
  let dossier = source(
    emptyDossier("proxeed-plus"),
    id,
    "Proxeed Plus consumer leaflet",
    "proxeed-plus-leaflet.pdf",
    "Repository file public/downloads/proxeed-plus-leaflet.pdf. Consumer panel is image text. Presentation: 30 sachets per box; 5g per sachet. Flavour: Lemon. Use: dissolve 1 sachet in 200 ml of water or orange juice. Duration on the panel: at least 6 consecutive months. Composition panel: 20 mg of Zinc; sucrose 22,4%. Artwork edition 12.11.2024, plant modification 28/11/2024, practice C. 05030/4, article 45003973. Those are artwork dates, not a consumer edition line. Job title International. File-title words manf. Fine Foods are not a manufactured-by sentence. SKU PXD-PLS-001 is not printed."
  )
  dossier = fact(dossier, "name-proxeed-plus", "name", "Proxeed Plus", id, "Leaflet heading names Proxeed Plus. Arabic name was not confirmed from extractable text.")
  dossier = fact(
    dossier,
    "form-proxeed-plus",
    "form",
    "30 sachets per box; 5g per sachet.",
    id,
    "PARTIAL_MATCH. Count and sachet weight agree. The catalog form string is longer. This is the leaflet sentence, not a catalog snapshot. Not approval-ready against the current form string."
  )
  dossier = fact(
    dossier,
    "brand-proxeed-plus",
    "brand",
    "Alfasigma S.p.A.",
    id,
    "Trademark owner named on the leaflet. Not inferred from the product name. Distributor Alfasigma HealthScience BV is a different role and is not stored as the brand."
  )
  return dossier
}

function men(): EvidenceDossier {
  const id = "src-proxeed-men-leaflet"
  let dossier = source(
    emptyDossier("proxeed-men"),
    id,
    "Proxeed Men consumer leaflet",
    "proxeed-men-leaflet.pdf",
    "Repository file public/downloads/proxeed-men-leaflet.pdf. Presentation: 30 sachets per box; 6,5 g per sachet. Use volume 150 ml. Nutrition line has vitamin E 24 mg and does not state 7.5 µg. Artwork dates run from 26.11.2018 through plant modification 27/10/2023, practice C. 02140/10. Job title International. A print note names E-Pharma for a code insertion, not as manufacturer. SKU PXD-MEN-001 is not printed."
  )
  dossier = fact(dossier, "name-proxeed-men", "name", "Proxeed Men", id, "Leaflet heading names Proxeed Men. Arabic name was not confirmed as an exact match.")
  dossier = fact(
    dossier,
    "form-proxeed-men",
    "form",
    "30 sachets per box; 6,5 g per sachet.",
    id,
    "MATCHING CANDIDATE for 30 sachets and 6.5 g. The catalog form also says powder sachets. This draft stores the leaflet sentence, not the catalog sentence."
  )
  dossier = fact(
    dossier,
    "brand-proxeed-men",
    "brand",
    "Alfasigma s.p.a.",
    id,
    "Trademark owner as printed. Not a manufacturer authorization and not inferred from the product name."
  )
  return dossier
}

function women(): EvidenceDossier {
  const id = "src-proxeed-women-leaflet"
  let dossier = source(
    emptyDossier("proxeed-women"),
    id,
    "Proxeed Women consumer leaflet",
    "proxeed-women-leaflet.pdf",
    "Repository file public/downloads/proxeed-women-leaflet.pdf. Presentation: 30 sachets; 6 g per sachet. Use: 200 ml of still water. Energetic value 75 kJ (18 kcal) per sachet. No printed consumer edition date. SKU PXD-WMN-001 is not printed. The file does not title itself a doctors' leaflet."
  )
  dossier = fact(dossier, "name-proxeed-women", "name", "Proxeed Women", id, "Leaflet heading names Proxeed Women. Arabic name was not confirmed as an exact match.")
  dossier = fact(
    dossier,
    "form-proxeed-women",
    "form",
    "30 sachets; 6 g per sachet.",
    id,
    "MATCHING CANDIDATE for 30 sachets and 6 g. Ingredients include orange flavour. The catalog form string is longer. This draft stores the leaflet presentation line."
  )
  dossier = fact(
    dossier,
    "composition-proxeed-women",
    "composition",
    compositionSnapshot(WOMEN_COMPOSITION),
    id,
    "REVIEW_REQUIRED. Stored amounts match the leaflet nutrition line. The leaflet also states fumarate 863 mg and HCl 295 mg, which the catalog rows omit. That is not a contradiction and not a catalog edit. No printed edition date. Not an approval.",
    compositionSnapshot(WOMEN_COMPOSITION_EN)
  )
  dossier = fact(
    dossier,
    "brand-proxeed-women",
    "brand",
    "Alfasigma S.p.A.",
    id,
    "Trademark owner named on the leaflet. Not inferred from the product name."
  )
  dossier = fact(
    dossier,
    "manufacturer-proxeed-women",
    "manufacturer",
    "E-Pharma Trento S.p.A.",
    id,
    "Leaflet says Proxeed Women is manufactured by E-Pharma Trento S.p.A., Trento, Italy. This is not the distributor and not Nile Pharma Food."
  )
  return dossier
}

function inositol(): EvidenceDossier {
  const id = "src-proxeed-women-inositol-leaflet"
  let dossier = source(
    emptyDossier("proxeed-women-inositol"),
    id,
    "Proxeed Women Inositol consumer leaflet",
    "proxeed-women-inositol-leaflet.pdf",
    "Repository file public/downloads/proxeed-women-inositol-leaflet.pdf. Presentation: 30 sachets; 6 g per sachet. Nutrition includes myo-inositol 1000 mg. Use: 200 ml of still water. Artwork edition 10.04.2025, plant modification 24/04/2025, practice C. 05296/3, article 45003976. Job title International. SKU PXD-WIN-001 is not printed. Catalog pending-pack and unconfirmed composition were not replaced."
  )
  dossier = fact(
    dossier,
    "name-proxeed-women-inositol",
    "name",
    "Proxeed Women Inositol",
    id,
    "Leaflet heading names Proxeed Women Inositol. Arabic name was not confirmed as an exact match."
  )
  dossier = fact(
    dossier,
    "form-proxeed-women-inositol",
    "form",
    "30 sachets; 6 g per sachet.",
    id,
    "CONFLICT. Catalog form says final packaging details are pending approval. Leaflet states 30 sachets, 6 g per sachet. Do not update the catalog. Do not approve this fact against the current form string."
  )
  dossier = fact(
    dossier,
    "composition-proxeed-women-inositol",
    "composition",
    "Nutritional value per sachet (6 g): myo-inositol 1000 mg, L-carnitine 500 mg (as L-carnitine fumarate 860 mg), acetyl-L-carnitine 250 mg, L-arginine 500 mg, L-cysteine 100 mg, folic acid 400 µg, vitamin D3 5 µg, zinc 5 mg, iron 7 mg, vitamin C 90 mg, vitamin E 30 mg, selenium 27.5 µg, vitamin B12 2.5 µg",
    id,
    "CONFLICT. Catalog says the base formula is the same as Proxeed Women and that the myo-inositol amount is unconfirmed. The leaflet states 1000 mg myo-inositol, L-cysteine 100 mg, folic acid 400 µg, and fumarate 860 mg. Proxeed Women leaflet states folic acid 200 µg, N-acetyl cysteine 50 mg, and fumarate 863 mg. Do not update the catalog."
  )
  dossier = fact(
    dossier,
    "brand-proxeed-women-inositol",
    "brand",
    "Alfasigma S.p.A.",
    id,
    "Trademark owner named on the leaflet. Not inferred from the product name."
  )
  dossier = fact(
    dossier,
    "manufacturer-proxeed-women-inositol",
    "manufacturer",
    "Fine Foods & Pharmaceuticals N.T.M. S.p.A.",
    id,
    "Leaflet says manufactured by Fine Foods & Pharmaceuticals N.T.M. S.p.A., Zingonia-Verdellino (BG), Italy. Not the distributor."
  )
  return dossier
}

export const CATALOG_EVIDENCE_DRAFTS: readonly EvidenceDossier[] = Object.freeze([plus(), men(), women(), inositol()])
