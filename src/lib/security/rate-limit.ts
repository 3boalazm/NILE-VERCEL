import "server-only"
import { isIP } from "node:net"
import { headers } from "next/headers"

/** Trust a proxy header only after the deployment explicitly identifies its
 * overwrite policy / trusted hop count. Never trust attacker-prepended XFF. */
export async function getClientIp(): Promise<string> {
  const h = await headers()
  const trusted = process.env.TRUSTED_CLIENT_IP_HEADER
  if (trusted === "x-real-ip" || trusted === "cf-connecting-ip") {
    const value = h.get(trusted)?.trim() ?? ""
    return isIP(value) ? value : "unknown"
  }
  const hops = Number(process.env.TRUSTED_PROXY_HOPS)
  if (Number.isInteger(hops) && hops > 0 && hops <= 10) {
    const chain = (h.get("x-forwarded-for") ?? "")
      .split(",")
      .map((v) => v.trim())
    const value = chain[chain.length - hops] ?? ""
    return isIP(value) ? value : "unknown"
  }
  return "unknown"
}

const MAX_KEYS = 10_000
const hits = new Map<string, { times: number[]; expires: number }>()
let nextSweep = 0
/** Bounded per-process sliding windows. At capacity reject unknown keys,
 * rather than evict a victim's counter and enable brute-force bypass.
 * Multi-replica deployments still require an edge/shared rate limiter. */
export function isRateLimited(
  key: string,
  windowMs: number,
  max: number
): boolean {
  if (
    !key ||
    key.length > 512 ||
    !Number.isFinite(windowMs) ||
    windowMs <= 0 ||
    !Number.isInteger(max) ||
    max < 1 ||
    max > 1000
  )
    return true
  const now = Date.now()
  if (now >= nextSweep || hits.size >= MAX_KEYS) {
    for (const [k, v] of hits) if (v.expires <= now) hits.delete(k)
    nextSweep = now + 30_000
  }
  const previous = hits.get(key)
  if (!previous && hits.size >= MAX_KEYS) return true
  const recent = (previous?.times ?? []).filter((at) => at > now - windowMs)
  if (recent.length >= max) return true
  recent.push(now)
  hits.set(key, { times: recent, expires: now + windowMs })
  return false
}
