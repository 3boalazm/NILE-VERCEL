import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import path from "node:path"

import { isProductSearchEligible } from "@/lib/seo/indexability"
import { buildSitemapEntries } from "@/lib/seo/sitemap-entries"
import { MockProductRepository } from "@/lib/products/mock-repository"
import type { Product } from "@/lib/products/types"

import { CATALOG_EVIDENCE_DRAFTS } from "./catalog-drafts"
import { CATALOG_DECISION_QUEUE } from "./decision-queue"
import { authorizeDecisionActor } from "./decision-auth"
import {
  applyDecisionToProduct,
  canFinalizeDecision,
  createDecisionGrant,
  decisionFromClientPayload,
  deferDecision,
  evidenceSnapshotCurrent,
  finalizeDecision,
  isDecisionGrant,
  openDecision,
  projectDecidedCatalog,
  rejectDecision,
  startDecisionReview,
  type DecisionActor,
  type EvidenceDecision,
} from "./decisions"
import { listEvidenceDecisions, listEvidenceRecords, publicCatalogProduct } from "./store"
import { canApproveEvidence, createServerGrant } from "./access"

const OWNER_ID = "user-1"

const actor = (): DecisionActor => {
  const next = authorizeDecisionActor(
    { id: OWNER_ID },
    {
      id: OWNER_ID,
      email: "reviewer@example.test",
      evidenceDecisionCapabilities: ["view_queue", "create_decision", "edit_decision", "finalize_decision"],
    }
  )
  if (next.kind !== "internal") throw new Error("grant")
  return next
}

function product(partial: Partial<Product> & Pick<Product, "slug">): Product {
  return {
    id: partial.slug,
    name: partial.slug,
    categorySlug: "supplements",
    status: "active",
    shortDescription: "Stored.",
    keyBenefits: [],
    ...partial,
  }
}

describe("evidence decision queue", () => {
  it("opens only the known conflicts and decides none of them", () => {
    expect(listEvidenceDecisions()).toBe(CATALOG_DECISION_QUEUE)
    expect(CATALOG_DECISION_QUEUE).toHaveLength(9)
    expect(new Set(CATALOG_DECISION_QUEUE.map((item) => item.id)).size).toBe(9)
    expect(CATALOG_DECISION_QUEUE.every((item) => item.status === "OPEN")).toBe(true)
    expect(CATALOG_DECISION_QUEUE.every((item) => item.decisionOwnerReference === undefined)).toBe(true)
    expect(CATALOG_DECISION_QUEUE.every((item) => item.decision === undefined)).toBe(true)
    expect(CATALOG_DECISION_QUEUE.map((item) => `${item.sku}:${item.field}`).sort()).toEqual([
      "PXD-MEN-001:vitaminD",
      "PXD-PLS-001:composition",
      "PXD-PLS-001:duration",
      "PXD-PLS-001:usage",
      "PXD-WIN-001:composition",
      "PXD-WIN-001:form",
      "PXD-WIN-001:usage",
      "PXD-WMN-001:faqCalories",
      "PXD-WMN-001:usage",
    ])
    expect(CATALOG_DECISION_QUEUE.some((item) => item.sku.startsWith("CA-MI"))).toBe(false)
  })

  it("keeps every snapshot tied to the current repository source", () => {
    for (const decision of CATALOG_DECISION_QUEUE) {
      expect(evidenceSnapshotCurrent(decision, listEvidenceRecords())).toBe(true)
      expect(decision.variantAmbiguous).toBe(true)
    }
    const vitamin = CATALOG_DECISION_QUEUE.find((item) => item.field === "vitaminD")
    expect(vitamin?.adoptable).toBe(false)
    expect(vitamin?.catalogValue).toBe("7.5 µg")
  })

  it("refuses a decision without a server grant and a real owner", () => {
    const record = CATALOG_DECISION_QUEUE[0]
    const input = { kind: "KEEP_CATALOG_VALUE" as const, decisionOwnerReference: OWNER_ID, rationale: "Recorded separately." }
    expect(finalizeDecision(record, input, { kind: "anonymous" }, "2026-09-24T00:00:00.000Z").ok).toBe(false)
    expect(finalizeDecision(record, input, { kind: "storefront", id: "user-1" }, "2026-09-24T00:00:00.000Z").ok).toBe(false)
    expect(createDecisionGrant()).toBeNull()
    const cannotMintFromId = createDecisionGrant as (...ids: string[]) => null
    for (const id of ["system", "admin", "Arena", "developer", "repository-acquisition"]) {
      expect(cannotMintFromId(id)).toBeNull()
    }
    const forged = JSON.parse(JSON.stringify({ actorId: "owner-file-1", "server-decision-grant": true }))
    expect(isDecisionGrant(forged)).toBe(false)
    expect(canFinalizeDecision({ kind: "internal", grant: forged })).toBe(false)
    const reviewer = createServerGrant("reviewer-1", ["approve"])
    expect(reviewer && canApproveEvidence({ kind: "internal", grant: reviewer })).toBe(true)
    expect(isDecisionGrant(reviewer)).toBe(false)
    expect(finalizeDecision(record, { ...input, decisionOwnerReference: "system" }, actor(), "2026-09-24T00:00:00.000Z")).toEqual({
      ok: false,
      reason: "missing_owner",
    })
    expect(decisionFromClientPayload({ status: "DECIDED", decision: "ADOPT_EVIDENCE_VALUE" })).toEqual({
      ok: false,
      reason: "client_payload_rejected",
    })
  })

  it("blocks adoption when the source no longer matches the snapshot", () => {
    const opened = openDecision(
      {
        id: "fixture-form",
        sku: "FIX-001",
        productSlug: "fixture",
        field: "form",
        catalogValue: "pending",
        evidenceValue: "30 sachets",
        evidenceSnapshot: "30 sachets",
        sourceId: "src-fixture",
        sourceLocator: "fixture.pdf",
        factId: "form-fixture",
        conflictType: "VALUE_CONFLICT",
        variantAmbiguous: false,
        adoptable: true,
      },
      "2026-09-24T00:00:00.000Z"
    )
    expect(opened.ok).toBe(true)
    if (!opened.ok) return
    const decided = finalizeDecision(
      opened.value,
      { kind: "ADOPT_EVIDENCE_VALUE", decisionOwnerReference: OWNER_ID, rationale: "Fixture only." },
      actor(),
      "2026-09-24T01:00:00.000Z"
    )
    expect(decided.ok).toBe(true)
    if (!decided.ok) return
    const stale = [
      {
        ...CATALOG_EVIDENCE_DRAFTS[0],
        productSlug: "fixture",
        sources: [{ ...CATALOG_EVIDENCE_DRAFTS[0].sources[0], id: "src-fixture", locator: "fixture.pdf" }],
        facts: [{ ...CATALOG_EVIDENCE_DRAFTS[0].facts[0], id: "form-fixture", sourceId: "src-fixture", reviewedValue: "60 sachets" }],
      },
    ]
    expect(evidenceSnapshotCurrent(decided.value, stale)).toBe(false)
    const row = product({ slug: "fixture", availableForm: "pending" })
    expect(applyDecisionToProduct(row, decided.value, stale)).toEqual({ ok: false, reason: "stale" })
    expect(row.availableForm).toBe("pending")
  })

  it("does not let an ambiguous variant adopt, replace, or retire", () => {
    const record = CATALOG_DECISION_QUEUE[0]
    const owner = { decisionOwnerReference: OWNER_ID, rationale: "Not established." }
    expect(finalizeDecision(record, { ...owner, kind: "ADOPT_EVIDENCE_VALUE" }, actor(), "2026-09-24T00:00:00.000Z")).toEqual({
      ok: false,
      reason: "variant_ambiguous",
    })
    expect(finalizeDecision(record, { ...owner, kind: "REPLACE_WITH_OTHER_VALUE", replacementValue: "other" }, actor(), "2026-09-24T00:00:00.000Z")).toEqual({
      ok: false,
      reason: "variant_ambiguous",
    })
    expect(finalizeDecision(record, { ...owner, kind: "RETIRE_PRODUCT" }, actor(), "2026-09-24T00:00:00.000Z")).toEqual({
      ok: false,
      reason: "variant_ambiguous",
    })
    expect(finalizeDecision(record, { ...owner, kind: "REMOVE_FROM_PUBLIC_OUTPUT" }, actor(), "2026-09-24T00:00:00.000Z")).toEqual({
      ok: false,
      reason: "variant_ambiguous",
    })
    const vitamin = CATALOG_DECISION_QUEUE.find((item) => item.id === "dec-pxd-men-001-vitamin-d")
    expect(vitamin).toBeDefined()
    if (!vitamin) return
    const cleared: EvidenceDecision = { ...vitamin, variantAmbiguous: false }
    expect(finalizeDecision(cleared, { ...owner, kind: "ADOPT_EVIDENCE_VALUE" }, actor(), "2026-09-24T00:00:00.000Z")).toEqual({
      ok: false,
      reason: "evidence_incomplete",
    })
  })

  it("keeps catalog text when the decision is keep or unverified", () => {
    const opened = openDecision(
      {
        id: "fixture-keep",
        sku: "FIX-002",
        productSlug: "fixture-keep",
        field: "form",
        catalogValue: "pending",
        evidenceValue: "30 sachets",
        evidenceSnapshot: "30 sachets",
        sourceId: "src-keep",
        sourceLocator: "keep.pdf",
        evidenceAnchor: "30 sachets",
        conflictType: "INTENTIONAL_HOLD",
        variantAmbiguous: false,
        adoptable: true,
      },
      "2026-09-24T00:00:00.000Z"
    )
    expect(opened.ok).toBe(true)
    if (!opened.ok) return
    const dossiers = [
      {
        ...CATALOG_EVIDENCE_DRAFTS[0],
        productSlug: "fixture-keep",
        sources: [{ ...CATALOG_EVIDENCE_DRAFTS[0].sources[0], id: "src-keep", locator: "keep.pdf", notes: "30 sachets" }],
        facts: [],
      },
    ]
    const row = product({ slug: "fixture-keep", availableForm: "pending" })
    for (const kind of ["KEEP_CATALOG_VALUE", "MARK_UNVERIFIED"] as const) {
      const decided = finalizeDecision(opened.value, { kind, decisionOwnerReference: OWNER_ID, rationale: "No rewrite." }, actor(), "2026-09-24T01:00:00.000Z")
      expect(decided.ok).toBe(true)
      if (!decided.ok) return
      expect(applyDecisionToProduct(row, decided.value, dossiers)).toEqual({ ok: true, value: row })
    }
  })

  it("applies an unambiguous non-claim decision without approving a claim", () => {
    const opened = openDecision(
      {
        id: "fixture-adopt",
        sku: "FIX-003",
        productSlug: "fixture-adopt",
        field: "form",
        catalogValue: "pending",
        evidenceValue: "30 sachets",
        evidenceSnapshot: "30 sachets",
        sourceId: "src-adopt",
        sourceLocator: "adopt.pdf",
        evidenceAnchor: "30 sachets",
        conflictType: "VALUE_CONFLICT",
        variantAmbiguous: false,
        adoptable: true,
      },
      "2026-09-24T00:00:00.000Z"
    )
    expect(opened.ok).toBe(true)
    if (!opened.ok) return
    const dossiers = [
      {
        ...CATALOG_EVIDENCE_DRAFTS[0],
        productSlug: "fixture-adopt",
        sources: [{ ...CATALOG_EVIDENCE_DRAFTS[0].sources[0], id: "src-adopt", locator: "adopt.pdf", notes: "30 sachets" }],
        facts: [],
      },
    ]
    const row = product({
      slug: "fixture-adopt",
      availableForm: "pending",
      evidencePack: {
        claims: [
          {
            id: "fertility",
            statement: "Supports fertility.",
            evidenceIds: [],
            reviewStatus: "unverified",
            allowedContexts: [],
          },
        ],
      },
    })
    const decided = finalizeDecision(
      opened.value,
      { kind: "ADOPT_EVIDENCE_VALUE", decisionOwnerReference: OWNER_ID, rationale: "Form only." },
      actor(),
      "2026-09-24T01:00:00.000Z"
    )
    expect(decided.ok).toBe(true)
    if (!decided.ok) return
    const applied = applyDecisionToProduct(row, decided.value, dossiers)
    expect(applied.ok).toBe(true)
    if (!applied.ok) return
    expect(applied.value.availableForm).toBe("30 sachets")
    expect(applied.value.evidencePack).toEqual(row.evidencePack)
    expect("brand" in applied.value).toBe(false)
    expect("manufacturer" in applied.value).toBe(false)
    expect(row.availableForm).toBe("pending")
  })

  it("does not change the live catalog or search eligibility while every decision is open", async () => {
    const products = await new MockProductRepository().getAllProducts()
    for (const item of products) {
      expect(publicCatalogProduct(item)).toBe(item)
    }
    const slugs = ["proxeed-women-inositol", "proxeed-plus", "proxeed-women", "proxeed-men"]
    for (const slug of slugs) {
      const item = products.find((row) => row.slug === slug)
      expect(item).toBeDefined()
      if (!item) continue
      expect(isProductSearchEligible(publicCatalogProduct(item))).toBe(false)
    }
    const devices = products.filter((item) => item.sku?.startsWith("CA-MI"))
    expect(devices.every((item) => isProductSearchEligible(publicCatalogProduct(item)))).toBe(true)
    expect(projectDecidedCatalog(products[0], listEvidenceDecisions(), listEvidenceRecords())).toBe(products[0])
    for (const decision of CATALOG_DECISION_QUEUE) {
      const row = products.find((item) => item.slug === decision.productSlug)
      expect(row).toBeDefined()
      expect(JSON.stringify(row)).toContain(decision.catalogValue)
    }
    expect(buildSitemapEntries(products, [], listEvidenceRecords(), listEvidenceDecisions()).map((entry) => entry.url)).toEqual(
      buildSitemapEntries(products, [], listEvidenceRecords()).map((entry) => entry.url)
    )
  })

  it("rewrites only the stored locale string that still matches the catalog phrase", () => {
    const opened = openDecision(
      {
        id: "fixture-locale",
        sku: "FIX-004",
        productSlug: "fixture-locale",
        field: "usage",
        catalogValue: "each in about 120ml of water or orange juice",
        evidenceValue: "200 ml of water or orange juice",
        evidenceSnapshot: "200 ml of water or orange juice",
        sourceId: "src-locale",
        sourceLocator: "locale.pdf",
        evidenceAnchor: "200 ml of water or orange juice",
        conflictType: "USAGE_VOLUME",
        variantAmbiguous: false,
        adoptable: true,
      },
      "2026-09-24T00:00:00.000Z"
    )
    expect(opened.ok).toBe(true)
    if (!opened.ok) return
    const decided = finalizeDecision(
      opened.value,
      { kind: "ADOPT_EVIDENCE_VALUE", decisionOwnerReference: OWNER_ID, rationale: "English phrase only." },
      actor(),
      "2026-09-24T01:00:00.000Z"
    )
    expect(decided.ok).toBe(true)
    if (!decided.ok) return
    const dossiers = [
      {
        ...CATALOG_EVIDENCE_DRAFTS[0],
        productSlug: "fixture-locale",
        sources: [{ ...CATALOG_EVIDENCE_DRAFTS[0].sources[0], id: "src-locale", locator: "locale.pdf", notes: "200 ml of water or orange juice" }],
        facts: [],
      },
    ]
    const row = product({
      slug: "fixture-locale",
      usage: "حوالي 120 مل",
      translations: { en: { usage: "Dissolve two sachets, each in about 120ml of water or orange juice." } },
    })
    const applied = applyDecisionToProduct(row, decided.value, dossiers)
    expect(applied.ok).toBe(true)
    if (!applied.ok) return
    expect(applied.value.usage).toBe("حوالي 120 مل")
    expect(applied.value.translations?.en?.usage).toBe("Dissolve two sachets, 200 ml of water or orange juice.")
  })

  it("can record review, rejection, and deferral without a catalog write", () => {
    const record = CATALOG_DECISION_QUEUE[1]
    const reviewed = startDecisionReview(record, actor(), "2026-09-24T02:00:00.000Z")
    expect(reviewed.ok).toBe(true)
    if (!reviewed.ok) return
    expect(reviewed.value.status).toBe("IN_REVIEW")
    expect(reviewed.value.audit.at(-1)?.action).toBe("start_review")
    const rejected = rejectDecision(
      reviewed.value,
      { kind: "KEEP_CATALOG_VALUE", decisionOwnerReference: OWNER_ID, rationale: "Not accepted." },
      actor(),
      "2026-09-24T03:00:00.000Z"
    )
    expect(rejected.ok && rejected.value.status).toBe("REJECTED")
    const deferred = deferDecision(
      reviewed.value,
      { kind: "KEEP_CATALOG_VALUE", decisionOwnerReference: OWNER_ID, rationale: "Waiting for a matching edition." },
      actor(),
      "2026-09-24T03:00:00.000Z"
    )
    expect(deferred.ok && deferred.value.status).toBe("DEFERRED")
    expect(record.status).toBe("OPEN")
  })

  it("does not expose a client decision control or a decision collection", () => {
    const root = process.cwd()
    const users = readFileSync(path.join(root, "src/collections/Users.ts"), "utf8")
    const config = readFileSync(path.join(root, "src/payload.config.ts"), "utf8")
    expect(users).not.toMatch(/role/)
    expect(config).not.toMatch(/Decision/)
    const files = [
      "src/lib/evidence/decisions.ts",
      "src/lib/evidence/decision-queue.ts",
      "src/lib/evidence/store.ts",
    ]
    for (const file of files) {
      const source = readFileSync(path.join(root, file), "utf8")
      expect(source).not.toMatch(/["']use client["']/)
      expect(source).not.toMatch(/payload\.create/)
    }
  })
})
