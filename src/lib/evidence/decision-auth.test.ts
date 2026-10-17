import { describe, expect, it } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"

import { Users } from "@/collections/Users"
import type { Product } from "@/lib/products/types"
import { productsHubSearchLinks } from "@/lib/seo/growth"
import { buildSitemapEntries } from "@/lib/seo/sitemap-entries"
import { isProductSearchEligible } from "@/lib/seo/sku-evidence"

import { decisionActorFromPayloadSession } from "@/lib/auth/decision-session"
import { canApproveEvidence, createServerGrant } from "./access"
import { CATALOG_EVIDENCE_DRAFTS } from "./catalog-drafts"
import { CATALOG_DECISION_QUEUE } from "./decision-queue"
import {
  authorizeDecisionActor,
  decisionActorFromClientPayload,
  executeAuthorizedDecision,
  stripUntrustedCapabilityWrite,
} from "./decision-auth"
import { canFinalizeDecision, createDecisionGrant, isDecisionGrant, type DecisionActor, type DecisionKind } from "./decisions"
import { listEvidenceDecisions, publicCatalogProduct } from "./store"
import { MockProductRepository } from "@/lib/products/mock-repository"

const AT = "2026-09-24T00:00:00.000Z"

function reviewer(capabilities: readonly string[] = ["view_queue", "create_decision", "edit_decision", "finalize_decision"]): DecisionActor {
  return authorizeDecisionActor(
    { id: "user-1" },
    { id: "user-1", email: "reviewer@example.test", evidenceDecisionCapabilities: capabilities }
  )
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

function dossier(slug: string, sourceId: string, locator: string, notes: string) {
  return [
    {
      ...CATALOG_EVIDENCE_DRAFTS[0],
      productSlug: slug,
      sources: [{ ...CATALOG_EVIDENCE_DRAFTS[0].sources[0], id: sourceId, locator, notes }],
      facts: [],
    },
  ]
}

describe("evidence decision authorization", () => {
  it("denies anonymous, unauthenticated, and capability-less users", () => {
    expect(authorizeDecisionActor(null, null)).toEqual({ kind: "anonymous" })
    expect(authorizeDecisionActor({ id: "user-1" }, null)).toEqual({ kind: "anonymous" })
    expect(authorizeDecisionActor({ id: "user-1" }, { id: "user-2", evidenceDecisionCapabilities: ["finalize_decision"] })).toEqual({
      kind: "anonymous",
    })
    const signedIn = authorizeDecisionActor({ id: "user-1" }, { id: "user-1", email: "person@example.test", evidenceDecisionCapabilities: [] })
    expect(signedIn).toEqual({ kind: "storefront", id: "user-1" })
    expect(canFinalizeDecision(signedIn)).toBe(false)
    expect(executeAuthorizedDecision({
      decision: CATALOG_DECISION_QUEUE[0],
      kind: "KEEP_CATALOG_VALUE",
      rationale: "No.",
      actor: signedIn,
      at: AT,
      product: product({ slug: CATALOG_DECISION_QUEUE[0].productSlug }),
      dossiers: CATALOG_EVIDENCE_DRAFTS,
    })).toEqual({ ok: false, reason: "denied" })
  })

  it("ignores a client role, a client grant, and capabilities on the session object", () => {
    const body = {
      id: "user-1",
      isAdmin: true,
      role: "evidence_reviewer",
      evidenceDecisionCapabilities: ["finalize_decision"],
      grant: { actorId: "user-1", capabilities: ["finalize_decision"] },
    }
    expect(decisionActorFromClientPayload(body)).toEqual({ kind: "anonymous" })
    expect(createDecisionGrant()).toBeNull()
    expect((createDecisionGrant as (id?: string) => null)("user-1")).toBeNull()
    expect(isDecisionGrant(JSON.parse(JSON.stringify({ actorId: "user-1", identity: "user-1", capabilities: ["finalize_decision"], "server-decision-grant": true })))).toBe(false)
    const ignored = decisionActorFromPayloadSession(
      { id: "user-1", collection: "users", evidenceDecisionCapabilities: ["finalize_decision"], isAdmin: true } as { id: string; collection: string },
      { id: "user-1", email: "person@example.test", evidenceDecisionCapabilities: [] }
    )
    expect(canFinalizeDecision(ignored)).toBe(false)
    expect(decisionActorFromPayloadSession({ id: "user-1", collection: "media" }, { id: "user-1", evidenceDecisionCapabilities: ["finalize_decision"] })).toEqual({
      kind: "anonymous",
    })
    expect(stripUntrustedCapabilityWrite({ email: "person@example.test", evidenceDecisionCapabilities: ["finalize_decision"] }, { evidenceDecisionCapabilities: [] }).evidenceDecisionCapabilities).toEqual([])
  })

  it("lets a stored finalize capability run the workflow without approving evidence", () => {
    const actor = reviewer()
    expect(actor.kind).toBe("internal")
    const approver = createServerGrant("reviewer-1", ["approve"])
    expect(approver && canApproveEvidence({ kind: "internal", grant: approver })).toBe(true)
    expect(canFinalizeDecision({ kind: "internal", grant: approver })).toBe(false)
    if (actor.kind !== "internal") return
    expect(canApproveEvidence({ kind: "internal", grant: actor.grant as never })).toBe(false)
    const row = product({ slug: "fixture-auth", availableForm: "pending" })
    const opened = {
      id: "fixture-auth",
      sku: "FIX-AUTH",
      productSlug: "fixture-auth",
      field: "form" as const,
      catalogValue: "pending",
      evidenceValue: "30 sachets",
      evidenceSnapshot: "30 sachets",
      sourceId: "src-auth",
      sourceLocator: "auth.pdf",
      evidenceAnchor: "30 sachets",
      conflictType: "VALUE_CONFLICT" as const,
      variantAmbiguous: false,
      adoptable: true,
      status: "OPEN" as const,
      audit: [],
    }
    const executed = executeAuthorizedDecision({
      decision: opened,
      kind: "ADOPT_EVIDENCE_VALUE",
      rationale: "Form only.",
      actor,
      at: AT,
      product: row,
      dossiers: dossier("fixture-auth", "src-auth", "auth.pdf", "30 sachets"),
    })
    expect(executed.ok).toBe(true)
    if (!executed.ok) return
    expect(executed.value.product.availableForm).toBe("30 sachets")
    expect(executed.value.product).not.toBe(row)
    expect(row.availableForm).toBe("pending")
    expect(executed.value.decision.decisionOwnerReference).toBe("user-1")
    expect(executed.value.decision.status).toBe("DECIDED")
    const event = executed.value.decision.audit.at(-1)
    expect(event).toMatchObject({
      action: "decide",
      entityId: "fixture-auth",
      actorId: "user-1",
      actorIdentity: "reviewer@example.test",
      sku: "FIX-AUTH",
      field: "form",
      previousValue: "pending",
      newValue: "30 sachets",
      decisionType: "ADOPT_EVIDENCE_VALUE",
      evidenceSnapshot: "30 sachets",
      sourceLocator: "auth.pdf",
      rationale: "Form only.",
      approvalState: "not_approved",
      at: AT,
    })
    expect(event?.searchEligibility).toBe(isProductSearchEligible(executed.value.product) ? "eligible" : "not_eligible")
    expect(opened.status).toBe("OPEN")
  })

  it("rejects a stale snapshot, a moved catalog phrase, and an invalid kind without writing", () => {
    const actor = reviewer()
    const row = product({ slug: "fixture-auth", availableForm: "pending" })
    const decision = {
      id: "fixture-stale",
      sku: "FIX-STALE",
      productSlug: "fixture-auth",
      field: "form" as const,
      catalogValue: "pending",
      evidenceValue: "30 sachets",
      evidenceSnapshot: "30 sachets",
      sourceId: "src-stale",
      sourceLocator: "stale.pdf",
      evidenceAnchor: "30 sachets",
      conflictType: "VALUE_CONFLICT" as const,
      variantAmbiguous: false,
      adoptable: true,
      status: "OPEN" as const,
      audit: [],
    }
    expect(executeAuthorizedDecision({
      decision,
      kind: "ADOPT_EVIDENCE_VALUE",
      rationale: "Stale source.",
      actor,
      at: AT,
      product: row,
      dossiers: dossier("fixture-auth", "src-stale", "stale.pdf", "60 sachets"),
    })).toEqual({ ok: false, reason: "stale" })
    expect(executeAuthorizedDecision({
      decision,
      kind: "KEEP_CATALOG_VALUE",
      rationale: "Catalog moved.",
      actor,
      at: AT,
      product: product({ slug: "fixture-auth", availableForm: "other" }),
      dossiers: dossier("fixture-auth", "src-stale", "stale.pdf", "30 sachets"),
    })).toEqual({ ok: false, reason: "stale" })
    expect(executeAuthorizedDecision({
      decision,
      kind: "NOT_A_KIND" as "KEEP_CATALOG_VALUE",
      rationale: "Bad kind.",
      actor,
      at: AT,
      product: row,
      dossiers: dossier("fixture-auth", "src-stale", "stale.pdf", "30 sachets"),
    }).ok).toBe(false)
    expect(row.availableForm).toBe("pending")
  })

  it("scopes view, create, and edit separately from finalizing", () => {
    const viewer = reviewer(["view_queue"])
    expect(viewer.kind).toBe("internal")
    expect(canFinalizeDecision(viewer)).toBe(false)
    const editor = reviewer(["edit_decision"])
    expect(canFinalizeDecision(editor)).toBe(false)
    const finalizer = reviewer(["finalize_decision"])
    expect(canFinalizeDecision(finalizer)).toBe(true)
    if (finalizer.kind !== "internal") return
    expect(finalizer.grant.capabilities).toEqual(["finalize_decision"])
    expect(finalizer.grant.capabilities).not.toContain("approve")
  })

  it("does not apply the nine confirmed decisions without a stored reviewer", async () => {
    const confirmed: DecisionKind[] = [
      "ADOPT_EVIDENCE_VALUE",
      "ADOPT_EVIDENCE_VALUE",
      "ADOPT_EVIDENCE_VALUE",
      "ADOPT_EVIDENCE_VALUE",
      "ADOPT_EVIDENCE_VALUE",
      "ADOPT_EVIDENCE_VALUE",
      "ADOPT_EVIDENCE_VALUE",
      "ADOPT_EVIDENCE_VALUE",
      "MARK_UNVERIFIED",
    ]
    expect(CATALOG_DECISION_QUEUE).toHaveLength(confirmed.length)
    const products = await new MockProductRepository().getAllProducts()
    const before = products.map((item) => JSON.stringify(item))
    for (const [index, decision] of CATALOG_DECISION_QUEUE.entries()) {
      const product = products.find((item) => item.slug === decision.productSlug)
      expect(product).toBeDefined()
      if (!product) continue
      expect(
        executeAuthorizedDecision({
          decision,
          kind: confirmed[index],
          rationale: "Confirmed earlier. This is not a stored reviewer.",
          actor: { kind: "anonymous" },
          at: AT,
          product,
          dossiers: CATALOG_EVIDENCE_DRAFTS,
        })
      ).toEqual({ ok: false, reason: "denied" })
      expect(
        executeAuthorizedDecision({
          decision,
          kind: confirmed[index],
          rationale: "Empty stored capability.",
          actor: authorizeDecisionActor(
            { id: "user-1" },
            { id: "user-1", email: "person@example.test", evidenceDecisionCapabilities: [] }
          ),
          at: AT,
          product,
          dossiers: CATALOG_EVIDENCE_DRAFTS,
        })
      ).toEqual({ ok: false, reason: "denied" })
    }
    expect(CATALOG_DECISION_QUEUE.every((item) => item.status === "OPEN" && item.decision === undefined)).toBe(true)
    expect(CATALOG_DECISION_QUEUE.every((item) => item.decisionOwnerReference === undefined)).toBe(true)
    expect(products.map((item) => JSON.stringify(item))).toEqual(before)
    expect(products.filter(isProductSearchEligible).map((item) => item.sku).sort()).toEqual(["CAMI-IRT-001", "CAMI-PO-001"])
    const urls = buildSitemapEntries(products).map((entry) => entry.url)
    expect(urls.some((url) => url.endsWith("/products/ca-mi-pulse-oximeter"))).toBe(true)
    expect(urls.some((url) => url.endsWith("/products/proxeed-plus"))).toBe(false)
    expect(urls.some((url) => url.endsWith("/products/proxeed-men"))).toBe(false)
    expect(productsHubSearchLinks(products, "en").map((link) => link.href).sort()).toEqual([
      "/en/products/ca-mi-ir-thermometer",
      "/en/products/ca-mi-pulse-oximeter",
    ])
  })

  it("does not execute the open queue or change the catalog", async () => {
    expect(CATALOG_DECISION_QUEUE.every((item) => item.status === "OPEN" && item.decision === undefined)).toBe(true)
    expect(listEvidenceDecisions()).toBe(CATALOG_DECISION_QUEUE)
    const products = await new MockProductRepository().getAllProducts()
    for (const item of products) expect(publicCatalogProduct(item)).toBe(item)
    const men = products.find((item) => item.sku === "PXD-MEN-001")
    expect(JSON.stringify(men)).toContain("7.5 µg")
    expect(isProductSearchEligible(products.find((item) => item.sku === "PXD-PLS-001")!)).toBe(false)
    expect(isProductSearchEligible(products.find((item) => item.sku === "CAMI-PO-001")!)).toBe(true)
  })

  it("has no request path that assigns or finalizes a decision", () => {
    const root = process.cwd()
    const users = readFileSync(path.join(root, "src/collections/Users.ts"), "utf8")
    expect(users).toContain("update: () => false")
    expect(users).toContain("stripUntrustedCapabilityWrite")
    const session = readFileSync(path.join(root, "src/lib/auth/decision-session.ts"), "utf8")
    expect(session).not.toContain("getPayload")
    expect(session).not.toContain("evidenceDecisionCapabilities: [")
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((name) => {
        const full = path.join(dir, name)
        return statSync(full).isDirectory() ? walk(full) : [full]
      })
    for (const file of walk(path.join(root, "src/app"))) {
      if (!/\.(ts|tsx)$/.test(file)) continue
      const source = readFileSync(file, "utf8")
      expect(source).not.toContain("authorizeDecisionActor")
      expect(source).not.toContain("createScopedDecisionGrant")
      expect(source).not.toContain("executeAuthorizedDecision")
    }
    const hook = Users.hooks?.beforeChange?.[0]
    expect(hook).toBeTypeOf("function")
    if (!hook) return
    const locked = hook({
      data: { email: "person@example.test", evidenceDecisionCapabilities: ["finalize_decision"] },
      originalDoc: { evidenceDecisionCapabilities: [] },
    } as never)
    expect(locked.evidenceDecisionCapabilities).toEqual([])
  })
})
