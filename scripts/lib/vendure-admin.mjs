// Shared Admin API client for the Vendure provisioning scripts
// (seed-vendure-catalog.mjs, seed-vendure-demo.cjs, vendure-audit.mjs).
//
// Vendure 3 API-shape notes learned the hard way:
//  - list queries return `{ items }`;
//  - the admin login token arrives ONLY in the `vendure-auth-token` response
//    HEADER (bearer), not in the body;
//  - Channel input takes defaultTaxZoneId/defaultShippingZoneId while queries
//    return zone objects;
//  - products use `enabled` (there is no `published`);
//  - union mutation results reject `... on ErrorResult` spreads for concrete
//    types — select fields on the concrete type;
//  - the reindex mutation is `reindex` and returns a Job that the WORKER runs.
import { readFileSync } from "node:fs"

export const ADMIN_API = process.env.VENDURE_ADMIN_API || "http://localhost:3001/admin-api"
export const SHOP_API = process.env.VENDURE_SHOP_API_URL || "http://localhost:3001/shop-api"

let adminToken = null

export async function gql(query, variables, { api = ADMIN_API, auth = true } = {}) {
  const res = await fetch(api, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(auth && adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  })
  const headerToken = res.headers.get("vendure-auth-token")
  if (auth && api === ADMIN_API && headerToken) adminToken = headerToken
  const json = await res.json()
  if (json.errors) throw new Error(JSON.stringify(json.errors).slice(0, 400))
  return json.data
}

export async function adminLogin() {
  const username = process.env.SUPERADMIN_USERNAME
  const password = process.env.SUPERADMIN_PASSWORD
  if (!username || !password) {
    throw new Error("SUPERADMIN_USERNAME / SUPERADMIN_PASSWORD are not set (source your .env first).")
  }
  const data = await gql(
    `mutation Login($u: String!, $p: String!) { login(username: $u, password: $p) { ... on CurrentUser { id identifier } ... on ErrorResult { errorCode message } } }`,
    { u: username, p: password }
  )
  if (!data.login?.id) throw new Error("admin login failed: " + JSON.stringify(data.login))
  return data.login
}

/** Multipart GraphQL upload (graphql-multipart-request-spec). */
export async function uploadAssets(files) {
  const form = new FormData()
  form.set(
    "operations",
    JSON.stringify({
      query: `mutation ($input: [CreateAssetInput!]!) { createAssets(input: $input) { ... on Asset { id name preview } ... on MimeTypeError { message fileName mimeType } } }`,
      variables: { input: files.map(() => ({ file: null })) },
    })
  )
  form.set("map", JSON.stringify(Object.fromEntries(files.map((_, i) => [String(i), [`variables.input.${i}.file`]]))))
  files.forEach((f, i) => form.set(String(i), new Blob([readFileSync(f.path)], { type: f.type }), f.name))
  const res = await fetch(ADMIN_API, {
    method: "POST",
    headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
    body: form,
  })
  const json = await res.json()
  if (json.errors) throw new Error(JSON.stringify(json.errors).slice(0, 400))
  return json.data.createAssets
}

export async function waitForJob(jobId, { timeoutMs = 60_000 } = {}) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const { job } = await gql(`query ($id: ID!) { job(jobId: $id) { id state progress error } }`, { id: jobId })
    if (job && ["COMPLETED", "FAILED", "CANCELLED"].includes(job.state)) return job
    await new Promise((r) => setTimeout(r, 1000))
  }
  return { id: jobId, state: "TIMEOUT" }
}

export function log(...args) {
  console.log(...args)
}
