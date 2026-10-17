// Dumps the storefront's source-of-truth mock catalog (the same data
// `npm run seed` pushes into Payload) into the JSON shape
// scripts/seed-vendure-catalog.mjs consumes. Needed after any environment
// rebuild (the /tmp catalog does not survive sandbox wipes).
//
// Usage: node scripts/dump-catalog.mjs [outfile=/tmp/catalog.json]
import { build } from "esbuild"
import { pathToFileURL } from "url"
import { writeFileSync } from "node:fs"

const outfile = process.argv[2] || "/tmp/catalog.json"

await build({
  stdin: {
    contents: `
      import { writeFileSync } from "node:fs";
      import { MockProductRepository } from "${process.cwd()}/src/lib/products/mock-repository";
      const repo = new MockProductRepository();
      const products = await repo.getAllProducts();
      const catalog = products.map((p) => ({ slug: p.slug, sku: p.sku ?? p.slug + "-SKU", name: p.name, price: p.price }));
      writeFileSync(process.argv[1] ?? "/tmp/catalog.json", JSON.stringify(catalog, null, 2));
      console.log("dumped", catalog.length, "products");
    `,
    resolveDir: process.cwd(),
    loader: "ts",
  },
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  outfile: "node_modules/.cache/npf-dump-catalog.mjs",
  logLevel: "warning",
})

process.argv[1] = outfile
await import(pathToFileURL("node_modules/.cache/npf-dump-catalog.mjs").href)
