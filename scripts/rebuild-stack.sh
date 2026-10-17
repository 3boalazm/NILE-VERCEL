#!/usr/bin/env bash
# Full-stack rebuild for this environment after a sandbox wipe.
#
# WHY THIS EXISTS: the sandbox does not persist node_modules, /tmp, or
# running processes between turns (snapshot exclusions). Every rebuild used
# to be re-derived from chat history — this script makes it one command.
# Order matters and is easy to get wrong:
#
#   1. Payload seed MUST run BEFORE Vendure's schema is created: Payload's
#      drizzle-kit push (0.31.7) crashes when it introspects existing Vendure
#      tables with composite primary keys (it drops the query params).
#   2. pg is pinned to 8.16.3 (8.23 breaks @payloadcms/drizzle 3.88).
#   3. npm installs run BEFORE the @nestjs symlinks are re-created (any npm
#      invocation prunes them). Symlinks — NOT copies: a copy would create a
#      second @nestjs runtime and break Nest DI token identity.
#   4. node_modules/.cache/static is a REAL copy re-made every rebuild (the
#      sandbox converts symlinks there into partial real directories).
#   5. The catalog/demo seeders talk to a RUNNING server — a temporary one
#      is started here and killed afterwards.
#
# Usage: bash scripts/rebuild-stack.sh
# Then start the long-running processes (vendure server/worker bundles,
# storefront `npm run start`) separately.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "── 1/5 node_modules"
if [ ! -d node_modules/@vendure/core ]; then
  npm ci --legacy-peer-deps
fi
if [ "$(node -e "console.log(require('pg/package.json').version)")" != "8.16.3" ]; then
  npm i --no-save --legacy-peer-deps pg@8.16.3 >/dev/null 2>&1
fi
# Playwright's CDN is unreachable from this sandbox — the e2e browser comes
# from @sparticuz/chromium (npm), which extracts to /tmp/chromium + /tmp/al2023.
if [ ! -x /tmp/chromium ]; then
  ls -d node_modules/@sparticuz/chromium >/dev/null 2>&1 || npm i --no-save --legacy-peer-deps @sparticuz/chromium >/dev/null 2>&1 || true
  node --input-type=module -e "import('@sparticuz/chromium').then(async (m) => { await m.default.executablePath(); console.log('   /tmp/chromium extracted'); })" || true
fi
echo "   pg $(node -e "console.log(require('pg/package.json').version)") pinned"
# LAST of the npm work: re-apply peers + @nestjs symlinks + shim
bash scripts/fix-node-env.sh

echo "── 2/5 .env"
if [ ! -f .env ]; then
  cat > .env <<ENV
PAYLOAD_SECRET=$(openssl rand -base64 32)
DATABASE_URI=postgresql://postgres:npf-local-2026@localhost:5432/npf
DB_HOST=localhost
DB_PORT=5432
DB_NAME=npf
DB_USERNAME=postgres
DB_PASSWORD=npf-local-2026
DB_SCHEMA=public
COOKIE_SECRET=$(openssl rand -base64 32)
DATABASE_POOL_MAX=10
APP_ENV=dev
VENDURE_SERVER_PORT=3001
SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=Npf-Demo-2026!Admin
SEED_ADMIN_PASSWORD=Npf-Demo-2026!Payload
VENDURE_SHOP_API_URL=http://localhost:3001/shop-api
NEXT_PUBLIC_HOME_HERO_DARK=0
NEXT_PUBLIC_HERO_WEBGL=0
MOCK_BLOG_FALLBACK=0
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
NPF_SESSION_MAX_AGE_DAYS=30
NPF_CSP_MODE=enforce
SMTP_PORT=587
SMTP_SECURE=false
STOREFRONT_URL=http://localhost:3000
VENDURE_PUBLIC_URL=http://localhost:3001
NPF_REQUIRE_EMAIL_VERIFICATION=false
ENV
  # Optional env keys must be ABSENT, not empty (zod .optional() rejects "").
  echo "   .env generated"
fi

echo "── 3/5 postgres + database"
PG_BIN=node_modules/@embedded-postgres/linux-x64/native/bin
if [ ! -d /tmp/pgdata ]; then
  "$PG_BIN/initdb" -D /tmp/pgdata -U postgres --auth=trust -E UTF8 > /tmp/initdb.log 2>&1
  echo "   initdb done"
fi
"$PG_BIN/pg_ctl" -D /tmp/pgdata -o "-p 5432 -h 127.0.0.1 -c listen_addresses=127.0.0.1" -l /tmp/pg.log start > /dev/null 2>&1 || true
sleep 2
node -e "
const { Client } = require('pg');
(async () => {
  const c = new Client({ host:'127.0.0.1', port:5432, user:'postgres', database:'postgres' });
  await c.connect();
  const r = await c.query(\"SELECT 1 FROM pg_database WHERE datname='npf'\");
  if (!r.rowCount) await c.query('CREATE DATABASE npf');
  await c.end();
  console.log('   db npf ready');
})()"

set -a; . ./.env; set +a

echo "── 4/5 vendure bundles + static copy"
EX="--external:@vendure/core --external:@vendure/email-plugin --external:@vendure/asset-server-plugin --external:@vendure/graphiql-plugin --external:@vendure/dashboard/plugin"
mkdir -p node_modules/.cache/npf-vendure
npx esbuild src/index.ts --bundle --platform=node --format=cjs --target=node22 $EX --outfile=node_modules/.cache/npf-vendure/server.cjs 2>&1 | tail -1
npx esbuild src/index-worker.ts --bundle --platform=node --format=cjs --target=node22 $EX --outfile=node_modules/.cache/npf-vendure/worker.cjs 2>&1 | tail -1
rm -rf node_modules/.cache/static
cp -r static node_modules/.cache/static

FRESH=$(node -e "
const { Client } = require('pg');
(async () => {
  const c = new Client({ host:'127.0.0.1', port:5432, user:'postgres', database:'npf' });
  await c.connect();
  const r = await c.query(\"SELECT count(*)::int n FROM information_schema.tables WHERE table_name='channel'\");
  console.log(r.rows[0].n > 0 ? 'no' : 'yes');
  await c.end();
})()")

echo "── 5/5 seeds (fresh=$FRESH; Payload FIRST, then Vendure) — temp server on 3001"
node node_modules/.cache/npf-vendure/server.cjs > /tmp/seed-server.log 2>&1 &
SEED_PID=$!
for i in $(seq 1 30); do
  curl -sf http://127.0.0.1:3001/health > /dev/null 2>&1 && break
  sleep 1
done

if [ "$FRESH" = "yes" ]; then
  npm run seed 2>&1 | tail -1
  SMTP_HOST=x SMTP_USER=x SMTP_PASS=x npx vendure migrate -r 2>&1 | tail -1
  # Kill the temp server: it cached "no channel" state; bootstrap re-seeds
  # defaults on its own boot (port 3011).
  kill "$SEED_PID" 2>/dev/null || true
  wait "$SEED_PID" 2>/dev/null || true
  node -e "
const { Client } = require('pg');
(async () => {
  const c = new Client({ host:'127.0.0.1', port:5432, user:'postgres', database:'npf' });
  await c.connect();
  const seller = await c.query('INSERT INTO seller (name, \"createdAt\", \"updatedAt\") VALUES (\$1, now(), now()) RETURNING id', ['Nile Pharma Food']);
  await c.query('INSERT INTO channel (code, token, \"defaultLanguageCode\", \"defaultCurrencyCode\", \"availableCurrencyCodes\", \"availableLanguageCodes\", \"pricesIncludeTax\", \"trackInventory\", \"outOfStockThreshold\", \"createdAt\", \"updatedAt\", \"sellerId\") VALUES (\$1,\$2,\$3,\$4,\$5,\$6,false,true,0,now(),now(),\$7)',
    ['__default_channel__','__default_channel_token__','en','EGP','EGP','en,ar', seller.rows[0].id]);
  console.log('   default channel + seller created');
  await c.end();
})()"
  PORT=3011 node scripts/bootstrap-vendure-db.mjs 2>&1 | tail -1
  node node_modules/.cache/npf-vendure/server.cjs >> /tmp/seed-server.log 2>&1 &
  SEED_PID=$!
  for i in $(seq 1 30); do
    curl -sf http://127.0.0.1:3001/health > /dev/null 2>&1 && break
    sleep 1
  done
fi

node scripts/dump-catalog.mjs > /dev/null
CATALOG_JSON=/tmp/catalog.json node scripts/seed-vendure-catalog.mjs 2>&1 | tail -1
node scripts/seed-vendure-demo.cjs 2>&1 | tail -1
kill "$SEED_PID" 2>/dev/null || true
wait "$SEED_PID" 2>/dev/null || true

echo "rebuild complete — start: vendure server (cache bundle), worker, then \`npm run start\`"
