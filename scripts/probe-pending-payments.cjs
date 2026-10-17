#!/usr/bin/env node
/**
 * Manual-transfer verification list — the "pending payments" card from the
 * reconciliation plan, CLI-shaped and READ-ONLY (the client's decision: no
 * automation; settlement stays a human step in the admin UI).
 *
 * Lists orders whose payment is Authorized but NOT yet settled — i.e. money
 * is claimed transferred (InstaPay / Vodafone Cash / COD) and an admin must
 * verify the receipt in WhatsApp / the banking app, then click "Settle" on
 * the order in /admin. Includes the customer-typed transfer reference when
 * present. Mutates nothing.
 *
 * Usage: npm run payments:pending
 * Env: same .env the server boots with (SUPERADMIN_USERNAME/PASSWORD).
 */
const ADMIN_API = process.env.VENDURE_ADMIN_API_URL || "http://localhost:3001/admin-api"

async function main() {
  const username = process.env.SUPERADMIN_USERNAME || "superadmin"
  const password = process.env.SUPERADMIN_PASSWORD
  if (!password) throw new Error("SUPERADMIN_PASSWORD env required (run with the repo .env sourced)")

  const loginRes = await fetch(ADMIN_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `mutation { login(username:"${username}", password:"${password}") { ...on CurrentUser { id } ...on ErrorResult { errorCode message } } }`,
    }),
  })
  const token = (loginRes.headers.get("vendure-auth-token") || "").trim()
  const loginJson = await loginRes.json()
  if (!token || !loginJson?.data?.login?.id) throw new Error("admin login failed: " + JSON.stringify(loginJson))

  async function gql(query) {
    const res = await fetch(ADMIN_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query }),
    })
    const json = await res.json()
    if (json.errors) throw new Error(JSON.stringify(json.errors).slice(0, 300))
    return json.data
  }

  const data = await gql(`{
    orders(options: { filter: { state: { in: ["PaymentAuthorized", "ArrangingPayment"] } }, sort: { createdAt: DESC }, take: 50 }) {
      items {
        code state createdAt totalWithTax
        payments { id state method metadata }
        customer { firstName lastName emailAddress }
        lines { quantity productVariant { name } }
      }
    }
  }`)

  const items = data.orders.items
  if (!items.length) {
    console.log("No payments awaiting verification — all clear ✅")
    return
  }

  console.log(`\nPayments awaiting manual verification (${items.length}) — settle in /admin after checking the receipt:\n`)
  for (const order of items) {
    const payment = order.payments?.[0]
    const meta = payment?.metadata?.public ?? payment?.metadata ?? {}
    const rail = typeof meta.paymentMethod === "string" ? meta.paymentMethod : order.state
    const ref = typeof meta.transferRef === "string" && meta.transferRef.trim() ? meta.transferRef.trim() : "—"
    const who = [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(" ") || "—"
    const total = (order.totalWithTax / 100).toFixed(2)
    console.log(`• #${order.code}  ${order.state}  ${total} EGP`)
    console.log(`  customer: ${who} <${order.customer?.emailAddress ?? "—"}>`)
    console.log(`  rail: ${rail} | transferRef: ${ref} | payment: ${payment ? `${payment.method} (${payment.state})` : "none"}`)
    console.log(`  action: verify receipt → /admin → Orders → ${order.code} → Settle payment (or Cancel if rejected)\n`)
  }
  console.log("This list is read-only. Settlement / cancellation is a human step in the admin UI — no automation by design.")
}

main().catch((error) => {
  console.error("payments:pending failed:", error.message)
  process.exit(1)
})
