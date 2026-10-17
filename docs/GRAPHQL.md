# GraphQL endpoints & interactive explorers

> F-09 asked for this: an interactive GraphQL UI that 404s in production is
> either a missing feature or an undocumented one, and nobody could tell which.
> Both explorers below exist and are wired; what was missing was the
> documentation and an explicit environment gate.

There are **two independent GraphQL servers** in this project, because there
are two backends (ADR-007: Vendure owns commerce, Payload owns content). They
do not share a schema, a port, or an auth model.

| Backend | Endpoint | Interactive explorer | Available when |
|---|---|---|---|
| Vendure **Shop API** (cart, checkout, customer, prices) | `POST /shop-api` | `/graphiql/shop` | `APP_ENV=dev` only |
| Vendure **Admin API** (catalogue admin, orders) | `POST /admin-api` | `/graphiql/admin` | `APP_ENV=dev` only |
| Payload **CMS API** (products, categories, media, inquiries, users) | `POST /api/graphql` · REST at `/api/<collection>` | `/api/graphql-playground` | always (behind Payload's own auth for mutations) |

Vendure's port is `VENDURE_SERVER_PORT` (default 3001) unless the host injects
`PORT`; the storefront's Next server (default 3000) proxies nothing — talk to
Vendure directly.

## Why the Vendure explorers are dev-gated

`GraphiqlPlugin.init()` used to be in the plugin list unconditionally, so
production served an interactive IDE that advertises the entire schema and lets
anyone run **unauthenticated** queries against the Shop API. It now sits behind
the same `IS_DEV` gate as `adminApiDebug`/`shopApiDebug` in
`src/vendure-config.ts`:

```ts
const IS_DEV = env.APP_ENV === 'dev';
// …
plugins: [
  ...(IS_DEV ? [GraphiqlPlugin.init()] : []),
  // …
]
```

`APP_ENV` is validated by `src/lib/env.ts` against `dev|staging|production`, so
a typo (`prod`) cannot silently turn the explorers on — it fails the boot.

Payload's playground is a different case: it is an App Router route
(`src/app/(payload)/api/graphql-playground/route.ts`) that ships in every
environment. Payload's own auth still applies to anything that mutates, but if
a deployment would rather not expose the explorer at all, delete that route
file — nothing else references it.

## Useful first queries

Shop API — the live price the storefront shows (single source of truth, so a
PDP price and a checkout price cannot disagree):

```graphql
query {
  product(slug: "proxeed-plus") {
    id
    name
    variants {
      id
      sku
      priceWithTax
      stockLevel
    }
  }
}
```

Shop API — the mutation behind `/ar/login/forgot-password` (F-04). It always
returns a bare `true`, including for addresses that have no account: that is
deliberate, to stop the endpoint being used to enumerate customers. The mail is
only sent when the address exists.

```graphql
mutation {
  requestPasswordReset(email: "someone@example.com")
}
```

Payload API — the CMS document the PDP renders from:

```graphql
query {
  Products(where: { slug: { equals: "proxeed-plus" } }) {
    docs {
      slug
      name
      status
      translations {
        en { name description }
      }
    }
  }
}
```

## Where the storefront's queries live

Application code never writes GraphQL by hand at the call site: the documents
are in `src/lib/vendure/queries.ts` and `src/lib/vendure/client.ts`, and server
actions in `src/lib/auth/actions.ts` wrap them. Add a query there rather than
inlining it in a component, so the operation name stays greppable and the error
shape stays uniform (`describeError` in `src/lib/i18n/common-errors.ts`).

## Related

- `docs/OPS.md` — environment variables, backups, CSP rollout switches.
- `src/lib/env.ts` — the validated shape of every variable named above.
- `scripts/check-env.mjs` — CI guard that keeps `.env.example` honest.
