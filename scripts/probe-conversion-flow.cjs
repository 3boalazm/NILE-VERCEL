#!/usr/bin/env node
/**
 * Guest conversion-flow smoke — exercises the FULL order lifecycle over the
 * live shop-api, no browser needed:
 *
 *   guest cart → setCustomerForOrder → Egypt shipping address
 *   → 3 eligible shipping methods @ 0 EGP (the zone-pricing open decision)
 *   → ArrangingPayment → manual-settlement payment → PaymentAuthorized
 *
 * manual-settlement authorizes on checkout by design (COD / bank transfer —
 * money moves later); settling is an admin step. Assert PaymentAuthorized
 * here; run scripts/probe-admin-settle.cjs right after to close the loop to
 * PaymentSettled.
 *
 * Usage: VENDURE_API_URL=http://localhost:3001/shop-api node scripts/probe-conversion-flow.cjs
 * Exits 0 on success, 1 with the failing step on stderr.
 */
const API = process.env.VENDURE_API_URL || "http://localhost:3001/shop-api";

let cookie = "";
async function g(query, variables) {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const scs = res.headers.getSetCookie();
  if (scs.length) cookie = scs.map((c) => c.split(";")[0]).join("; ");
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

(async () => {
  // 1. locate a purchasable variant (Proxeed Plus is always in the seeded catalog)
  const search = await g(
    `{ search(input:{ term:"Proxeed Plus", take:1, groupByProduct:false }) { totalItems items { productVariantId productName } } }`
  );
  if (!search.search.items.length) throw new Error("search index empty — is the vendure WORKER running? (update-search-index queue)");
  const variantId = search.search.items[0].productVariantId;
  console.log("variant:", variantId, search.search.items[0].productName);

  // 2. guest cart
  await g(
    `mutation { addItemToOrder(productVariantId: "${variantId}", quantity: 2) { ...on Order { id code } ...on ErrorResult { errorCode message } } }`
  );
  const order = await g(`{ activeOrder { code state totalWithTax lines { quantity } } }`);
  if (!order.activeOrder) throw new Error("no active order after addItemToOrder");
  console.log("cart:", order.activeOrder.state, "lines:", order.activeOrder.lines.length, "total:", order.activeOrder.totalWithTax);

  // 3. guest customer + Egypt address
  await g(
    `mutation { setCustomerForOrder(input:{ firstName:"ضيف", lastName:"اختبار", emailAddress:"guest-smoke@example.com" }) { ...on Order { id } ...on ErrorResult { errorCode message } } }`
  );
  const addr = await g(
    `mutation { setOrderShippingAddress(input:{ fullName:"ضيف اختبار", streetLine1:"١ شارع التست", city:"القاهرة", province:"القاهرة", countryCode:"EG", phoneNumber:"+201024442340" }) { ...on Order { id } ...on ErrorResult { errorCode message } } }`
  );
  if (addr.setOrderShippingAddress.errorCode) throw new Error(addr.setOrderShippingAddress.message);

  // 4. shipping — store policy (client, 2026-09-24): zone 1 (Greater Cairo +
  // Alexandria) is FREE to the customer by default; pickup is free anyway.
  const elig = await g(`{ eligibleShippingMethods { id name price } }`);
  console.log("eligible shipping:", elig.eligibleShippingMethods.map((m) => `${m.name}@${m.price}`).join(", "));
  if (elig.eligibleShippingMethods.length !== 3) throw new Error("expected 3 eligible methods, got " + elig.eligibleShippingMethods.length);
  const pickup = elig.eligibleShippingMethods.find((m) => /Pickup/.test(m.name));
  const door = elig.eligibleShippingMethods.find((m) => /Door-to-door/.test(m.name));
  const dropoff = elig.eligibleShippingMethods.find((m) => /branch drop-off|dropoff/i.test(m.name));
  if (!pickup || !door || !dropoff) throw new Error("expected pickup, door-to-door and branch drop-off methods");
  if (door.price !== 0 || dropoff.price !== 0 || pickup.price !== 0)
    throw new Error(`expected zone-1 FREE (store policy) for all methods, got ${pickup.price}/${door.price}/${dropoff.price}`);
  await g(
    `mutation { setOrderShippingMethod(shippingMethodId: ["${elig.eligibleShippingMethods[0].id}"]) { ...on Order { id } ...on ErrorResult { errorCode message } } }`
  );

  // 5. transition + pay with the first eligible payment method (seeded: manual-settlement)
  const tr = await g(
    `mutation { transitionOrderToState(state: "ArrangingPayment") { ...on Order { id state } ...on ErrorResult { errorCode message } } }`
  );
  if (tr.transitionOrderToState.errorCode) throw new Error(tr.transitionOrderToState.message);
  const epm = await g(`{ eligiblePaymentMethods { code name } }`);
  if (!epm.eligiblePaymentMethods.length) throw new Error("no eligible payment methods — is the demo payment method seeded?");
  const methodCode = epm.eligiblePaymentMethods[0].code;
  console.log("paying with:", methodCode);
  const pay = await g(
    `mutation { addPaymentToOrder(input:{ method: "${methodCode}", metadata: { guestSmoke: true } }) { ...on Order { id state code } ...on ErrorResult { errorCode message } } }`
  );
  if (pay.addPaymentToOrder.errorCode) throw new Error(pay.addPaymentToOrder.message);
  console.log("final state:", pay.addPaymentToOrder.state, "| order code:", pay.addPaymentToOrder.code);
  if (pay.addPaymentToOrder.state !== "PaymentAuthorized")
    throw new Error("expected PaymentAuthorized (manual-settlement authorizes; settle is an admin step), got " + pay.addPaymentToOrder.state);
  console.log("✅ CONVERSION FLOW PASS");
})().catch((e) => {
  console.error("❌ CONVERSION FLOW FAIL:", e.message);
  process.exit(1);
});
