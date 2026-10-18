#!/usr/bin/env bash
# One command from a FRESH checkout (no Docker, no hosted DB) to the full
# working stack: embedded Postgres → Payload seed → Vendure migrations →
# Vendure server + worker → Vendure provisioning → audit.
#
#   npm ci
#   bash scripts/setup-local-stack.sh        # idempotent: safe to re-run
#   npm run dev                              # (or: npm run build && npm run start)
#
# State lives outside the repo: NPF_STACK_DIR (default /tmp/npf-stack) holds the
# Postgres data directory, logs and pid files. Delete that directory to start
# again from an empty database. A local .env is generated ONLY when missing and
# is git-ignored — never commit it.
#
# Why two databases: Payload (CMS) and Vendure (commerce) get their own
# (npf_payload / npf) so Payload's drizzle schema push never introspects
# Vendure's composite-PK tables (see DECISIONS.md "قاعدتان منفصلتان").
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$PWD"
STACK="${NPF_STACK_DIR:-/tmp/npf-stack}"
PGDATA="$STACK/pgdata"
PGPORT="${NPF_PG_PORT:-5432}"
PG_BIN="$ROOT/node_modules/@embedded-postgres/linux-x64/native/bin"
mkdir -p "$STACK"

step() { printf '\n── %s\n' "$*"; }

step "1/7 dependencies"
[ -d node_modules/@vendure/core ] || npm ci
[ -x "$PG_BIN/initdb" ] || { echo "embedded-postgres binaries missing (npm ci not finished?)"; exit 1; }

step "2/7 postgres (embedded, port $PGPORT)"
# Postgres refuses to run as root; in a root sandbox use a throwaway user.
as_pg() { if [ "$(id -u)" = 0 ]; then su -s /bin/bash npfpg -c "$*"; else bash -c "$*"; fi; }
if [ "$(id -u)" = 0 ]; then
  id npfpg >/dev/null 2>&1 || useradd -m npfpg
  chmod -R o+rX "$ROOT" 2>/dev/null || true
  mkdir -p "$STACK" && chown npfpg "$STACK"
fi
if [ ! -f "$PGDATA/PG_VERSION" ]; then
  as_pg "'$PG_BIN/initdb' -D '$PGDATA' -U postgres --auth=trust -E UTF8" >"$STACK/initdb.log" 2>&1
fi
if ! as_pg "'$PG_BIN/pg_ctl' -D '$PGDATA' status" >/dev/null 2>&1; then
  as_pg "'$PG_BIN/pg_ctl' -D '$PGDATA' -o '-p $PGPORT -h 127.0.0.1' -l '$STACK/pg.log' start" >/dev/null
fi
for _ in $(seq 1 30); do
  node -e "const {Client}=require('pg');const c=new Client({host:'127.0.0.1',port:$PGPORT,user:'postgres',database:'postgres'});c.connect().then(()=>c.end()).catch(()=>process.exit(1))" 2>/dev/null && break
  sleep 1
done
node -e "
const {Client}=require('pg');
(async()=>{const c=new Client({host:'127.0.0.1',port:$PGPORT,user:'postgres',database:'postgres'});await c.connect();
for(const d of ['npf','npf_payload']){const r=await c.query('SELECT 1 FROM pg_database WHERE datname=\$1',[d]);if(!r.rowCount)await c.query('CREATE DATABASE '+d)}
await c.end();console.log('   databases npf + npf_payload ready')})()"

step "3/7 .env (generated only if missing; git-ignored)"
if [ ! -f .env ]; then
  cat > .env <<ENV
PAYLOAD_SECRET=$(openssl rand -base64 32)
DATABASE_URI=postgresql://postgres:x@127.0.0.1:$PGPORT/npf_payload
DB_HOST=127.0.0.1
DB_PORT=$PGPORT
DB_NAME=npf
DB_USERNAME=postgres
DB_PASSWORD=x
DB_SCHEMA=public
COOKIE_SECRET=$(openssl rand -base64 32)
DATABASE_POOL_MAX=10
APP_ENV=dev
VENDURE_SERVER_PORT=3001
SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=Npf-Local-$(openssl rand -hex 6)
SEED_ADMIN_EMAIL=admin@example.test
SEED_ADMIN_PASSWORD=Npf-Local-$(openssl rand -hex 6)
VENDURE_SHOP_API_URL=http://localhost:3001/shop-api
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
STOREFRONT_URL=http://localhost:3000
VENDURE_PUBLIC_URL=http://localhost:3001
NPF_SESSION_MAX_AGE_DAYS=30
NPF_CSP_MODE=enforce
NPF_REQUIRE_EMAIL_VERIFICATION=false
ENV
  echo "   .env generated"
else
  echo "   .env exists (kept)"
fi
set -a; . ./.env; set +a
# APP_ENV must be exactly "dev" for local work (GraphiQL, debug); production is "production".

step "4/7 Payload seed (CMS catalog, articles, first admin)"
npm run seed 2>&1 | tail -3

step "5/7 build + start Vendure server (runs pending migrations) and worker"
node scripts/build-vendure.mjs >/dev/null
mkdir -p static
stop_pid() { [ -f "$1" ] && kill "$(cat "$1")" 2>/dev/null || true; rm -f "$1"; }
stop_pid "$STACK/server.pid"; stop_pid "$STACK/worker.pid"
RUN_MIGRATIONS=true setsid nohup node dist/index.js >"$STACK/server.log" 2>&1 </dev/null & echo $! >"$STACK/server.pid"
for _ in $(seq 1 90); do
  curl -sf "http://127.0.0.1:${VENDURE_SERVER_PORT:-3001}/health" >/dev/null 2>&1 && break
  sleep 1
done
curl -sf "http://127.0.0.1:${VENDURE_SERVER_PORT:-3001}/health" >/dev/null || { echo "Vendure server did not come up — see $STACK/server.log"; exit 1; }
setsid nohup node dist/index-worker.js >"$STACK/worker.log" 2>&1 </dev/null & echo $! >"$STACK/worker.pid"
sleep 6   # let the worker register its queues before the reindex job is queued

step "6/7 Vendure provisioning (zone, tax, channel, catalog, assets, payment, shipping, roles, reindex)"
node scripts/seed-vendure-catalog.mjs
node scripts/seed-vendure-demo.cjs

step "7/7 audit"
node scripts/vendure-audit.mjs

cat <<MSG

Stack is up:  Postgres :$PGPORT · Vendure API :${VENDURE_SERVER_PORT:-3001} (+ worker)
Next:         set -a; . ./.env; set +a; npm run dev      # storefront on :3000
Stop:         kill \$(cat $STACK/server.pid $STACK/worker.pid); pg_ctl -D $PGDATA stop
MSG
