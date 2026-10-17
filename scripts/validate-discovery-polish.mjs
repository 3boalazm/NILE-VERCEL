import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "@playwright/test";

const base = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const out =
  process.env.CARE_ATLAS_EVIDENCE_DIR ||
  "docs/upgrade-2026-10-15/discovery-evidence";
const axePath = process.env.AXE_CORE_PATH;
assert(axePath && fs.existsSync(axePath), "Set AXE_CORE_PATH to axe.min.js");
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {},
);
const page = await browser.newPage({ reducedMotion: "reduce" });
const result = {
  timestamp: new Date().toISOString(),
  base,
  visits: [],
  audits: [],
  errors: [],
  failures: [],
};
page.on("pageerror", (error) => result.errors.push(error.message));
const states = {
  // A maximum-length unbroken value must wrap in both the chip and empty state.
  empty:
    "/products?q=" + "z".repeat(200) + "&category=medical-devices&sort=desc",
  filtered:
    "/products?q=plus%20proxeed&category=supplements&need=mens-health&sort=desc",
  atlas: "",
  chapter: "/products/proxeed-plus",
};
try {
  for (const locale of ["ar", "en"])
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
      for (const [state, route] of Object.entries(states)) {
        const response = await page.goto(`${base}/${locale}${route}`);
        await page.evaluate(() => document.fonts.ready);
        if (state === "atlas") {
          await page
            .locator('.ca-product-explorer input[type="search"]')
            .fill("no-match-zzzz");
          await page
            .locator(".ca-atlas-empty-actions")
            .waitFor({ state: "visible" });
          await page
            .locator(".ca-product-explorer")
            .evaluate((element) =>
              element.scrollIntoView({ behavior: "instant", block: "start" }),
            );
        } else if (state === "chapter") {
          await page.locator('.ca-dossier-index a[href="#usage"]').click();
          await page
            .locator(
              '.ca-dossier-index a[href="#usage"][aria-current="location"]',
            )
            .waitFor();
        } else {
          await page
            .locator(
              state === "empty" ? ".ca-catalog-empty" : ".ca-applied-filters",
            )
            .evaluate((element) =>
              element.scrollIntoView({ behavior: "instant", block: "center" }),
            );
        }
        const dimensions = await page.evaluate(() => ({
          width: innerWidth,
          scroll: document.documentElement.scrollWidth,
        }));
        result.visits.push({
          locale,
          width,
          state,
          status: response.status(),
          ...dimensions,
        });
        if (response.status() !== 200 || dimensions.scroll > width + 1)
          result.failures.push({ locale, width, state, ...dimensions });
        if ([390, 1440].includes(width)) {
          await page.evaluate(fs.readFileSync(axePath, "utf8"));
          for (const theme of ["light", "dark"]) {
            await page.evaluate(
              (dark) => document.documentElement.classList.toggle("dark", dark),
              theme === "dark",
            );
            const violations = await page.evaluate(async () =>
              (
                await window.axe.run(document, {
                  runOnly: {
                    type: "tag",
                    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
                  },
                })
              ).violations.map((v) => ({
                id: v.id,
                impact: v.impact,
                nodes: v.nodes.map((n) => ({
                  target: n.target,
                  failureSummary: n.failureSummary,
                })),
              })),
            );
            result.audits.push({ locale, width, state, theme, violations });
            if (violations.length)
              result.failures.push({ locale, width, state, theme, violations });
          }
          await page.evaluate(() =>
            document.documentElement.classList.remove("dark"),
          );
        }
        // Four viewport images, not another duplicate full-site screenshot set.
        const shot =
          (locale === "ar" &&
            width === 1440 &&
            ["empty", "filtered"].includes(state)) ||
          (locale === "ar" && width === 390 && state === "chapter") ||
          (locale === "en" && width === 1440 && state === "atlas");
        if (shot)
          await page.screenshot({
            path: `${out}/${state}-${locale}-${width}.webp`,
          });
      }
      console.log(
        `Discovery ${locale}/${width}: empty, filtered, atlas, chapter`,
      );
    }
} finally {
  await browser.close();
  fs.writeFileSync(
    `${out}/discovery-browser.json`,
    JSON.stringify(result, null, 2) + "\n",
  );
}
console.log(
  `${result.visits.length} responsive visits; ${result.audits.length} axe audits; ${result.errors.length} page errors; ${result.failures.length} failures`,
);
assert.equal(result.errors.length, 0, "Browser errors");
assert.equal(result.failures.length, 0, "See discovery-browser.json");
