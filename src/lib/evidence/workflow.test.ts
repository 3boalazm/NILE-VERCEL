import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { contentProductLinks } from "@/lib/content/links"
import type { ContentRecord } from "@/lib/content/types"
import { EXPOSURE_CONTEXTS } from "@/lib/products/evidence-pack"
import { commercialFacts, commercialSections } from "@/lib/products/commercial-profile"
import { localizeProduct } from "@/lib/products/localize"
import { MockProductRepository } from "@/lib/products/mock-repository"
import type { Product } from "@/lib/products/types"
import { productPageMetadata } from "@/lib/seo/product-metadata"
import { buildProductJsonLd } from "@/lib/seo/product-schema"
import { buildSitemapEntries } from "@/lib/seo/sitemap-entries"
import {
  canExposeField,
  canExposeStatement,
  canUseSkuInContent,
  isProductSearchEligible,
  skuAssessment,
  storedClaimStatements,
} from "@/lib/seo/sku-evidence"

import {
  actorFromStorefrontSession,
  canApproveEvidence,
  canEditEvidence,
  canSubmitEvidence,
  createServerGrant,
  evidenceFromClientPayload,
  isServerGrant,
  type EvidenceActor,
  type EvidenceCapability,
} from "./access"
import { compositionSnapshot, applyApprovedEvidence, projectApprovedPack } from "./project"
import { listEvidenceRecords, publicCatalogProduct } from "./store"
import type { EvidenceDossier } from "./types"
import {
  addDraftClaim,
  addDraftFact,
  addDraftSource,
  advanceToApproved,
  emptyDossier,
  transitionClaim,
  transitionFact,
  transitionSource,
  type WorkflowResult,
} from "./workflow"

const AT = "2026-09-24T00:00:00.000Z"
const products = await new MockProductRepository().getAllProducts()
const device = products.find((item) => item.slug === "ca-mi-pulse-oximeter")
if (!device) throw new Error("missing device")

function must<T>(result: WorkflowResult<T>): T {
  if (!result.ok) throw new Error(result.reason)
  return result.value
}

function grant(capabilities: readonly EvidenceCapability[], actorId = "reviewer-1"): EvidenceActor {
  const created = createServerGrant(actorId, capabilities)
  if (!created) throw new Error("grant")
  return { kind: "internal", grant: created }
}

const reviewer = grant(["edit", "submit", "approve"])
const editor = grant(["edit"], "editor-1")
const submitter = grant(["submit"], "submitter-1")
const approver = grant(["approve"], "approver-1")

function approve(
  dossier: EvidenceDossier,
  kind: "source" | "fact" | "claim",
  id: string,
  actor: EvidenceActor = reviewer
): EvidenceDossier {
  const transition = kind === "source" ? transitionSource : kind === "fact" ? transitionFact : transitionClaim
  return must(advanceToApproved(transition, dossier, id, actor, AT))
}

function supplement(overrides: Partial<Product> = {}): Product {
  return {
    id: "fixture-supplement",
    slug: "fixture-supplement",
    name: "Fixture Supplement",
    nameArabic: "مكمل تجريبي",
    categorySlug: "supplements",
    status: "active",
    shortDescription: "Stored identity line.",
    keyBenefits: ["Stored benefit line."],
    composition: [{ label: "Ingredient", value: "Listed amount" }],
    availableForm: "30 sachets",
    sku: "FIX-001",
    price: 100,
    currency: "EGP",
    ...overrides,
  }
}

function withPackEvidence(product: Product): EvidenceDossier {
  let dossier = emptyDossier(product.slug)
  dossier = must(
    addDraftSource(
      dossier,
      {
        id: "src-pack",
        sourceType: "INTERNAL_APPROVED_DOCUMENT",
        title: "Internal review record",
        locator: "internal-review-record",
      },
      reviewer,
      AT
    )
  )
  dossier = approve(dossier, "source", "src-pack")
  dossier = must(
    addDraftFact(
      dossier,
      {
        id: "fact-form",
        field: "form",
        reviewedValue: product.availableForm?.trim() ?? "",
        reviewedValueEn: product.translations?.en?.availableForm?.trim(),
        sourceId: "src-pack",
      },
      reviewer,
      AT
    )
  )
  dossier = approve(dossier, "fact", "fact-form")
  dossier = must(
    addDraftFact(
      dossier,
      {
        id: "fact-composition",
        field: "composition",
        reviewedValue: compositionSnapshot(product.composition),
        reviewedValueEn: product.translations?.en?.composition
          ? compositionSnapshot(product.translations.en.composition)
          : undefined,
        sourceId: "src-pack",
      },
      reviewer,
      AT
    )
  )
  dossier = approve(dossier, "fact", "fact-composition")
  return dossier
}

function withClaim(dossier: EvidenceDossier, id: string, statement: string): EvidenceDossier {
  const drafted = must(
    addDraftClaim(
      dossier,
      {
        id,
        statement,
        sourceId: "src-pack",
        allowedContexts: EXPOSURE_CONTEXTS,
        note: "Reviewed as stored.",
      },
      reviewer,
      AT
    )
  )
  return approve(drafted, "claim", id)
}

function withEveryClaim(product: Product, dossier: EvidenceDossier): EvidenceDossier {
  let next = dossier
  storedClaimStatements(product).forEach((statement, index) => {
    next = withClaim(next, `claim-${index + 1}`, statement)
  })
  return next
}

function complete(product: Product): EvidenceDossier {
  return withEveryClaim(product, withPackEvidence(product))
}

function forgedPack(product: Product): Product {
  const approved = applyApprovedEvidence(product, [complete(product)])
  return { ...product, evidencePack: approved.evidencePack }
}

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? filesUnder(path) : [path]
  })
}

const guide: ContentRecord = {
  id: "guide-1",
  translationGroupId: "guide-pack",
  kind: "guide",
  layer: "editorial",
  slug: "pack-facts",
  locale: "en",
  title: "Pack facts",
  summary: "A stored summary.",
  reviewState: "published",
  relatedProductSlugs: ["fixture-supplement", "ca-mi-pulse-oximeter"],
}

describe("evidence review lifecycle", () => {
  it("requires draft, submitted, and under review before approval, and records the audit on the dossier", () => {
    let dossier = must(
      addDraftClaim(
        emptyDossier("fixture-supplement"),
        {
          id: "claim-1",
          statement: "Stored identity line.",
          sourceId: "src-pack",
          allowedContexts: ["PRODUCT_PAGE"],
        },
        editor,
        AT
      )
    )
    expect(addDraftClaim(dossier, { id: "x", statement: "x", sourceId: "src-pack", allowedContexts: [] }, submitter, AT)).toEqual({
      ok: false,
      reason: "denied",
    })
    expect(transitionClaim(dossier, "claim-1", "SUBMITTED", editor, AT)).toEqual({ ok: false, reason: "denied" })
    expect(transitionClaim(dossier, "claim-1", "APPROVED", approver, AT)).toEqual({ ok: false, reason: "invalid_transition" })
    expect(dossier.claims[0]?.state).toBe("DRAFT")

    dossier = must(transitionClaim(dossier, "claim-1", "SUBMITTED", submitter, "2026-09-24T01:00:00.000Z"))
    expect(transitionClaim(dossier, "claim-1", "UNDER_REVIEW", submitter, AT)).toEqual({ ok: false, reason: "denied" })
    dossier = must(transitionClaim(dossier, "claim-1", "UNDER_REVIEW", approver, "2026-09-24T02:00:00.000Z"))
    const rejected = must(transitionClaim(dossier, "claim-1", "REJECTED", approver, "2026-09-24T03:00:00.000Z"))
    expect(rejected.claims[0]?.statement).toBe("Stored identity line.")
    expect(rejected.claims[0]?.reviewerId).toBe("approver-1")
    expect(rejected.claims[0]?.reviewedAt).toBe("2026-09-24T03:00:00.000Z")
    expect(transitionClaim(rejected, "claim-1", "APPROVED", approver, AT)).toEqual({ ok: false, reason: "invalid_transition" })
    expect(rejected.audit.map((event) => event.action)).toEqual(["create", "submit", "start_review", "reject"])
    const last = rejected.audit.at(-1)
    expect(last).toEqual({
      action: "reject",
      entityId: "claim-1",
      previousState: "UNDER_REVIEW",
      newState: "REJECTED",
      actorId: "approver-1",
      at: "2026-09-24T03:00:00.000Z",
    })
  })

  it("approves only from under review and keeps the stored wording", () => {
    const product = supplement()
    const dossier = complete(product)
    const claim = dossier.claims.find((item) => item.statement === "Stored benefit line.")
    expect(claim?.state).toBe("APPROVED")
    expect(claim?.note).toBe("Reviewed as stored.")
    expect(claim?.statement).toBe("Stored benefit line.")
    expect(dossier.claims).toHaveLength(2)
    expect(dossier.audit.some((event) => event.action === "approve" && event.previousState === "UNDER_REVIEW")).toBe(true)
    expect(projectApprovedPack(product, [dossier])?.claims?.map((item) => item.statement).sort()).toEqual([
      "Stored benefit line.",
      "Stored identity line.",
    ])
  })
})

describe("approved snapshots and claims", () => {
  it("does not let an approved 30-sachet pack authorize a later 60-sachet value", () => {
    const product = supplement()
    const dossier = complete(product)
    const cleared = applyApprovedEvidence(product, [dossier])
    expect(canExposeField(cleared, "form", "PRODUCT_PAGE")).toBe(true)
    expect(commercialFacts(cleared, { categoryName: "Supplements", availability: "Active" }, cleared)).toContainEqual({
      key: "form",
      value: "30 sachets",
    })

    const changed = { ...product, availableForm: "60 sachets" }
    const stale = applyApprovedEvidence(changed, [dossier])
    expect(stale.availableForm).toBe("60 sachets")
    expect(stale.evidencePack?.references?.some((reference) => reference.covers.includes("identity"))).toBeFalsy()
    expect(canExposeField(stale, "form", "PRODUCT_SCHEMA")).toBe(false)
    expect(commercialFacts(changed, { categoryName: "Supplements", availability: "Active" }, stale).some((fact) => fact.key === "form")).toBe(
      false
    )
    const schema = buildProductJsonLd(changed, "en", "Nile Pharma Food", "Supplements", stale)
    expect(JSON.stringify(schema)).not.toContain("60 sachets")
    expect(JSON.stringify(schema)).not.toContain("30 sachets")
    expect(isProductSearchEligible(stale)).toBe(false)
  })

  it("treats an English pack change as stale even when the Arabic snapshot still matches", () => {
    const product = supplement({
      translations: { en: { availableForm: "30 sachets", shortDescription: "Stored identity line.", keyBenefits: ["Stored benefit line."] } },
    })
    const dossier = complete(product)
    const changed = {
      ...product,
      translations: { en: { ...product.translations?.en, availableForm: "60 sachets" } },
    }
    const stale = applyApprovedEvidence(changed, [dossier])
    expect(canExposeField(stale, "form", "PRODUCT_SCHEMA")).toBe(false)
    expect(isProductSearchEligible(stale)).toBe(false)
  })

  it("keeps a partial claim review off the sitemap and exposes only the exact approved statement", () => {
    const product = supplement()
    const dossier = withClaim(withPackEvidence(product), "claim-1", "Stored identity line.")
    const partial = applyApprovedEvidence(product, [dossier])
    expect(isProductSearchEligible(partial)).toBe(false)
    expect(canExposeStatement(partial, "Stored identity line.", "PRODUCT_PAGE")).toBe(true)
    expect(canExposeStatement(partial, "Stored benefit line.", "PRODUCT_PAGE")).toBe(false)
    expect(canExposeStatement(partial, "Stored identity line. Extra.", "PRODUCT_PAGE")).toBe(false)
    expect(commercialSections(partial).benefits).toBe(false)
    expect(buildSitemapEntries([partial], [], [dossier]).some((entry) => entry.url.includes(product.slug))).toBe(false)
    const schema = JSON.stringify(buildProductJsonLd(partial, "en", "Nile Pharma Food", "Supplements", partial))
    expect(schema).not.toContain("Stored benefit line.")
    expect(schema).toContain("Listed amount")
  })

  it("makes a supplement eligible only when pack, composition, and every stored statement match", () => {
    const product = supplement()
    const dossier = complete(product)
    const cleared = applyApprovedEvidence(product, [dossier])
    expect(isProductSearchEligible(cleared)).toBe(true)
    expect(skuAssessment(cleared).fields.leaflet.state).toBe("MISSING")
    expect(cleared.downloadUrl).toBeUndefined()
    expect(canUseSkuInContent(cleared, "editorial")).toBe(true)
    expect(canUseSkuInContent(cleared, "medical_claim")).toBe(true)
    expect(buildSitemapEntries([product], [], [dossier]).some((entry) => entry.url.endsWith("/products/fixture-supplement"))).toBe(true)
    expect(buildSitemapEntries([product], [], []).some((entry) => entry.url.includes(product.slug))).toBe(false)

    const compositionOnly = applyApprovedEvidence(product, [withPackEvidence(product)])
    expect(isProductSearchEligible(compositionOnly)).toBe(false)
    expect(isProductSearchEligible({ ...cleared, status: "paused" })).toBe(false)
    expect(buildSitemapEntries([{ ...product, status: "paused" }], [], [dossier]).some((entry) => entry.url.includes(product.slug))).toBe(
      false
    )
  })

  it("does not infer brand or manufacturer, and does not require either for a device", () => {
    const product = supplement()
    const cleared = applyApprovedEvidence(product, [complete(product)])
    expect(skuAssessment(cleared).fields.brand.state).toBe("MISSING")
    expect(buildProductJsonLd(cleared, "en", "Nile Pharma Food").brand).toBeUndefined()
    expect(JSON.stringify(cleared.evidencePack)).not.toContain(product.name)

    let dossier = complete(product)
    dossier = must(
      addDraftSource(
        dossier,
        {
          id: "src-brand",
          sourceType: "MANUFACTURER_DOCUMENT",
          title: "Manufacturer authorization",
          locator: "manufacturer-authorization.pdf",
        },
        reviewer,
        AT
      )
    )
    dossier = approve(dossier, "source", "src-brand")
    dossier = must(
      addDraftFact(dossier, { id: "fact-brand", field: "brand", reviewedValue: "Fixture Brand", sourceId: "src-brand" }, reviewer, AT)
    )
    dossier = approve(dossier, "fact", "fact-brand")
    dossier = must(
      addDraftFact(
        dossier,
        { id: "fact-manufacturer", field: "manufacturer", reviewedValue: "Fixture Manufacturer", sourceId: "src-brand" },
        reviewer,
        AT
      )
    )
    dossier = approve(dossier, "fact", "fact-manufacturer")
    const branded = applyApprovedEvidence(product, [dossier])
    const schema = buildProductJsonLd(branded, "en", "Nile Pharma Food", "Supplements", branded)
    expect(schema.brand).toEqual({ "@type": "Brand", name: "Fixture Brand" })
    expect(schema.manufacturer).toEqual({ "@type": "Organization", name: "Fixture Manufacturer" })
    expect(commercialFacts(branded, { availability: "Active" }, branded)).toEqual(
      expect.arrayContaining([
        { key: "brand", value: "Fixture Brand" },
        { key: "manufacturer", value: "Fixture Manufacturer" },
      ])
    )

    const projectedDevice = applyApprovedEvidence(device, [])
    expect(isProductSearchEligible(projectedDevice)).toBe(true)
    expect(skuAssessment(projectedDevice).fields.brand.state).toBe("MISSING")
    const deviceSchema = buildProductJsonLd(localizeProduct(projectedDevice, "en"), "en", "Nile Pharma Food", "Medical Devices", projectedDevice)
    expect(deviceSchema.brand).toBeUndefined()
    expect(deviceSchema.manufacturer).toBeUndefined()
    expect(deviceSchema.additionalProperty).toEqual(
      expect.arrayContaining([{ "@type": "PropertyValue", name: "Battery", value: "2 x AAA batteries, ~30 hours of operation" }])
    )
    expect(JSON.stringify(deviceSchema)).not.toContain("Italy")
    expect(buildSitemapEntries([device], [], []).some((entry) => entry.url.endsWith("/products/ca-mi-pulse-oximeter"))).toBe(true)
  })
})

describe("production output follows the store", () => {
  it("keeps the current catalog unapproved and unchanged", () => {
    expect(listEvidenceRecords().some((dossier) => dossier.sources.some((source) => source.state === "APPROVED"))).toBe(false)
    expect(listEvidenceRecords().some((dossier) => dossier.facts.some((fact) => fact.state === "APPROVED"))).toBe(false)
    expect(listEvidenceRecords().some((dossier) => dossier.claims.some((claim) => claim.state === "APPROVED"))).toBe(false)
    for (const product of products) {
      expect(product.evidencePack).toBeUndefined()
      expect(publicCatalogProduct(product)).toBe(product)
      expect(isProductSearchEligible(publicCatalogProduct(product))).toBe(isProductSearchEligible(product))
    }
    expect(products.filter(isProductSearchEligible).map((product) => product.slug).sort()).toEqual([
      "ca-mi-ir-thermometer",
      "ca-mi-pulse-oximeter",
    ])
    expect(buildSitemapEntries(products, [], listEvidenceRecords()).map((entry) => entry.url)).toEqual(
      buildSitemapEntries(products).map((entry) => entry.url)
    )
  })

  it("ignores a product-field pack on the sitemap, metadata, schema, and content links", () => {
    const product = supplement()
    const forged = forgedPack(product)
    expect(isProductSearchEligible(forged)).toBe(true)
    expect(isProductSearchEligible(applyApprovedEvidence(forged, []))).toBe(false)
    expect(buildSitemapEntries([forged]).some((entry) => entry.url.includes(forged.slug))).toBe(true)
    expect(buildSitemapEntries([forged], [], []).some((entry) => entry.url.includes(forged.slug))).toBe(false)
    expect(productPageMetadata(forged, "en", applyApprovedEvidence(forged, [])).robots).toEqual({ index: false, follow: true })

    const conflict = { ...device, evidencePack: { identity: { sku: "OTHER-SKU" } } }
    expect(buildSitemapEntries([conflict]).some((entry) => entry.url.includes(conflict.slug))).toBe(false)
    expect(buildSitemapEntries([conflict], [], []).some((entry) => entry.url.includes(device.slug))).toBe(true)

    const dossier = complete(product)
    const cleared = applyApprovedEvidence(product, [dossier])
    expect(productPageMetadata(cleared, "en", cleared).robots).toEqual({ index: true, follow: true })
    const schema = JSON.stringify(buildProductJsonLd(cleared, "en", "Nile Pharma Food", "Supplements", cleared))
    expect(schema).toContain("Listed amount")
    expect(schema).toContain("Stored identity line.")
    expect(schema).not.toContain("internal-review-record")
    expect(schema).not.toContain("/api/media")
    expect(cleared.evidencePack?.brand).toBeUndefined()
    expect((buildProductJsonLd(cleared, "en", "Nile Pharma Food", "Supplements", cleared).offers as { price: number }).price).toBe(100)

    expect(contentProductLinks(guide, [forged, device], "en").map((link) => link.href)).toEqual([
      "/en/products/ca-mi-pulse-oximeter",
    ])
    expect(contentProductLinks(guide, [product, device], "en", [dossier]).map((link) => link.href)).toEqual([
      "/en/products/fixture-supplement",
      "/en/products/ca-mi-pulse-oximeter",
    ])
    expect(buildSitemapEntries([product, device], [], [dossier]).map((entry) => entry.url).join("\n")).not.toContain("internal-review-record")
  })
})

describe("evidence approval cannot be granted by a request", () => {
  it("rejects storefront actors, JSON grants, URLs, and public media references", () => {
    expect(canApproveEvidence({ kind: "anonymous" })).toBe(false)
    expect(canApproveEvidence(actorFromStorefrontSession())).toBe(false)
    expect(canApproveEvidence(actorFromStorefrontSession("customer-1"))).toBe(false)
    expect(canEditEvidence(actorFromStorefrontSession("customer-1"))).toBe(false)
    expect(canSubmitEvidence(approver)).toBe(false)
    expect(evidenceFromClientPayload({ evidencePack: { brand: { name: "Fixture Brand", reviewStatus: "approved" } }, verified: true })).toEqual({
      ok: false,
      reason: "client_payload_rejected",
    })

    const minted = createServerGrant("reviewer-1", ["approve"])
    const parsed = JSON.parse(JSON.stringify(minted)) as unknown
    expect(isServerGrant(parsed)).toBe(false)
    expect(canApproveEvidence({ kind: "internal", grant: parsed } as EvidenceActor)).toBe(false)
    const drafted = must(
      addDraftFact(
        emptyDossier("fixture-supplement"),
        { id: "fact-form", field: "form", reviewedValue: "30 sachets", sourceId: "src-pack" },
        editor,
        AT
      )
    )
    expect(transitionFact(drafted, "fact-form", "APPROVED", actorFromStorefrontSession("customer-1"), AT)).toEqual({
      ok: false,
      reason: "denied",
    })
    expect(drafted.facts[0]?.state).toBe("DRAFT")

    expect(
      addDraftSource(
        emptyDossier("fixture-supplement"),
        { id: "src-url", sourceType: "OFFICIAL_LEAFLET", title: "Leaflet", locator: "https://example.com/leaflet.pdf" },
        editor,
        AT
      )
    ).toEqual({ ok: false, reason: "invalid" })
    expect(
      addDraftSource(
        emptyDossier("fixture-supplement"),
        {
          id: "src-media",
          sourceType: "OFFICIAL_LEAFLET",
          title: "Leaflet",
          locator: "leaflet-label",
          documentRef: "/api/media/file/leaflet.pdf",
        },
        editor,
        AT
      )
    ).toEqual({ ok: false, reason: "invalid" })

    const urlDossier: EvidenceDossier = {
      productSlug: "fixture-supplement",
      sources: [
        {
          id: "src-url",
          sourceType: "OTHER_APPROVED_SOURCE",
          title: "A URL",
          locator: "https://example.com/leaflet.pdf",
          state: "APPROVED",
        },
      ],
      facts: [{ id: "fact-form", field: "form", reviewedValue: "30 sachets", sourceId: "src-url", state: "APPROVED" }],
      claims: [],
      audit: [],
    }
    expect(projectApprovedPack(supplement(), [urlDossier])).toBeNull()
    expect(JSON.stringify(projectApprovedPack(supplement(), [complete(supplement())]))).not.toContain("http")
  })

  it("has no request path, role, or public media store for approval", () => {
    const app = filesUnder("src/app").filter((path) => path.endsWith(".ts") || path.endsWith(".tsx"))
    const serverFiles = filesUnder("src").filter(
      (path) => /\.(ts|tsx)$/.test(path) && !path.endsWith(".test.ts") && readFileSync(path, "utf8").includes('"use server"')
    )
    for (const path of [...app, ...serverFiles]) {
      const text = readFileSync(path, "utf8")
      expect(text).not.toContain("createServerGrant")
      expect(text).not.toContain("transitionFact")
      expect(text).not.toContain("transitionClaim")
      expect(text).not.toContain("addDraftSource")
    }
    expect(readFileSync("src/app/sitemap.ts", "utf8")).toContain("listEvidenceRecords()")
    expect(readFileSync("src/app/[locale]/products/[slug]/page.tsx", "utf8")).toContain("publicCatalogProduct")
    expect(readFileSync("src/app/[locale]/products/[slug]/page.tsx", "utf8")).not.toContain("evidencePack")
    expect(readFileSync("src/collections/Users.ts", "utf8")).toContain("evidenceDecisionCapabilities")
    expect(readFileSync("src/collections/Users.ts", "utf8")).toContain("update: () => false")
    expect(readFileSync("src/collections/Users.ts", "utf8")).not.toMatch(/approve/)
    expect(readFileSync("src/collections/Media.ts", "utf8")).toContain("read: () => true")
    expect(readFileSync("src/payload.config.ts", "utf8")).toContain("collections: [Users, Media, Categories, Products, Articles, Jobs, Inquiries, ErasureRequests, Wishlists]")
    for (const path of filesUnder("src/lib/evidence").filter((item) => !item.endsWith(".test.ts"))) {
      const text = readFileSync(path, "utf8")
      expect(text).not.toMatch(/from ["']payload["']/)
      expect(text).not.toContain("collections/Media")
    }
  })
})
