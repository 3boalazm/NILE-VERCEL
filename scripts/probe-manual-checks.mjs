#!/usr/bin/env node
/**
 * NPF — Browser probe for the MANUAL checks  (probe-manual-checks.mjs)
 * --------------------------------------------------------------------
 * `scripts/verify-fixes.mjs` answers the ~48 defects that can be settled from
 * source scans and HTTP responses. A few wave-1 items can only be proven in a
 * real browser, and the register leaves them as MANUAL:
 *
 *   F-02b  induce a render error -> styled error page with retry
 *          (not a browser dead-end / chrome-error://)
 *   F-34   skip link is the FIRST focusable element, and activating it moves
 *          focus into the main region (the static check can only prove markup
 *          order, not focus behaviour)
 *   F-64   submit while the connection is down -> visible message + retryable
 *          control (not a stuck spinner and a disabled button)
 *   F-73   unknown URL with JavaScript DISABLED -> real 404 + branded copy
 *   F-18/70 consent banner gates analytics: nothing third-party pre-consent,
 *          cookie + bootstrap + queued view_item post-consent (when a
 *          measurement id is built in; inert loader is also a pass)
 *   F-25   the listing's sort control actually re-orders results
 *   F-59   the show-password toggle flips the input type
 *   F-62   header nav marks the active item with aria-current
 *   F-19   the register strength meter appears and scores a strong password
 *   F-33   the served manifest really contains a maskable icon
 *   F-67   the image optimizer really negotiates AVIF
 *   F-12   the home hero CTA renders as a native <a href> (real navigation,
 *          works with JS disabled — not a router-driven div)
 *   F-14   the service worker ships the offline document fallback AND the
 *          /offline target itself answers 200 (full offline proof needs a
 *          browser SW round-trip; e2e covers registration)
 *   F-54   malformed product slugs (quotes, traversal, SQL) answer 404 at the
 *          edge — never a 500 leaking out of the database layer
 *   F-40   mobile LCP/CLS measured in the real browser (thresholds 2.5s/0.1)
 *   F-43/47/48/08/16 (wave 4): asset cache headers + SW no-cache; admin
 *          de-indexed (X-Robots-Tag + robots.txt); trailing-slash/canonical
 *          collapse; single-hop hash redirect; real hero copy
 *   F-35/36/38 axe rules on 5 pages: color-contrast, heading-order, tab aria
 *          structure, landmark uniqueness — 0 violations
 *
 * Usage:
 *   node scripts/probe-manual-checks.mjs                 # http://localhost:3000
 *   node scripts/probe-manual-checks.mjs http://localhost:3000
 *
 * Browser: uses the `@sparticuz/chromium` binary already vendored in
 * node_modules, because `npx playwright install` cannot reach
 * storage.googleapis.com from this environment. That binary needs the NSS/NSPR
 * libraries shipped alongside it in `bin/al2023.tar.br`; they are extracted to
 * /tmp/al2023 on first run (see prepareBrowser) and passed via LD_LIBRARY_PATH.
 *
 * Exit code: 0 = every probe passed · 1 = at least one failed.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { brotliDecompressSync } from "node:zlib";

const BASE = (process.argv[2] || process.env.BASE_URL || "http://localhost:3000").replace(/\/+$/, "");

const results = [];
const record = (id, ok, note) => results.push({ id, ok, note });

// ---------------------------------------------------------------- browser setup
/**
 * Resolves a runnable Chromium, extracting the vendored NSS/NSPR libraries the
 * first time. Returns `{ executablePath, env }` or throws with the reason —
 * a probe that silently skipped would be worse than one that failed loudly.
 */
async function prepareBrowser() {
  const sparticuz = (await import("@sparticuz/chromium")).default;
  const executablePath = await sparticuz.executablePath();

  const libDir = join(tmpdir(), "al2023", "lib");
  if (!existsSync(join(libDir, "libnss3.so"))) {
    // The package only auto-extracts these on Amazon Linux 2023; everywhere
    // else the binary fails to load with "libnspr4.so: cannot open shared
    // object file". Decompress the vendored brotli tarball ourselves.
    const binDir = join(process.cwd(), "node_modules/@sparticuz/chromium/bin");
    const tarPath = join(tmpdir(), "al2023.tar");
    mkdirSync(join(tmpdir(), "al2023"), { recursive: true });
    writeFileSync(tarPath, brotliDecompressSync(readFileSync(join(binDir, "al2023.tar.br"))));
    execFileSync("tar", ["-xf", tarPath, "-C", join(tmpdir(), "al2023")]);
  }

  return {
    executablePath,
    env: {
      ...process.env,
      LD_LIBRARY_PATH: [libDir, tmpdir(), process.env.LD_LIBRARY_PATH].filter(Boolean).join(":"),
    },
  };
}

const { chromium } = await import("playwright-core");
const browserSpec = await prepareBrowser();
const browser = await chromium.launch({
  executablePath: browserSpec.executablePath,
  env: browserSpec.env,
  args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
});

console.log(`NPF MANUAL-CHECK BROWSER PROBE — ${new Date().toISOString()}`);
console.log(`Base: ${BASE}  ·  Chromium: ${browserSpec.executablePath}`);
console.log("=".repeat(78));

// ---------------------------------------------------------------- F-34 focus order
{
  const page = await browser.newPage({ locale: "ar" });
  await page.goto(`${BASE}/ar`, { waitUntil: "domcontentloaded" });

  // A fresh document must place focus on the skip link after ONE Tab press —
  // that is the whole point of the control, and it is not provable from HTML.
  await page.keyboard.press("Tab");
  const first = await page.evaluate(() => {
    const el = document.activeElement;
    return el ? { tag: el.tagName, href: el.getAttribute("href"), text: el.textContent?.trim() } : null;
  });
  const isSkip = first?.tag === "A" && first?.href === "#main-content";

  // Activating it must move focus to the main region, not leave it on the link.
  await page.keyboard.press("Enter");
  const after = await page.evaluate(() => {
    const el = document.activeElement;
    return el ? { id: el.id, tag: el.tagName } : null;
  });
  const focusMoved = after?.id === "main-content";

  record(
    "F-34",
    isSkip && focusMoved,
    `first Tab -> <${first?.tag} href="${first?.href}"> "${first?.text}" · Enter -> focus #${after?.id ?? "(none)"}`
  );
  await page.close();
}

// ---------------------------------------------------------------- F-02b render error
{
  const page = await browser.newPage({ locale: "ar" });
  // RECALIBRATED (F-48 precedent). The original vehicle — /admin failing to
  // render because Payload cannot reach Postgres — only exists when the CMS
  // database is down; with the real DB stack healthy, /admin serves the real
  // Payload admin (HTTP 200), so the old premise never fires and the check
  // would fail on a HEALTHY deployment. The recalibrated vehicle reproduces
  // the same failure CLASS deterministically in ANY environment: sabotage the
  // RSC payload (and route chunks) of the next route, then client-navigate
  // into it — exactly what users hit on a bad deploy / corrupted CDN asset /
  // mid-deploy navigation. The styled boundary must appear with a working
  // recovery control, and recovery must actually land on the page.
  await page.goto(`${BASE}/ar`, { waitUntil: "load" });
  let sabotaged = 0;
  await page.route("**/_rsc*", (route) => {
    sabotaged += 1;
    return route.abort("failed");
  });
  await page.route(/\/_next\/static\/chunks\/app\/%5Blocale%5D\/products/, (route) => {
    sabotaged += 1;
    return route.abort("failed");
  });
  await page.click('a[href="/ar/products"]');

  let text = "";
  try {
    await page.waitForFunction(
      () => /حصل خطأ|خطأ غير متوقع|Something went wrong|Application error/i.test(document.body?.innerText ?? ""),
      undefined,
      { timeout: 15000 }
    );
    text = await page.evaluate(() => document.body?.innerText ?? "");
  } catch {
    text = await page.evaluate(() => document.body?.innerText ?? "").catch(() => "");
  }

  const styledBoundary = /حصل خطأ|خطأ غير متوقع|Something went wrong/i.test(text);
  const hasRecovery = /إعادة المحاولة|إعادة تحميل|Try again|Reload page/i.test(text);
  const deadEnd = !text.trim() || /chrome-error/i.test(page.url());
  const url = page.url();

  // Recovery must actually recover: lift the sabotage, hit the boundary's
  // retry control, and land back on the products listing.
  let recovered = false;
  await page.unrouteAll({ behavior: "ignoreErrors" });
  const retry = page.getByRole("button", { name: /إعادة المحاولة|Try again|إعادة تحميل|Reload page/i }).first();
  if ((await retry.count()) > 0) {
    await retry.click();
    recovered = await page
      .waitForURL(/\/ar\/products/, { timeout: 15000 })
      .then(() => true)
      .catch(() => false);
  }

  record(
    "F-02b",
    styledBoundary && hasRecovery && !deadEnd && recovered,
    `sabotaged-requests=${sabotaged} · boundary-at=${url} · styled-boundary=${styledBoundary} · recovery-control=${hasRecovery} · retry-lands-on-page=${recovered}`
  );
  if (!styledBoundary || !recovered) console.log(`         body text was: ${JSON.stringify(text.slice(0, 160))}`);
  await page.close();
}

// ---------------------------------------------------------------- F-64 offline submit
async function offlineSubmitProbe(label, path, fill, submitSelector, expectedText) {
  const context = await browser.newContext({ locale: "ar" });
  const page = await context.newPage();
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });

  for (const [selector, value] of fill) await page.fill(selector, value);

  // Cut the connection BEFORE submitting: the server action's POST then fails
  // in the browser, which is exactly the case a server-side try/catch cannot
  // report (the action never runs).
  await context.setOffline(true);
  await page.click(submitSelector);

  let sawMessage = false;
  try {
    await page.waitForSelector(`text=${expectedText}`, { timeout: 15000 });
    sawMessage = true;
  } catch {
    /* asserted below */
  }

  // The control must come back: a permanently disabled button is the
  // "silent dead-end" half of the defect.
  const retryable = await page
    .evaluate((sel) => {
      const el = document.querySelector(sel);
      return el ? !el.disabled : null;
    }, submitSelector)
    .catch(() => null);

  const alertVisible = await page
    .evaluate(() => Boolean(document.querySelector('[role="alert"]')?.textContent?.trim()))
    .catch(() => false);

  await context.setOffline(false);
  await context.close();

  record(
    `F-64 ${label}`,
    sawMessage && retryable === true && alertVisible,
    `message-shown=${sawMessage} · control re-enabled=${retryable} · role=alert present=${alertVisible}`
  );
}

await offlineSubmitProbe(
  "login",
  "/ar/login",
  [
    ["#email", "offline-probe@nilepharmafood.local"],
    ["#password", "Passw0rd!"],
  ],
  'button[type="submit"]',
  "انقطع الاتصال بالإنترنت"
);

await offlineSubmitProbe(
  "forgot-password",
  "/ar/login/forgot-password",
  [["#email", "offline-probe@nilepharmafood.local"]],
  'button[type="submit"]',
  "انقطع الاتصال بالإنترنت"
);

await offlineSubmitProbe(
  "contact",
  "/ar/contact",
  [
    ["#name", "Offline Probe"],
    ["#email", "offline-probe@nilepharmafood.local"],
    ["#subject", "Offline probe"],
    ["#message", "This submission is made with the network disconnected to prove F-64."],
  ],
  'button[type="submit"]',
  "انقطع الاتصال بالإنترنت"
);

// ---------------------------------------------------------------- F-11 CSP must not break the app
// A Content-Security-Policy that blocks something the site legitimately does
// is worse than no policy: it fails silently for the deployer and visibly for
// the customer. next.config.ts now ships one, scoped storefront vs admin, so
// this probe loads both surfaces and fails on ANY violation. Chromium reports
// blocks as console errors; the `securitypolicyviolation` DOM event adds the
// directive and blocked URI, which is what makes a failure diagnosable from CI
// output alone. Note that the sandbox has no route to google.com, so the
// contact page's map iframe cannot actually render — that is fine and is not
// what is asserted here: a *network* failure is distinguishable from a
// *policy* failure, and only the latter fails this probe.
{
  const routes = [
    "/ar",
    "/ar/products",
    "/ar/products/proxeed-plus",
    "/ar/contact",
    "/ar/login",
    "/ar/register",
    "/ar/cart",
    "/admin",
  ];
  const context = await browser.newContext({ locale: "ar" });
  const page = await context.newPage();
  const violations = [];

  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      window.__cspViolations.push({
        directive: event.violatedDirective,
        blocked: event.blockedURI,
        source: (event.sourceFile || "").split("/").slice(-2).join("/"),
      });
    });
  });
  page.on("console", (message) => {
    const text = message.text();
    if (/Content Security Policy|Refused to (load|execute|frame|connect|apply|evaluate)/i.test(text)) {
      violations.push(`console: ${text.slice(0, 180)}`);
    }
  });

  const visited = [];
  for (const route of routes) {
    const response = await page.goto(BASE + route, { waitUntil: "domcontentloaded" }).catch(() => null);
    // Give inline bootstraps, hydration and the map iframe time to be judged
    // by the policy before reading the violation list.
    await page.waitForTimeout(900);
    const seen = await page.evaluate(() => window.__cspViolations ?? []).catch(() => []);
    for (const v of seen) violations.push(`${route}: ${v.directive} blocked ${v.blocked} (${v.source})`);
    const csp = response?.headers()?.["content-security-policy"] ?? "(none)";
    visited.push(`${route}->${response?.status() ?? "?"}${csp === "(none)" ? " NO-CSP!" : ""}`);
    if (csp === "(none)") violations.push(`${route}: no Content-Security-Policy header at all`);
  }

  const unique = [...new Set(violations)];
  record(
    "F-11 CSP",
    unique.length === 0,
    unique.length
      ? `${unique.length} violation(s): ${unique.slice(0, 3).join(" | ")}`
      : `${routes.length} routes loaded, 0 policy violations (${visited.slice(0, 3).join(", ")}, …)`
  );
  if (unique.length) for (const v of unique.slice(0, 8)) console.log(`         violation: ${v}`);
  await context.close();
}

// ---------------------------------------------------------------- F-11 storefront vs admin policies differ
{
  const [storefront, admin] = await Promise.all([
    fetch(`${BASE}/ar`).then((r) => r.headers.get("content-security-policy") ?? ""),
    fetch(`${BASE}/admin`).then((r) => r.headers.get("content-security-policy") ?? ""),
  ]);
  // Compare the script-src *directive*, not the whole header: `blob:` also
  // appears legitimately in the storefront's img-src and worker-src, so a
  // substring test over the full policy would report a false difference (it
  // did — this assertion was wrong before it was right).
  const scriptSrc = (header) => header.match(/script-src[^;]*/)?.[0] ?? "";
  const storefrontScript = scriptSrc(storefront);
  const adminScript = scriptSrc(admin);
  const checks = {
    "storefront has a policy": Boolean(storefront),
    "admin has a policy": Boolean(admin),
    "object-src 'none'": storefront.includes("object-src 'none'"),
    "frame-ancestors 'self'": storefront.includes("frame-ancestors 'self'"),
    "only Maps may be framed": storefront.includes("frame-src 'self' https://maps.google.com"),
    "admin script-src allows blob:": adminScript.includes("blob:"),
    "storefront script-src does not": !storefrontScript.includes("blob:"),
  };
  const failedChecks = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
  record(
    "F-11 scoping",
    failedChecks.length === 0,
    failedChecks.length
      ? `failed: ${failedChecks.join(", ")}`
      : `${Object.keys(checks).length} scoping assertions hold · storefront script-src="${storefrontScript.replace("script-src ", "")}"`
  );
}

// ---------------------------------------------------------------- F-73/F-46 JS-free 404
// The whole point of global-not-found.tsx: with scripting disabled (curl,
// crawlers on a budget, corporate proxies) an unknown URL must still return a
// real 404 WITH the branded document — not the empty __next_error__ shell the
// default fallback produced.
{
  const context = await browser.newContext({ javaScriptEnabled: false, locale: "ar" });
  const page = await context.newPage();
  const response = await page.goto(`${BASE}/ar/definitely-not-a-page`, { waitUntil: "domcontentloaded" });
  const body = await page.content();
  const status = response?.status() ?? 0;
  const branded = body.includes("الصفحة غير موجودة") && body.includes("404");
  const notEmptyShell = !/id="__next_error__"><\/div><body hidden/.test(body.replace(/\s/g, ""));
  record(
    "F-73 no-JS 404",
    status === 404 && branded && notEmptyShell,
    `status=${status} · branded-copy=${branded} · not-empty-shell=${notEmptyShell}`
  );
  await context.close();
}

// ---------------------------------------------------------------- F-18/F-70 consent gate
// Before consent: banner visible, zero third-party analytics scripts.
// After Accept: banner gone, npf-consent=granted cookie set. If the build has
// NEXT_PUBLIC_GA_ID (the sandbox probe build does), the bootstrap + remote
// script appear and the PDP queues view_item onto dataLayer; without an id the
// loader must stay inert, which is also a pass.
{
  const context = await browser.newContext({ locale: "ar" });
  const page = await context.newPage();
  await page.goto(`${BASE}/ar`, { waitUntil: "domcontentloaded" });
  const bannerBefore = await page.locator('[role="region"][aria-labelledby="consent-title"]').isVisible().catch(() => false);
  const gtagBefore = await page.locator('script[src*="googletagmanager"]').count();
  let accepted = false;
  try {
    await page.getByRole("button", { name: "موافق" }).click({ timeout: 5000 });
    accepted = true;
  } catch { /* asserted below */ }
  await page.waitForTimeout(600);
  const bannerAfter = await page.locator('[role="region"][aria-labelledby="consent-title"]').isVisible().catch(() => false);
  const cookie = await context.cookies();
  const consentCookie = cookie.find((c) => c.name === "npf-consent")?.value ?? "(none)";
  const bootstrap = await page.locator("script#ga-bootstrap").count();
  let plumbing = "ga-not-configured (loader inert by design)";
  let plumbingOk = true;
  if (bootstrap > 0) {
    await page.goto(`${BASE}/ar/products/proxeed-plus`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    const saw = await page.evaluate(() => ({
      dataLayer: Array.isArray(window.dataLayer),
      viewItem: (window.dataLayer ?? []).some((e) => e && e.event === "view_item"),
    }));
    plumbingOk = saw.dataLayer && saw.viewItem;
    plumbing = `dataLayer=${saw.dataLayer} · view_item queued=${saw.viewItem}`;
  }
  record(
    "F-18/F-70 consent",
    bannerBefore && gtagBefore === 0 && accepted && !bannerAfter && consentCookie === "granted" && plumbingOk,
    `banner-before=${bannerBefore} · gtag-before=${gtagBefore} · accepted=${accepted} · banner-after=${bannerAfter} · cookie=${consentCookie} · ${plumbing}`
  );
  await context.close();
}

// ---------------------------------------------------------------- F-25 sort actually sorts
{
  const context = await browser.newContext({ locale: "ar" });
  const page = await context.newPage();
  // "load" + settle + retry (same controlled-input hydration race as the
  // F-59/F-19 probes): a selectOption landing before React attaches is
  // silently swallowed — no navigation, no ?sort= param. Cold-start chunks
  // can take seconds, so retry until the URL reflects the choice.
  await page.goto(`${BASE}/ar/products`, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  const firstName = async () => (await page.locator(".ca-catalog-card h2").first().textContent())?.trim() ?? "";
  const before = await firstName();
  for (let attempt = 0; attempt < 4 && !page.url().includes("sort=desc"); attempt++) {
    await page.selectOption("form[role=search] select[name=sort]", "desc");
    await page.click("form[role=search] button[type=submit]");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1200);
  }
  const after = await firstName();
  const urlHasSort = page.url().includes("sort=desc");
  record(
    "F-25 sort works",
    Boolean(before) && Boolean(after) && before !== after && urlHasSort,
    `first-before="${before}" · first-after="${after}" · url-sort=${urlHasSort}`
  );
  await context.close();
}

// ---------------------------------------------------------------- F-59 show-password toggle
{
  const context = await browser.newContext({ locale: "ar" });
  const page = await context.newPage();
  // "load" + settle: the toggle is a React onClick — a click before
  // hydration is swallowed (same controlled-input race as the F-19 probe).
  await page.goto(`${BASE}/ar/login`, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  const typeBefore = await page.getAttribute("#password", "type");
  let typeAfter = typeBefore;
  for (let attempt = 0; attempt < 4 && typeAfter !== "text"; attempt++) {
    await page.getByRole("button", { name: "إظهار كلمة المرور" }).click();
    await page.waitForTimeout(400);
    typeAfter = await page.getAttribute("#password", "type");
  }
  record("F-59 toggle", typeBefore === "password" && typeAfter === "text", `type ${typeBefore} -> ${typeAfter}`);
  await context.close();
}

// ---------------------------------------------------------------- F-62 aria-current in header
{
  const context = await browser.newContext({ locale: "ar" });
  const page = await context.newPage();
  await page.goto(`${BASE}/ar/products`, { waitUntil: "domcontentloaded" });
  const href = await page.locator('header nav a[aria-current="page"]').first().getAttribute("href").catch(() => null);
  record("F-62 aria-current", href === "/ar/products", `active-href=${href}`);
  await context.close();
}

// ---------------------------------------------------------------- F-19 strength meter
{
  const context = await browser.newContext({ locale: "ar" });
  const page = await context.newPage();
  // "load" + settle window: hydration must be underway before the first
  // fill — the password input is CONTROLLED, so a fill that lands before
  // React attaches is silently reverted on hydration and the meter (rendered
  // from state) would never appear. Cold-start chunks can take seconds.
  await page.goto(`${BASE}/ar/register`, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  const meterBefore = await page.locator('[role="status"]').count();
  // Keep filling until the meter reacts — bounded; a genuine breakage still
  // fails the probe.
  let meterText = "";
  for (let attempt = 0; attempt < 6; attempt++) {
    await page.fill("#password", "Ab1!efgh");
    try {
      await page.waitForSelector('[role="status"]', { state: "visible", timeout: 2500 });
      break;
    } catch {
      // not hydrated yet — retry the fill
    }
  }
  meterText = (await page.locator('[role="status"]').first().textContent().catch(() => "")) ?? "";
  if (!meterText.trim()) {
    // The meter carries its label as aria-label too; read the accessible one
    // if the text node came back empty (markup evolution safety).
    meterText = (await page.locator('[role="status"]').first().getAttribute("aria-label").catch(() => "")) ?? "";
  }
  record(
    "F-19 meter",
    meterBefore === 0 && meterText.includes("قوية"),
    `meter-before=${meterBefore} · meter-text="${meterText.trim()}"`
  );
  await context.close();
}

// ---------------------------------------------------------------- F-33 manifest maskable (real fetch)
{
  const response = await fetch(`${BASE}/manifest.webmanifest`);
  const manifest = response.status === 200 ? await response.json() : null;
  const maskable = (manifest?.icons ?? []).some((i) => String(i.purpose ?? "").includes("maskable"));
  const any = (manifest?.icons ?? []).some((i) => String(i.purpose ?? "").includes("any"));
  record("F-33 manifest", response.status === 200 && maskable && any, `status=${response.status} · maskable=${maskable} · any=${any}`);
}

// ---------------------------------------------------------------- F-67 AVIF actually served
{
  const response = await fetch(`${BASE}/_next/image?url=%2Fproducts%2Fproxeed-plus.jpg&w=64&q=75`, {
    headers: { Accept: "image/avif,image/webp,image/*,*/*;q=0.8" },
  });
  const type = response.headers.get("content-type") ?? "";
  record("F-67 avif", response.status === 200 && type.includes("image/avif"), `status=${response.status} · content-type=${type}`);
}

// ---------------------------------------------------------------- F-12 hero CTA is a native anchor
{
  const response = await fetch(`${BASE}/ar`);
  const body = response.status === 200 ? await response.text() : "";
  const anchor = /<a[^>]+href="\/ar\/products/.test(body);
  const fakeLink = /role="link"/.test(body);
  record(
    "F-12 hero cta",
    response.status === 200 && anchor && !fakeLink,
    `status=${response.status} · native-anchor=${anchor} · role-link=${fakeLink}`
  );
}

// ---------------------------------------------------------------- F-14 offline fallback wiring
{
  // The SW is served from /serwist/sw.js (@serwist/turbopack's swDest, see
  // next.config.ts headers rule + SerwistProvider swUrl) — /sw.js is nothing.
  const swResponse = await fetch(`${BASE}/serwist/sw.js`);
  const sw = swResponse.status === 200 ? await swResponse.text() : "";
  const fallbackWired = sw.includes("/offline");
  const offlineResponse = await fetch(`${BASE}/offline`);
  const offlineBody = offlineResponse.status === 200 ? await offlineResponse.text() : "";
  record(
    "F-14 offline",
    swResponse.status === 200 && fallbackWired && offlineResponse.status === 200 && offlineBody.length > 500,
    `sw=${swResponse.status} · fallback-in-sw=${fallbackWired} · /offline=${offlineResponse.status} · body=${offlineBody.length}b`
  );
}

// ---------------------------------------------------------------- F-54 malformed slugs -> 404, never 500
{
  const cases = [
    ["quote", `${BASE}/ar/products/${encodeURIComponent("proxeed'--")}`],
    ["traversal", `${BASE}/ar/products/${encodeURIComponent("../../admin")}`],
    ["sql", `${BASE}/ar/products/${encodeURIComponent("1 OR 1=1")}`],
    ["braces", `${BASE}/ar/products/${encodeURIComponent("{ id }")}`],
  ];
  const notes = [];
  let all404 = true;
  for (const [name, url] of cases) {
    const response = await fetch(url, { redirect: "manual" });
    notes.push(`${name}=${response.status}`);
    if (response.status !== 404) all404 = false;
  }
  record("F-54 bad slug", all404, notes.join(" · "));
}

// ------------------------------------------------- F-43/47/48/F-08/F-16 (HTTP probes, wave 4)
{
  // F-43 — public static assets cached with stale-while-revalidate; the SW
  // script stays strictly no-cache.
  const asset = await fetch(`${BASE}/npf-logo.svg`);
  const assetCache = (asset.headers.get("cache-control") ?? "").includes("stale-while-revalidate");
  const swResp = await fetch(`${BASE}/serwist/sw.js`);
  const swNoCache = (swResp.headers.get("cache-control") ?? "").includes("no-store");
  record("F-43 cache", assetCache && swNoCache, `asset="${asset.headers.get("cache-control")}" · sw="${swResp.headers.get("cache-control")}"`);

  // F-48 — the admin panel is de-indexed twice: X-Robots-Tag ON the response
  // (present even while Payload is down and answering 500) and Disallow in
  // robots.txt.
  const admin = await fetch(`${BASE}/admin`, { redirect: "manual" });
  const adminNoindex = (admin.headers.get("x-robots-tag") ?? "").includes("noindex");
  const robotsText = await (await fetch(`${BASE}/robots.txt`)).text();
  const robotsDisallow = robotsText.includes("Disallow: /admin");
  record("F-48 admin noindex", adminNoindex && robotsDisallow, `x-robots=${adminNoindex} · robots-disallow=${robotsDisallow} · admin-status=${admin.status}`);

  // F-47 — duplicate-content paths collapse: trailing slash 308s to the clean
  // path, and the clean page declares its canonical.
  const slashed = await fetch(`${BASE}/ar/products/`, { redirect: "manual" });
  const canonical = await (await fetch(`${BASE}/ar/products`)).text();
  // The canonical href uses SITE_URL (the production origin), not the probe
  // host — assert the declared canonical path instead.
  const canonicalMatch = canonical.match(/rel="canonical" href="([^"]*\/ar\/[a-z-]+)"/);
  const hasCanonical = canonicalMatch !== null && canonicalMatch[1].endsWith("/ar/products");
  record("F-47 canonical", slashed.status === 308 && hasCanonical, `trailing=${slashed.status}->${slashed.headers.get("location")} · canonical=${hasCanonical}`);

  // F-08 remainder — hash URLs get exactly ONE redirect hop to the localized
  // path (the old scaffold double-redirected via a middleware chain).
  const hash = await fetch(`${BASE}/#/products`, { redirect: "manual" });
  const loc = (hash.headers.get("location") ?? "").split("?")[0];
  const singleHop = hash.status >= 300 && hash.status < 400 && (loc === "/ar" || loc === "/en");
  record("F-08 hash hop", singleHop, `status=${hash.status} · location=${hash.headers.get("location")}`);

  // F-16 — hero/guarantees carry real content: the documented hero claim is
  // in the SSR HTML and there is no "01"-style placeholder marker.
  const homeHtml = await (await fetch(`${BASE}/ar`)).text();
  const realHero = homeHtml.includes("خبرة من أوروبا.");
  // String checks (no regex): a literal ">01<" style placeholder marker.
  const noPlaceholder = !homeHtml.includes(">01<") && !homeHtml.includes(">١٢٣<") && !homeHtml.includes("Lorem ipsum");
  record("F-16 hero copy", realHero && noPlaceholder, `real-copy=${realHero} · no-placeholder=${noPlaceholder}`);
}

// ---------------------------------------------------------------- F-40 LCP + CLS, mobile, real browser
{
  async function measureVitals(path) {
    const context = await browser.newContext({
      locale: "ar",
      viewport: { width: 360, height: 800 },
      userAgent:
        "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36",
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__vitals = { lcp: 0, cls: 0 };
      try {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length) window.__vitals.lcp = entries[entries.length - 1].startTime;
        }).observe({ type: "largest-contentful-paint", buffered: true });
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__vitals.cls += entry.value;
        }).observe({ type: "layout-shift", buffered: true });
      } catch {}
    });
    await page.goto(`${BASE}${path}`, { waitUntil: "load" });
    await page.waitForTimeout(3000);
    const vitals = await page.evaluate(() => window.__vitals);
    await context.close();
    return vitals;
  }
  const home = await measureVitals("/ar");
  const listing = await measureVitals("/ar/products");
  // Headless sparticuz Chromium on shared CI CPUs is SLOWER than any real
  // phone, so these are upper bounds; the register thresholds (2.5s / 0.1)
  // still have to hold here to mean anything.
  const ok = home.lcp < 2500 && home.cls < 0.1 && listing.lcp < 2500 && listing.cls < 0.1;
  record(
    "F-40 vitals",
    ok,
    `home LCP=${home.lcp.toFixed(0)}ms CLS=${home.cls.toFixed(3)} · products LCP=${listing.lcp.toFixed(0)}ms CLS=${listing.cls.toFixed(3)}`
  );
}

// ------------------------------------------------- F-35/36/38 axe rules (real browser)
{
  const axeSource = readFileSync(join(process.cwd(), "node_modules/axe-core/axe.min.js"), "utf8");
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  // Animated content (the brand marquee) is evaluated at its reduced-motion
  // static state — the WCAG-conventional deterministic snapshot for moving
  // content, and the state reduced-motion users always see.
  await page.emulateMedia({ reducedMotion: "reduce" });
  const findings = [];
  let totalViolations = 0;
  for (const path of ["/ar", "/ar/products", "/ar/products/proxeed-plus", "/ar/register", "/ar/contact"]) {
    await page.goto(`${BASE}${path}`, { waitUntil: "load" });
    await page.waitForTimeout(1000);
    await page.evaluate(axeSource);
    const results = await page.evaluate(async () => {
      const r = await window.axe.run(document, {
        rules: {
          // F-36 — the contrast half of the a11y gate.
          "color-contrast": { enabled: true },
          // F-38 — heading order (1×h1 per page is checked by the harness
          // static grep; this adds the no-level-skips half).
          "heading-order": { enabled: true },
          // F-35 — the tab UI conformance half: tablist/tab/tabpanel roles
          // are validated by the required-children/parent aria rules.
          "aria-required-children": { enabled: true },
          "aria-required-parent": { enabled: true },
          // The two-navs-same-name class of bug the footer once had.
          "landmark-unique": { enabled: true },
        },
      });
      return r.violations.map((v) => `${v.id}×${v.nodes.length}`);
    });
    totalViolations += results.length;
    findings.push(`${path}:${results.length ? results.join(",") : "clean"}`);
  }
  await context.close();
  record(
    "F-35/36/38 axe",
    totalViolations === 0,
    `${totalViolations} violations · ${findings.join(" · ")}`
  );
}

// ---------------------------------------------------------------- report
await browser.close();

let failed = 0;
for (const r of results) {
  if (!r.ok) failed++;
  console.log(`${r.id.padEnd(18)} ${r.ok ? "PASS" : "FAIL"}   ${r.note}`);
}
console.log("=".repeat(78));
console.log(`PROBES: ${results.length - failed} passed / ${failed} failed  (${results.length} total)`);
process.exit(failed ? 1 : 0);
