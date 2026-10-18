// Vendure commerce provisioning — part 2: payment, shipping, admin roles.
// (Kept at its historical path; it is NOT demo data — it is the configuration
// the storefront's checkout hard-depends on.) Idempotent; run AFTER
// scripts/seed-vendure-catalog.mjs, against a RUNNING Vendure server.
//
//   set -a && . ./.env && set +a && node scripts/seed-vendure-demo.cjs
//
// Provisions:
//   1. PaymentMethod "manual-settlement" — the single method the storefront
//      uses for COD, InstaPay and Vodafone Cash (the customer picks the rail,
//      the payment stays AUTHORIZED until an admin settles it by hand).
//   2. Shipping methods whose CODES must match SHIPPING_CODE_TO_MODE in
//      src/lib/vendure/order-mapper.ts: door-to-door, branch-dropoff,
//      company-pickup. The zone price table lives in src/plugins/npf-shipping.ts
//      (Middle East Courier Service rates); these rows only bind the checkers
//      and calculators to a name/code.
//   3. Role "Order Operations" — day-to-day order handling (verify transfers,
//      settle payments, fulfil) without catalog/settings/admin powers. No admin
//      account is created: assign it to a person in /admin → Administrators.

// CommonJS script: require() is the module system here.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("node:path")

const METHODS = [
  {
    code: "door-to-door",
    ar: ["شحن حتى الباب (ميدل إيست كوريير)", "توصيل لكل محافظات مصر حسب جدول المناطق عبر ميدل إيست كوريير"],
    en: ["Door-to-door (Middle East Courier)", "Zone-priced delivery across Egypt by Middle East Courier Service"],
    checker: "npf-door-to-door-eligibility",
    calculator: "npf-door-to-door-calculator",
  },
  {
    code: "branch-dropoff",
    ar: ["تسليم بفرع ميدل إيست كوريير", "استلم من فرع ميدل إيست كوريير بنفس سعر التوصيل"],
    en: ["MECS branch drop-off", "Collect from a Middle East Courier branch at the door-to-door rate"],
    checker: "npf-branch-dropoff-eligibility",
    calculator: "npf-branch-dropoff-calculator",
  },
  {
    code: "company-pickup",
    ar: ["استلام من الشركة", "استلم طلبك من مقر الشركة مجانًا"],
    en: ["Pickup from NPF", "Collect from the company premises for free"],
    checker: "npf-company-pickup-eligibility",
    calculator: "npf-company-pickup-calculator",
  },
]
const LEGACY_CODES = { "npf-door-to-door": "door-to-door", "npf-branch-dropoff": "branch-dropoff", "npf-company-pickup": "company-pickup" }

const ORDER_OPERATIONS_PERMISSIONS = [
  "ReadOrder", "UpdateOrder", "ReadCustomer", "ReadPaymentMethod", "ReadShippingMethod", "ReadProduct", "ReadCatalog", "ReadStockLocation",
]

async function main() {
  const { adminLogin, gql, log, waitForJob } = await import(path.join(__dirname, "lib/vendure-admin.mjs"))
  const login = await adminLogin()
  log("admin login ok:", login.identifier)

  // 1 ── payment method
  const pms = (await gql(`{ paymentMethods { items { id code enabled } } }`)).paymentMethods.items
  const manual = pms.find((m) => m.code === "manual-settlement")
  if (!manual) {
    const created = (
      await gql(
        `mutation ($input: CreatePaymentMethodInput!) { createPaymentMethod(input: $input) { id code } }`,
        {
          input: {
            code: "manual-settlement",
            enabled: true,
            translations: [
              { languageCode: "ar", name: "الدفع عند الاستلام / InstaPay / فودافون كاش", description: "تُسوى القيمة يدويًا (كاش عند التسليم أو تحويل InstaPay / فودافون كاش)" },
              { languageCode: "en", name: "COD / InstaPay / Vodafone Cash", description: "Settled manually (cash on delivery, InstaPay or Vodafone Cash transfer)" },
            ],
            handler: {
              code: "dummy-payment-handler",
              arguments: [
                { name: "automaticSettle", value: "false" },
                { name: "method", value: "manual" },
              ],
            },
          },
        }
      )
    ).createPaymentMethod
    if (!created?.id) throw new Error("createPaymentMethod failed")
    log("payment method manual-settlement created")
  } else {
    if (!manual.enabled) {
      await gql(`mutation ($input: UpdatePaymentMethodInput!) { updatePaymentMethod(input: $input) { id } }`, { input: { id: manual.id, enabled: true } })
      log("payment method manual-settlement re-enabled")
    } else log("payment method manual-settlement exists")
  }

  // 2 ── shipping methods
  let list = (await gql(`{ shippingMethods { items { id code } } }`)).shippingMethods.items
  for (const m of list) {
    const next = LEGACY_CODES[m.code]
    if (!next) continue
    await gql(`mutation ($input: UpdateShippingMethodInput!) { updateShippingMethod(input: $input) { ... on ShippingMethod { id } } }`, { input: { id: m.id, code: next } })
    log("renamed legacy shipping code", m.code, "→", next)
  }
  list = (await gql(`{ shippingMethods { items { id code } } }`)).shippingMethods.items
  const sync = process.argv.includes("--sync")
  for (const m of METHODS) {
    const existing = list.find((x) => x.code === m.code)
    const translations = [
      { languageCode: "ar", name: m.ar[0], description: m.ar[1] },
      { languageCode: "en", name: m.en[0], description: m.en[1] },
    ]
    const bind = { checker: { code: m.checker, arguments: [] }, calculator: { code: m.calculator, arguments: [] } }
    if (!existing) {
      const created = (
        await gql(`mutation ($input: CreateShippingMethodInput!) { createShippingMethod(input: $input) { id } }`, {
          input: { code: m.code, fulfillmentHandler: "manual-fulfillment", translations, ...bind },
        })
      ).createShippingMethod
      if (!created?.id) throw new Error("createShippingMethod failed for " + m.code)
      log("shipping method created:", m.code)
    } else if (sync) {
      await gql(`mutation ($input: UpdateShippingMethodInput!) { updateShippingMethod(input: $input) { ... on ShippingMethod { id } } }`, {
        input: { id: existing.id, translations, ...bind },
      })
      log("shipping method synced:", m.code)
    } else log("shipping method exists:", m.code)
  }

  // 3 ── role
  const roles = (await gql(`{ roles { items { id code } } }`)).roles.items
  if (!roles.some((r) => r.code === "order-operations")) {
    await gql(`mutation ($input: CreateRoleInput!) { createRole(input: $input) { id code } }`, {
      input: {
        code: "order-operations",
        description: "Order handling: verify transfers, settle payments, fulfil orders. No catalog, settings or admin powers.",
        permissions: ORDER_OPERATIONS_PERMISSIONS,
      },
    })
    log("role order-operations created")
  } else log("role order-operations exists")

  void waitForJob
}

main().catch((e) => {
  console.error("ERROR:", e.message)
  process.exit(1)
})
