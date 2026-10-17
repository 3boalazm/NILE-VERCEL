import { expect, test, type Locator, type Page } from "@playwright/test";

import { getCareAtlasCopy } from "../src/lib/i18n/care-atlas";

/**
 * P0 "content is never blank" suite from the UX audit.
 *
 * The old scroll-reveal shipped every section as `opacity: 0` and relied on
 * hydration + IntersectionObserver to show it. These tests pin the new
 * contract from components/npf/motion/reveal.tsx:
 *
 *   - the core homepage content (hero heading, product spotlight/cards,
 *     trust + quality section, contact CTA) is visible on first load and
 *     after scrolling;
 *   - it stays visible with JavaScript disabled, with a broken
 *     IntersectionObserver, when hydration never happens, and under
 *     prefers-reduced-motion;
 *   - nothing overflows horizontally at phone / tablet / desktop widths.
 *
 * Runs against the same server as smoke.spec.ts (no Vendure needed).
 */
const art = getCareAtlasCopy("ar");

type Target = (page: Page) => Locator;

/** Fully painted: rendered, opacity 1, not clipped away, non-zero box. */
async function expectPainted(page: Page, target: Target, index = 0) {
  const locator = target(page).nth(index);
  await locator.scrollIntoViewIfNeeded();
  await expect(locator).toBeVisible();
  await expect
    .poll(
      async () =>
        locator.evaluate((element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return {
            opacity: Number(style.opacity),
            visibility: style.visibility,
            clip: style.clipPath,
            hasArea: rect.width * rect.height > 0,
          };
        }),
      { message: `target #${index} should be painted` },
    )
    .toEqual({
      opacity: 1,
      visibility: "visible",
      clip: "none",
      hasArea: true,
    });
}

/** The blocks the audit requires to be visible: hero → products → trust/quality → CTA. */
const CORE: Record<string, Target> = {
  heroHeading: (page) => page.locator("h1"),
  atlasHeading: (page) => page.locator("#atlas-title"),
  selectedProduct: (page) => page.locator(".ca-product-overview h3"),
  perspectiveHeading: (page) => page.locator("#perspective-title"),
  source: (page) => page.locator(".ca-partner span"),
  readingHeading: (page) => page.locator("#care-reading-title"),
  readingQuestion: (page) => page.locator(".ca-reading summary"),
  ctaHeading: (page) => page.locator("#care-contact-title"),
  ctaLink: (page) => page.locator(".ca-contact-orbit"),
};

async function scrollThrough(page: Page) {
  const total = await page.evaluate(
    () => document.documentElement.scrollHeight,
  );
  const step = await page.evaluate(() => Math.floor(window.innerHeight * 0.75));
  for (let y = 0; y <= total; y += step) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(60);
  }
}

test.describe("homepage content is visible", () => {
  test("hero, atlas, source, reading and CTA are visible after load and after scroll", async ({
    page,
  }) => {
    await page.goto("/ar");

    // Above the fold, no scrolling needed.
    await expectPainted(page, CORE.heroHeading);
    await expect(page.getByRole("link", { name: art.heroCta })).toBeVisible();
    // The server HTML must not hide anything: no armed reveal may be hidden
    // for content that is already inside the first viewport.
    const hiddenInViewport = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll("[data-reveal]")).filter(
          (element) => {
            const rect = element.getBoundingClientRect();
            const inViewport = rect.top < window.innerHeight && rect.bottom > 0;
            return inViewport && Number(getComputedStyle(element).opacity) < 1;
          },
        ).length,
    );
    expect(hiddenInViewport).toBe(0);

    // Walk the page like a user, then every core block must be painted.
    await scrollThrough(page);
    for (const target of Object.values(CORE)) {
      await expectPainted(page, target);
    }

    // Jump back to the top: nothing re-hides.
    await page.evaluate(() => window.scrollTo(0, 0));
    await expectPainted(page, CORE.heroHeading);
    const stillHidden = await page.evaluate(
      () =>
        document.querySelectorAll("[data-reveal-armed]:not([data-revealed])")
          .length,
    );
    expect(stillHidden).toBe(0);
  });

  test("an instant jump to the bottom (End key / anchor) still reveals everything passed", async ({
    page,
  }) => {
    await page.goto("/ar");
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight),
    );
    await expectPainted(page, CORE.ctaHeading);
    await expectPainted(page, CORE.ctaLink);
    // Scroll back to the middle — sections passed during the jump are shown.
    await expectPainted(page, CORE.perspectiveHeading);
    await expectPainted(page, CORE.source);
  });

  test("the hero reading note reaches the knowledge chapter", async ({
    page,
  }) => {
    await page.goto("/ar");
    await page.locator(".ca-hero-field-note").click();
    await expect(page).toHaveURL(/#reading$/);
    await expectPainted(page, CORE.readingHeading);
    await expectPainted(page, CORE.readingQuestion, 2);
  });
});

test.describe("degraded environments", () => {
  test("JavaScript disabled: every section is visible", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/ar");
    expect(await page.locator("html.js").count()).toBe(0);
    for (const target of Object.values(CORE)) {
      await expectPainted(page, target);
    }
    // Real counter values are server-rendered, never "0" placeholders.
    await expect(page.locator("[data-count-target]").first()).not.toHaveText(
      /^0$/,
    );
    await context.close();
  });

  test("IntersectionObserver never fires: scroll fallback reveals content", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      // An observer that accepts targets but never reports intersections.
      class SilentObserver {
        readonly root = null;
        readonly rootMargin = "0px";
        readonly thresholds = [0];
        observe() {}
        unobserve() {}
        disconnect() {}
        takeRecords() {
          return [];
        }
      }
      Object.defineProperty(window, "IntersectionObserver", {
        value: SilentObserver,
        configurable: true,
      });
    });
    await page.goto("/ar");
    await expectPainted(page, CORE.heroHeading);
    await scrollThrough(page);
    for (const target of Object.values(CORE)) {
      await expectPainted(page, target);
    }
  });

  test("hydration never happens: the page is still fully visible", async ({
    page,
  }) => {
    // The inline head script still runs (so <html class="js"> is set), but
    // no React bundle ever arrives — nothing may be hidden, at any time.
    await page.route("**/_next/static/chunks/**", (route) => route.abort());
    await page.goto("/ar", { waitUntil: "domcontentloaded" });
    await expect(page.locator("html.js")).toHaveCount(1);
    for (const target of Object.values(CORE)) {
      await expectPainted(page, target);
    }
    const hidden = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll("[data-reveal]")).filter(
          (element) => Number(getComputedStyle(element).opacity) < 1,
        ).length,
    );
    expect(hidden).toBe(0);
  });

  test("slow hydration: above-the-fold content is painted before React runs", async ({
    page,
  }) => {
    // Hold every script for a while; the server HTML alone must show the
    // hero, and the first product content on the listing page, unhidden.
    await page.route("**/_next/static/chunks/**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      await route.continue();
    });
    await page.goto("/ar/products", { waitUntil: "domcontentloaded" });
    await expectPainted(page, (p) => p.locator("h1"));
    await expectPainted(page, (p) => p.locator('a[href^="/ar/products/"]'));
    const hidden = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll("[data-reveal]")).filter(
          (element) => Number(getComputedStyle(element).opacity) < 1,
        ).length,
    );
    expect(hidden).toBe(0);
  });

  test("prefers-reduced-motion: no entrance motion and nothing hidden", async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/ar");
    await page.waitForLoadState("networkidle");
    const report = await page.evaluate(() => {
      const revealed = Array.from(document.querySelectorAll("[data-reveal]"));
      return {
        hidden: revealed.filter(
          (element) => Number(getComputedStyle(element).opacity) < 1,
        ).length,
        transformed: revealed.filter(
          (element) => getComputedStyle(element).transform !== "none",
        ).length,
        animated: Array.from(
          document.querySelectorAll(".hero-enter, .page-enter"),
        ).filter(
          (element) =>
            getComputedStyle(element).animationName !== "none" &&
            getComputedStyle(element).animationDuration !== "0s",
        ).length,
      };
    });
    expect(report).toEqual({ hidden: 0, transformed: 0, animated: 0 });
    await expectPainted(page, CORE.heroHeading);
    await context.close();
  });
});

test.describe("layout integrity", () => {
  for (const [label, width, height] of [
    ["phone", 375, 812],
    ["tablet", 768, 1024],
    ["desktop", 1440, 900],
  ] as const) {
    test(`no horizontal overflow at ${label} (${width}px) in both locales`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      for (const path of ["/ar", "/en", "/ar/products", "/en/products"]) {
        await page.goto(path);
        await scrollThrough(page);
        const { scrollWidth, clientWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        expect(
          scrollWidth,
          `${path} overflows at ${width}px`,
        ).toBeLessThanOrEqual(clientWidth);
      }
    });
  }

  test("phone: primary interactive targets are at least 44×44", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/ar");
    await scrollThrough(page);
    const small = await page.evaluate(() => {
      const selectors = [
        "header button",
        "header a",
        "nav[aria-label] a[href]",
        "main button",
        'main a[class*="min-h-11"], main a[class*="size-11"], main a[class*="min-h-12"]',
      ];
      const seen = new Set<Element>();
      const offenders: string[] = [];
      for (const selector of selectors) {
        for (const element of document.querySelectorAll<HTMLElement>(
          selector,
        )) {
          if (seen.has(element)) continue;
          seen.add(element);
          const rect = element.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue; // hidden at this width
          if (rect.width < 44 || rect.height < 44) {
            offenders.push(
              `${element.tagName.toLowerCase()}[${element.getAttribute("aria-label") ?? element.textContent?.trim().slice(0, 30)}] ${Math.round(rect.width)}×${Math.round(rect.height)}`,
            );
          }
        }
      }
      return offenders;
    });
    expect(small, `targets under 44px: ${small.join(", ")}`).toEqual([]);
  });
});
