import { createSerwistRoute } from "@serwist/turbopack";

// Fresh on every build, including uncommitted preview builds. Offline HTML
// must not retain a stale revision merely because the git HEAD is unchanged.
const revision = crypto.randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  additionalPrecacheEntries: [{ url: "/offline", revision }],
  swSrc: "src/app/sw.ts",
  // Do not eagerly download every product image, PDF and admin JS chunk.
  // Only the neutral fallback, its CSS and the small brand asset are precached.
  globPatterns: [".next/static/**/*.css", "public/npf-logo.svg"],
  // `nextConfig` is required by the installed @serwist/turbopack (9.5.2): it
  // reads `basePath`/`distDir` so it can rebase the precache manifest's URLs
  // (build artifacts live under `_next/`; public files are re-rooted onto
  // `basePath`). The docs' "only needed for Next.js < 15" note predates this
  // release of the package, whose options type makes `nextConfig` mandatory.
  // The app uses Next's defaults (basePath "/", distDir ".next"), so the
  // values are listed explicitly rather than derived from a config import.
  nextConfig: { basePath: "/", distDir: ".next" },
  useNativeEsbuild: true,
  // esbuild 0.28 cannot *lower* destructuring syntax to Serwist's very
  // conservative default targets (chrome64/edge79/…) and fails the build with
  // "Transforming destructuring … is not supported yet". Declaring destructuring
  // supported leaves that (universally available) syntax untouched while
  // everything else keeps the old baseline.
  esbuildOptions: { supported: { destructuring: true } },
});
