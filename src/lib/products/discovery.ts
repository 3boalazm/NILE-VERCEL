/** Preserve only discovery context, never auth tokens or arbitrary redirect URLs. */
export function localizedDiscoveryHref(
  pathname: string,
  search: string | URLSearchParams,
  locale: "ar" | "en"
): string {
  const parts = pathname.split("/")
  parts[1] = locale
  const query = new URLSearchParams(search)
  const allowed = new URLSearchParams()
  for (const key of ["q", "category", "need", "sort", "product"]) {
    const value = query.get(key)
    if (value) allowed.set(key, value.slice(0, 200))
  }
  return `${parts.join("/") || `/${locale}`}${allowed.size ? `?${allowed}` : ""}`
}
