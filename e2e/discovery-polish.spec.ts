import { expect, test } from "@playwright/test";
import { getDiscoveryCopy } from "../src/lib/i18n/discovery";

for (const locale of ["ar", "en"] as const) {
  test(`${locale}: Arabic diacritics work identically in catalog and atlas`, async ({
    page,
  }) => {
    await page.goto(
      `/${locale}/products?q=${encodeURIComponent("بُرُوكْسِيد بِلْس")}`,
    );
    await expect(page.getByTestId("product-card")).toHaveCount(1);
    await expect(page.getByTestId("product-card").locator("h2")).toHaveText(
      "Proxeed Plus",
    );
    await page.goto(`/${locale}/products`);
    const search = page.getByTestId("atlas-search");
    await search.fill("بِلْس بروكــسيد");
    await expect(page.getByTestId("atlas-row")).toHaveCount(1);
    await search.fill("no-match-zzzz");
    await expect(page.getByTestId("atlas-workspace")).toHaveAttribute(
      "data-empty",
      "true",
    );
    const workspace = await page.getByTestId("atlas-workspace").boundingBox();
    const index = await page.getByTestId("atlas-index").boundingBox();
    expect(index!.width).toBeGreaterThanOrEqual(workspace!.width - 4);
    await page
      .getByRole("button", {
        name: getDiscoveryCopy(locale).resetSearch,
        exact: true,
      })
      .click();
    await expect(page.getByTestId("atlas-row")).toHaveCount(8);
    await expect(search).toBeFocused();
    await search.fill("another-no-match-zzzz");
    await page
      .getByTestId("atlas-empty-actions")
      .getByRole("button", { name: getDiscoveryCopy(locale).all, exact: true })
      .click();
    await expect(page.getByTestId("atlas-row")).toHaveCount(8);
    await expect(search).toBeFocused();
  });

  test(`${locale}: removing one filter preserves the remaining context`, async ({
    page,
  }) => {
    await page.goto(
      `/${locale}/products?q=proxeed&category=supplements&need=mens-health&sort=desc`,
    );
    const filters = page.getByRole("navigation", {
      name: getDiscoveryCopy(locale).applied,
    });
    await expect(filters.getByRole("link")).toHaveCount(4);
    await filters
      .locator('a[href*="category=supplements"]')
      .filter({ hasText: "proxeed" })
      .click();
    await expect(page).toHaveURL((url) => !url.searchParams.has("q"));
    const query = new URL(page.url()).searchParams;
    expect(query.has("q")).toBe(false);
    expect(query.get("category")).toBe("supplements");
    expect(query.get("need")).toBe("mens-health");
    expect(query.get("sort")).toBe("desc");
    await expect(page.getByTestId("product-card")).toHaveCount(3);
  });

  test(`${locale}: no-results recovery neither invents products nor leaks search to contact`, async ({
    page,
  }) => {
    const copy = getDiscoveryCopy(locale);
    await page.goto(
      `/${locale}/products?q=no-match-private-query&category=medical-devices`,
    );
    await expect(page.getByTestId("product-card")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: copy.emptyTitle }),
    ).toBeVisible();
    const empty = page.getByTestId("catalog-empty");
    await expect(
      empty.getByRole("link", { name: copy.contact }),
    ).toHaveAttribute("href", `/${locale}/contact`);
    await empty.getByRole("link", { name: copy.browse }).click();
    await expect(page).toHaveURL(`/${locale}/products`);
    await expect(page.getByTestId("product-card")).toHaveCount(8);
    await page.goto(`/${locale}/products?category=not-a-real-category`);
    await expect(page.getByTestId("product-card")).toHaveCount(8);
    await expect(page.getByTestId("applied-filters")).toHaveCount(0);
  });

  test(`${locale}: mobile chapter links remain native and identify the current chapter`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${locale}/products/proxeed-plus`);
    const nav = page.getByRole("navigation", {
      name: getDiscoveryCopy(locale).reading,
    });
    expect(await page.evaluate(() => scrollY)).toBe(0);
    // Usage/composition/benefits stay hidden until the evidence workflow
    // approves them, so the leaflet chapter is the one every product has.
    await nav.locator('a[href="#downloads"]').click();
    await expect(page).toHaveURL(/#downloads$/);
    await expect(nav.locator('a[href="#downloads"]')).toHaveAttribute(
      "aria-current",
      "location",
    );
    // Ordinary reading, not a navigation click: keep the active tab in view
    // horizontally without moving the page vertically or taking focus.
    await page.evaluate(() =>
      document
        .getElementById("downloads")!
        .scrollIntoView({ block: "start", behavior: "instant" }),
    );
    await expect(nav.locator('a[href="#downloads"]')).toHaveAttribute(
      "aria-current",
      "location",
    );
    const activeBox = await nav
      .locator('a[aria-current="location"]')
      .boundingBox();
    const box = await nav.boundingBox();
    expect(activeBox!.x).toBeGreaterThanOrEqual(box!.x);
    expect(activeBox!.x + activeBox!.width).toBeLessThanOrEqual(
      box!.x + box!.width + 1,
    );
    expect(box!.y).toBeGreaterThanOrEqual(0);
    // The strip sticks just below the floating glass header (12px inset +
    // 64px bar), not at the very top of the viewport.
    expect(box!.y).toBeLessThan(120);
    await expect(page.locator("#downloads h2")).toBeVisible();
    const width = await page.evaluate(() => [
      innerWidth,
      document.documentElement.scrollWidth,
    ]);
    expect(width[0]).toBe(width[1]);
  });
}

test("no JavaScript: filter chips and product chapters still work", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto("/en/products?q=proxeed&category=supplements&sort=desc");
  await page
    .getByTestId("applied-filters").locator("a")
    .filter({ hasText: "proxeed" })
    .click();
  expect(new URL(page.url()).searchParams.has("q")).toBe(false);
  expect(new URL(page.url()).searchParams.get("category")).toBe("supplements");
  // Devices carry published specifications; supplements stay evidence-gated.
  await page.goto("/en/products/ca-mi-pulse-oximeter");
  await page.getByTestId("product-chapters").locator('a[href="#composition"]').click();
  await expect(page).toHaveURL(/#composition$/);
  await expect(page.locator("#composition h2")).toBeVisible();
  await context.close();
});
