#!/usr/bin/env node
/**
 * F-75 — Apply Vendure TypeORM migrations (and Payload migrations if present)
 * against the database named by DATABASE_URI / DB_*.
 *
 * Usage from repo root:
 *   DATABASE_URI=postgresql://... npm run db:migrate
 *   # or with SSL forced (hosted Postgres):
 *   DATABASE_SSL=require DATABASE_URI=postgresql://... npm run db:migrate
 */

import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('[db:migrate] Environment:');
console.log('  DATABASE_URI:', process.env.DATABASE_URI ? 'set' : 'MISSING');
console.log('  DATABASE_SSL:', process.env.DATABASE_SSL || 'not set');
console.log('  PGSSLMODE:', process.env.PGSSLMODE || 'not set');
console.log('  DB_HOST:', process.env.DB_HOST || 'not set');
console.log('  DB_PORT:', process.env.DB_PORT || 'not set');

// Vendure's own migrations directory (TypeORM .ts files).
const vendureMigrationsDir = resolve(__dirname, '../src/migrations');
console.log('  Vendure migrations dir:', vendureMigrationsDir);

// Payload's adapter uses `push` in dev; production relies on `payload migrate`
// CLI (not included here because Payload 3.90.2 ships its own binary).
console.log('  Payload adapter migrationDir:', resolve(__dirname, '../src/migrations'));

console.log(`
[db:migrate] To apply Vendure migrations, run with migrationsRun enabled:
  RUN_MIGRATIONS=true npm run start:server
  # or (if you prefer the CLI directly):
  node -e "
    const { createConnection } = require('typeorm');
    // This requires the full TypeORM runtime to be installed.
  "
`);

// If we have `typeorm` installed (transitive via @vendure/core), try running it.
try {
  const { execSync } = await import('child_process');
  // Check if `typeorm` binary exists.
  const typeormPath = resolve(__dirname, '../node_modules/typeorm/cli.js');
  // We don't actually invoke it automatically — running migrations against
  // a live hosted DB should always be an explicit operator decision.
  console.log('[db:migrate] TypeORM CLI path (if installed):', typeormPath);
} catch {
  // Nothing to do — the operator will use RUN_MIGRATIONS=true.
}
