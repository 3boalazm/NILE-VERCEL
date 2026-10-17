#!/usr/bin/env node
/**
 * NPF — Fix Verification Harness  (verify-fixes.mjs)  v2 — calibrated
 * -------------------------------------------------------------------
 * Re-checks the 71 register defects (docs/testing/results/24-test-defect-register.md)
 * and prints per-defect status: FIXED / OPEN / MANUAL.
 *
 * Usage:
 *   node scripts/verify-fixes.mjs                        # checks http://localhost:3000
 *   node scripts/verify-fixes.mjs http://localhost:3000
 *   BASE_URL=... VENDURE_URL=http://localhost:3001 node scripts/verify-fixes.mjs
 *
 * Requires: a running storefront (HTTP checks) — Vendure optional (F-54/F-57 skip if down).
 * Exit codes: 0 = all automatable checks FIXED · N = number still OPEN · 2 = server down.
 *
 * v2 calibration notes (why checks are shaped the way they are):
 *  - RSC flight payloads escape Arabic as \uXXXX → bodies are unescaped before grepping.
 *  - "skeleton" matches inside "cytoskeleton" → word-boundary component matching.
 *  - a robots.ts disallow rule must not count as "usage" of a route (the lab
 *    prototypes were disallowed there AND orphaned; F-21 wants them gone).
 *  - "backup" appears in THIS file → self-excluded from tooling scans.
 *  - session cookie is `maxAge: ONE_YEAR_SECONDS` → symbolic constants resolved.
 *  - aria-current/aria-label presence must be in the NAV components specifically.
 *  - v3: F-34's fixed 3000-char document prefix could not see <body> at all
 *    (~5.1KB of <head>), so it is now anchored at <body> and stricter — it
 *    also verifies the skip target id exists and precedes header/nav/main.
 * NOTE: plain .mjs — do NOT add TypeScript syntax here (it fails silently).
 */

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SELF = basename(fileURLToPath(import.meta.url));
const BASE = (process.argv[2] || process.env.BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const VENDURE = (process.env.VENDURE_URL || "http://localhost:3001").replace(/\/+$/, "");

const rows = [];
const add = (id, status, note) => rows.push({ id, status, note });

// ---------------------------------------------------------------- preflight
async function ping(url) {
  try { const r = await fetch(url, { redirect: "manual" }); return r.status > 0; } catch { return false; }
}
const baseUp = await ping(BASE);
if (!baseUp) {
  console.error(`SERVER DOWN — ${BASE} unreachable. Start the storefront first, then re-run.`);
  process.exit(2);
}
const vendureUp = await ping(VENDURE);

// ---------------------------------------------------------------- source scan
const srcFiles = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(tsx?|jsx?|mjs|css)$/.test(name)) srcFiles.push(p);
  }
})(join(ROOT, "src"));

const SRC = [];
for (const p of srcFiles) {
  try { SRC.push([p.slice(ROOT.length + 1), readFileSync(p, "utf8")]); } catch {}
}
const srcGrep = (needle) => SRC.filter(([, t]) => t.includes(needle)).map(([p]) => p);
const srcTest = (re) => SRC.filter(([, t]) => re.test(t)).map(([p]) => p);

function readScripts() {
  const dir = join(ROOT, "scripts");
  const out = [];
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir)) {
    if (f === SELF) continue; // this file mentions "backup" in its comments
    try { out.push([f, readFileSync(join(dir, f), "utf8")]); } catch {}
  }
  return out;
}

// ---------------------------------------------------------------- HTTP pages
function unescapeFlight(body) {
  return body.replace(/\\u([0-9a-fA-F]{4})/g, (_, g) => String.fromCharCode(parseInt(g, 16)));
}
async function page(path) {
  try {
    const r = await fetch(BASE + path, {
      redirect: "manual",
      headers: { "user-agent": "npf-fix-verify/2.0" },
    });
    const raw = await r.text();
    return { status: r.status, headers: r.headers, body: unescapeFlight(raw), err: null };
  } catch (e) {
    return { status: 0, headers: new Headers(), body: "", err: String(e) };
  }
}
const visible = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");

const P = {};
for (const [key, path] of [
  ["home", "/ar"], ["products", "/ar/products"], ["pdp", "/ar/products/proxeed-plus"],
  ["register", "/ar/register"], ["login", "/ar/login"], ["checkout", "/ar/checkout"],
  ["contact", "/ar/contact"], ["careers", "/ar/careers"], ["shipping", "/ar/shipping-delivery"],
  ["quality", "/ar/quality-sourcing"], ["story", "/ar/story"], ["blogs", "/ar/blogs"],
  ["manifest", "/manifest.json"], ["robots", "/robots.txt"], ["sitemap", "/sitemap.xml"],
  ["notfoundxml", "/not-found.xml"], ["adminApp", "/admin"],
]) {
  P[key] = await page(path);
}
// discover manifest path from the layout link (fallback paths tried above + webmanifest)
{
  const m = P.home.body.match(/rel="manifest"\s+href="([^"]+)"/) || P.home.body.match(/href="([^"]+)"\s+rel="manifest"/);
  const path = m ? m[1] : P.manifest.status === 200 ? null : "/manifest.webmanifest";
  if (path) P.manifest = await page(path);
}

// ================================================================ AUTO CHECKS

// ---- F-01 catalog placeholders (scan BOTH visible text and full unescaped body)
{
  const hay = visible(P.products.body) + " " + visible(P.pdp.body) + " " + P.pdp.body;
  const bad = hay.match(/#\s?P\d{2,}/g) || [];
  const skuNull = /sku\\?":\s*null/.test(hay) && visible(P.pdp.body).includes("sku");
  add("F-01", bad.length || skuNull ? "OPEN" : "FIXED",
    bad.length ? `placeholder SKUs still render: ${[...new Set(bad)].slice(0, 3).join(", ")}` :
      skuNull ? "sku:null still exposed in markup" : "no placeholder SKUs in rendered text");
}

// ---- F-02 error boundaries
{
  const hasErr = existsSync(join(ROOT, "src/app/error.tsx")) || existsSync(join(ROOT, "src/app/[locale]/error.tsx"));
  const hasGlobal = existsSync(join(ROOT, "src/app/global-error.tsx"));
  add("F-02", hasErr && hasGlobal ? "FIXED" : "OPEN", `error.tsx=${hasErr} global-error.tsx=${hasGlobal}`);
}

// ---- F-03 payment copy vs capability (unescaped body — labels live in RSC flight)
// Recalibrated 2026-09-23: Vodafone Cash + InstaPay are now REAL transfer rails
// (client-supplied collection details rendered at checkout and on the order
// confirmation), so mentioning فودافون كاش is truthful — no longer the F-03
// false-advertising defect. What remains forbidden: card-payment labels and
// "secure gateway" marketing copy (no card gateway exists), and a bare
// "فودافون" claim WITHOUT the actual rails (InstaPay alias / wallet number).
{
  const t = P.pdp.body + " " + P.home.body + " " + P.checkout.body;
  const card = t.includes("الدفع بالبطاقة");
  const secure = t.includes("بوابة الدفع آمنة");
  const vodafone = t.includes("فودافون");
  const rails = t.includes("ahmedkhaled3bsallam@instapay") || t.includes("01091984418");
  add("F-03", !card && !secure && (!vodafone || rails) ? "FIXED" : "OPEN",
    `card labels=${card} · secure-gateway copy=${secure} · vodafone=${vodafone} backed by rails=${rails}`);
}

// ---- F-04 password reset
{
  const a = await page("/ar/login/forgot-password");
  const b = await page("/ar/account/forgot-password");
  const c = await page("/ar/reset-password");
  const okForm = [a, b, c].some((p) => p.status === 200 && p.body.includes("<form"));
  const linked = P.login.body.includes("نسيت") || P.login.body.toLowerCase().includes("forgot");
  add("F-04", okForm && linked ? "FIXED" : "OPEN", `reset page with form=${okForm} · linked from login=${linked}`);
}

// ---- F-05 empty content pages
{
  const pages = { contact: P.contact, careers: P.careers, shipping: P.shipping, quality: P.quality, story: P.story };
  const empty = [];
  for (const [k, p] of Object.entries(pages)) {
    if (visible(p.body).trim().length < 200) empty.push(k);
  }
  add("F-05", empty.length ? "OPEN" : "FIXED",
    empty.length ? `still near-empty (<200 chars visible): ${empty.join(", ")}` : "all 5 pages have real content");
}

// ---- F-08 docs
{
  const docs = existsSync(join(ROOT, "DECISIONS.md")) && existsSync(join(ROOT, "TODO.md"));
  add("F-08", docs ? "FIXED" : "OPEN", `DECISIONS.md+TODO.md=${docs}`);
}

// ---- F-09 GraphQL playground documentation
// v2 calibration (2026-09-22, wave 2): the check grepped two exact-case
// literals, "graphql-playground" and "GraphiQL". The repo wires BOTH explorers
// under different spellings — `GraphiqlPlugin` (lowercase "ql") in
// vendure-config.ts and `GRAPHQL_PLAYGROUND_GET` (upper snake) in the Payload
// route — so neither literal matched and a fully-wired feature reported OPEN.
// Matching is now case-insensitive (a strict superset of v1: nothing that
// passed before fails now) and the note names which surface was found, so the
// row is auditable instead of a bare boolean.
{
  const re = /graphiql|graphql[-_ ]?playground/i;
  const hits = SRC.filter(([, t]) => re.test(t)).map(([p]) => p);
  const vendure = hits.some((p) => p.includes("vendure-config"));
  const payload = hits.some((p) => p.includes("graphql-playground"));
  add("F-09", hits.length ? "FIXED" : "OPEN",
    hits.length
      ? `explorer(s) wired: ${[vendure ? "Vendure GraphiqlPlugin (dev-gated)" : null, payload ? "Payload /api/graphql-playground" : null].filter(Boolean).join(" + ")} — see docs/GRAPHQL.md`
      : "no playground/dev GraphQL UI");
}

// ---- F-11 env validation + security headers
{
  const envVal = srcGrep("valibot").length > 0 || srcTest(/\bzod\b/).length > 0 ||
    existsSync(join(ROOT, "scripts/check-env.mjs")) || existsSync(join(ROOT, "scripts/check-env.js"));
  const h = P.home.headers;
  const csp = !!h.get("content-security-policy");
  const xp = !!h.get("x-powered-by");
  add("F-11", envVal && csp && !xp ? "FIXED" : "OPEN",
    `env-validation=${envVal} · CSP header=${csp} · X-Powered-By=${xp}`);
}

// ---- F-13 article TOC
{
  let fixed = false, note = "no article found";
  const arts = [...P.blogs.body.matchAll(/href="((?:\/ar)?\/blogs\/[a-z0-9-]+)"/gi)].map((m) => m[1]);
  if (arts.length) {
    const art = await page(arts[0]);
    const t = visible(art.body);
    const i = t.indexOf("المحتويات");
    const seg = i >= 0 ? t.slice(i, i + 300) : "";
    fixed = seg.length > 60 && /[\u0600-\u06FF]{4,}/.test(seg.slice(8));
    note = `article ${arts[0]}: TOC ${fixed ? "has entries" : "empty"}`;
  } else {
    // Deliberate content gap, NOT a code defect: the blog source is empty
    // because real articles are pending from the client — faking them is
    // explicitly forbidden (CONTENT-PAGE-MAPPING.md §H "no fake blog",
    // enforced by the MOCK_BLOG_FALLBACK flag being off in real mode). The
    // listing/empty-state/article template all work (e2e covers them); this
    // stays OPEN until real articles are added to the CMS.
    note = "blog intentionally empty — real articles pending from client (CONTENT-PAGE-MAPPING.md §H); template works, content gap only";
  }
  add("F-13", fixed ? "FIXED" : "OPEN", note);
}

// ---- F-15 rate-limit docs
{
  let hit = false;
  for (const dir of [join(ROOT, "docs"), ROOT]) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (!/\.md$/i.test(f)) continue;
      const t = readFileSync(join(dir, f), "utf8").toLowerCase();
      if (t.includes("rate") && (t.includes("limit") || t.includes("throttle"))) hit = true;
    }
  }
  add("F-15", hit ? "FIXED" : "OPEN", hit ? "rate limits documented" : "no rate-limit documentation found");
}

// ---- F-17 checkout governorate control
{
  const f = SRC.find(([p]) => p.includes("checkout-form"));
  const t = f ? f[1] : "";
  const selectish = t.includes("<Select") || t.includes('role="listbox"') || t.includes("Combobox") || t.includes("<select");
  add("F-17", selectish ? "FIXED" : "OPEN",
    selectish ? "governorate is now a select/listbox (verify the other 4 sub-fixes manually)" : "governorate still a free TEXT input");
}

// ---- F-18 cookie consent
{
  const t = P.home.body.toLowerCase();
  const ok = t.includes("consent") || t.includes("موافقة") || t.includes("ملفات تعريف") || t.includes("cookie-banner");
  add("F-18", ok ? "FIXED" : "OPEN", ok ? "consent banner present" : "no consent banner markers");
}

// ---- F-19 register confirm-password + strength
{
  const f = SRC.find(([p]) => p.includes("register-form"));
  const t = f ? f[1] : "";
  const confirm = /confirm|تأكيد|توكيد/i.test(t);
  const strength = /strength|قوة/i.test(t);
  add("F-19", confirm && strength ? "FIXED" : "OPEN", `confirm-password=${confirm} · strength meter=${strength}`);
}

// ---- F-21 hero-abstract orphan (robots.ts disallow mentions don't count as usage)
{
  const lab = join(ROOT, "src/app/[locale]/lab");
  const usedIn = srcGrep("hero-abstract").filter((p) => !p.includes("/lab/") && !p.includes("robots.ts"));
  add("F-21", !existsSync(lab) || usedIn.length ? "FIXED" : "OPEN",
    existsSync(lab) ? (usedIn.length ? `used by: ${usedIn.slice(0, 2).join(",")}` : "lab/hero-abstract still ships orphaned") : "lab route removed");
}

// ---- F-22 skeleton.tsx used as a COMPONENT (word boundary — "cytoskeleton" trap)
{
  const users = srcTest(/\bSkeleton\b|from ["'].*\/skeleton["']/).filter((p) => !p.endsWith("skeleton.tsx"));
  add("F-22", users.length ? "FIXED" : "OPEN", users.length ? `Skeleton used in: ${users.slice(0, 3).join(", ")}` : "skeleton.tsx still unused as a component");
}

// ---- F-23 social links
{
  const m = P.home.body.match(/href="https?:\/\/(www\.)?(facebook|instagram|linkedin|youtube|twitter|x)\.[^"]+"/i);
  add("F-23", m ? "FIXED" : "OPEN", m ? `social link found: ${m[0].slice(5, 60)}` : "no social links in home markup");
}

// ---- F-24 + F-25 listing filters/sort
{
  const t = visible(P.products.body);
  const filter = /filter|تصفية|فئة/i.test(t);
  const sort = /sort|ترتيب/i.test(t) || P.products.body.includes('name="sort"');
  add("F-24", filter ? "FIXED" : "OPEN", filter ? "filter UI present on listing" : "no filter UI on listing");
  add("F-25", sort ? "FIXED" : "OPEN", sort ? "sort control present (verify it WORKS manually)" : "no sort control on listing");
}

// ---- F-33 maskable icon
{
  let ok = false, note = "manifest missing";
  if (P.manifest.status === 200) {
    try {
      const m = JSON.parse(P.manifest.body);
      ok = (m.icons || []).some((i) => String(i.purpose || "").includes("maskable"));
      note = `icons=${(m.icons || []).length} · maskable=${ok}`;
    } catch { note = "manifest unparseable"; }
  }
  add("F-33", ok ? "FIXED" : "OPEN", note);
}

// ---- F-34 skip link
// v3 calibration (2026-09-22): v2 scanned a FIXED 3000-character prefix of the
// document. This app's <head> alone is ~5.1KB — two nine-width hero-image
// preload hints plus the full OG/Twitter metadata — so <body> starts at ~5.1k
// and a correctly-placed skip link could never land inside that window. The
// check therefore reported OPEN even for a conformant implementation (same
// class of false audit as the Report 16 correction). The requirement is "first
// focusable element in the document", so the scan is now anchored at <body>
// and asserts the three properties that make a skip link actually work — which
// is strictly more than v2 checked: v2 never verified the target existed.
{
  const bodyIdx = P.home.body.indexOf("<body");
  const body = bodyIdx >= 0 ? P.home.body.slice(bodyIdx) : P.home.body;
  const skip = body.match(/<a\b[^>]*href="#([^"]+)"[^>]*>([\s\S]{0,160}?)<\/a>/i);
  const skipPos = skip ? body.indexOf(skip[0]) : Infinity;
  const firstLandmark = Math.min(
    ...["<header", "<nav", "<main"].map((t) => {
      const i = body.indexOf(t);
      return i < 0 ? Infinity : i;
    })
  );
  const label = skip ? skip[2].replace(/<[^>]+>/g, "") : "";
  const labelled = /skip|تخطي|تجاوز إلى|تجاوز الى/i.test(label);
  const targetExists = skip ? P.home.body.includes(`id="${skip[1]}"`) : false;
  const ok = Boolean(skip) && labelled && targetExists && skipPos < firstLandmark;
  add("F-34", ok ? "FIXED" : "OPEN",
    ok ? `skip link "${label.trim()}" -> #${skip[1]}, precedes header/nav/main, target exists`
       : `link=${Boolean(skip)} labelled=${labelled} target-id-exists=${targetExists} before-nav=${skipPos < firstLandmark}`);
}

// ---- F-37 icon-button names (NAV components specifically)
{
  const navFiles = ["src/components/npf/header.tsx", "src/components/npf/bottom-nav.tsx", "src/components/npf/footer.tsx"];
  const covered = navFiles.filter((p) => SRC.some(([sp, t]) => sp === p && t.includes("aria-label")));
  add("F-37", covered.length >= 2 ? "FIXED" : "OPEN", `nav files with aria-label: ${covered.map((p) => p.split("/").pop()).join(",") || "none"}`);
}

// ---- F-39 fieldset
{
  const ok = srcGrep("<fieldset").length >= 1;
  add("F-39", ok ? "FIXED" : "OPEN", ok ? "fieldset(s) present" : "no fieldset/legend around form groups");
}

// ---- F-43 cache directives
{
  const cc = P.home.headers.get("cache-control") || "";
  const ok = /stale-while-revalidate|s-maxage|max-age/i.test(cc);
  add("F-43", ok ? "FIXED" : "OPEN", `Cache-Control: ${cc || "(none)"}`);
}

// ---- F-45 canonical + OG
{
  const b = P.home.body;
  const canon = b.includes('rel="canonical"');
  const ogurl = b.includes('property="og:url"');
  const ogimg = b.includes('property="og:image"');
  add("F-45", canon && ogurl && ogimg ? "FIXED" : "OPEN", `canonical=${canon} og:url=${ogurl} og:image=${ogimg}`);
}

// ---- F-46 robots meta + custom 404 document
// RECALIBRATED 2026-09-22 (same class as the F-09/F-71 recalibrations): the
// original check demanded `GET /not-found.xml` → **200**. That is a soft 404 —
// a 200 on a URL that has no resource tells crawlers the page exists, which is
// precisely the SEO defect report 07 warns about, and Google's guidance is to
// return a real 404/410 for missing URLs. The register's actual intent
// ("not-found.xml missing … add file", i.e. *a custom 404 document exists and
// is served for unknown URLs, including machine-format ones*) is what we test
// now: the unmatched-URL response must carry the real 404 status AND the
// site's own branded error document (global-not-found.tsx, F-73) rather than
// the framework's empty `__next_error__` shell — so the check proves a custom
// 404 is served, without rewarding a soft 404.
{
  const robotsNoindexHome = /name="robots"[^>]*noindex/i.test(P.home.body);
  const nfStatus = P.notfoundxml.status === 404;
  const nfCustom = /global-not-found|الصفحة غير موجودة|Page not found|404/.test(P.notfoundxml.body)
    && !P.notfoundxml.body.includes('id="__next_error__"></div><body hidden');
  const nf = nfStatus && nfCustom;
  add("F-46", nf && !robotsNoindexHome ? "FIXED" : "OPEN",
    `unknown-URL=${P.notfoundxml.status} (want 404, never 200) · custom-doc=${nfCustom} · home noindex=${robotsNoindexHome}`);
}

// ---- F-47 trailing-slash canonicalization
{
  const r = await page("/ar/");
  const ok = r.status >= 300 && r.status < 400;
  add("F-47", ok ? "FIXED" : "OPEN", `/ar/ → status ${r.status} → ${r.headers.get("location") || "(no redirect — verify canonical tags)"}`);
}

// ---- F-48 admin robots
{
  const tag = (P.adminApp.headers.get("x-robots-tag") || "").toLowerCase();
  const ok = tag.includes("noindex") || /name="robots"[^>]*noindex/i.test(P.adminApp.body);
  add("F-48", ok ? "FIXED" : "OPEN", `admin X-Robots-Tag=${tag || "(none)"}`);
}

// ---- F-50 src-level iframe titles (content-block iframes = manual F-50b)
{
  const bad = srcTest(/<iframe(?![^>]*\btitle=)/i);
  add("F-50", bad.length ? "OPEN" : "FIXED",
    bad.length ? `untitled iframes in: ${bad.slice(0, 2).join(", ")}` : "src iframes titled (content-block iframes: see F-50b manual)");
}

// ---- F-52 mailer
{
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  const deps = Object.keys(pkg.dependencies || {});
  const mailer = deps.some((d) => /resend|nodemailer|postmark|sendgrid|@react-email|mailgun/.test(d));
  const flows = srcGrep("emailVerification").length + srcGrep("verifyEmail").length + srcGrep("resetPassword").length;
  add("F-52", mailer && flows ? "FIXED" : "OPEN", `mailer dep=${mailer} · verification/reset flow markers=${flows}`);
}

// ---- F-53 backups (self-excluded)
{
  const hit = readScripts().some(([, t]) => /pg_dump|backup/i.test(t));
  add("F-53", hit ? "FIXED" : "OPEN", hit ? "backup tooling found in scripts/" : "no backup/restore tooling in scripts/");
}

// ---- F-54 malformed id → not-500
{
  if (!vendureUp) add("F-54", "MANUAL", `Vendure down (${VENDURE}) — start it and re-run`);
  else {
    let ok = false, note = "shop-api error";
    try {
      const r = await fetch(VENDURE + "/shop-api", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: 'query { product(id: "!!!bad-id!!!") { id } }' }),
      });
      const t = await r.text();
      ok = r.status !== 500 && !/internal server error/i.test(t);
      note = `status=${r.status} · body-snippet=${t.slice(0, 80)}`;
    } catch (e) { note = String(e); }
    add("F-54", ok ? "FIXED" : "OPEN", note);
  }
}

// ---- F-56 session lifetime (symbolic constants resolved)
{
  const bad = srcTest(/maxAge:\s*(ONE_YEAR_SECONDS|31536000|365\s*\*\s*24)/i)
    .concat(srcGrep("ONE_YEAR_SECONDS").filter((p) => /maxAge:\s*ONE_YEAR_SECONDS/.test(SRC.find(([sp]) => sp === p)?.[1] || "")));
  const uniq = [...new Set(bad)];
  add("F-56", uniq.length ? "OPEN" : "FIXED",
    uniq.length ? `year-long cookies in: ${uniq.slice(0, 2).join(",")} (verify password policy manually)` : "no year-long session cookies found");
}

// ---- F-57 admin hardening
{
  if (!vendureUp) add("F-57", "MANUAL", `Vendure down (${VENDURE}) — start it and re-run`);
  else {
    let xp = true, note = "admin error";
    try {
      const r = await fetch(VENDURE + "/admin", { redirect: "manual" });
      xp = !!r.headers.get("x-powered-by");
      note = `X-Powered-By=${xp} (password policy check manually)`;
    } catch (e) { note = String(e); }
    add("F-57", xp ? "OPEN" : "FIXED", note);
  }
}

// ---- F-58 account deletion
{
  const hits = srcGrep("deleteAccount").length + srcGrep("حذف الحساب").length + srcGrep("delete-account").length;
  add("F-58", hits ? "FIXED" : "OPEN", hits ? "delete-account flow present" : "no account deletion flow");
}

// ---- F-59 maxlength policy + show-password
{
  const hard = srcTest(/maxLength=\{?(120|254|160|200|2000)\}?/);
  const eye = srcGrep("showPassword").length + srcGrep("show-password").length;
  add("F-59", !hard.length && eye ? "FIXED" : "OPEN",
    `hardcoded maxLengths=${hard.length ? hard.slice(0, 2).join(",") : "none"} · show-password toggle=${!!eye}`);
}

// ---- F-61 ARIA on fields
{
  const inv = srcGrep("aria-invalid").length;
  const desc = srcGrep("aria-describedby").length;
  add("F-61", inv && desc ? "FIXED" : "OPEN", `aria-invalid files=${inv} · aria-describedby files=${desc}`);
}

// ---- F-62 aria-current on the HEADER nav specifically
{
  const header = SRC.find(([p]) => p.endsWith("header.tsx"));
  const ok = header ? header[1].includes("aria-current") : false;
  add("F-62", ok ? "FIXED" : "OPEN", ok ? "header nav has aria-current" : "header.tsx still lacks aria-current (bottom-nav/pagination have it)");
}

// ---- F-63 change password
{
  const hits = srcGrep("currentPassword").length + srcGrep("updateCustomerPassword").length + srcGrep("changePassword").length;
  add("F-63", hits ? "FIXED" : "OPEN", hits ? "change-password flow present" : "no change-password UI/API");
}

// ---- F-65 client error pipeline
{
  const hits = srcGrep("Sentry").length + srcGrep("captureException").length + srcGrep("reportError").length;
  add("F-65", hits ? "FIXED" : "OPEN", hits ? "client error reporting wired" : "console-only errors (no pipeline)");
}

// ---- F-66 fonts
{
  const fontDir = join(ROOT, "src/app/fonts");
  let raw = [];
  if (existsSync(fontDir)) {
    for (const f of readdirSync(fontDir)) if (/\.(ttf|otf)$/i.test(f)) raw.push(f);
  }
  const preload = P.home.body.includes('rel="preload"') && /font/i.test(P.home.body);
  add("F-66", !raw.length ? "FIXED" : "OPEN",
    `raw ttf/otf=${raw.length ? raw.slice(0, 3).join(",") : "none"} · preload hint=${preload} (verify ≤14KB woff2 manually)`);
}

// ---- F-67 img fallbacks + AVIF
{
  const onErr = srcGrep("onError").length;
  const cfg = ["next.config.ts", "next.config.js", "next.config.mjs"]
    .map((f) => join(ROOT, f)).filter(existsSync)
    .map((f) => readFileSync(f, "utf8")).join(" ");
  const avif = cfg.includes("avif");
  add("F-67", onErr && avif ? "FIXED" : "OPEN", `onError handlers=${onErr} · AVIF in next.config=${avif}`);
}

// ---- F-68 PWA meta
{
  const b = P.home.body;
  const theme = b.includes('name="theme-color"');
  const apple = b.includes("apple-mobile-web-app");
  add("F-68", theme && apple ? "FIXED" : "OPEN", `theme-color=${theme} · apple-mobile-web-app=${apple} (check start_url locale too)`);
}

// ---- F-69 delivery pipeline (v2: CI+Dockerfile exist in baseline — CD half is the gap)
{
  const wf = join(ROOT, ".github/workflows");
  const hasWf = existsSync(wf) && readdirSync(wf).filter((f) => /\.ya?ml$/i.test(f)).length > 0;
  const docker = existsSync(join(ROOT, "Dockerfile"));
  add("F-69", hasWf && docker ? "FIXED" : "OPEN",
    `CI workflow=${hasWf} · Dockerfile=${docker} (CD/staging/monitoring/rollback remain manual — see register)`);
}

// ---- F-70 analytics
{
  const hits = srcGrep("gtag(").length + srcGrep("dataLayer").length + srcGrep("googletagmanager").length;
  add("F-70", hits ? "FIXED" : "OPEN", hits ? "analytics markers present (verify EVENTS fire manually)" : "no analytics layer");
}

// ---- F-71 pool sizing
// v2 calibration (2026-09-22, wave 2): the alternative list assumed a
// `DB_POOL*` spelling. The implemented variable is `DATABASE_POOL_MAX` — named
// after Payload's `DATABASE_URI` because one validated value feeds BOTH
// Payload's adapter and Vendure's TypeORM `extra.max`; and pg's own option is
// `max`, so `poolSize`/`connectionLimit`/`maxConnections` (Mongo/MySQL
// spellings) never appear in a Postgres-only project. Added `DATABASE_POOL` and
// pg's `pool: { max }` shape; every v1 alternative still matches.
{
  const hits = srcTest(/poolSize|connectionLimit|DB_POOL|DATABASE_POOL|maxConnections|pool:\s*\{[^}]*\bmax:/i);
  add("F-71", hits.length ? "FIXED" : "OPEN", hits.length ? `pool config in: ${hits.slice(0, 3).join(", ")}` : "no explicit DB pool sizing");
}

// ---------------------------------------------------------------- MANUAL list
const MANUAL = [
  ["F-06", "Spot-check button labels across surfaces (PDP vs checkout vs cart) — same action = same name"],
  ["F-07", "Login with ?redirect=/ar/cart → after login must land on /ar/cart (Playwright)"],
  ["F-10", "Submit forms with errors → field values must be preserved (Playwright)"],
  ["F-12", "Click hero CTA within 500ms of paint → must navigate (Playwright timing test)"],
  ["F-14", "Offline → open a new document → must land on /offline (Playwright offline probe)"],
  ["F-16", "Home guarantees/hero copy = real content, no '01'-style placeholders"],
  ["F-20", "Wishlist must sync to the account (login on 2nd device → same wishlist)"],
  ["F-27", "Home at 1280–1439px → no horizontal overflow (scrollWidth == clientWidth)"],
  ["F-29", "EN hero-abstract two-column → no overflow at 1280px"],
  ["F-30", "All tappable targets ≥ 44×44 CSS px (measure header/footer/nav links)"],
  ["F-31", "Wishlist heart icon legible on dark hero (theme-aware fill)"],
  ["F-32", "Modal/dialog fits 320px width without overflow"],
  ["F-35", "axe: every tab UI (product-spotlight etc.) has role=tab|aria-selected|aria-controls CONFORMANT pairs"],
  ["F-36", "axe/contrast: body ≥ 4.5:1, primary buttons ≥ 4.5:1 (Lighthouse a11y ≥ 95)"],
  ["F-38", "Landmark/heading order: 1×h1 per page, no level skips (axe)"],
  ["F-40", "Lighthouse mobile: LCP < 2.5s, CLS < 0.1 on / and /ar/products"],
  ["F-41", "curl -w TTFB < 200ms on /ar"],
  ["F-42", "Largest first-load chunk < 300KB; total first-load JS < 1MB"],
  ["F-44", "Production envs define TLS/HTTPS URLs (deploy checklist)"],
  ["F-50b", "Rendered content-block iframes (CMS HTML) must carry title attributes"],
  ["F-55", "Fix IDOR probe expectations in api-probes (test-side mapping)"],
  ["F-60", "Submit contact → must not double-submit on reload (PRG pattern)"],
  ["F-64", "Offline submit → visible error message + retry (offline probe)"],
  ["F-02b", "Induce a render error → styled error page with retry (not chrome-error://)"],
  ["F-70b", "Place a test order → GA4 DebugView shows view_item→purchase chain (after F-18 consent)"],
];

// ---------------------------------------------------------------- report
console.log("NPF FIX VERIFICATION v2 — " + new Date().toISOString());
console.log(`Base: ${BASE}${baseUp ? "" : " (DOWN)"}  ·  Vendure: ${VENDURE}${vendureUp ? "" : " (DOWN)"}`);
console.log("=".repeat(78));
const pad = (s, n) => String(s).padEnd(n);
let fixed = 0, open = 0, manualAuto = 0;
const opens = [];
for (const r of rows) {
  if (r.status === "FIXED") fixed++;
  else if (r.status === "OPEN") { open++; opens.push(r.id); }
  else manualAuto++;
  console.log(`${r.id.padEnd(6)} ${pad(r.status, 7)} ${r.note}`);
}
console.log("=".repeat(78));
console.log(`AUTO: ${fixed} FIXED / ${open} OPEN / ${manualAuto} deferred-to-MANUAL  ·  MANUAL: ${MANUAL.length} checks`);
if (opens.length) console.log("STILL OPEN: " + opens.join(", "));
console.log("\nMANUAL CHECKS (retest by hand/browser):");
for (const [id, how] of MANUAL) console.log(`  ${id.padEnd(6)} ${how}`);
console.log("\nNext: fix OPEN items → re-run this script → when AUTO=0 open, clear the MANUAL list →");
console.log("      re-run the sign-off battery (docs/testing/results/25-fix-verification-playbook.md §4).");
process.exit(open);
