#!/usr/bin/env bash
# Re-applies the environment fixes that any `npm install` undoes:
#  1. Absolute symlinks for @nestjs/* (npm resolves them nested under
#     @vendure/core; Nest's runtime requires them from the package root).
#  2. loadPackageSync shim in the vendure-nested @nestjs/common
#     (@vendure/dashboard pulls @nestjs/graphql@14 which imports it).
# Run after EVERY npm install / npm ci.
set -euo pipefail
cd "$(dirname "$0")/.."
# npm installs FIRST: any `npm i` prunes extraneous packages — the @nestjs
# copies below would be wiped by a later install.
ls -d node_modules/class-validator node_modules/class-transformer >/dev/null 2>&1 || npm i --no-save --legacy-peer-deps class-validator class-transformer >/dev/null 2>&1
node -e '
const fs=require("fs"),path=require("path");
const nested="node_modules/@vendure/core/node_modules/@nestjs";
fs.mkdirSync("node_modules/@nestjs",{recursive:true});
let n=0;
// SYMLINK (must resolve to the vendure nested copy — a real copy would create
// a second @nestjs runtime and break Nest DI token identity across plugins (no apostrophes inside this block)).
for (const name of fs.readdirSync(nested)) {
  const dest=path.resolve("node_modules/@nestjs", name);
  if (fs.existsSync(dest)) continue;
  fs.symlinkSync(path.resolve(nested, name), dest, "dir"); n++;
}
console.log("symlinked", n, "@nestjs packages");'
F=node_modules/@vendure/core/node_modules/@nestjs/common/utils/load-package.util.js
if [ -f "$F" ] && ! grep -q loadPackageSync "$F"; then
  cat >> "$F" <<'SH'
// env-fix (scripts/fix-node-env.sh): @nestjs/graphql@14 imports
// loadPackageSync; this vendure-nested common only exports loadPackage —
// they are the same sync operation.
exports.loadPackageSync = loadPackage;
SH
  echo "loadPackageSync shim applied"
fi
echo "node env fixed"
