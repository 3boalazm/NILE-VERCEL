// `npm run seed` entrypoint: bundles scripts/seed.ts with esbuild (already a
// devDependency — no tsx/ts-node needed) and runs it. Cross-platform, unlike
// a chained shell one-liner.
import { build } from "esbuild"
import { pathToFileURL } from "url"

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
