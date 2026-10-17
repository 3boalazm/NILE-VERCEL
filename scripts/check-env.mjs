#!/usr/bin/env node
/**
 * Environment/documentation drift guard (F-11).
 *
 * The concrete bug this exists to prevent already shipped once: `.env.example`
 * documented `SUPERADMIN_USER` / `SUPERADMIN_PASS` while `vendure-config.ts`
 * read `SUPERADMIN_USERNAME` / `SUPERADMIN_PASSWORD`. Copying the documented
 * file therefore produced a super-admin nobody could log in as, and *nothing*
 * complained — the wrong names were simply ignored.
 *
 * `src/lib/env.ts` now validates values at boot (zod, all problems at once).
 * This script covers the other half: that every variable the code reads is
 * documented, and every documented variable is still read. It runs in CI in
 * seconds and needs no server, no database and no dependencies.
 *
 * Usage:
 *   node scripts/check-env.mjs            # exits 1 on drift
 *   node scripts/check-env.mjs --json     # machine-readable report
 *
 * Deliberately NOT its job: checking that values are *set* or *valid* — that is
 * env.ts's, at boot, where the failure can name the variable and the fix.
 */

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const AS_JSON = process.argv.includes("--json");

const rootConfigs = [];

/** Provided by the framework/runtime, not by this project's .env. */
const FRAMEWORK_PROVIDED = new Set([
  "NODE_ENV",
  "CI",
  "PORT",
  "PWD",
  "HOME",
  "SHELL",
  "TMPDIR",
  // Next.js sets NEXT_PHASE itself: "phase-production-build" while `next
  // build` runs, "phase-development-server" under `next dev`. The app reads
  // it to tell a compile from a request (src/lib/env.ts) — it is not a
  // project variable and has no value to put in .env.
  "NEXT_PHASE",
]);
/** Read dynamically or injected by hosting platforms; not documentable by name. */
const IGNORE_PATTERNS = [/^npm_/, /^VERCEL/, /^NEXT_RUNTIME$/, /^__NEXT/];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|mts|js|jsx|mjs)$/.test(name)) out.push(p);
  }
  return out;
}

/**
 * Removes comments before scanning. Without this, prose is read as config: the
 * module comment in report-error.ts explains that dynamic lookups are not
 * inlined by writing `process.env.X`, and X is not a variable.
 *
 * Only block comments and *whole-line* `//` comments are stripped — an inline
 * trailing comment could theoretically hide a real read, but stripping those
 * would also mangle string literals containing `//` (every URL in the codebase),
 * which is the worse failure. Documented limitation, not an oversight.
 */
function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
}

/** Tests assert behaviour; they are not a source of configuration needs. */
const isTestFile = (rel) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(rel);

// Root-level config files are consumers too: next.config.ts reads the CSP
// rollout switches, and nothing under src/ does. Scanning only src/ would have
// reported them as undocumented.
for (const name of ["next.config.ts", "next.config.mjs", "next.config.js", "instrumentation.ts"]) {
  const p = join(ROOT, name);
  if (existsSync(p)) rootConfigs.push(p);
}

// ---------------------------------------------------------------- code side
/** `process.env.NAME` — static member access only. Dynamic lookups
 * (`process.env[key]`) are not resolvable statically and are intentionally not
 * guessed at; env.ts is the single place that reads the whole object. */
const reads = new Map(); // NAME -> Set<relative file>
for (const file of [...walk(join(ROOT, "src")), ...rootConfigs]) {
  const rel = relative(ROOT, file);
  if (rel.endsWith(".d.ts")) continue; // declarations describe, they don't read
  if (isTestFile(rel)) continue;
  const text = stripComments(readFileSync(file, "utf8"));
  for (const match of text.matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g)) {
    const name = match[1];
    if (FRAMEWORK_PROVIDED.has(name)) continue;
    if (IGNORE_PATTERNS.some((re) => re.test(name))) continue;
    if (!reads.has(name)) reads.set(name, new Set());
    reads.get(name).add(rel);
  }
}

// Modules that take the environment as an injected parameter (so they can be
// unit-tested) read it as `env.NAME` / `requireValue("NAME")` instead of
// `process.env.NAME`. They are listed explicitly rather than matching every
// `env.NAME`, which would also sweep in already-parsed config objects.
for (const rel of ["src/lib/email/transport-config.ts"]) {
  const text = stripComments(readFileSync(join(ROOT, rel), "utf8"));
  for (const match of text.matchAll(/\benv\.([A-Z][A-Z0-9_]*)|requireValue\("([A-Z][A-Z0-9_]*)"\)/g)) {
    const name = match[1] ?? match[2];
    if (FRAMEWORK_PROVIDED.has(name)) continue;
    if (!reads.has(name)) reads.set(name, new Set());
    reads.get(name).add(rel);
  }
}

// Also count the variables declared in the zod schemas: those ARE read (via the
// parsed object), just not through a literal `process.env.X` expression.
// Indentation-agnostic on purpose: the shared sub-schemas (pool, SMTP) are
// indented differently from the scope-level ones, and a fixed-width match
// silently skipped DATABASE_POOL_MAX the first time this ran.
const envModule = readFileSync(join(ROOT, "src/lib/env.ts"), "utf8");
for (const match of envModule.matchAll(/^\s+([A-Z][A-Z0-9_]*):/gm)) {
  const name = match[1];
  if (FRAMEWORK_PROVIDED.has(name)) continue;
  if (!reads.has(name)) reads.set(name, new Set());
  reads.get(name).add("src/lib/env.ts (schema)");
}

// ---------------------------------------------------------------- docs side
const examplePath = join(ROOT, ".env.example");
if (!existsSync(examplePath)) {
  console.error("check-env: .env.example is missing — nothing to compare against.");
  process.exit(1);
}
const documented = new Set();
for (const line of readFileSync(examplePath, "utf8").split("\n")) {
  const m = /^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=/.exec(line);
  if (m && !FRAMEWORK_PROVIDED.has(m[1])) documented.add(m[1]);
}

// ---------------------------------------------------------------- other consumers
// A variable can be consumed by something other than src/: docker-compose
// defines the database container's own credentials, the Dockerfile and CI
// workflows pass build/runtime values, and scripts/ reads operational ones.
// Calling those "stale docs" would be wrong, so they are scanned too before
// anything is reported as unused.
const otherConsumers = [];
for (const candidate of ["docker-compose.yml", "docker-compose.yaml", "compose.yaml", "Dockerfile"]) {
  const p = join(ROOT, candidate);
  if (existsSync(p)) otherConsumers.push(p);
}
for (const dir of ["scripts", ".github/workflows"]) {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) continue;
  for (const name of readdirSync(abs)) {
    const p = join(abs, name);
    if (statSync(p).isFile() && /\.(sh|mjs|js|ts|ya?ml)$/.test(name) && name !== "check-env.mjs") otherConsumers.push(p);
  }
}
const consumedElsewhere = new Map();
for (const file of otherConsumers) {
  const text = readFileSync(file, "utf8");
  for (const match of text.matchAll(/\$\{?([A-Z][A-Z0-9_]*)\}?|\b([A-Z][A-Z0-9_]{2,})\s*:/g)) {
    const name = match[1] || match[2];
    if (!name || FRAMEWORK_PROVIDED.has(name)) continue;
    if (!consumedElsewhere.has(name)) consumedElsewhere.set(name, relative(ROOT, file));
  }
}

// ---------------------------------------------------------------- report
const undocumented = [...reads.keys()].filter((n) => !documented.has(n)).sort();
const stale = [...documented].filter((n) => !reads.has(n) && !consumedElsewhere.has(n)).sort();
const documentedForInfra = [...documented].filter((n) => !reads.has(n) && consumedElsewhere.has(n)).sort();

if (AS_JSON) {
  console.log(
    JSON.stringify(
      {
        readInCode: [...reads.keys()].sort(),
        documented: [...documented].sort(),
        undocumented,
        stale,
        documentedForInfra,
        ok: undocumented.length === 0 && stale.length === 0,
      },
      null,
      2
    )
  );
} else {
  console.log(`check-env — ${reads.size} variable(s) read in src/, ${documented.size} documented in .env.example`);
  if (undocumented.length) {
    console.log("\n✗ Read by the code but NOT documented in .env.example:");
    for (const name of undocumented) {
      console.log(`    ${name.padEnd(34)} ${[...reads.get(name)].slice(0, 2).join(", ")}`);
    }
  }
  if (stale.length) {
    console.log("\n✗ Documented in .env.example but never read (stale docs):");
    for (const name of stale) console.log(`    ${name}`);
  }
  if (documentedForInfra.length) {
    console.log(
      `\n✓ Documented for infrastructure rather than src/ (compose/Dockerfile/CI/scripts): ${documentedForInfra.join(", ")}`
    );
  }
  if (!undocumented.length && !stale.length) {
    console.log("\n✓ No drift — every variable read is documented, and every documented variable is consumed.");
  }
}

process.exit(undocumented.length || stale.length ? 1 : 0);
