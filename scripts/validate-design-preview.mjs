import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { chromium } from "@playwright/test"

// Run against the explicitly labelled design preview, not a live commerce site.
// axe-core is optional audit tooling installed separately (see V2 handoff).
const base = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000"
const output = process.env.DESIGN_EVIDENCE_DIR || "docs/upgrade-2026-10-15/v2-evidence"
const axePath = process.env.AXE_CORE_PATH
assert(axePath && fs.existsSync(axePath), "Set AXE_CORE_PATH to axe-core/axe.min.js")
fs.mkdirSync(output, { recursive: true })
const browser = await chromium.launch({
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {}),
})
const report = {
  timestamp: new Date().toISOString(),
  browser: browser.version(),
  base,
  pages: [],
  a11y: [],
  interaction: [],
  errors: [],
}
const context = await browser.newContext({ reducedMotion: "reduce" })
const page = await context.newPage()
page.on("pageerror", error => report.errors.push(error.message))
const file = name => path.join(output, name)
async function settle() {
  await page.evaluate(async () => { await document.fonts.ready })
  // Load lazy images and exercise every section without scroll-jacking.
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 700) {
      scrollTo(0, y)
      await new Promise(resolve => setTimeout(resolve, 25))
    }
    scrollTo(0, 0)
    const visibleImages = [...document.images].filter(img => img.getClientRects().length > 0)
    await Promise.race([
      Promise.all(visibleImages.map(img => img.decode().catch(() => {}))),
      new Promise(resolve => setTimeout(resolve, 3000)),
    ])
  })
  // Let class-driven theme transitions finish before contrast measurement.
  await page.waitForTimeout(500)
}
try {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const route of ["/ar", "/en", "/ar/products", "/en/products", "/ar/products/proxeed-plus"]) {
      const response = await page.goto(base + route)
      await settle()
      console.log(`Responsive: ${route} at ${width}px`)
      report.pages.push({
        width, route, status: response.status(),
        ...await page.evaluate(() => ({
          client: innerWidth,
          scroll: document.documentElement.scrollWidth,
          broken: [...document.images].filter(img => img.getClientRects().length > 0 && (!img.complete || !img.naturalWidth)).map(img => img.src),
        })),
      })
    }
  }
  for (const locale of ["en", "ar"]) {
    await page.setViewportSize({ width: 1440, height: 1000 })
    for (const suffix of ["", "/products", "/products/proxeed-plus"]) {
      await page.goto(`${base}/${locale}${suffix}`)
      await settle()
      for (const mode of ["light", "dark"]) {
        await page.evaluate(m => document.documentElement.classList.toggle("dark", m === "dark"), mode)
        await page.waitForTimeout(500)
        await page.addScriptTag({ path: axePath })
        const violations = await page.evaluate(async () => {
          const result = await window.axe.run(document, {
            runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
          })
          return result.violations.map(v => ({
            id: v.id,
            nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })),
          }))
        })
        console.log(`Axe: /${locale}${suffix} (${mode}) — ${violations.length} violations`)
        report.a11y.push({ locale, route: `/${locale}${suffix}`, mode, violations })
        if (!suffix) {
          await page.screenshot({ path: file(`home-${locale}-${mode === "light" ? "desktop" : "dark"}.png`), fullPage: true })
          if (locale === "ar" && mode === "light") {
            await page.screenshot({ path: file("site-preview.png") })
          }
        }
      }
    }
    await page.goto(`${base}/${locale}`)
    await page.setViewportSize({ width: 390, height: 844 })
    await settle()
    await page.screenshot({ path: file(`home-${locale}-mobile.png`), fullPage: true })
  }
  await page.goto(`${base}/en`)
  const women = page.getByRole("button", { name: "Women’s health", exact: true })
  await women.click()
  report.interaction.push({
    womenPressed: await women.getAttribute("aria-pressed"),
    womenHeading: await page.locator(".need-panel:not([hidden]) h3").allTextContents(),
    range: await page.locator(".need-panel:not([hidden]) .need-round-link").getAttribute("href"),
  })
} finally {
  fs.writeFileSync(file("browser.json"), JSON.stringify(report, null, 2) + "\n")
  await browser.close()
}
assert.equal(report.pages.length, 25)
for (const sample of report.pages) {
  assert.equal(sample.status, 200, sample.route)
  assert(sample.scroll <= sample.client, `Overflow: ${sample.route} at ${sample.width}px`)
  assert.equal(sample.broken.length, 0, `Broken image: ${sample.route}`)
}
assert.equal(report.a11y.length, 12)
for (const audit of report.a11y) assert.equal(audit.violations.length, 0, JSON.stringify(audit))
assert.equal(report.errors.length, 0, JSON.stringify(report.errors))
assert.equal(report.interaction[0].womenPressed, "true")
assert.equal(report.interaction[0].range, "/en/products?need=womens-health")
console.log("PASS: 25 responsive visits, 12 axe audits, audience selection; evidence written to " + output)
