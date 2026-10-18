import { expect, test } from "@playwright/test";

// Motion / glass contracts of the Nile Glass shell (src/app/glass.css,
// components/glass/{header,hero-stage}.tsx).

for (const locale of ["ar", "en"]) {
  for (const width of [320, 390, 1440]) {
    test(`${locale}/${width}: one floating navigation, flagged when scrolled and restored at the top`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${locale}`);
      const header = page.locator("header.ng-header");
      await expect(header).toHaveCount(1);
      await expect(header).toHaveAttribute("data-scrolled", "false");
      await page.locator("#atlas-title").scrollIntoViewIfNeeded();
      await expect(header).toHaveAttribute("data-scrolled", "true");
      const rect = await header.locator(".ng-header-bar").boundingBox();
      expect(rect?.y).toBeGreaterThanOrEqual(0);
      expect(rect?.x).toBeGreaterThanOrEqual(0);
      expect((rect?.x ?? 0) + (rect?.width ?? 0)).toBeLessThanOrEqual(width);
      // The header stays pinned while the page scrolls.
      expect(
        await header.evaluate((el) => el.getBoundingClientRect().top),
      ).toBeLessThanOrEqual(1);
      const outside = await header.evaluate((el) => {
        const bounds = el
          .querySelector(".ng-header-bar")!
          .getBoundingClientRect();
        return [...el.querySelectorAll<HTMLElement>("a,button")]
          .filter((element) => {
            const r = element.getBoundingClientRect();
            return (
              r.width > 0 &&
              r.height > 0 &&
              (r.left < bounds.left - 0.5 || r.right > bounds.right + 0.5)
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
      await expect(header).toHaveAttribute("data-scrolled", "false");
    });
  }
}

test("hero stage animates an actual product change without a hidden initial slide", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/en");
  const heading = page.locator("#hero-title");
  await expect(heading).toBeVisible();
  await expect(heading).toHaveCSS("opacity", "1");
  const slides = page.locator(".ng-stage-slide");
  await expect(slides).not.toHaveCount(0);
  await expect(slides.first()).toHaveAttribute("data-active", "true");
  await expect(slides.first()).toHaveCSS("opacity", "1");
  const dot = page.getByRole("button", { name: "Proxeed Women", exact: true });
  await dot.click();
  await expect(dot).toHaveAttribute("aria-current", "true");
  await expect
    .poll(() =>
      slides.first().evaluate((el) => Number(getComputedStyle(el).opacity)),
    )
    .toBeLessThan(1);
  const incoming = slides.filter({ has: page.locator('img[alt="Proxeed Women"]') });
  await expect(incoming).toHaveAttribute("data-active", "true");
  await expect(incoming).toHaveCSS("opacity", "1");
  await expect(page.locator(".ng-stage-caption")).toContainText("Proxeed Women");
});

test("desktop primary action stays bounded on hover and remains a real link", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/en");
  const link = page.locator("#contact a.ng-btn-primary");
  await link.scrollIntoViewIfNeeded();
  await expect(link).toHaveAttribute("href", "/en/contact");
  await link.hover();
  await page.waitForTimeout(450);
  const translation = await link.evaluate((el) => {
    const m = new DOMMatrix(getComputedStyle(el).transform);
    return [m.m41, m.m42];
  });
  expect(translation.every((n) => Math.abs(n) <= 9)).toBe(true);
  await page.mouse.move(0, 0);
  await expect
    .poll(() =>
      link.evaluate((el) =>
        Math.abs(new DOMMatrix(getComputedStyle(el).transform).m42),
      ),
    )
    .toBeLessThan(0.1);
  await link.click();
  await expect(page).toHaveURL(/\/en\/contact$/);
});

test("reduced motion turns off entrances, stage rotation and hover movement", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en");
  await expect(page.locator(".ng-hero-copy h1")).toHaveCSS(
    "animation-name",
    "none",
  );
  const caption = page.locator(".ng-stage-caption");
  const before = await caption.innerText();
  await page.waitForTimeout(6000); // longer than the 5.2s rotation interval
  expect(await caption.innerText()).toBe(before);
  await page
    .getByRole("button", { name: "Proxeed Women", exact: true })
    .click();
  const incoming = page
    .locator(".ng-stage-slide")
    .filter({ has: page.locator('img[alt="Proxeed Women"]') });
  await expect(incoming).toHaveCSS("opacity", "1");
  await expect(incoming).toHaveCSS("transform", "none");
  const link = page.locator("#contact a.ng-btn-primary");
  await link.scrollIntoViewIfNeeded();
  await link.hover();
  await page.waitForTimeout(100);
  await expect(link).toHaveCSS("transform", "none");
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
  await expect(page.locator(".ng-header-bar")).toHaveCSS(
    "backdrop-filter",
    "none",
  );
  await expect(page.locator(".ng-chip-float").first()).toHaveCSS(
    "backdrop-filter",
    "none",
  );
  const utilityBlur = await page.evaluate(() => {
    const probe = document.createElement("div");
    probe.className = "backdrop-blur-sm";
    document.body.append(probe);
    const value = getComputedStyle(probe).backdropFilter;
    probe.remove();
    return value;
  });
  expect(utilityBlur).toBe("none");
  const surfaces = await page.evaluate(() => {
    return ["--card", "--secondary", "--popover", "--muted"].map((token) => {
      const probe = document.createElement("div");
      probe.style.backgroundColor = `var(${token})`;
      document.body.append(probe);
      const value = getComputedStyle(probe).backgroundColor;
      probe.remove();
      const match = value.match(/rgba?\(([^)]+)\)/i);
      if (!match) {
        const alpha = value.match(/\/\s*([\d.]+)\s*\)$/)?.[1];
        return { token, value, alpha: Number(alpha ?? 1) };
      }
      const channels = match[1].split(/[\s,/]+/).filter(Boolean);
      return {
        token,
        value,
        alpha: channels.length === 4 ? Number(channels[3]) : 1,
      };
    });
  });
  // Legacy shadcn/Tailwind surfaces share the glass tokens and become opaque
  // or near-opaque when transparency is reduced.
  for (const surface of surfaces) {
    expect(surface.alpha, `${surface.token}: ${surface.value}`).toBeGreaterThanOrEqual(0.95);
  }

  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await expect(page.locator(".ng-header-bar")).toHaveCSS(
    "backdrop-filter",
    "none",
  );
  const darkCard = await page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.backgroundColor = "var(--card)";
    document.body.append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  });
  const darkAlpha = darkCard.match(/rgba?\(([^)]+)\)/i)?.[1]
    .split(/[\s,/]+/)
    .filter(Boolean);
  expect(darkAlpha?.length === 4 ? Number(darkAlpha[3]) : 1).toBeGreaterThanOrEqual(0.95);
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
  const link = page.locator("#contact a.ng-btn-primary");
  await link.scrollIntoViewIfNeeded();
  await expect(link).toHaveCSS("transform", "none");
  await link.tap();
  await expect(page).toHaveURL(/\/en\/contact$/);
  await context.close();
});
