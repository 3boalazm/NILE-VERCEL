import { defineConfig, devices } from "@playwright/test"

// Local: boots `next dev` automatically (or reuses your running server).
// CI: the workflow builds first, then this config boots `next start`.
// Point at any environment explicitly with PLAYWRIGHT_BASE_URL (skips webServer).
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000"

// Sandboxes/CI caches where `npx playwright install` cannot reach the browser
// CDN can point at an existing Chromium binary instead (the repo's own
// browser probe vendors one via @sparticuz/chromium — see
// scripts/probe-manual-checks.mjs, which also extracts the NSS/NSPR libs the
// binary needs; export their directory in LD_LIBRARY_PATH when using this).
const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  // Suite order matters (commerce tests place real orders) and tests share
  // backends (Payload/Vendure) — run serially, one worker.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // Optional local browser path for constrained preview environments. CI
    // and normal development keep Playwright’s managed browser by default.
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } }
      : {}),
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: process.env.CI ? "npm run start -- --port 3000" : "npm run dev -- --port 3000",
        url: "http://localhost:3000/ar",
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(executablePath
          ? { launchOptions: { executablePath, args: ["--no-sandbox", "--disable-gpu"] } }
          : {}),
      },
    },
  ],
})
