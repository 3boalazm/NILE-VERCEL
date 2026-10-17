import { expect, test } from "@playwright/test";
import { getCareAtlasCopy } from "../src/lib/i18n/care-atlas";

// The owner chose the zero-base atlas direction. These replace the rejected
// three-audience homepage contract, not commerce/security/recovery coverage.
for (const locale of ["ar", "en"] as const) {
  test(`${locale}: atlas keyboard selection opens the actual product file`, async ({
    page,
  }) => {
    await page.goto(`/${locale}`);
    const explorer = page.locator(".ca-product-explorer");
    const rows = explorer.locator(".ca-product-row");
    const names = await rows.locator("strong").allTextContents();
    const plus = rows.filter({
      has: page.getByText("Proxeed Plus", { exact: true }),
    });
    await plus.focus();
    await page.keyboard.press("ArrowDown");
    const next = names[(names.indexOf("Proxeed Plus") + 1) % names.length];
    await expect(explorer.locator("h3")).toHaveText(next);
    await expect(
      rows.filter({ has: page.getByText(next, { exact: true }) }),
    ).toBeFocused();
    const women = rows.filter({
      has: page.getByText("Proxeed Women", { exact: true }),
    });
    await women.click();
    await expect(women).toHaveAttribute("aria-pressed", "true");
    await expect(plus).toHaveAttribute("aria-pressed", "false");
    await explorer.locator(".ca-file-links a").first().click();
    await expect(page).toHaveURL(`/${locale}/products/proxeed-women`);
    await expect(page.locator("h1")).toHaveText(
      locale === "ar" ? "بروكسيد نساء" : "Proxeed Women",
    );
  });
  test(`${locale}: atlas filters, Arabic search and empty-state recovery`, async ({
    page,
  }) => {
    const c = getCareAtlasCopy(locale);
    await page.goto(`/${locale}`);
    const explorer = page.locator(".ca-product-explorer");
    await explorer
      .getByRole("button", { name: c.filterDevices, exact: true })
      .click();
    await expect(explorer.locator(".ca-product-row")).toHaveCount(2);
    await expect(
      explorer.locator(".ca-product-tabs button").first(),
    ).toHaveText(c.specifications);
    await explorer
      .getByRole("button", { name: c.filterAll, exact: true })
      .click();
    const search = explorer.getByRole("searchbox");
    await search.fill("بروكسيد بلس");
    await expect(explorer.locator(".ca-product-row")).toHaveCount(1);
    await expect(explorer.locator("h3")).toHaveText("Proxeed Plus");
    await search.fill("no-match-zzzz");
    await expect(explorer.locator(".ca-empty")).toBeVisible();
    await expect(explorer.locator(".ca-product-stage")).toHaveCount(0);
    await search.clear();
    await expect(explorer.locator(".ca-product-row")).toHaveCount(8);
    await expect(explorer.locator(".ca-product-stage")).toBeVisible();
  });
  test(`${locale}: atlas uses genuine leaflets and verified inquiry context`, async ({
    page,
  }) => {
    const c = getCareAtlasCopy(locale);
    await page.goto(`/${locale}`);
    const explorer = page.locator(".ca-product-explorer");
    await explorer
      .getByRole("button", { name: c.leaflet, exact: true })
      .click();
    await expect(explorer.locator(".ca-pdf-link")).toHaveAttribute(
      "href",
      "/downloads/proxeed-plus-leaflet.pdf",
    );
    await explorer
      .getByRole("button", { name: c.filterDevices, exact: true })
      .click();
    await explorer
      .getByRole("button", { name: c.leaflet, exact: true })
      .click();
    await expect(explorer.locator(".ca-product-detail")).toContainText(
      c.noLeaflet,
    );
    await expect(explorer.locator(".ca-pdf-link")).toHaveCount(0);
    const name = await explorer.locator("h3").textContent();
    await explorer.locator(".ca-file-links a").last().click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/contact\\?product=`));
    await expect(page.locator('input[name="subject"]')).toHaveValue(
      `${locale === "ar" ? "استفسار عن المنتج" : "Product inquiry"}: ${name}`,
    );
  });
}

test("saved products survive navigation and can be removed again", async ({
  page,
}) => {
  await page.goto("/en/products");
  const plus = page.locator(".ca-catalog-card").filter({
    has: page.getByRole("heading", { name: "Proxeed Plus", exact: true }),
  });
  await plus
    .getByRole("button", { name: "Add to Wishlist", exact: true })
    .click();
  await expect(
    plus.getByRole("button", { name: "Remove from Wishlist", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goto("/en/wishlist");
  await expect(page.locator("h1")).toHaveText("Wishlist");
  await expect(
    page.getByRole("heading", { name: "Proxeed Plus", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Remove from Wishlist", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Proxeed Plus", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Your wishlist is empty", exact: true }),
  ).toBeVisible();
});

test("no JavaScript: all eight actual product files remain reachable", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  const page = await context.newPage();
  await page.goto("/en");
  const links = page.locator(".ca-noscript-note a");
  await expect(links).toHaveCount(8);
  await links.filter({ hasText: "Proxeed Women Inositol" }).click();
  await expect(page).toHaveURL(/\/en\/products\/proxeed-women-inositol$/);
  await expect(page.locator("h1")).toHaveText("Proxeed Women Inositol");
  await page.goto("/en/products");
  await page.getByRole("searchbox").fill("بروكسيد بلس");
  await page.getByRole("button", { name: /Search/ }).click();
  await expect(page.locator(".ca-catalog-card")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "Proxeed Plus", exact: true }),
  ).toBeVisible();
  await context.close();
});
