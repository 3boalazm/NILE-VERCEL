import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "@playwright/test";

// Public, non-mutating checks against the actual Next application, not the
// standalone direction study. Commerce has its separate seeded-backend suite.
const base = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const out =
  process.env.CARE_ATLAS_EVIDENCE_DIR ||
  "docs/upgrade-2026-10-15/integrated-evidence";
const axePath = process.env.AXE_CORE_PATH;
assert(axePath && fs.existsSync(axePath), "Set AXE_CORE_PATH to axe.min.js");
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {},
);
const context = await browser.newContext({ reducedMotion: "reduce" });
const page = await context.newPage();
const result = {
  timestamp: new Date().toISOString(),
  base,
  browser: browser.version(),
  visits: [],
  accessibility: [],
  errors: [],
  failures: [],
};
page.on("pageerror", (e) =>
  result.errors.push({ url: page.url(), message: e.message }),
);
const routes = [
  "",
  "/products",
  "/products/proxeed-plus",
  "/products/ca-mi-ir-thermometer",
  "/about",
  "/story",
  "/quality-sourcing",
  "/contact",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/cart",
  "/checkout",
  "/wishlist",
  "/privacy-policy",
  "/careers",
];
const audited = new Set([
  "",
  "/products",
  "/products/proxeed-plus",
  "/about",
  "/quality-sourcing",
  "/contact",
  "/login",
  "/cart",
]);
async function settled() {
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (const img of document.images) img.loading = "eager";
    await Promise.all(
      [...document.images].map((img) => img.decode().catch(() => {})),
    );
    // Full-page screenshots must represent revealed content, not a frozen
    // pre-scroll state. Native scrolling also exercises the reveal fallback.
    if (document.querySelector("[data-reveal]")) {
      const height = document.documentElement.scrollHeight;
      for (let y = 0; y < height; y += innerHeight * 0.8) {
        window.scrollTo({ top: y, behavior: "instant" });
        await new Promise((resolve) => setTimeout(resolve, 35));
      }
      window.scrollTo({ top: 0, behavior: "instant" });
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  });
}

async function audit(route, locale, width, theme) {
  await page.evaluate(fs.readFileSync(axePath, "utf8"));
  const violations = await page.evaluate(async () => {
    const r = await window.axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
      },
    });
    return r.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    }));
  });
  result.accessibility.push({ route, locale, width, theme, violations });
  if (violations.length)
    result.failures.push(
      `axe ${locale}${route}/${width}/${theme}: ${violations.map((v) => v.id).join(", ")}`,
    );
}
try {
  for (const locale of ["ar", "en"]) {
    for (const route of routes) {
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
        const response = await page.goto(`${base}/${locale}${route}`);
        await settled();
        const dimensions = await page.evaluate(() => ({
          width: innerWidth,
          scroll: document.documentElement.scrollWidth,
          broken: [...document.images]
            .filter((img) => !img.complete || !img.naturalWidth)
            .map((img) => img.getAttribute("src")),
          main: document.querySelectorAll("main").length,
          h1: document.querySelectorAll("main h1").length,
        }));
        result.visits.push({
          locale,
          route,
          width,
          status: response.status(),
          finalPath: new URL(page.url()).pathname,
          ...dimensions,
        });
        if (
          response.status() !== 200 ||
          dimensions.scroll > width + 1 ||
          dimensions.broken.length ||
          dimensions.main !== 1 ||
          dimensions.h1 !== 1
        )
          result.failures.push(
            `layout ${locale}${route}/${width}: ${JSON.stringify(dimensions)} status ${response.status()}`,
          );
        if (audited.has(route) && width === 390)
          await audit(route, locale, width, "light");
        if (
          process.env.CARE_ATLAS_SCREENSHOTS !== "0" &&
          [390, 1440].includes(width) &&
          [
            "",
            "/products",
            "/products/proxeed-plus",
            "/contact",
            "/login",
            "/about",
            "/story",
            "/quality-sourcing",
          ].includes(route)
        ) {
          const name = route ? route.replaceAll("/", "-").slice(1) : "home";
          await page.screenshot({
            path: `${out}/${name}-${locale}-${width === 390 ? "mobile" : "desktop"}.webp`,
            fullPage: true,
          });
          if (!route && locale === "ar" && width === 1440)
            await page.screenshot({ path: `${out}/site-preview.webp` });
        }
      }
      console.log(`Responsive ${locale}${route || "/"}: 320,390,768,1440`);
    }
    for (const route of [
      "",
      "/products",
      "/products/proxeed-plus",
      "/contact",
      "/login",
      "/cart",
    ]) {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(`${base}/${locale}${route}`);
      await settled();
      await page.evaluate(() => document.documentElement.classList.add("dark"));
      await audit(route, locale, 1440, "dark");
      await page.evaluate(() =>
        document.documentElement.classList.remove("dark"),
      );
    }
  }
} finally {
  await browser.close();
  fs.writeFileSync(
    `${out}/browser.json`,
    `${JSON.stringify(result, null, 2)}\n`,
  );
}
console.log(
  `Visits: ${result.visits.length}; axe audits: ${result.accessibility.length}; page errors: ${result.errors.length}`,
);
console.log(
  result.failures.join("\n") || "PASS — no detected layout/image/axe failures",
);
assert.equal(result.errors.length, 0, "Browser errors");
assert.equal(result.failures.length, 0, "See browser.json for failures");
