// Vendure commerce provisioning — part 1: store-wide settings + the catalog.
// Idempotent: safe to re-run on a fresh OR an already-seeded database.
//
//   set -a && . ./.env && set +a
//   node scripts/seed-vendure-catalog.mjs          # create what is missing
//   node scripts/seed-vendure-catalog.mjs --sync   # also re-align price / SKU /
//                                                  # enabled state with the repo
//
// Needs a RUNNING Vendure server AND worker (reindex is a worker job).
//
// What it provisions (everything the storefront hard-depends on):
//   - zone "Egypt" (+ the EG country), the channel's default tax + shipping zone
//   - channel: EGP currency, ar + en languages, prices INCLUDE tax (the shop's
//     terms say "prices include VAT where applicable" and the storefront shows
//     priceWithTax, so the number on the card is the number charged)
//   - tax category "Standard" + a 14% Egypt VAT rate (14% on products, shipping
//     zero-rated — confirmed by the owner 2026-08-31, see src/plugins/npf-shipping.ts)
//   - one product + one variant per catalog entry (scripts/data/vendure-catalog.json,
//     generated from mock-repository.ts by scripts/dump-catalog.mjs)
//   - the product photo as the featured Vendure asset (cart lines render it)
//   - search reindex, awaited (the job runs in the worker process)
//
// Data-integrity rules (pharma / food-supplement business):
//   - prices come ONLY from the catalog file. A product without an approved
//     price (price === null) is created DISABLED with price 0 and stays hidden
//     from the Shop API, so the storefront shows it as unpriced — never as "0 EGP".
//   - stock levels are NOT invented: variants do not track inventory, they are
//     simply orderable. Real stock counts are an owner input.
//   - descriptions are NOT invented: product copy lives in Payload.
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { adminLogin, gql, log, uploadAssets, waitForJob } from "./lib/vendure-admin.mjs"

const SYNC = process.argv.includes("--sync")
const CATALOG_PATH = process.env.CATALOG_JSON || "scripts/data/vendure-catalog.json"
const CATALOG = JSON.parse(readFileSync(CATALOG_PATH, "utf8"))

const MIME = { ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png" }

async function ensureZoneAndChannel() {
  // Country EG must exist before it can join the zone.
  let countries = (await gql(`{ countries(options: { take: 300 }) { items { id code } } }`)).countries.items
  let eg = countries.find((c) => c.code === "EG")
  if (!eg) {
    const created = (
      await gql(
        `mutation ($input: CreateCountryInput!) { createCountry(input: $input) { id code } }`,
        {
          input: {
            code: "EG",
            enabled: true,
            translations: [
              { languageCode: "ar", name: "مصر" },
              { languageCode: "en", name: "Egypt" },
            ],
          },
        }
      )
    ).createCountry
    eg = created
    log("country EG created")
  }

  const zones = (await gql(`{ zones(options: { take: 100 }) { items { id name members { id code } } } }`)).zones.items
  let egypt = zones.find((z) => z.name === "Egypt")
  if (!egypt) {
    egypt = (await gql(`mutation { createZone(input: { name: "Egypt" }) { id name members { id code } } }`)).createZone
    log("zone Egypt created:", egypt.id)
  }
  if (!egypt.members.some((m) => m.code === "EG")) {
    await gql(`mutation ($z: ID!, $m: [ID!]!) { addMembersToZone(zoneId: $z, memberIds: $m) { id } }`, { z: egypt.id, m: [eg.id] })
    log("EG added to zone Egypt")
  }

  await gql(`mutation { updateGlobalSettings(input: { availableLanguages: [en, ar] }) { ... on GlobalSettings { id } } }`)

  const ch = (
    await gql(
      `{ activeChannel { id currencyCode defaultCurrencyCode availableCurrencyCodes availableLanguageCodes defaultLanguageCode pricesIncludeTax defaultTaxZone { id } defaultShippingZone { id } } }`
    )
  ).activeChannel
  const wantLangs = ["ar", "en"]
  const ok =
    ch.currencyCode === "EGP" &&
    ch.defaultCurrencyCode === "EGP" &&
    ch.availableCurrencyCodes.length === 1 &&
    ch.availableCurrencyCodes[0] === "EGP" &&
    wantLangs.every((l) => ch.availableLanguageCodes.includes(l)) &&
    ch.pricesIncludeTax === true &&
    ch.defaultTaxZone?.id === egypt.id &&
    ch.defaultShippingZone?.id === egypt.id
  if (!ok) {
    const upd = (
      await gql(
        `mutation ($input: UpdateChannelInput!) { updateChannel(input: $input) { ... on Channel { id } ... on ErrorResult { errorCode message } } }`,
        {
          input: {
            id: ch.id,
            currencyCode: "EGP",
            defaultCurrencyCode: "EGP",
            availableCurrencyCodes: ["EGP"],
            availableLanguageCodes: wantLangs,
            pricesIncludeTax: true,
            defaultTaxZoneId: egypt.id,
            defaultShippingZoneId: egypt.id,
          },
        }
      )
    ).updateChannel
    if (!upd?.id) throw new Error("channel update failed: " + JSON.stringify(upd))
    log("channel configured: EGP, ar+en, prices include tax, Egypt tax/shipping zone")
  } else {
    log("channel already configured")
  }
  return egypt
}

async function ensureTax(egypt) {
  let cat = (await gql(`{ taxCategories { items { id name } } }`)).taxCategories.items.find((t) => t.name === "Standard")
  if (!cat) {
    cat = (await gql(`mutation { createTaxCategory(input: { name: "Standard", isDefault: true }) { id name } }`)).createTaxCategory
    log("tax category Standard created")
  }
  const rates = (await gql(`{ taxRates(options: { take: 100 }) { items { id name value category { id } zone { id } } } }`)).taxRates.items
  const rate = rates.find((r) => r.category.id === cat.id && r.zone.id === egypt.id)
  if (!rate) {
    await gql(
      `mutation ($input: CreateTaxRateInput!) { createTaxRate(input: $input) { id } }`,
      { input: { name: "Egypt VAT 14%", enabled: true, value: 14, categoryId: cat.id, zoneId: egypt.id } }
    )
    log("tax rate Egypt VAT 14% created")
  } else {
    log("tax rate exists:", rate.name, rate.value + "%")
  }
  return cat
}

function assetFor(item) {
  if (!item.image) return null
  const file = path.join("public", item.image.replace(/^\//, ""))
  if (!existsSync(file)) return null
  return { path: file, name: path.basename(file), type: MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream" }
}

async function ensureProducts(taxCategory) {
  for (const item of CATALOG) {
    const priced = typeof item.price === "number" && item.price > 0
    const minor = priced ? Math.round(item.price * 100) : 0
    const q = await gql(
      `query ($slug: String!) { products(options: { filter: { slug: { eq: $slug } } }) { items { id enabled featuredAsset { id } variants { id sku enabled priceWithTax trackInventory } } } }`,
      { slug: item.slug }
    )
    let product = q.products.items[0]

    if (!product) {
      const created = (
        await gql(
          `mutation ($input: CreateProductInput!) { createProduct(input: $input) { id } }`,
          {
            input: {
              enabled: priced,
              translations: [
                { languageCode: "ar", name: item.nameArabic || item.name, slug: item.slug, description: "" },
                { languageCode: "en", name: item.name, slug: item.slug, description: "" },
              ],
            },
          }
        )
      ).createProduct
      if (!created?.id) throw new Error("createProduct failed for " + item.slug)
      const variant = (
        await gql(
          `mutation ($input: [CreateProductVariantInput!]!) { createProductVariants(input: $input) { id } }`,
          {
            input: [
              {
                productId: created.id,
                sku: item.sku,
                price: minor,
                taxCategoryId: taxCategory.id,
                enabled: priced,
                trackInventory: "FALSE",
                translations: [
                  { languageCode: "ar", name: item.nameArabic || item.name },
                  { languageCode: "en", name: item.name },
                ],
              },
            ],
          }
        )
      ).createProductVariants?.[0]
      if (!variant?.id) throw new Error("createProductVariants failed for " + item.slug)
      log(`product ${item.slug} created (${item.sku}, ${priced ? item.price + " EGP" : "UNPRICED → disabled"})`)
      product = (
        await gql(
          `query ($id: ID!) { product(id: $id) { id enabled featuredAsset { id } variants { id sku enabled priceWithTax trackInventory } } }`,
          { id: created.id }
        )
      ).product
    } else {
      log(`product ${item.slug} exists`)
    }

    // Repair / sync the variant. Repair always (a variant with the wrong
    // inventory flag cannot be ordered); price/sku/enabled drift only with --sync.
    const v = product.variants[0]
    if (v) {
      const patch = {}
      if (v.trackInventory !== "FALSE") patch.trackInventory = "FALSE"
      if (SYNC) {
        if (v.priceWithTax !== minor) patch.price = minor
        if (v.sku !== item.sku) patch.sku = item.sku
        if (v.enabled !== priced) patch.enabled = priced
      }
      if (Object.keys(patch).length) {
        await gql(
          `mutation ($input: [UpdateProductVariantInput!]!) { updateProductVariants(input: $input) { ... on ProductVariant { id } } }`,
          { input: [{ id: v.id, ...patch }] }
        )
        log(`  variant ${item.sku} updated:`, JSON.stringify(patch))
      }
    }
    if (SYNC && product.enabled !== priced) {
      await gql(`mutation ($input: UpdateProductInput!) { updateProduct(input: $input) { ... on Product { id } } }`, {
        input: { id: product.id, enabled: priced },
      })
      log(`  product ${item.slug} enabled=${priced}`)
    }

    // Featured image (the cart renders product.featuredAsset.preview).
    if (!product.featuredAsset) {
      const file = assetFor(item)
      if (file) {
        const [asset] = await uploadAssets([file])
        if (asset?.id) {
          await gql(`mutation ($input: UpdateProductInput!) { updateProduct(input: $input) { ... on Product { id } } }`, {
            input: { id: product.id, featuredAssetId: asset.id, assetIds: [asset.id] },
          })
          log(`  asset ${file.name} attached`)
        } else {
          log(`  asset upload skipped for ${item.slug}:`, JSON.stringify(asset))
        }
      }
    }
  }
}

async function reindex() {
  const job = (await gql(`mutation { reindex { id state } }`)).reindex
  const done = await waitForJob(job.id)
  log("reindex job:", done.state)
  if (done.state !== "COMPLETED") {
    log("  WARNING: the reindex job did not complete — is the Vendure WORKER running? (docs/OPS.md §2)")
  }
}

async function main() {
  const login = await adminLogin()
  log("admin login ok:", login.identifier)
  const egypt = await ensureZoneAndChannel()
  const taxCategory = await ensureTax(egypt)
  await ensureProducts(taxCategory)
  await reindex()
  log("catalog seeding complete")
}

main().catch((e) => {
  console.error("ERROR:", e.message)
  process.exit(1)
})
