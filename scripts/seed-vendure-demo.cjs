// Demo-environment seeder for the Vendure commerce side (run AFTER
// populate-vendure catalog seeding, idempotent). A fresh Vendure DB lacks
// four things the storefront's checkout hard-depends on:
//   1. the "EG" country (Vendure 3 stores countries in `region`) — without
//      it setOrderShippingAddress fails with "countryCode not recognized";
//   2. the channel currency — defaults to USD while all seeded prices are
//      EGP piastres, so orders/receipts show the wrong currency;
//   3. the three NPF shipping methods (codes must match the storefront's
//      SHIPPING_CODE_TO_MODE map in src/lib/vendure/order-mapper.ts:
//      door-to-door, branch-dropoff, company-pickup);
//   4. the "manual-settlement" PaymentMethod entity — without it
//      addPaymentToOrder fails with payment-method-not-found.
// Usage: set -a && . ./.env && set +a && node scripts/seed-vendure-demo.cjs
const ADMIN_API = process.env.VENDURE_ADMIN_API || "http://localhost:3001/admin-api"
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
  if (json.errors) throw new Error(JSON.stringify(json.errors).slice(0, 400))
  return json.data
}

async function main() {
  const login = await gql(
    `mutation Login($u: String!, $p: String!) { login(username: $u, password: $p) { ... on CurrentUser { id identifier } ... on ErrorResult { errorCode message } } }`,
    { u: process.env.SUPERADMIN_USERNAME || "superadmin", p: process.env.SUPERADMIN_PASSWORD || "Npf-Demo-2026!Admin" }
  )
  if (!login.login.id) throw new Error("admin login failed: " + JSON.stringify(login.login))
  console.log("admin login ok")

  // Vendure 3 stores countries in the `region` table; a fresh DB has NONE,
  // so setOrderShippingAddress(countryCode: "EG") fails with
  // "The countryCode \"EG\" was not recognized" and checkout can never
  // quote shipping. Create Egypt and attach it to the Egypt zone (id 1).
  const egyptCheck = await gql(`{ countries { items { id code name } } }`)
  const egypt = egyptCheck.countries.items.find((c) => c.code === "EG")
  if (egypt) {
    console.log("country EG exists:", egypt.id, egypt.name)
  } else {
    const createdCountry = await gql(
      `mutation CreateCountry($input: CreateCountryInput!) {
        createCountry(input: $input) { id code name }
      }`,
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
    const c = createdCountry.createCountry
    if (!c || !c.id) throw new Error("createCountry failed: " + JSON.stringify(createdCountry))
    console.log("created country:", c.id, c.code, c.name)
    const zoneAdd = await gql(
      `mutation AddToZone($zoneId: ID!, $memberIds: [ID!]!) { addMembersToZone(zoneId: $zoneId, memberIds: $memberIds) { id name } }`,
      { zoneId: "1", memberIds: [c.id] }
    )
    const z = zoneAdd.addMembersToZone
    if (!z || !z.id) throw new Error("addRegionsToZone failed: " + JSON.stringify(zoneAdd))
    console.log("added EG to zone:", z.id, z.name)
  }

  // The channel's currency must be EGP: all seeded prices are stored as EGP
  // piastres (e.g. 255000 = 2,550 EGP) but a fresh Vendure channel defaults
  // to USD, so orders/sessions report currencyCode "USD" — wrong receipts.
  const channel = await gql(`{ activeChannel { id code currencyCode } }`)
  if (channel.activeChannel.currencyCode !== "EGP") {
    const upd = await gql(
      `mutation UpdateChannel($input: UpdateChannelInput!) { updateChannel(input: $input) { ... on Channel { id currencyCode } ... on ErrorResult { errorCode message } } }`,
      { input: { id: channel.activeChannel.id, currencyCode: "EGP" } }
    )
    const uc = upd.updateChannel
    if (!uc || !uc.id) throw new Error("updateChannel currency failed: " + JSON.stringify(upd))
    console.log("channel currency → EGP")
  } else {
    console.log("channel currency already EGP")
  }

  // Vendure needs a PaymentMethod ENTITY with the storefront's expected code
  // ("manual-settlement") or addPaymentToOrder fails with
  // payment-method-not-found. The dummy handler settles immediately —
  // matches the storefront's COD/bank-transfer model until a real gateway
  // is wired (TODO.md BLOCKED).
  const pmList = await gql(`{ paymentMethods { items { id code enabled } } }`)
  const hasManual = pmList.paymentMethods.items.find((m) => m.code === "manual-settlement")
  if (hasManual) {
    console.log("payment method manual-settlement exists:", hasManual.id)
  } else {
    const createdPm = await gql(
      `mutation CreatePaymentMethod($input: CreatePaymentMethodInput!) {
        createPaymentMethod(input: $input) { id code name }
      }`,
      {
        input: {
          code: "manual-settlement",
          translations: [
            { languageCode: "ar", name: "الدفع عند الاستلام / InstaPay / فودافون كاش", description: "تُسوى القيمة يدويًا (كاش عند التسليم أو تحويل InstaPay / فودافون كاش)" },
            { languageCode: "en", name: "COD / InstaPay / Vodafone Cash", description: "Settled manually (cash on delivery, InstaPay or Vodafone Cash transfer)" },
          ],
          enabled: true,
          handler: {
            code: "dummy-payment-handler",
            arguments: [
              { name: "method", value: "manual" },
              { name: "automaticSettle", value: "false" },
            ],
          },
        },
      }
    )
    const pm = createdPm.createPaymentMethod
    if (!pm || !pm.id) throw new Error("createPaymentMethod failed: " + JSON.stringify(createdPm))
    console.log("created payment method:", pm.id, pm.code)
  }

  const existing = await gql(`{ shippingMethods { items { id name code } } }`)
  const list = existing.shippingMethods.items
  console.log("existing shipping methods:", list.map((m) => `${m.code}`).join(", ") || "(none)")
  // Rename legacy npf-* prefixed codes to the storefront's expected codes.
  const RENAME = { "npf-door-to-door": "door-to-door", "npf-branch-dropoff": "branch-dropoff", "npf-company-pickup": "company-pickup" }
  for (const m of list) {
    const next = RENAME[m.code]
    if (!next) continue
    const upd = await gql(
      `mutation UpdateShippingMethod($input: UpdateShippingMethodInput!) { updateShippingMethod(input: $input) { ... on ShippingMethod { id code } } }`,
      {
        input: {
          id: m.id,
          code: next,
          translations: [
            { languageCode: "ar", name: m.name, description: m.name },
            { languageCode: "en", name: m.name, description: m.name },
          ],
        },
      }
    )
    if (!upd.updateShippingMethod || !upd.updateShippingMethod.id) throw new Error("rename failed: " + JSON.stringify(upd))
    console.log("renamed", m.code, "→", next)
  }
  const after = await gql(`{ shippingMethods { items { id code } } }`)
  if (after.shippingMethods.items.length >= 3) {
    console.log("shipping methods present — nothing more to do")
    return
  }

  // The project's own three shipping options (src/plugins/npf-shipping.ts,
  // all zero-arg checkers/calculators). Company pickup is the always-eligible
  // fallback so checkout is never blocked by an unmatched address.
  const METHODS = [
    {
      code: "door-to-door",
      ar: ["شحن حتى الباب", "توصيل لكل محافظات مصر حسب جدول المناطق"],
      en: ["Door-to-door", "Zone-priced delivery across all Egyptian governorates"],
      checker: "npf-door-to-door-eligibility",
      calculator: "npf-door-to-door-calculator",
    },
    {
      code: "branch-dropoff",
      ar: ["تسليم بفرع شركة الشحن", "استلم من فرع شركة الشحن بنفس سعر التوصيل"],
      en: ["Courier branch drop-off", "Collect from the courier's branch at the door-to-door rate"],
      checker: "npf-branch-dropoff-eligibility",
      calculator: "npf-door-to-door-calculator",
    },
    {
      code: "company-pickup",
      ar: ["استلام من الشركة", "استلم طلبك من مقر الشركة مجانًا"],
      en: ["Pickup from NPF", "Collect from the company premises for free"],
      checker: "npf-company-pickup-eligibility",
      calculator: "npf-company-pickup-calculator",
    },
  ]
  for (const m of METHODS) {
    const created = await gql(
      `mutation CreateShippingMethod($input: CreateShippingMethodInput!) {
        createShippingMethod(input: $input) { id code name }
      }`,
      {
        input: {
          code: m.code,
          translations: [
            { languageCode: "ar", name: m.ar[0], description: m.ar[1] },
            { languageCode: "en", name: m.en[0], description: m.en[1] },
          ],
          checker: { code: m.checker, arguments: [] },
          calculator: { code: m.calculator, arguments: [] },
          fulfillmentHandler: "manual-fulfillment",
        },
      }
    )
    const sm = created.createShippingMethod
    if (!sm || !sm.id) throw new Error("createShippingMethod failed: " + JSON.stringify(created))
    console.log("created shipping method:", sm.id, sm.code, sm.name)
  }

  const shop = await fetch("http://localhost:3001/shop-api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: `{ eligibleShippingMethods { id name price priceWithTax } }` }),
  })
  const shopJson = await shop.json()
  console.log("shop eligibleShippingMethods now:", JSON.stringify(shopJson.data?.eligibleShippingMethods))
}

main().catch((e) => {
  console.error("ERROR:", e.message)
  process.exit(1)
})
