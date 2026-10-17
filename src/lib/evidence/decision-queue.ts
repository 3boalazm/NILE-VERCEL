import { CATALOG_EVIDENCE_DRAFTS } from "./catalog-drafts"
import { openDecision, type EvidenceDecision } from "./decisions"

/**
 * Open conflicts from the reconciliation re-read.
 * No record is decided. No owner is assigned. The catalog is not changed.
 */
const AT = "2026-09-24T00:00:00.000Z"

function mustOpen(input: Parameters<typeof openDecision>[0]): EvidenceDecision {
  const opened = openDecision(input, AT)
  if (!opened.ok) throw new Error(opened.reason)
  const dossier = CATALOG_EVIDENCE_DRAFTS.find((item) => item.productSlug === opened.value.productSlug)
  const source = dossier?.sources.find((item) => item.id === opened.value.sourceId)
  if (!source) throw new Error(opened.value.sourceId)
  if (opened.value.factId) {
    const fact = dossier?.facts.find((item) => item.id === opened.value.factId)
    if (fact?.reviewedValue !== opened.value.evidenceSnapshot) throw new Error(opened.value.id)
  } else if (opened.value.evidenceAnchor && !source.notes?.includes(opened.value.evidenceAnchor)) {
    throw new Error(opened.value.id)
  }
  return opened.value
}

function factValue(slug: string, factId: string): string {
  const fact = CATALOG_EVIDENCE_DRAFTS.find((item) => item.productSlug === slug)?.facts.find((item) => item.id === factId)
  if (!fact) throw new Error(factId)
  return fact.reviewedValue
}

export const CATALOG_DECISION_QUEUE: readonly EvidenceDecision[] = Object.freeze([
  mustOpen({
    id: "dec-pxd-win-001-form",
    sku: "PXD-WIN-001",
    productSlug: "proxeed-women-inositol",
    field: "form",
    catalogValue: "Powder sachets (final packaging details pending approval)",
    evidenceValue: "30 sachets; 6 g per sachet.",
    evidenceSnapshot: factValue("proxeed-women-inositol", "form-proxeed-women-inositol"),
    sourceId: "src-proxeed-women-inositol-leaflet",
    sourceLocator: "proxeed-women-inositol-leaflet.pdf",
    factId: "form-proxeed-women-inositol",
    conflictType: "INTENTIONAL_HOLD",
    variantAmbiguous: true,
    adoptable: true,
  }),
  mustOpen({
    id: "dec-pxd-win-001-composition",
    sku: "PXD-WIN-001",
    productSlug: "proxeed-women-inositol",
    field: "composition",
    catalogValue: "Exact amount per sachet not yet confirmed",
    evidenceValue: factValue("proxeed-women-inositol", "composition-proxeed-women-inositol"),
    evidenceSnapshot: factValue("proxeed-women-inositol", "composition-proxeed-women-inositol"),
    sourceId: "src-proxeed-women-inositol-leaflet",
    sourceLocator: "proxeed-women-inositol-leaflet.pdf",
    factId: "composition-proxeed-women-inositol",
    conflictType: "COMPOSITION_MISMATCH",
    variantAmbiguous: true,
    adoptable: false,
  }),
  mustOpen({
    id: "dec-pxd-win-001-usage",
    sku: "PXD-WIN-001",
    productSlug: "proxeed-women-inositol",
    field: "usage",
    catalogValue: "Take one sachet daily, mixed with 120ml of water or orange juice.",
    evidenceValue: "200 ml of still water",
    evidenceSnapshot: "200 ml of still water",
    sourceId: "src-proxeed-women-inositol-leaflet",
    sourceLocator: "proxeed-women-inositol-leaflet.pdf",
    evidenceAnchor: "200 ml of still water",
    conflictType: "USAGE_VOLUME",
    variantAmbiguous: true,
    adoptable: true,
  }),
  mustOpen({
    id: "dec-pxd-pls-001-usage",
    sku: "PXD-PLS-001",
    productSlug: "proxeed-plus",
    field: "usage",
    catalogValue: "each in about 120ml of water or orange juice",
    evidenceValue: "200 ml of water or orange juice",
    evidenceSnapshot: "200 ml of water or orange juice",
    sourceId: "src-proxeed-plus-leaflet",
    sourceLocator: "proxeed-plus-leaflet.pdf",
    evidenceAnchor: "200 ml of water or orange juice",
    conflictType: "USAGE_VOLUME",
    variantAmbiguous: true,
    adoptable: true,
  }),
  mustOpen({
    id: "dec-pxd-pls-001-duration",
    sku: "PXD-PLS-001",
    productSlug: "proxeed-plus",
    field: "duration",
    catalogValue: "4–6 months",
    evidenceValue: "at least 6 consecutive months",
    evidenceSnapshot: "at least 6 consecutive months",
    sourceId: "src-proxeed-plus-leaflet",
    sourceLocator: "proxeed-plus-leaflet.pdf",
    evidenceAnchor: "at least 6 consecutive months",
    conflictType: "DURATION",
    variantAmbiguous: true,
    adoptable: true,
  }),
  mustOpen({
    id: "dec-pxd-pls-001-composition",
    sku: "PXD-PLS-001",
    productSlug: "proxeed-plus",
    field: "composition",
    catalogValue: "20 mg zinc",
    evidenceValue: "20 mg of Zinc; sucrose 22,4%",
    evidenceSnapshot: "20 mg of Zinc; sucrose 22,4%",
    sourceId: "src-proxeed-plus-leaflet",
    sourceLocator: "proxeed-plus-leaflet.pdf",
    evidenceAnchor: "20 mg of Zinc; sucrose 22,4%",
    conflictType: "COMPOSITION_REPRESENTATION",
    variantAmbiguous: true,
    adoptable: false,
  }),
  mustOpen({
    id: "dec-pxd-wmn-001-usage",
    sku: "PXD-WMN-001",
    productSlug: "proxeed-women",
    field: "usage",
    catalogValue: "about 120ml of water or orange juice",
    evidenceValue: "200 ml of still water",
    evidenceSnapshot: "200 ml of still water",
    sourceId: "src-proxeed-women-leaflet",
    sourceLocator: "proxeed-women-leaflet.pdf",
    evidenceAnchor: "200 ml of still water",
    conflictType: "USAGE_VOLUME",
    variantAmbiguous: true,
    adoptable: true,
  }),
  mustOpen({
    id: "dec-pxd-wmn-001-calories",
    sku: "PXD-WMN-001",
    productSlug: "proxeed-women",
    field: "faqCalories",
    catalogValue: "Each sachet contains 16 kcal.",
    evidenceValue: "75 kJ (18 kcal)",
    evidenceSnapshot: "75 kJ (18 kcal)",
    sourceId: "src-proxeed-women-leaflet",
    sourceLocator: "proxeed-women-leaflet.pdf",
    evidenceAnchor: "75 kJ (18 kcal)",
    conflictType: "CALORIE",
    variantAmbiguous: true,
    adoptable: true,
  }),
  mustOpen({
    id: "dec-pxd-men-001-vitamin-d",
    sku: "PXD-MEN-001",
    productSlug: "proxeed-men",
    field: "vitaminD",
    catalogValue: "7.5 µg",
    evidenceValue: "cholecalciferol is named; 7.5 µg is not stated",
    evidenceSnapshot: "cholecalciferol is named; 7.5 µg is not stated",
    sourceId: "src-proxeed-men-leaflet",
    sourceLocator: "proxeed-men-leaflet.pdf",
    evidenceAnchor: "does not state 7.5",
    conflictType: "MISSING_DOSE",
    variantAmbiguous: true,
    adoptable: false,
  }),
])
