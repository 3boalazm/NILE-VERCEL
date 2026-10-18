// Dumps the storefront's source-of-truth catalog (the same data `npm run seed`
// pushes into Payload) into the JSON that scripts/seed-vendure-catalog.mjs
// consumes. The committed copy lives at scripts/data/vendure-catalog.json (no
// /tmp dependency); a unit test (scripts/vendure-catalog.test.ts) fails when it
// drifts from mock-repository.ts, and this script regenerates it.
//
// Only fields that already exist in the repo are copied. `price` stays null for
// products with no approved price — they are NEVER given a placeholder price.
//
// Usage: node scripts/dump-catalog.mjs [outfile=scripts/data/vendure-catalog.json]
import { build } from "esbuild"
import { pathToFileURL } from "url"

const outfile = process.argv[2] || "scripts/data/vendure-catalog.json"

await build({
  stdin: {
    contents: `
      import { writeFileSync } from "node:fs";
      import { MockProductRepository } from "${process.cwd()}/src/lib/products/mock-repository";
      const repo = new MockProductRepository();
      const products = await repo.getAllProducts();
      const catalog = products.map((p) => ({
        slug: p.slug,
        sku: p.sku ?? null,
        name: p.name,
        nameArabic: p.nameArabic ?? null,
        category: p.categorySlug,
        status: p.status,
        price: typeof p.price === "number" ? p.price : null,
        image: p.image ?? null,
      }));
      writeFileSync(process.argv[1], JSON.stringify(catalog, null, 2) + "\\n");
      console.log("dumped", catalog.length, "products ->", process.argv[1]);
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
