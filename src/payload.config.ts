import path from "path"
import { fileURLToPath } from "url"

import { postgresAdapter } from "@payloadcms/db-postgres"
import { lexicalEditor } from "@payloadcms/richtext-lexical"
import sharp from "sharp"
import { buildConfig } from "payload"

import { npfEmailAdapter } from "./lib/email/payload-adapter"
import { parseEnvOrThrow, payloadEnvSchema, payloadEnvWarnings, warnEnvIssues } from "./lib/env"
import { Categories } from "./collections/Categories"
import { Inquiries } from "./collections/Inquiries"
import { ErasureRequests } from "./collections/ErasureRequests"
import { Wishlists } from "./collections/Wishlists"
import { Articles } from "./collections/Articles"
import { Jobs } from "./collections/Jobs"
import { Media } from "./collections/Media"
import { Products } from "./collections/Products"
import { Users } from "./collections/Users"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// F-11 — fail fast, not silently, and not one variable at a time.
//
// A missing secret/connection string used to fall back to "" (postgresAdapter
// would then fail deep inside a pool-connect error, and an empty PAYLOAD_SECRET
// is a real security risk — Payload signs JWTs and encrypts fields with it).
// The first version of this guard threw on the *first* missing var, so a fresh
// clone needed a start-and-fix cycle per variable; the zod schema in
// src/lib/env.ts reports all of them together and points at .env.example.
// Optional-but-consequential gaps (no SMTP host, no STOREFRONT_URL) warn
// instead of throwing, because offline/mock development is supported on
// purpose (MOCK_CATALOG_FALLBACK=1).
const env = parseEnvOrThrow(payloadEnvSchema, "payload")
warnEnvIssues("payload", payloadEnvWarnings(env))

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [Users, Media, Categories, Products, Articles, Jobs, Inquiries, ErasureRequests, Wishlists],
  // F-52: sends CMS-side mail over SMTP when `SMTP_HOST` is configured, and
  // otherwise logs + resolves instead of throwing — an unconfigured mailer
  // must not turn a contact-inquiry submission into a 500. Previously there
  // was no `email` config at all, so Payload used its console transport and
  // nothing could ever be delivered in production.
  email: npfEmailAdapter,
  graphQL: { disablePlaygroundInProduction: true },
  editor: lexicalEditor(),
  secret: env.PAYLOAD_SECRET,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: env.DATABASE_URI,
      // F-71 — explicit pool ceiling (pg's own default is max: 10 *per
      // process*). Shared with Vendure's `extra.max` via the same validated
      // DATABASE_POOL_MAX so both sides of the one physical database agree,
      // instead of each driver silently picking its own default.
      max: env.DATABASE_POOL_MAX,
    },
  }),
  sharp,
})
