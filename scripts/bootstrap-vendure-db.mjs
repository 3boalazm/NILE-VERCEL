// One-shot bootstrap for a FRESH database: Vendure's programmatic populate()
// — creates the full schema (migrations), seeds Vendure's default data
// (default channel, countries incl. none — the EG country is added by
// scripts/seed-vendure-demo.cjs, roles, global settings), then reindexes.
//
// ORDER MATTERS on a fresh environment: run Payload's `npm run seed` BEFORE
// this script — drizzle-kit's schema push (used by Payload) crashes when it
// introspects existing Vendure tables with composite primary keys
// (drizzle-kit 0.31.7 sends the composite-PK query with its params dropped).
//
// Usage: set -a && . ./.env && set +a && node scripts/bootstrap-vendure-db.mjs
import { build } from "esbuild"
import { pathToFileURL } from "url"

await build({
  entryPoints: ["scripts/bootstrap-vendure-db.entry.ts"],
  bundle: true,
  platform: "node",
  format: "cjs",
  packages: "external",
  external: ["@vendure/core", "@vendure/email-plugin", "@vendure/asset-server-plugin", "@vendure/graphiql-plugin", "@vendure/dashboard/plugin"],
  outfile: "node_modules/.cache/npf-bootstrap/bootstrap.cjs",
  logLevel: "warning",
})

await import(pathToFileURL("node_modules/.cache/npf-bootstrap/bootstrap.cjs").href)
