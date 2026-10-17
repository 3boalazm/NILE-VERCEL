import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

import { MockProductRepository } from "@/lib/products/mock-repository"
import { buildProductJsonLd } from "@/lib/seo/product-schema"
import { buildSitemapEntries } from "@/lib/seo/sitemap-entries"
import { canExposeField, isProductSearchEligible, storedClaimStatements } from "@/lib/seo/sku-evidence"

import { createServerGrant, type EvidenceActor } from "./access"
import { applyApprovedEvidence, compositionSnapshot } from "./project"
import { listEvidenceRecords, publicCatalogProduct } from "./store"
import type { EvidenceDossier } from "./types"
import { advanceToApproved, transitionFact, transitionSource } from "./workflow"

const products = await new MockProductRepository().getAllProducts()

function product(slug: string) {
  const found = products.find((item) => item.slug === slug)
  if (!found) throw new Error(slug)
  return found
}

function dossier(slug: string): EvidenceDossier {
  const found = listEvidenceRecords().find((item) => item.productSlug === slug)
  if (!found) throw new Error(slug)
  return found
}

describe("catalog reconciliation does not mutate conflicts", () => {
  it("leaves every known conflict in the catalog and every dossier unapproved", () => {
    const plus = product("proxeed-plus")
    const men = product("proxeed-men")
    const women = product("proxeed-women")
    const inositol = product("proxeed-women-inositol")

    expect(plus.translations?.en?.usage).toContain("120ml")
    expect(plus.translations?.en?.composition?.some((row) => row.label === "Zinc lactate" && row.value === "20 mg zinc")).toBe(true)
    expect(plus.translations?.en?.composition?.some((row) => /sucrose/i.test(row.label))).toBe(false)
    expect(men.translations?.en?.composition?.some((row) => row.label === "Vitamin D" && row.value === "7.5 µg")).toBe(true)
    expect(women.translations?.en?.usage).toContain("120ml")
    expect(women.translations?.en?.faq?.some((item) => item.answer === "Each sachet contains 16 kcal.")).toBe(true)
    expect(inositol.translations?.en?.availableForm).toContain("pending approval")
    expect(inositol.translations?.en?.composition?.some((row) => row.value === "Same ingredients as Proxeed Women")).toBe(true)
    expect(inositol.translations?.en?.faq?.some((item) => item.answer.includes("120ml"))).toBe(true)

    for (const item of listEvidenceRecords()) {
      expect(item.claims).toEqual([])
      expect(item.sources.every((source) => source.state === "DRAFT")).toBe(true)
      expect(item.facts.every((fact) => fact.state === "DRAFT" && fact.reviewerId === undefined)).toBe(true)
      expect(item.sources.every((source) => source.notes?.includes("Catalog was not changed"))).toBe(true)
      expect(item.sources.every((source) => source.notes?.includes("not moved to UNDER_REVIEW"))).toBe(true)
    }
    expect(readFileSync("src/lib/evidence/catalog-drafts.ts", "utf8")).not.toContain('"approve"')
    expect(products.filter(isProductSearchEligible).map((item) => item.slug).sort()).toEqual([
      "ca-mi-ir-thermometer",
      "ca-mi-pulse-oximeter",
    ])
    expect(buildSitemapEntries(products, [], listEvidenceRecords()).map((entry) => entry.url)).toEqual(
      buildSitemapEntries(products).map((entry) => entry.url)
    )
  })

  it("does not let a leaflet sentence replace a conflicting catalog value in schema", () => {
    for (const item of products) {
      const projected = publicCatalogProduct(item)
      expect(projected).toBe(item)
      const schema = JSON.stringify(buildProductJsonLd(item, "en", "Nile Pharma Food", "Catalog", projected))
      expect(schema).not.toContain("200 ml")
      expect(schema).not.toContain("myo-inositol 1000 mg")
      expect(schema).not.toContain("Alfasigma")
      expect(schema).not.toContain("E-Pharma")
      expect(schema).not.toContain("18 kcal")
    }
    const inositol = publicCatalogProduct(product("proxeed-women-inositol"))
    expect(canExposeField(inositol, "form", "PRODUCT_SCHEMA")).toBe(false)
    expect(canExposeField(inositol, "composition", "PRODUCT_SCHEMA")).toBe(false)
    expect(JSON.stringify(buildProductJsonLd(inositol, "en", "Nile Pharma Food", "Supplements", inositol))).not.toContain(
      "pending approval"
    )
  })

  it("keeps a matching snapshot off the store, and a stale or variant copy cannot expose the old value", () => {
    const women = product("proxeed-women")
    const stored = dossier("proxeed-women")
    expect(stored.facts.find((fact) => fact.field === "composition")?.reviewedValue).toBe(compositionSnapshot(women.composition))
    expect(canExposeField(women, "composition", "PRODUCT_SCHEMA")).toBe(false)
    expect(storedClaimStatements(women).some((statement) => statement === "Each sachet contains 16 kcal.")).toBe(true)
    expect(stored.claims).toEqual([])

    const grant = createServerGrant("test-reviewer", ["edit", "submit", "approve"])
    if (!grant) throw new Error("grant")
    const actor: EvidenceActor = { kind: "internal", grant }
    let approved = structuredClone(stored)
    for (const id of ["src-proxeed-women-leaflet", "composition-proxeed-women"]) {
      const kind = id.startsWith("src-") ? transitionSource : transitionFact
      const moved = advanceToApproved(kind, approved, id, actor, "2026-09-24T00:00:00.000Z")
      if (!moved.ok) throw new Error(moved.reason)
      approved = moved.value
    }
    const cleared = applyApprovedEvidence(women, [approved])
    expect(canExposeField(cleared, "composition", "PRODUCT_SCHEMA")).toBe(true)
    expect(isProductSearchEligible(cleared)).toBe(false)
    expect(dossier("proxeed-women").facts.every((fact) => fact.state === "DRAFT")).toBe(true)

    const changed = {
      ...women,
      composition: women.composition?.map((row) => (row.label === "L-Carnitine" ? { ...row, value: "60 mg" } : row)),
    }
    const stale = applyApprovedEvidence(changed, [approved])
    const staleSchema = JSON.stringify(buildProductJsonLd(stale, "en", "Nile Pharma Food", "Supplements", stale))
    expect(canExposeField(stale, "composition", "PRODUCT_SCHEMA")).toBe(false)
    expect(staleSchema).not.toContain("60 mg")
    expect(staleSchema).not.toContain("500 mg")

    const men = product("proxeed-men")
    const wrongVariant = applyApprovedEvidence(men, [approved])
    expect(wrongVariant).toBe(men)
    expect(canExposeField(wrongVariant, "composition", "PRODUCT_SCHEMA")).toBe(false)
    expect(isProductSearchEligible(product("proxerex"))).toBe(false)
    expect(isProductSearchEligible(product("ellamuselle"))).toBe(false)
  })
})
