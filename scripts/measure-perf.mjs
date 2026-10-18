// First-load JS (transferred bytes) + LCP/CLS on a mobile profile.
//   BASE_URL=http://localhost:3000 node scripts/measure-perf.mjs [paths...]
import { chromium } from "playwright-core"
const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "")
const paths = process.argv.slice(2).length ? process.argv.slice(2) : ["/ar", "/en", "/ar/products", "/ar/products/proxeed-plus", "/ar/about", "/ar/contact"]
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ["--no-sandbox"] })
for (const p of paths) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true })
  await ctx.addCookies([{ name: "npf-consent", value: "denied", url: BASE }])
  const page = await ctx.newPage()
  const cdp = await ctx.newCDPSession(page)
  await cdp.send("Network.enable")
  const js = new Map()
  cdp.on("Network.responseReceived", (e) => { if (e.type === "Script") js.set(e.requestId, e.response.url) })
  const sizes = new Map()
  cdp.on("Network.loadingFinished", (e) => sizes.set(e.requestId, e.encodedDataLength))
  await page.addInitScript(() => {
    window.__m = { lcp: 0, cls: 0 }
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__m.lcp = e.startTime }).observe({ type: "largest-contentful-paint", buffered: true })
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.cls += e.value }).observe({ type: "layout-shift", buffered: true })
  })
  await page.goto(BASE + p, { waitUntil: "networkidle" })
  await page.waitForTimeout(1200)
  const m = await page.evaluate(() => window.__m)
  let total = 0, biggest = 0
  for (const [id] of js) { const s = sizes.get(id) ?? 0; total += s; biggest = Math.max(biggest, s) }
  console.log(`${p.padEnd(28)} JS ${(total / 1024).toFixed(0)}KB (largest ${(biggest / 1024).toFixed(0)}KB) · LCP ${m.lcp.toFixed(0)}ms · CLS ${m.cls.toFixed(4)}`)
  await ctx.close()
}
await browser.close()
