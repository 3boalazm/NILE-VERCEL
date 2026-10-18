// Full-page screenshot + layout-health capture for the design audit / evidence.
//
//   node scripts/capture-screens.mjs <outDir> [--locales=ar,en] [--widths=390,768,1280,1536] [--only=home,products] [--consent=ask]
//
// Needs the storefront running (BASE_URL, default http://localhost:3000) and a
// Chromium: PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH (e.g. /opt/pw-browsers/chromium-1194/chrome-linux/chrome).
// Besides PNGs it writes <outDir>/report.json with, per shot: HTTP status,
// horizontal overflow, console/page errors, and the page height.
import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { chromium } from "playwright-core"

const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "")
const out = process.argv[2]
if (!out) throw new Error("usage: capture-screens.mjs <outDir>")
const arg = (name, def) => (process.argv.find((a) => a.startsWith(`--${name}=`)) ?? `--${name}=${def}`).split("=")[1]
const locales = arg("locales", "ar,en").split(",")
const widths = arg("widths", "390,768,1280,1536").split(",").map(Number)
const only = arg("only", "").split(",").filter(Boolean)
const HEIGHT = { 390: 844, 768: 1024, 1280: 800, 1536: 900 }

const ROUTES = [
  ["home", ""],
  ["products", "/products"],
  ["product-proxeed-plus", "/products/proxeed-plus"],
  ["product-unpriced", "/products/proxeed-men"],
  ["about", "/about"],
  ["story", "/story"],
  ["quality", "/quality-sourcing"],
  ["contact", "/contact"],
  ["careers", "/careers"],
  ["blogs", "/blogs"],
  ["article", "/blogs/micic-2019-sperm-parameters-trial"],
  ["cart", "/cart"],
  ["checkout", "/checkout"],
  ["login", "/login"],
  ["register", "/register"],
  ["account", "/account"],
  ["wishlist", "/wishlist"],
  ["terms", "/terms"],
  ["privacy", "/privacy-policy"],
  ["shipping", "/shipping-delivery"],
  ["offline", "/offline", true],
  ["notfound", "/this-page-does-not-exist"],
]

mkdirSync(out, { recursive: true })
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  args: ["--no-sandbox", "--disable-gpu"],
})
const report = []

for (const width of widths) {
  const ctx = await browser.newContext({
    viewport: { width, height: HEIGHT[width] ?? 900 },
    deviceScaleFactor: width < 600 ? 2 : 1,
    reducedMotion: "no-preference",
  })
  // --consent=ask keeps the cookie banner visible; default dismisses it (denied)
  // so the captures show the page, not the banner.
  if (arg("consent", "denied") !== "ask") {
    await ctx.addCookies([{ name: "npf-consent", value: "denied", url: BASE }])
  }
  for (const locale of locales) {
    for (const [name, route, rootOnly] of ROUTES) {
      if (only.length && !only.includes(name)) continue
      const url = `${BASE}${rootOnly ? "" : "/" + locale}${route}`
      const page = await ctx.newPage()
      const errors = []
      page.on("pageerror", (e) => errors.push("pageerror: " + String(e.message).slice(0, 160)))
      page.on("console", (m) => {
        if (m.type() === "error") errors.push("console: " + m.text().slice(0, 160))
      })
      let status = 0
      try {
        const res = await page.goto(url, { waitUntil: "load", timeout: 45_000 })
        status = res?.status() ?? 0
        await page.evaluate(() => document.fonts?.ready)
        // Scroll through so lazy images / reveal-on-scroll content paint.
        await page.evaluate(async () => {
          const step = Math.max(400, innerHeight * 0.8)
          for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
            scrollTo(0, y)
            await new Promise((r) => setTimeout(r, 120))
          }
          scrollTo(0, 0)
        })
        await page.waitForTimeout(700)
        const metrics = await page.evaluate(() => ({
          overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          height: document.documentElement.scrollHeight,
        }))
        const file = path.join(out, `${name}-${locale}-${width}.png`)
        await page.screenshot({ path: file, fullPage: true, animations: "disabled", timeout: 60_000 })
        report.push({ name, locale, width, status, ...metrics, errors })
        console.log(`${status} ${name} ${locale} ${width} overflow=${metrics.overflowX} h=${metrics.height}${errors.length ? " ERR=" + errors.length : ""}`)
      } catch (e) {
        report.push({ name, locale, width, status, fatal: String(e.message).slice(0, 200) })
        console.log(`FAIL ${name} ${locale} ${width}: ${String(e.message).slice(0, 100)}`)
      }
      await page.close()
    }
  }
  await ctx.close()
}
await browser.close()
writeFileSync(path.join(out, "report.json"), JSON.stringify(report, null, 2))
