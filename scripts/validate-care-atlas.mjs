import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium, expect } from "@playwright/test";

const base =
  process.env.CARE_ATLAS_URL ||
  "http://127.0.0.1:3100/concepts/care-atlas/index.html";
const out = "docs/upgrade-2026-10-15/v3-concept-evidence";
const axePath = process.env.AXE_CORE_PATH;
assert(
  axePath && fs.existsSync(axePath),
  "AXE_CORE_PATH must point to axe.min.js",
);
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
  interactions: [],
  errors: [],
  noJavaScript: false,
};
page.on("pageerror", (e) => result.errors.push(e.message));
const url = (language) => `${base}?lang=${language}`;
async function settled() {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images]
        .filter((img) => img.getClientRects().length)
        .map((img) => img.decode().catch(() => {})),
    );
  });
}
try {
  for (const language of ["ar", "en"]) {
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
      const response = await page.goto(url(language));
      await expect(page.locator(".product-row")).toHaveCount(8);
      await settled();
      const dimensions = await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
        broken: [...document.images]
          .filter((img) => !img.complete || !img.naturalWidth)
          .map((img) => img.src),
      }));
      result.visits.push({
        language,
        width,
        status: response.status(),
        ...dimensions,
      });
      console.log(`Responsive ${language}/${width}: ${dimensions.scroll}px`);
      if ([390, 1440].includes(width)) {
        await page.screenshot({
          path: path.join(
            out,
            `${language}-${width === 390 ? "mobile" : "desktop"}.webp`,
          ),
          fullPage: true,
        });
        if (language === "ar" && width === 1440)
          await page.screenshot({ path: path.join(out, "preview.webp") });
      }
      if ([390, 1440].includes(width)) {
        await page.evaluate(fs.readFileSync(axePath, "utf8"));
        const violations = await page.evaluate(async () => {
          const audit = await window.axe.run(document, {
            runOnly: {
              type: "tag",
              values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
            },
          });
          return audit.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            nodes: v.nodes.map((n) => ({
              target: n.target,
              summary: n.failureSummary,
            })),
          }));
        });
        result.accessibility.push({ language, width, violations });
        console.log(
          `Axe ${language}/${width}: ${violations.length} violations`,
        );
      }
    }
  }
  await page.goto(url("ar"));
  await expect(page.locator(".product-row")).toHaveCount(8);
  await page.locator('[data-category="medical-devices"]').click();
  await expect(page.locator(".product-row")).toHaveCount(2);
  await expect(page.locator("#stage-category")).toHaveText(
    "CA-MI / MEDICAL DEVICE",
  );
  await expect(page.locator('[data-detail="composition"]')).toHaveText(
    "المواصفات",
  );
  await page.locator('[data-detail="leaflet"]').click();
  await expect(page.locator("#product-detail")).toContainText(
    "لا توجد نشرة PDF رسمية",
  );
  assert.equal(await page.locator("#product-detail .pdf-link").count(), 0);
  result.interactions.push(
    "Devices filter + real specifications + no fabricated PDF",
  );
  await page.locator('[data-category="all"]').click();
  const search = page.locator("#search");
  await search.fill("بروكسيد بلس");
  await expect(page.locator(".product-row")).toHaveCount(1);
  await expect(page.locator("#product-title")).toHaveText("Proxeed Plus");
  await search.fill("no-match-zzzz");
  await expect(page.locator("#empty")).toBeVisible();
  await expect(page.locator(".product-stage")).toBeHidden();
  await search.fill("");
  await expect(page.locator(".product-row")).toHaveCount(8);
  result.interactions.push(
    "Arabic product-name search + empty state + recovery",
  );
  const plus = page.locator('[data-slug="proxeed-plus"]');
  await plus.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator('[data-slug="proxeed-men"]')).toBeFocused();
  await expect(page.locator("#product-title")).toHaveText("Proxeed Men");
  await page.locator('[data-slug="proxeed-women"]').click();
  await expect(page.locator("#product-title")).toHaveText("Proxeed Women");
  await page.locator('[data-detail="usage"]').click();
  await expect(page.locator("#product-detail .usage-copy")).toBeVisible();
  await page.locator('[data-detail="leaflet"]').click();
  const pdf = page.locator("#product-detail .pdf-link");
  await expect(pdf).toHaveAttribute(
    "href",
    "/downloads/proxeed-women-leaflet.pdf",
  );
  const pdfResponse = await context.request.get(
    new URL(await pdf.getAttribute("href"), base).href,
  );
  assert.equal(pdfResponse.status(), 200);
  assert.match(pdfResponse.headers()["content-type"], /application\/pdf/);
  result.interactions.push(
    "Keyboard product selection + usage + genuine Women PDF",
  );
  await page.locator("#language").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.locator("#product-title")).toHaveText("Proxeed Women");
  assert.match(page.url(), /lang=en/);
  await expect(page.locator("#product-description")).toContainText(
    "A food formula",
  );
  result.interactions.push(
    "Language switch preserves selected product and detail",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  const menu = page.locator("#menu-button");
  await menu.click();
  await expect(page.locator("#mobile-menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#mobile-menu")).toBeHidden();
  await expect(menu).toBeFocused();
  await menu.click();
  await page.locator('#mobile-menu a[href="#reading"]').click();
  await expect(page.locator("#mobile-menu")).toBeHidden();
  await expect(page.locator("#reading")).toBeFocused();
  result.interactions.push(
    "Mobile modal menu: Escape, focus restore, anchor destination focus",
  );
  const nojsContext = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const nojs = await nojsContext.newPage();
  await nojs.goto(base);
  await expect(nojs.locator("h1")).toBeVisible();
  await expect(nojs.locator("#reading-title")).toBeVisible();
  await expect(nojs.locator(".noscript-note")).toBeVisible();
  await expect(nojs.locator('.noscript-note a[href$=".pdf"]')).toBeVisible();
  result.noJavaScript = true;
  await nojsContext.close();
} finally {
  fs.writeFileSync(
    path.join(out, "browser.json"),
    JSON.stringify(result, null, 2) + "\n",
  );
  await browser.close();
}
for (const visit of result.visits) {
  assert.equal(visit.status, 200, JSON.stringify(visit));
  assert.equal(visit.width, visit.scroll, JSON.stringify(visit));
  assert.equal(visit.broken.length, 0, JSON.stringify(visit));
}
for (const audit of result.accessibility)
  assert.equal(audit.violations.length, 0, JSON.stringify(audit));
assert.equal(result.errors.length, 0, JSON.stringify(result.errors));
assert.equal(result.visits.length, 10);
assert.equal(result.accessibility.length, 4);
assert.equal(result.interactions.length, 5);
assert(result.noJavaScript);
console.log(
  "PASS: standalone concept checks. No claim of production commerce or owner visual acceptance.",
);
