import { expect, test } from "@playwright/test";

for (const locale of ["ar", "en"]) {
  for (const width of [320, 390, 1440]) {
    test(`${locale}/${width}: one navigation docks after the hero and restores at the top`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${locale}`);
      await expect(page.locator("header")).not.toHaveClass(/ca-header-float/);
      await page.locator("#atlas-title").scrollIntoViewIfNeeded();
      await expect(page.locator("header")).toHaveClass(/ca-header-float/);
      await expect(page.locator("header")).toHaveCount(1);
      const rect = await page.locator("header").boundingBox();
      expect(rect?.y).toBeGreaterThanOrEqual(0);
      expect((rect?.x ?? 0) + (rect?.width ?? 0)).toBeLessThanOrEqual(width);
      const outside = await page.locator("header").evaluate((header) => {
        const bounds = header.getBoundingClientRect();
        return [...header.querySelectorAll<HTMLElement>("a,button")]
          .filter((element) => {
            const r = element.getBoundingClientRect();
            return (
              r.width > 0 &&
              r.height > 0 &&
              (r.left < bounds.left || r.right > bounds.right)
            );
          })
          .map(
            (element) =>
              element.getAttribute("aria-label") || element.textContent,
          );
      });
      expect(outside).toEqual([]);

      await page.evaluate(() =>
        window.scrollTo({ top: 0, behavior: "instant" }),
      );
      await expect(page.locator("header")).not.toHaveClass(/ca-header-float/);
    });
  }
}

test("atlas animates an actual product change without a hidden initial stage", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/en");
  const image = page.locator(".ca-stage-art img");
  await expect(image).toHaveCSS("opacity", "1");
  const row = page
    .locator(".ca-product-row")
    .filter({ has: page.getByText("Proxeed Women", { exact: true }) });
  await row.click();
  await expect
    .poll(() => image.evaluate((el) => Number(getComputedStyle(el).opacity)))
    .toBeLessThan(1);
  await expect(image).toHaveCSS("opacity", "1");
  await expect(row).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".ca-product-overview h3")).toHaveText(
    "Proxeed Women",
  );
});

test("desktop magnetic link is bounded, resets, and remains a real link", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/en");
  const link = page.locator("[data-ca-magnetic]");
  await link.scrollIntoViewIfNeeded();
  await expect(link).toHaveAttribute("href", "/en/contact");
  // Test inside the circular hit area, not its transparent square corners.
  const bounds = await link.boundingBox();
  await link.hover({
    position: { x: bounds!.width * 0.3, y: bounds!.height * 0.3 },
  });
  await expect
    .poll(() => link.evaluate((el) => getComputedStyle(el).transform))
    .not.toBe("none");
  const translation = await link.evaluate((el) => {
    const m = new DOMMatrix(getComputedStyle(el).transform);
    return [m.m41, m.m42];
  });
  expect(translation.every((n) => Math.abs(n) <= 9)).toBe(true);
  await page.mouse.move(0, 0);
  await expect
    .poll(() =>
      link.evaluate((el) =>
        Math.abs(new DOMMatrix(getComputedStyle(el).transform).m41),
      ),
    )
    .toBeLessThan(0.1);
  await link.click();
  await expect(page).toHaveURL(/\/en\/contact$/);
});

test("reduced motion turns off entrances, magnetic movement and product-change animation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en");
  await page
    .locator(".ca-product-row")
    .filter({ has: page.getByText("Proxeed Women", { exact: true }) })
    .click();
  await expect(page.locator(".ca-stage-art img")).toHaveCSS("opacity", "1");
  await expect(page.locator(".ca-stage-art img")).toHaveCSS(
    "transform",
    "none",
  );
  const link = page.locator("[data-ca-magnetic]");
  // Test inside the circular hit area, not its transparent square corners.
  const bounds = await link.boundingBox();
  await link.hover({
    position: { x: bounds!.width * 0.3, y: bounds!.height * 0.3 },
  });
  await expect(link).toHaveCSS("transform", "none");
  await expect(page.locator(".ca-hero-copy h1")).toHaveCSS(
    "animation-name",
    "none",
  );
});

test("reduced transparency supplies opaque glass fallbacks", async ({
  page,
  context,
}) => {
  const session = await context.newCDPSession(page);
  await session.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-transparency", value: "reduce" }],
  });
  await page.goto("/en");
  await expect(page.locator(".ca-desktop-nav")).toHaveCSS(
    "backdrop-filter",
    "none",
  );
  await expect(page.locator(".ca-hero-field-note")).toHaveCSS(
    "background-color",
    "rgb(24, 51, 68)",
  );
});

test("touch devices keep the call-to-action stationary", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  await page.goto("/en");
  const link = page.locator("[data-ca-magnetic]");
  await link.scrollIntoViewIfNeeded();
  await expect(link).toHaveCSS("transform", "none");
  await link.tap();
  await expect(page).toHaveURL(/\/en\/contact$/);
  await context.close();
});
