import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

// axe-core audit of every key route in both locales, light + dark theme,
// phone + desktop. Zero violations (incl. colour contrast on glass surfaces).
const ROUTES = [
  "",
  "/products",
  "/products/proxeed-plus",
  "/products/proxeed-men",
  "/about",
  "/story",
  "/quality-sourcing",
  "/contact",
  "/careers",
  "/blogs",
  "/cart",
  "/checkout",
  "/login",
  "/register",
  "/wishlist",
  "/terms",
  "/privacy-policy",
  "/shipping-delivery",
]

for (const locale of ["ar", "en"]) {
  for (const theme of ["light", "dark"] as const) {
    for (const width of [390, 1280]) {
      test(`axe: ${locale} ${theme} ${width}px — all key routes have 0 violations`, async ({ browser, baseURL }) => {
        test.setTimeout(240_000)
        const context = await browser.newContext({
          baseURL,
          viewport: { width, height: 900 },
          colorScheme: theme,
          reducedMotion: "reduce",
        })
        await context.addCookies([{ name: "npf-consent", value: "denied", url: baseURL! }])
        await context.addInitScript((t) => {
          try { localStorage.setItem("theme", t) } catch {}
        }, theme)
        const page = await context.newPage()
        const failures: string[] = []
        for (const route of ROUTES) {
          await page.goto(`/${locale}${route}`, { waitUntil: "load" })
          await page.evaluate(async () => {
            for (let y = 0; y < document.documentElement.scrollHeight; y += 700) {
              scrollTo(0, y)
              await new Promise((r) => setTimeout(r, 40))
            }
            scrollTo(0, 0)
          })
          await page.waitForTimeout(250)
          const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()
          for (const v of results.violations) {
            failures.push(`${route || "/"} · ${v.id} (${v.impact}) ×${v.nodes.length}: ${v.nodes[0]?.target?.join(" ")} — ${v.nodes[0]?.failureSummary?.split("\n")[1] ?? ""}`)
          }
        }
        await context.close()
        expect(failures, failures.join("\n")).toEqual([])
      })
    }
  }
}
