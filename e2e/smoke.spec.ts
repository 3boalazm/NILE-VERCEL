import { createConnection } from "node:net"

import { expect, test } from "@playwright/test"

import { getCareAtlasCopy } from "../src/lib/i18n/care-atlas";
import { dictionaries } from "../src/lib/i18n/dictionaries";

/**
 * No-Vendure smoke suite: homepage, catalog (seeded via `npm run seed`),
 * contact, terms, 404s, and locale routing. Runs in CI against a fresh
 * Postgres + `next start`. Anything touching cart/checkout/account lives
 * in commerce.spec.ts, which skips itself when Vendure is unreachable.
 */
const ar = dictionaries.ar;

/**
 * The contact test persists through Payload, i.e. it needs Postgres. On a
 * database-less machine (this sandbox) failing it would be noise — the form
 * correctly shows its error state when persistence is down — so the test
 * skips itself with a reason, exactly like commerce.spec.ts does for
 * Vendure. CI, which boots a Postgres service, runs it.
 */
async function postgresReachable(): Promise<boolean> {
  const uri = process.env.DATABASE_URI ?? "postgresql://localhost:5432"
  const match = uri.match(/@([^:/]+):(\d+)/)
  const host = match?.[1] ?? "127.0.0.1"
  const port = Number(match?.[2] ?? 5432)
  return new Promise((resolve) => {
    const socket = createConnection({ host, port })
    const done = (ok: boolean) => {
      socket.destroy()
      resolve(ok)
    }
    socket.setTimeout(1500)
    socket.once("connect", () => done(true))
    socket.once("timeout", () => done(false))
    socket.once("error", () => done(false))
  })
}

let dbUp = false
test.beforeAll(async () => {
  dbUp = await postgresReachable()
})

test("root redirects to the default locale", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/ar\/?$/);
});

test("unsupported locale redirects to the default locale", async ({ page }) => {
  await page.goto("/fr/products");
  await expect(page).toHaveURL("/ar/products");
});

test("arabic homepage renders RTL with hero actions", async ({ page }) => {
  await page.goto("/ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(
    page.getByRole("link", { name: getCareAtlasCopy("ar").heroCta }),
  ).toBeVisible();
  await expect(page.locator(".ca-hero-field-note")).toBeVisible();
});

test("english homepage renders LTR", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(
    page.getByRole("link", { name: getCareAtlasCopy("en").heroCta }),
  ).toBeVisible();
});

test("products listing shows the seeded catalog", async ({ page }) => {
  await page.goto("/ar/products");
  const cards = page.locator('a[href^="/ar/products/"]');
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeGreaterThan(0);
});

test("product detail page renders from the listing", async ({ page }) => {
  await page.goto("/ar/products");
  await page.locator('a[href^="/ar/products/"]').first().click();
  await expect(page).toHaveURL(/\/ar\/products\/.+/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("contact form reports the actual backend result", async ({ page }) => {
  test.skip(process.env.NPF_PREVIEW_MODE !== "1" && !dbUp, "Postgres unreachable — contact persistence (Payload) needs a database; see suite header")
  await page.goto("/ar/contact")
  await page.locator('input[name="name"]').fill("Playwright Smoke")
  await page.locator('input[name="email"]').fill("smoke@nilepharmafood.local")
  await page.locator('input[name="subject"]').fill("E2E smoke test — please ignore")
  await page.locator('textarea[name="message"]').fill("Automated smoke-test submission.")
  await page.getByRole("button", { name: ar.contact.formSubmit }).click()
  if (process.env.NPF_PREVIEW_MODE === "1") {
    // The design preview deliberately blocks persistence; do not fabricate success.
    await expect(page.getByRole("main").getByRole("alert")).toContainText("info@nilepharmafood.com")
    await expect(page.getByRole("status")).toHaveCount(0)
    return
  }
  await expect(page.getByRole("status")).toContainText(ar.contact.formSubmittedNotice)

  // F-60 — the submit goes through a fetch-based server action, not a
  // document POST, so a reload after success must land on a FRESH form
  // (nothing to resubmit, no browser "confirm resend" flow). If this ever
  // regresses into a form-POST design, this reload starts double-posting.
  await page.reload()
  await expect(page.locator('input[name="name"]')).toHaveValue("")
  await expect(page.getByRole("button", { name: ar.contact.formSubmit })).toBeEnabled()
})

test("terms page renders", async ({ page }) => {
  await page.goto("/ar/terms");
  await expect(
    page.getByRole("heading", { name: ar.terms.pageTitle }),
  ).toBeVisible();
});

test("unknown route shows the localized 404", async ({ page }) => {
  await page.goto("/ar/definitely-not-a-page");
  await expect(
    page.getByRole("heading", { name: ar.notFound.title }),
  ).toBeVisible();
});

test("design-lab prototypes are gone, not just gated", async ({ page }) => {
  // F-21: /lab/* used to ship as flag-gated prototype routes. They were
  // removed outright (their output lives on as src/components/npf/hero*.tsx),
  // so the URL must now 404 like any other unknown route — a gate that can be
  // flipped open in prod is not removal.
  await page.goto("/ar/lab/hero-abstract")
  await expect(page.getByRole("heading", { name: ar.notFound.title })).toBeVisible()
})
