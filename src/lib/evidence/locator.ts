/**
 * A public URL or media path is not an evidence authority and is not a
 * private file reference. Payload Media is public-read, so an `/api/media`
 * path is not a private document.
 */
export function isPrivateEvidenceLocator(locator: string): boolean {
  const value = locator.trim()
  if (!value || value.length > 200) return false
  if (/[\s?#]/.test(value)) return false
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return false
  if (value.startsWith("/") || value.startsWith("\\") || value.startsWith(".")) return false
  if (value.includes("..") || value.includes("/") || value.includes("\\")) return false
  if (/api\/media|\/media\//i.test(value)) return false
  return true
}

export function isAuthorizationName(name: string): boolean {
  const value = name.trim()
  if (!value || value.length > 200) return false
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return false
  if (value.includes("/") || value.includes("\\") || /api\/media/i.test(value)) return false
  return true
}
