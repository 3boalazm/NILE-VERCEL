import { SITE_URL } from "@/lib/site-config"

/** The only origin a login redirect may resolve to — see site-config.ts. */
const INTERNAL_ORIGIN = SITE_URL

/**
 * Returns a login destination only when it is a path in the current locale.
 * Query-string values are attacker-controlled: validate both the raw value
 * and a bounded number of decoded forms so encoded slash/backslash and
 * protocol-relative bypasses cannot become a cross-origin navigation.
 */
export function getSafeLoginRedirect(value: string | null | undefined, locale: string): string {
  const fallback = `/${locale}/account`
  if (!value) return fallback

  const original = value
  let candidate = value
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (isUnsafeRedirect(candidate, locale)) return fallback
    try {
      const decoded = decodeURIComponent(candidate)
      if (decoded === candidate) break
      candidate = decoded
    } catch {
      return fallback
    }
  }

  if (isUnsafeRedirect(candidate, locale)) return fallback

  try {
    const resolved = new URL(candidate, INTERNAL_ORIGIN)
    const localeBase = `/${locale}`
    if (resolved.origin !== INTERNAL_ORIGIN || (resolved.pathname !== localeBase && !resolved.pathname.startsWith(`${localeBase}/`))) {
      return fallback
    }
  } catch {
    return fallback
  }

  return original
}

function isUnsafeRedirect(value: string, locale: string): boolean {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return true
  const path = value.split(/[?#]/, 1)[0]
  if (/%2f|%5c/i.test(path)) return true
  if (/^[a-z][a-z\d+.-]*:/i.test(value)) return true
  if (/[\u0000-\u001f\u007f]/.test(value)) return true

  const localeBase = `/${locale}`
  return value !== localeBase && !value.startsWith(`${localeBase}/`)
}
