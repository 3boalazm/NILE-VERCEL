# Analytics (F-70)

What ships: a **consent-gated GA4 layer** with a GA4 e-commerce event contract.
What does NOT ship: any third-party measurement by default. `NEXT_PUBLIC_GA_ID`
is empty in `.env.example`, and with it empty the loader never renders a
script tag — this sandbox and any privacy review deploy run analytics-free.

## Consent gate (with F-18)

1. First visit, no `npf-consent` cookie → banner (equal-weight Accept/Reject,
   link to the privacy policy). Essential cookies are never gated.
2. Accept → `npf-consent=granted` (1 year) → `AnalyticsProvider` injects the
   inline bootstrap (`dataLayer` + `gtag()` + Consent Mode v2 defaults) and
   then `gtag/js?id=…`; everything already queued on the dataLayer drains.
3. Reject → `npf-consent=denied` → nothing third-party loads, ever, for that
   visitor. Revoking later pushes `gtag('consent','update',
   {analytics_storage:'denied'})` which stops measurement in-page immediately.
4. CSP already allow-lists `googletagmanager.com` / `google-analytics.com`
   (script-src + connect-src), so enabling the id needs no policy change.

## Event contract

Emitters live in `src/components/npf/analytics-events.tsx` (page beacons) and
`src/lib/cart/provider.tsx` (cart mutations). All push onto `dataLayer`
via `track()` (`src/lib/analytics/track.ts`); payloads follow GA4 e-commerce
schema (`currency`, `value`, `items[]` with `item_id/item_name/quantity/price`).

| Event | Where | Notes |
|---|---|---|
| `view_item_list` | `/[locale]/products` | current filtered set; `item_list_name` = need/category/`all` |
| `search` | listing hero search submit | `search_term` |
| `view_item` | `/[locale]/products/[slug]` | once per mount |
| `add_to_cart` | cart provider `addItem` | **success only** — rejected adds are not demand |
| `remove_from_cart` | cart provider `removeItem` | names the removed line |
| `begin_checkout` | `/[locale]/checkout` render with non-empty cart | `value` = subtotal |
| `purchase` | `/checkout/confirmation` with a visible order | `transaction_id` = order number |

Funnel in GA4: `view_item_list → view_item → add_to_cart → begin_checkout →
purchase`, mark as conversion on `purchase`.

## Verifying without a GA account

`scripts/probe-manual-checks.mjs` asserts, in a real browser: no gtag script
pre-consent; after Accept the bootstrap + remote script exist and
`window.dataLayer` is an array; the PDP queues `view_item`; a denied visitor
gets no script at all. That proves the plumbing end-to-end without sending a
single hit to Google — which is also why this check runs in CI.
