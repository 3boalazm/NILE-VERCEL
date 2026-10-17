import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

import { MockProductRepository } from "@/lib/products/mock-repository"
import { buildProductJsonLd } from "@/lib/seo/product-schema"
import { buildSitemapEntries } from "@/lib/seo/sitemap-entries"
import { canExposeField, isProductSearchEligible } from "@/lib/seo/sku-evidence"

import { createServerGrant, type EvidenceActor } from "./access"
import { CATALOG_EVIDENCE_DRAFTS } from "./catalog-drafts"
import { compositionSnapshot, applyApprovedEvidence } from "./project"
import { listEvidenceRecords, publicCatalogProduct } from "./store"
import type { EvidenceDossier } from "./types"
import { advanceToApproved, transitionFact, transitionSource } from "./workflow"

const AT = "2026-09-24T00:00:00.000Z"
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

function reviewer(): EvidenceActor {
  const grant = createServerGrant("test-reviewer", ["edit", "submit", "approve"])
  if (!grant) throw new Error("grant")
  return { kind: "internal", grant }
}

function approveCopy(source: EvidenceDossier, sourceIds: string[], factIds: string[]): EvidenceDossier {
  let next = structuredClone(source)
  const actor = reviewer()
  for (const id of sourceIds) {
    const moved = advanceToApproved(transitionSource, next, id, actor, AT)
    if (!moved.ok) throw new Error(moved.reason)
    next = moved.value
  }
  for (const id of factIds) {
    const moved = advanceToApproved(transitionFact, next, id, actor, AT)
    if (!moved.ok) throw new Error(moved.reason)
    next = moved.value
  }
  return next
}

describe("repository leaflet drafts", () => {
  it("keeps every acquired record as an unapproved draft", () => {
    expect(listEvidenceRecords()).toEqual(CATALOG_EVIDENCE_DRAFTS)
    expect(listEvidenceRecords().map((item) => item.productSlug)).toEqual([
      "proxeed-plus",
      "proxeed-men",
      "proxeed-women",
      "proxeed-women-inositol",
    ])
    for (const item of listEvidenceRecords()) {
      expect(item.claims).toEqual([])
      expect(item.audit.every((event) => event.action === "create" && event.actorId === "repository-acquisition" && event.at === AT)).toBe(true)
      for (const source of item.sources) {
        expect(source.state).toBe("DRAFT")
        expect(source.locator.endsWith(".pdf")).toBe(true)
        expect(source.locator).not.toMatch(/[/\\]|https?:|api\/media|downloads/i)
        expect(source.documentRef).toBeUndefined()
        expect(source.notes).toContain("PRIVATE EVIDENCE STORAGE REQUIRED")
        expect(source.notes).toContain(`public/downloads/${source.locator}`)
      }
      for (const fact of item.facts) {
        expect(fact.state).toBe("DRAFT")
        expect(fact.reviewerId).toBeUndefined()
        expect(fact.reviewedAt).toBeUndefined()
      }
    }
    expect(readFileSync("src/lib/evidence/catalog-drafts.ts", "utf8")).not.toContain("new Date(")
    expect(readFileSync("src/collections/Media.ts", "utf8")).toContain("read: () => true")
  })

  it("does not let drafts unlock supplements, change sitemap URLs, or change schema", () => {
    expect(products.filter(isProductSearchEligible).map((item) => item.slug).sort()).toEqual([
      "ca-mi-ir-thermometer",
      "ca-mi-pulse-oximeter",
    ])
    for (const slug of ["proxerex", "ellamuselle", "ca-mi-pulse-oximeter", "ca-mi-ir-thermometer"]) {
      expect(listEvidenceRecords().some((item) => item.productSlug === slug)).toBe(false)
      expect(isProductSearchEligible(publicCatalogProduct(product(slug)))).toBe(isProductSearchEligible(product(slug)))
    }
    expect(buildSitemapEntries(products, [], listEvidenceRecords()).map((entry) => entry.url)).toEqual(
      buildSitemapEntries(products).map((entry) => entry.url)
    )
    for (const item of products) {
      const raw = JSON.stringify(buildProductJsonLd(item, "en", "Nile Pharma Food", "Catalog", item))
      const projected = JSON.stringify(buildProductJsonLd(publicCatalogProduct(item), "en", "Nile Pharma Food", "Catalog", publicCatalogProduct(item)))
      expect(projected).toBe(raw)
      expect(projected).not.toContain("leaflet.pdf")
      expect(projected).not.toContain("Alfasigma")
      expect(projected).not.toContain("E-Pharma")
      expect(projected).not.toContain("Fine Foods")
    }
  })

  it("does not let the acquisition actor approve, and a public path is still not a locator", () => {
    const grant = createServerGrant("repository-acquisition", ["edit"])
    if (!grant) throw new Error("grant")
    const actor: EvidenceActor = { kind: "internal", grant }
    const copy = structuredClone(dossier("proxeed-women"))
    expect(advanceToApproved(transitionSource, copy, "src-proxeed-women-leaflet", actor, AT)).toEqual({ ok: false, reason: "denied" })
    expect(dossier("proxeed-women").sources[0]?.state).toBe("DRAFT")
    expect(
      transitionSource(
        {
          ...copy,
          sources: [{ ...copy.sources[0]!, locator: "/downloads/proxeed-women-leaflet.pdf", state: "UNDER_REVIEW" }],
        },
        "src-proxeed-women-leaflet",
        "APPROVED",
        reviewer(),
        AT
      )
    ).toEqual({ ok: false, reason: "invalid" })
  })

  it("lets an in-memory approval of the matching women composition pass the existing gate while the store stays draft", () => {
    const women = product("proxeed-women")
    const stored = dossier("proxeed-women")
    const composition = stored.facts.find((fact) => fact.field === "composition")
    expect(composition?.reviewedValue).toBe(compositionSnapshot(women.composition))
    expect(composition?.reviewedValueEn).toBe(compositionSnapshot(women.translations?.en?.composition))
    expect(canExposeField(women, "composition", "PRODUCT_SCHEMA")).toBe(false)

    const approved = approveCopy(stored, ["src-proxeed-women-leaflet"], ["composition-proxeed-women"])
    const cleared = applyApprovedEvidence(women, [approved])
    expect(canExposeField(cleared, "composition", "PRODUCT_SCHEMA")).toBe(true)
    expect(canExposeField(cleared, "composition", "SITEMAP")).toBe(false)
    expect(isProductSearchEligible(cleared)).toBe(false)
    expect(buildSitemapEntries([cleared], [], [approved]).some((entry) => entry.url.includes(women.slug))).toBe(false)
    expect(stored.facts.every((fact) => fact.state === "DRAFT")).toBe(true)
    expect(publicCatalogProduct(women)).toBe(women)
    expect(JSON.stringify(buildProductJsonLd(women, "en", "Nile Pharma Food", "Supplements", women))).not.toContain("L-Carnitine")
    expect(JSON.stringify(buildProductJsonLd(cleared, "en", "Nile Pharma Food", "Supplements", cleared))).toContain("L-Carnitine")
  })

  it("does not expose a catalog value from a mismatched or conflicting snapshot", () => {
    const women = product("proxeed-women")
    const approvedForm = approveCopy(dossier("proxeed-women"), ["src-proxeed-women-leaflet"], ["form-proxeed-women"])
    const formProjected = applyApprovedEvidence(women, [approvedForm])
    expect(formProjected.availableForm).toBe(women.availableForm)
    expect(canExposeField(formProjected, "form", "PRODUCT_SCHEMA")).toBe(false)
    expect(JSON.stringify(buildProductJsonLd(formProjected, "en", "Nile Pharma Food", "Supplements", formProjected))).not.toContain(women.availableForm ?? "")

    const mismatched = approveCopy(dossier("proxeed-women"), ["src-proxeed-women-leaflet"], ["composition-proxeed-women"])
    const fact = mismatched.facts.find((item) => item.id === "composition-proxeed-women")
    if (!fact) throw new Error("fact")
    fact.reviewedValue = fact.reviewedValue.replace("500 mg", "60 mg")
    const stale = applyApprovedEvidence(women, [mismatched])
    expect(canExposeField(stale, "composition", "PRODUCT_SCHEMA")).toBe(false)
    expect(JSON.stringify(buildProductJsonLd(stale, "en", "Nile Pharma Food", "Supplements", stale))).not.toContain("60 mg")
    expect(JSON.stringify(buildProductJsonLd(stale, "en", "Nile Pharma Food", "Supplements", stale))).not.toContain("500 mg")

    const inositol = product("proxeed-women-inositol")
    const conflict = dossier("proxeed-women-inositol").facts.find((item) => item.field === "composition")
    expect(conflict?.reviewedValue).not.toBe(compositionSnapshot(inositol.composition))
    expect(conflict?.reviewedValue).toContain("myo-inositol 1000 mg")
    const approvedConflict = approveCopy(dossier("proxeed-women-inositol"), ["src-proxeed-women-inositol-leaflet"], [
      "composition-proxeed-women-inositol",
      "form-proxeed-women-inositol",
    ])
    const blocked = applyApprovedEvidence(inositol, [approvedConflict])
    expect(blocked.availableForm).toBe(inositol.availableForm)
    expect(blocked.composition).toEqual(inositol.composition)
    expect(canExposeField(blocked, "form", "PRODUCT_SCHEMA")).toBe(false)
    expect(canExposeField(blocked, "composition", "PRODUCT_SCHEMA")).toBe(false)
    const schema = JSON.stringify(buildProductJsonLd(blocked, "en", "Nile Pharma Food", "Supplements", blocked))
    expect(schema).not.toContain("Same ingredients as Proxeed Women")
    expect(schema).not.toContain("myo-inositol 1000 mg")
    expect(schema).not.toContain(inositol.availableForm ?? "")
    expect(isProductSearchEligible(blocked)).toBe(false)
  })
})
