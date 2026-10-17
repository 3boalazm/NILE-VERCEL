# Vendure rendering performance baseline

**Date:** 2026-09-23  
**Status:** source trace only. No timing was measured. No Core Web Vitals number exists.  
**This pass does not change rendering.** `cache: "no-store"` is still set. Cart and checkout freshness are unchanged.

Do not treat the abort timers below as measured TTFB. They are upper bounds written in the code, reached only if a request is accepted and then does not finish.

## Transport

| Item | Source | Value |
| --- | --- | --- |
| Client | `src/lib/vendure/client.ts` `vendureRequest` | `fetch` POST to `VENDURE_SHOP_API_URL` or `http://localhost:3001/shop-api` |
| Cache | same function | `cache: "no-store"` on every Shop API call, including reads |
| Abort | `VENDURE_REQUEST_TIMEOUT_MS` | 10_000 ms |
| Session | `Authorization: Bearer` from the Next cookie, not the browser talking to Vendure | A token may be absent. Reads during render must not write the cookie |

`cache: "no-store"` is there so Next's data cache cannot reuse a session-bearing response, and so a catalog price is not stored as a shared document that checkout might disagree with. Removing it is not a safe first edit.

## Calls that can block HTML

### 1. Locale layout — every public page

| Field | Value |
| --- | --- |
| Request | `activeOrder` via `readActiveOrderItems`; `activeCustomer` via `getActiveCustomer` |
| Route | `src/app/[locale]/layout.tsx`, so `/`, `/ar`, `/en`, product pages, about, contact, and the rest of the locale tree |
| Render phase | Server Component render, before the document is sent. `Promise.all` of the two reads |
| Blocking | Yes. The layout awaits both before returning HTML |
| Cache | Each call uses `vendureRequest` (`cache: "no-store"`, 10s abort). `getActiveCustomer` is wrapped in React `cache()` for the same render only. It returns `null` immediately when there is no token, so a guest does not wait on the customer query |
| Freshness | Cart count and signed-in state. A guest still waits on `activeOrder`, because that read always calls Vendure even with no token |
| Estimated impact | Not measured. If Vendure accepts the connection and hangs, this await can last up to 10 seconds. A refused connection fails inside the `catch` and the page still renders, with cart status `unavailable` or customer treated as a guest. Signed-in pages wait for the slower of the two parallel calls, still capped at 10 seconds each |
| Safe future optimization | Not implemented. A later design can fail the cart read open within a short deadline, or load the cart count after first paint, without caching another customer's session. Do not start by deleting `no-store` |

### 2. Catalog price lookup — pages that load products

| Field | Value |
| --- | --- |
| Request | `product(slug)` variant `priceWithTax` / `currencyCode` / `sku`, one Shop API call per slug missing from the in-memory map |
| Route | `PayloadProductRepository.getAllProducts`, `getProductBySlug`, `getProductsByCategory`. Used by the homepage, `/products`, and PDPs |
| Render phase | After the layout await. The page then awaits Payload and, on success, `getLivePrices`. Those phases are sequential, not overlapped with the layout read |
| Blocking | Yes, on catalog routes. `Promise.allSettled` runs the missing slugs together, so the wait is the slowest slug, not the sum |
| Cache | Fetch is still `no-store`. A separate process-local `Map` keeps a successful price for 60 seconds (`CACHE_TTL_MS`). Failures are not cached, so a down Vendure is retried on the next request. The map is not shared across instances and is not the Next data cache |
| Freshness | The displayed list price is supposed to match what checkout will charge. Checkout reads the live order, not this map. A price missing from Vendure falls back to the mock bridge |
| Estimated impact | Not measured. A catalog page can add up to another 10 seconds after the layout wait if Vendure hangs. Eight slugs do not multiply that cap because they run in parallel. No lab number was taken with Vendure stopped |
| Safe future optimization | Not implemented. Marketing copy can be rendered from Payload without this call. A displayed price can be filled after paint, or revalidated on a short timer, only after checkout is re-read and shown to refuse a mismatched charge. That check was not repeated in this pass |

### 3. Cart and checkout mutations

| Field | Value |
| --- | --- |
| Request | `addItemToOrder`, `adjustOrderLine`, `setOrderShippingAddress`, shipping methods, payment, customer, and the other mutations in `src/lib/cart/actions.ts` |
| Route | Cart, checkout, and account actions. Not the marketing layout by themselves |
| Render phase | Server Actions, after the user submits. Not part of the first HTML of a product page except where the layout already read the order |
| Blocking | The action the user is waiting on. Not the anonymous homepage HTML, beyond the layout read above |
| Cache | Same `vendureRequest` `no-store` and 10s abort |
| Freshness | Required. The price, stock check, shipping method, and payment result must be the live order. This pass does not cache them |
| Estimated impact | Not measured. A hung Shop API can hold the action until the 10 second abort |
| Safe future optimization | None proposed for mutations. They stay network-only |

### 4. Order confirmation and account reads

| Field | Value |
| --- | --- |
| Request | `orderByCode` on the confirmation page; `activeCustomer` and addresses on account pages |
| Route | `/[locale]/checkout/confirmation`, `/[locale]/account/*` |
| Render phase | Server Component render of those routes, plus the layout read |
| Blocking | Yes, for those routes |
| Cache | `no-store`. Customer read is request-memoized |
| Freshness | Required. An order confirmation must not be a cached other-session response |
| Estimated impact | Not measured. Same 10 second abort cap |
| Safe future optimization | Not in this pass. These routes are already `noindex` |

## What was not changed

- `cache: "no-store"` in `vendureRequest`
- The 10 second abort
- The layout `Promise.all` of cart and customer
- The 60 second in-memory price map
- Checkout, cart mutations, and account reads

## What a later measurement has to do

Stop Vendure, then record TTFB of `/ar` and `/ar/products/ca-mi-pulse-oximeter` from a running copy of this app. Compare that with Vendure up. Do not invent a Core Web Vitals score from this file. Do not claim a ranking or speed change from the SEO edits in the same release.
