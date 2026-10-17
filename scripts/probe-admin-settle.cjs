#!/usr/bin/env node
/**
 * Admin settle probe — closes the order lifecycle the conversion smoke opens.
 *
 * scripts/probe-conversion-flow.cjs ends at PaymentAuthorized (manual-
 * settlement = COD / bank transfer: authorization happens at checkout, money
 * moves later). This script does the admin half:
 *
 *   admin login (bearer) → find order by code → settlePayment → PaymentSettled
 *
 * Usage:
 *   node scripts/probe-admin-settle.cjs <ORDER_CODE>
 *   node scripts/probe-admin-settle.cjs            # settles the newest PaymentAuthorized order
 * Env: VENDURE_API_URL (admin-api URL is derived), SUPERADMIN_USERNAME,
 *      SUPERADMIN_PASSWORD (required — same values the server boots with).
 */
const ADMIN_API = (process.env.VENDURE_ADMIN_API_URL || "http://localhost:3001/admin-api");

async function g(query, token) {
  const res = await fetch(ADMIN_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

(async () => {
  const username = process.env.SUPERADMIN_USERNAME || "superadmin";
  const password = process.env.SUPERADMIN_PASSWORD;
  if (!password) throw new Error("SUPERADMIN_PASSWORD env required (same value the server boots with)");

  // login — tokenMethod is ['bearer','cookie'], so take the bearer token
  const loginRes = await fetch(ADMIN_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `mutation { login(username:"${username}", password:"${password}") { ...on CurrentUser { id } ...on ErrorResult { errorCode message } } }`,
    }),
  });
  const loginJson = await loginRes.json();
  if (loginJson.errors || !loginJson.data?.login?.id) throw new Error("admin login failed: " + JSON.stringify(loginJson));
  const token = (loginRes.headers.get("vendure-auth-token") || "").trim();
  if (!token) throw new Error("no vendure-auth-token header on login response");
  console.log("admin login OK (user id", loginJson.data.login.id + ")");

  // find the target order: by code, else the newest PaymentAuthorized one
  const wanted = process.argv[2];
  const filter = wanted
    ? `{code:{eq:"${wanted}"}}`
    : `{state:{eq:"PaymentAuthorized"}}`;
  const found = await g(
    `{ orders(options:{ filter:${filter}, sort:{ createdAt: DESC }, take:1 }) { items { id code state payments { id state } } } }`,
    token
  );
  const order = found.orders.items[0];
  if (!order) throw new Error(wanted ? `order ${wanted} not found` : "no PaymentAuthorized order to settle");
  console.log("order:", order.code, order.state);
  if (order.state !== "PaymentAuthorized") throw new Error(`order ${order.code} is ${order.state}, expected PaymentAuthorized`);
  const payment = order.payments?.[0];
  if (!payment) throw new Error("order has no payment to settle");

  const settled = await g(
    `mutation { settlePayment(id: "${payment.id}") { ...on Payment { state } ...on ErrorResult { message } } }`,
    token
  );
  if (settled.settlePayment.errorCode || settled.settlePayment.message) throw new Error("settlePayment failed: " + JSON.stringify(settled.settlePayment));
  console.log("payment:", settled.settlePayment.state);

  const after = await g(`{ order(id:"${order.id}") { state } }`, token);
  if (after.order.state !== "PaymentSettled") throw new Error("expected PaymentSettled, got " + after.order.state);
  console.log("✅ ADMIN SETTLE PASS — order", order.code, "is PaymentSettled");
})().catch((e) => {
  console.error("❌ ADMIN SETTLE FAIL:", e.message);
  process.exit(1);
});
