// Vendure demo-catalog seeder — mirrors the storefront catalog (slug-keyed
// bridge) into a FRESH Vendure database: zone/channel wiring, tax category,
// products + variants (enabled, priced, in stock), then search reindex.
// Idempotent: existing products are skipped, so it is safe to re-run.
//
// Usage: set -a && . ./.env && set +a && CATALOG_JSON=/tmp/catalog.json \
//          node scripts/seed-vendure-catalog.mjs
// (generate /tmp/catalog.json with scripts/dump-catalog or any 8-product file)
//
// Vendure 3 API-shape notes baked in the hard way (each cost a debugging
// round): list queries return `{ items }`; the admin login token arrives ONLY
// in the `vendure-auth-token` response HEADER; Channel input takes
// defaultTaxZoneId/defaultShippingZoneId while queries return zone objects;
// products use `enabled` (there is no `published`); union mutation results
// reject `... on ErrorResult` spreads for concrete types (select fields on
// the concrete type); the reindex mutation is `reindex`; fresh variants
// default to stockOnHand 0 — they are updated to a demo stock here.
import { readFileSync } from "node:fs"

const ADMIN_API = process.env.VENDURE_ADMIN_API || "http://localhost:3001/admin-api"
const CATALOG = JSON.parse(readFileSync(process.env.CATALOG_JSON || "/tmp/catalog.json", "utf8"))
let adminToken = null

async function gql(query, variables) {
  const res = await fetch(ADMIN_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  })
  const headerToken = res.headers.get("vendure-auth-token")
  if (headerToken) adminToken = headerToken
  const json = await res.json()
  if (json.errors) throw new Error(JSON.stringify(json.errors).slice(0, 300))
  return json.data
}

function createVariantFor(productId, p, taxCategoryId) {
  return {
    productId,
    sku: p.sku,
    taxCategoryId,
    translations: [
      { languageCode: "ar", name: p.name },
      { languageCode: "en", name: p.name },
    ],
    // Catalog bridge prices are whole EGP; Vendure stores minor units.
    price: Math.round((p.price ?? 0) * 100), // null price = legitimately unpriced demo entry (proxeed-men, proxeed-women-inositol)
  }
}

async function main() {
  const login = await gql(
    `mutation Login($u: String!, $p: String!) { login(username: $u, password: $p) { ... on CurrentUser { id identifier } ... on ErrorResult { errorCode message } } }`,
    { u: process.env.SUPERADMIN_USERNAME || "superadmin", p: process.env.SUPERADMIN_PASSWORD || "Npf-Demo-2026!Admin" }
  )
  if (!login.login.id) throw new Error("admin login failed: " + JSON.stringify(login.login))
  console.log("admin login ok:", login.login.identifier)

  // ── Zone "Egypt" + channel wiring (a fresh DB has none — without a default
  // tax zone, variant creation fails with "active tax zone could not be
  // determined").
  let zones = await gql(`{ zones { items { id name } } }`)
  let egyptZone = zones.zones.items.find((z) => z.name === "Egypt")
  if (!egyptZone) {
    const created = await gql(`mutation { createZone(input: { name: "Egypt" }) { id name } }`)
    egyptZone = created.createZone
    console.log("zone Egypt created:", egyptZone.id)
  } else {
    console.log("zone Egypt exists:", egyptZone.id)
  }
  const channel = await gql(`{ activeChannel { id code defaultTaxZone { id } defaultShippingZone { id } } }`)
  if (!channel.activeChannel.defaultTaxZone || !channel.activeChannel.defaultShippingZone) {
    const upd = await gql(
      `mutation UpdateChannel($input: UpdateChannelInput!) { updateChannel(input: $input) { ... on Channel { id } ... on ErrorResult { errorCode } } }`,
      {
        input: {
          id: channel.activeChannel.id,
          defaultTaxZoneId: egyptZone.id,
          defaultShippingZoneId: egyptZone.id,
        },
      }
    )
    if (!upd.updateChannel || !upd.updateChannel.id) throw new Error("channel wiring failed: " + JSON.stringify(upd))
    console.log("channel default tax/shipping zones wired")
  } else {
    console.log("channel zones already wired")
  }

  // ── Tax category "Standard".
  let taxCats = await gql(`{ taxCategories { items { id name } } }`)
  let standard = taxCats.taxCategories.items.find((t) => t.name === "Standard")
  if (!standard) {
    const created = await gql(`mutation { createTaxCategory(input: { name: "Standard" }) { id name } }`)
    standard = created.createTaxCategory
    console.log("tax category Standard created:", standard.id)
  } else {
    console.log("tax category Standard exists:", standard.id)
  }

  // ── Products + variants.
  for (const p of CATALOG) {
    const existing = await gql(
      `query ($slug: String!) { products(options: { filter: { slug: { eq: $slug } } }) { items { id slug variants { id sku enabled stockOnHand } } } }`,
      { slug: p.slug }
    )
    if (existing.products.items.length > 0) {
      console.log(`product ${p.slug} exists — skipped`)
      // Repair path: fresh variants are created disabled with 0 stock, so an
      // interrupted first run leaves products without a sellable variant.
      for (const v of existing.products.items[0].variants) {
        if (!v.enabled || v.stockOnHand === 0) {
          await gql(
            `mutation UpdateVariants($input: [UpdateProductVariantInput!]!) { updateProductVariants(input: $input) { ... on ProductVariant { id enabled } } }`,
            { input: [{ id: v.id, enabled: true, stockOnHand: 100 }] }
          )
          console.log(`  variant ${v.sku} enabled + stocked`)
        }
      }
      continue
    }
    const createdProduct = await gql(
      `mutation CreateProduct($input: CreateProductInput!) { createProduct(input: $input) { ... on Product { id slug } } }`,
      {
        input: {
          translations: [
            {
              languageCode: "ar",
              name: p.name,
              slug: p.slug,
              description: `${p.name} — ديمو كاتالوج نايل فارما فود.`,
            },
            {
              languageCode: "en",
              name: p.name,
              slug: p.slug,
              description: `${p.name} — Nile Pharma Food demo catalog.`,
            },
          ],
        },
      }
    )
    const product = createdProduct.createProduct
    if (!product || !product.id) throw new Error("createProduct failed for " + p.slug + ": " + JSON.stringify(createdProduct))
    // CreateProductInput cannot enable; flip it explicitly.
    await gql(
      `mutation UpdateProduct($input: UpdateProductInput!) { updateProduct(input: $input) { ... on Product { id enabled } } }`,
      { input: { id: product.id, enabled: true } }
    )
    const createdVariants = await gql(
      `mutation CreateVariants($input: [CreateProductVariantInput!]!) { createProductVariants(input: $input) { ... on ProductVariant { id sku } } }`,
      { input: [createVariantFor(product.id, p, standard.id)] }
    )
    const variant = createdVariants.createProductVariants?.[0]
    if (!variant || !variant.id) throw new Error("createProductVariants failed for " + p.slug + ": " + JSON.stringify(createdVariants))
    // Fresh variants are disabled with stockOnHand 0 — enable + stock them.
    await gql(
      `mutation UpdateVariants($input: [UpdateProductVariantInput!]!) { updateProductVariants(input: $input) { ... on ProductVariant { id enabled stockOnHand } } }`,
      { input: [{ id: variant.id, enabled: true, stockOnHand: 100 }] }
    )
    console.log(`product ${p.slug} created (${p.sku} @ ${p.price} EGP)`)
  }

  // ── Search reindex so the storefront queries see everything.
  const reindex = await gql(`mutation { reindex { __typename } }`)
  console.log("reindex done:", JSON.stringify(reindex.reindex))
  console.log("catalog seeding complete")
}

main().catch((e) => {
  console.error("ERROR:", e.message)
  process.exit(1)
})
