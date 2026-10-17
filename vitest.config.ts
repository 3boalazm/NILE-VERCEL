import { fileURLToPath } from "url"

import { defineConfig } from "vitest/config"

const root = fileURLToPath(new URL("./", import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      // Mirror tsconfig's `@/*` so tests import exactly like app code.
      "@": `${root}src`,
      // `server-only` throws on ANY server-side import outside Next's
      // bundler (that's its whole job) — stub it out for unit tests so
      // server modules under test can be imported in plain Node.
      "server-only": `${root}test/stubs/server-only.ts`,
      // In-memory cookies()/headers() so Server Actions under test can
      // read/write session state without a real request scope.
      "next/headers": `${root}test/stubs/next-headers.ts`,
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
})
