import { expect, test } from "@playwright/test";

for (const locale of ["ar", "en"]) {
  test(`${locale}: the header displays only the original mark and keeps an accessible home link`, async ({
    page,
  }) => {
    await page.goto(`/${locale}`);
    const brand = page.locator("header .ca-brand");
    await expect(brand).toHaveText("");
    await expect(brand).toHaveAttribute("aria-label", /.+/);
    await expect(brand).toHaveAttribute("href", `/${locale}`);
    await expect(brand.locator("img")).toHaveAttribute(
      "src",
      "/npf-mark-white.svg",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("header .ca-menu-button").click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.locator('[data-slot="sheet-title"] img'),
    ).toHaveAttribute("src", "/npf-mark-white.svg");
    await expect(
      dialog.locator('[data-slot="sheet-title"] .sr-only'),
    ).toHaveText(/.+/);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
  test(`${locale}: all editorial placements load and disclose that they are illustrations`, async ({
    page,
  }) => {
    for (const [route, file] of [
      ["about", "about-garden"],
      ["story", "story-courtyard"],
      ["quality-sourcing", "quality-materials"],
      ["contact", "contact-conversation"],
      ["careers", "contact-conversation"],
    ]) {
      await page.goto(`/${locale}/${route}`);
      const visual = page.locator(".ca-editorial-visual");
      await visual.scrollIntoViewIfNeeded();
      const image = visual.locator("img");
      await expect(image).toHaveAttribute("alt", /.+/);
      await expect
        .poll(() =>
          image.evaluate(
            (el: HTMLImageElement) => el.complete && el.naturalWidth > 0,
          ),
        )
        .toBe(true);
      expect(
        await image.evaluate((el: HTMLImageElement) => el.currentSrc),
      ).toContain(file);
      await expect(visual.locator("figcaption")).toContainText(
        locale === "ar" ? "مولّد" : "AI-generated",
      );
      await expect(page.locator('main img[src*="exhibition-"]')).toHaveCount(0);
    }
  });
}
