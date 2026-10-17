import fs from "node:fs";
import ts from "typescript";

// Snapshot only public content for the isolated design study. Intentionally
// exclude prices, stock, commerce identifiers, testimonials and long claims.
// The module is trusted repository code; all of its imports are type-only.
const source = fs.readFileSync("src/lib/products/mock-repository.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const compiledModule = { exports: {} };
new Function("exports", "module", compiled)(compiledModule.exports, compiledModule);
const products =
  await new compiledModule.exports.MockProductRepository().getAllProducts();
const keys = [
  "slug",
  "name",
  "nameArabic",
  "categorySlug",
  "image",
  "availableForm",
  "shortDescription",
  "composition",
  "compositionNote",
  "usage",
  "downloadUrl",
];
const translatedKeys = [
  "shortDescription",
  "availableForm",
  "composition",
  "compositionNote",
  "usage",
];
const result = products.map((product) => {
  const pack = `/concepts/care-atlas/packs/${product.slug}.webp`;
  return {
    ...Object.fromEntries(keys.map((key) => [key, product[key]])),
    ...(fs.existsSync("public" + pack) ? { image: pack } : {}),
    en: product.translations?.en
      ? Object.fromEntries(
          translatedKeys.map((key) => [key, product.translations.en[key]]),
        )
      : undefined,
  };
});
fs.writeFileSync(
  "public/concepts/care-atlas/catalog.json",
  JSON.stringify(result, null, 2) + "\n",
);
console.log(
  `Exported ${result.length} public product files; no prices, stock or testimonials.`,
);
