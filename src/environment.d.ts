import type { PayloadEnv, VendureEnv } from "./lib/env"

/**
 * Every environment variable this app reads is declared exactly once — in the
 * zod schemas in `src/lib/env.ts` — and the raw `process.env` types below are
 * *derived* from those schemas rather than hand-listed a second time.
 *
 * Why this file changed (F-11): it came from the Vendure scaffold and
 * hand-declared twelve names, all non-optional, including `DB_PORT: number` —
 * a type lie, since every environment variable is a string at runtime. That
 * combination is what made `+process.env.DB_PORT` look type-safe while
 * silently producing `NaN` when the variable was unset, and it let
 * `.env.example` drift away from the names the code actually reads (the
 * `SUPERADMIN_USER` vs `SUPERADMIN_USERNAME` mismatch shipped a super-admin
 * nobody could log in as).
 *
 * Contract now: raw access is honestly `string | undefined`; code that needs a
 * validated, coerced value parses a schema via `parseEnvOrThrow()` instead of
 * reading `process.env` directly. Adding a variable means adding it to a
 * schema in `src/lib/env.ts` — this file needs no edit, and
 * `scripts/check-env.mjs` fails CI if the variable is missing from
 * `.env.example`.
 */
type ValidatedEnvVar = keyof PayloadEnv | keyof VendureEnv

declare global {
    namespace NodeJS {
        // Empty on purpose: every member comes from the extended Record type.
        // An `interface` (not a `type`) is required here because augmenting
        // @types/node's ProcessEnv only works through declaration merging.
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        interface ProcessEnv extends Partial<Record<ValidatedEnvVar, string>> {}
    }
}

export {}
