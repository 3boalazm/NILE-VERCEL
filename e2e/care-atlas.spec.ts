import { expect, test } from "@playwright/test";
import { getCareAtlasCopy } from "../src/lib/i18n/care-atlas";

// The owner chose the zero-base atlas direction. These replace the rejected
// three-audience homepage contract, not commerce/security/recovery coverage.
for (const locale of ["ar", "en"] as const) {
  test(`${locale}: atlas keyboard selection opens the actual product file`, async ({
    page,
  }) => {
    await page.goto(`/${locale}/products`);
    const explorer = page.getByTestId("product-atlas");
    const rows = explorer.getByTestId("atlas-row");
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
    await explorer.getByTestId("atlas-file-links").locator("a").first().click();
    await expect(page).toHaveURL(`/${locale}/products/proxeed-women`);
    await expect(page.locator("h1")).toHaveText(
      locale === "ar" ? "بروكسيد نساء" : "Proxeed Women",
    );
  });
  test(`${locale}: atlas filters, Arabic search and empty-state recovery`, async ({
    page,
  }) => {
    const c = getCareAtlasCopy(locale);
    await page.goto(`/${locale}/products`);
    const explorer = page.getByTestId("product-atlas");
    await explorer
      .getByRole("button", { name: c.filterDevices, exact: true })
      .click();
    await expect(explorer.getByTestId("atlas-row")).toHaveCount(2);
    await expect(
      explorer.getByTestId("atlas-tabs").locator("button").first(),
    ).toHaveText(c.specifications);
    await explorer
      .getByRole("button", { name: c.filterAll, exact: true })
      .click();
    const search = explorer.getByTestId("atlas-search");
    await search.fill("بروكسيد بلس");
    await expect(explorer.getByTestId("atlas-row")).toHaveCount(1);
    await expect(explorer.locator("h3")).toHaveText("Proxeed Plus");
    await search.fill("no-match-zzzz");
    await expect(explorer.getByTestId("atlas-empty")).toBeVisible();
    await expect(explorer.getByTestId("atlas-stage")).toHaveCount(0);
    await search.clear();
    await expect(explorer.getByTestId("atlas-row")).toHaveCount(8);
    await expect(explorer.getByTestId("atlas-stage")).toBeVisible();
  });
  test(`${locale}: atlas uses genuine leaflets and verified inquiry context`, async ({
    page,
  }) => {
    const c = getCareAtlasCopy(locale);
    await page.goto(`/${locale}/products`);
    const explorer = page.getByTestId("product-atlas");
    await explorer
      .getByRole("button", { name: c.leaflet, exact: true })
      .click();
    await expect(explorer.getByTestId("atlas-pdf-link")).toHaveAttribute(
      "href",
      "/downloads/proxeed-plus-leaflet.pdf",
    );
    await explorer
      .getByRole("button", { name: c.filterDevices, exact: true })
      .click();
    await explorer
      .getByRole("button", { name: c.leaflet, exact: true })
      .click();
    await expect(explorer.getByTestId("atlas-detail")).toContainText(
      c.noLeaflet,
    );
    await expect(explorer.getByTestId("atlas-pdf-link")).toHaveCount(0);
    const name = await explorer.locator("h3").textContent();
    await explorer.getByTestId("atlas-file-links").locator("a").last().click();
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
  const plus = page.getByTestId("product-card").filter({
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
  await page.goto("/en/products");
  const links = page.getByTestId("atlas-noscript").locator("a");
  await expect(links).toHaveCount(8);
  await links.filter({ hasText: "Proxeed Women Inositol" }).click();
  await expect(page).toHaveURL(/\/en\/products\/proxeed-women-inositol$/);
  await expect(page.locator("h1")).toHaveText("Proxeed Women Inositol");
  await page.goto("/en/products");
  const catalogSearch = page.getByRole("search");
  await catalogSearch.getByRole("searchbox").fill("بروكسيد بلس");
  await catalogSearch.getByRole("button", { name: /Search/ }).click();
  await expect(page.getByTestId("product-card")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "Proxeed Plus", exact: true }),
  ).toBeVisible();
  await context.close();
});
