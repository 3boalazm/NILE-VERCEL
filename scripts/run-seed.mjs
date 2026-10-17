// `npm run seed` entrypoint: bundles scripts/seed.ts with esbuild (already a
// devDependency — no tsx/ts-node needed) and runs it. Cross-platform, unlike
// a chained shell one-liner.
import { build } from "esbuild"
import { pathToFileURL } from "url"

// The seed owns schema creation: production runs with `push: false`, so on an
// empty database the tables would otherwise not exist (see payload.config.ts).
process.env.PAYLOAD_DB_PUSH ??= "true"

await build({
  entryPoints: ["scripts/seed.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  outfile: "node_modules/.cache/npf-seed/seed.mjs",
  logLevel: "warning",
})

await import(pathToFileURL("node_modules/.cache/npf-seed/seed.mjs").href)
