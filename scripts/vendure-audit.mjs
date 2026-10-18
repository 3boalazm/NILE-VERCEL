// Audits a RUNNING Vendure (+ optionally the Payload database) against what the
// storefront needs, prints PASS/GAP per check and exits 1 when anything is a gap.
//
//   set -a && . ./.env && set +a && node scripts/vendure-audit.mjs
//   npm run vendure:audit
//
// Checks: channel (currency / languages / tax inclusion / default zones), the
// Egypt zone + EG country, tax category + 14% rate, shipping methods (codes the
// storefront maps) and their checkers/calculators, the manual-settlement payment
// method, admin roles, every catalog product (SKU / price / enabled / no stock
// tracking / featured asset), Payload ↔ Vendure slug parity, and the search
// index (needs the WORKER). Read-only: it never mutates anything.
import { readFileSync } from "node:fs"
import { adminLogin, gql, SHOP_API } from "./lib/vendure-admin.mjs"

const CATALOG = JSON.parse(readFileSync(process.env.CATALOG_JSON || "scripts/data/vendure-catalog.json", "utf8"))
const results = []
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail })
  console.log(`${ok ? "PASS" : "GAP "}  ${name}${detail ? " — " + detail : ""}`)
}

async function main() {
  await adminLogin()

  // ── channel + zone + tax
  const ch = (
    await gql(
      `{ activeChannel { currencyCode defaultCurrencyCode availableCurrencyCodes availableLanguageCodes pricesIncludeTax defaultTaxZone { id name } defaultShippingZone { id name } } }`
    )
  ).activeChannel
  check("channel currency EGP", ch.currencyCode === "EGP" && ch.defaultCurrencyCode === "EGP" && ch.availableCurrencyCodes.join() === "EGP", `${ch.currencyCode}`)
  check("channel languages include ar + en", ["ar", "en"].every((l) => ch.availableLanguageCodes.includes(l)), ch.availableLanguageCodes.join())
  check("channel prices include tax (shop shows priceWithTax)", ch.pricesIncludeTax === true)
  check("channel default tax + shipping zone = Egypt", ch.defaultTaxZone?.name === "Egypt" && ch.defaultShippingZone?.name === "Egypt")
  const zones = (await gql(`{ zones(options: { take: 100 }) { items { id name members { code } } } }`)).zones.items
  const egypt = zones.find((z) => z.name === "Egypt")
  check("zone Egypt contains country EG", Boolean(egypt?.members.some((m) => m.code === "EG")))
  const rates = (await gql(`{ taxRates(options: { take: 100 }) { items { name value enabled category { name } zone { name } } } }`)).taxRates.items
  check("tax rate 14% (Standard / Egypt) enabled", rates.some((r) => r.enabled && r.value === 14 && r.category.name === "Standard" && r.zone.name === "Egypt"))

  // ── payment + shipping + roles
  const pms = (await gql(`{ paymentMethods { items { code enabled handler { code } } } }`)).paymentMethods.items
  const manual = pms.find((p) => p.code === "manual-settlement")
  check("payment method manual-settlement enabled", Boolean(manual?.enabled), manual?.handler?.code ?? "missing")
  check("no card-gateway payment method enabled by accident", !pms.some((p) => p.enabled && /paymob|fawry|kashier/.test(p.handler?.code ?? "")))
  const sms = (await gql(`{ shippingMethods { items { code checker { code } calculator { code } } } }`)).shippingMethods.items
  for (const code of ["door-to-door", "branch-dropoff", "company-pickup"]) {
    const m = sms.find((x) => x.code === code)
    check(`shipping method ${code}`, Boolean(m), m ? `${m.checker.code} / ${m.calculator.code}` : "missing")
  }
  const roles = (await gql(`{ roles { items { code } } }`)).roles.items
  check("roles: SuperAdmin + order-operations", ["__super_admin_role__", "order-operations"].every((c) => roles.some((r) => r.code === c)))

  // ── catalog
  const products = (
    await gql(
      `{ products(options: { take: 200 }) { items { slug enabled featuredAsset { id } variants { sku priceWithTax enabled trackInventory } } } }`
    )
  ).products.items
  for (const item of CATALOG) {
    const p = products.find((x) => x.slug === item.slug)
    if (!p) {
      check(`product ${item.slug} present`, false, "missing in Vendure")
      continue
    }
    const priced = typeof item.price === "number" && item.price > 0
    const v = p.variants[0]
    const want = priced ? Math.round(item.price * 100) : 0
    const problems = []
    if (!v) problems.push("no variant")
    else {
      if (v.sku !== item.sku) problems.push(`sku ${v.sku} ≠ ${item.sku}`)
      if (v.priceWithTax !== want) problems.push(`priceWithTax ${v.priceWithTax} ≠ ${want}`)
      if (v.enabled !== priced) problems.push(`variant enabled=${v.enabled}`)
      if (v.trackInventory !== "FALSE") problems.push(`trackInventory=${v.trackInventory}`)
    }
    if (p.enabled !== priced) problems.push(`product enabled=${p.enabled}`)
    if (!p.featuredAsset) problems.push("no featured asset")
    check(
      `product ${item.slug} (${item.sku}) ${priced ? item.price + " EGP" : "UNPRICED → hidden"}`,
      problems.length === 0,
      problems.join("; ")
    )
  }
  const extra = products.filter((p) => !CATALOG.some((c) => c.slug === p.slug))
  check("no unknown extra products", extra.length === 0, extra.map((e) => e.slug).join())

  // ── Payload ↔ Vendure slug parity (needs DATABASE_URI)
  if (process.env.DATABASE_URI) {
    try {
      const pg = await import("pg")
      const client = new pg.default.Client({ connectionString: process.env.DATABASE_URI })
      await client.connect()
      const rows = (await client.query("select slug from products")).rows.map((r) => r.slug)
      await client.end()
      const missing = rows.filter((s) => !products.some((p) => p.slug === s))
      check("every Payload product has a Vendure product", missing.length === 0, missing.join())
    } catch (e) {
      check("Payload database reachable for parity check", false, String(e.message).slice(0, 80))
    }
  }

  // ── search index (public Shop API; requires the worker to have run)
  const pricedCount = CATALOG.filter((c) => typeof c.price === "number" && c.price > 0).length
  const search = await gql(`{ search(input: { groupByProduct: true, take: 50 }) { totalItems } }`, undefined, { api: SHOP_API, auth: false })
  check("search index lists every enabled product (worker ran)", search.search.totalItems === pricedCount, `${search.search.totalItems}/${pricedCount}`)
  const shopProducts = await gql(`{ products(options: { take: 50 }) { totalItems } }`, undefined, { api: SHOP_API, auth: false })
  check("Shop API hides unpriced products", shopProducts.products.totalItems === pricedCount, `${shopProducts.products.totalItems}/${pricedCount}`)

  const gaps = results.filter((r) => !r.ok)
  console.log(`\n${results.length - gaps.length}/${results.length} checks pass, ${gaps.length} gap(s)`)
  process.exit(gaps.length ? 1 : 0)
}

main().catch((e) => {
  console.error("ERROR:", e.message)
  process.exit(2)
})
