import { NextResponse } from "next/server"

import { buildHealthReport, type HealthReport } from "@/lib/cms/health"
import { getPayloadClient } from "@/lib/cms/payload-client"

/**
 * GET /api/health — a deployment self-check.
 *
 * The logic lives in `src/lib/cms/health.ts` (it is unit-tested there);
 * this file is the transport: it runs the check, caches it for a few
 * seconds so the endpoint cannot be used to hammer the database, and
 * answers with JSON.
 *
 * The response never contains a secret, a host name or a password — see the
 * module's header for the rules it follows.
 */
export const dynamic = "force-dynamic"

/** A stale answer is worse than a slow one, but not by much. */
const CACHE_TTL_MS = 15_000

let cached: { at: number; report: HealthReport } | null = null

async function countProducts(): Promise<number> {
  const payload = await getPayloadClient()
  const result = await payload.find({ collection: "products", limit: 1, depth: 0 })
  return result.totalDocs
}

export async function GET() {
  const now = Date.now()
  if (!cached || now - cached.at > CACHE_TTL_MS) {
    cached = {
      at: now,
      report: await buildHealthReport({
        env: process.env,
        readCatalogCount: countProducts,
      }),
    }
  }
  return NextResponse.json(cached.report, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  })
}
