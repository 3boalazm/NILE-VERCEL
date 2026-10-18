// Builds the Vendure server + worker (+ TypeORM migrations) into dist/ with
// esbuild. `vendure dev` cannot load this repo (ESM resolution of extension-less
// TS imports) and `vendure build` needs the dashboard toolchain, so this is the
// supported, hermetic way to get `node dist/index.js` / `node dist/index-worker.js`.
//
//   node scripts/build-vendure.mjs
//   node dist/index.js          # API    (runs pending migrations first)
//   node dist/index-worker.js   # worker (job queue: search index, e-mail)
//
// vendure-config.ts resolves './migrations/*.js' and '../static' relative to
// __dirname, which is dist/ — hence the output layout below.
import { build } from "esbuild"
import { readdirSync } from "node:fs"

const migrations = readdirSync("src/migrations")
  .filter((f) => f.endsWith(".ts"))
  .map((f) => `src/migrations/${f}`)

await build({
  entryPoints: ["src/index.ts", "src/index-worker.ts", ...migrations],
  outdir: "dist",
  outbase: "src",
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node22",
  packages: "external",
  sourcemap: false,
  logLevel: "info",
})
