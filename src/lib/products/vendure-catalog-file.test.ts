import { readFileSync } from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

import { MockProductRepository } from "./mock-repository"
import { resolveCatalogPrice } from "./catalog-price"

// scripts/data/vendure-catalog.json is what scripts/seed-vendure-catalog.mjs
// provisions into Vendure. It is generated from mock-repository.ts
// (`node scripts/dump-catalog.mjs`) and committed, so a fresh database never
// depends on /tmp. This test fails when the two drift apart.
const file = path.join(process.cwd(), "scripts/data/vendure-catalog.json")
const catalog = JSON.parse(readFileSync(file, "utf8")) as Array<{
  slug: string
  sku: string | null
  name: string
  price: number | null
  status: string
}>

describe("scripts/data/vendure-catalog.json", () => {
  it("mirrors the repo catalog exactly (run `node scripts/dump-catalog.mjs` after catalog edits)", async () => {
    const products = await new MockProductRepository().getAllProducts()
    expect(catalog.map((c) => c.slug)).toEqual(products.map((p) => p.slug))
    for (const p of products) {
      const row = catalog.find((c) => c.slug === p.slug)!
      expect(row.sku).toBe(p.sku ?? null)
      expect(row.price).toBe(typeof p.price === "number" ? p.price : null)
      expect(row.status).toBe(p.status)
    }
  })

  it("gives every product a SKU and never a placeholder price", () => {
    for (const row of catalog) {
      expect(row.sku, row.slug).toBeTruthy()
      if (row.price !== null) expect(row.price, row.slug).toBeGreaterThan(0)
    }
  })

  it("keeps unpriced products unpriced", () => {
    const unpriced = catalog.filter((c) => c.price === null).map((c) => c.slug)
    expect(unpriced.sort()).toEqual(["proxeed-men", "proxeed-women-inositol"])
  })
})

describe("resolveCatalogPrice", () => {
  it("treats a 0 live price as unavailable, never as a free product", () => {
    const r = resolveCatalogPrice({ price: 0, currency: "EGP", sku: "X" }, undefined, false)
    expect(r.priceSource).toBe("unavailable")
    expect(r.price).toBeUndefined()
  })
})
