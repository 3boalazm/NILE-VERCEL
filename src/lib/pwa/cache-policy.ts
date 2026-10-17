export const LEGACY_PRIVATE_CACHES = [
  "pages",
  "pages-rsc",
  "pages-rsc-prefetch",
  "others",
  "next-data",
  "static-data-assets",
] as const

/** Only public, known asset directories / brand files may enter media cache.
 * A request's destination alone isn't proof that its response is public. */
export function isPublicMediaPath(url: URL): boolean {
  const path =
    url.pathname === "/_next/image"
      ? url.searchParams.get("url") || ""
      : url.pathname
  return (
    /^\/(products|categories|stock|team|art|care-atlas)\//.test(path) ||
    /^\/(npf-logo(?:-white)?|npf-mark-white|alfasigma-logo)\.svg$/.test(path) ||
    /^\/icon-(192|512)\.png$/.test(path)
  )
}

export async function purgePrivatePageCaches(): Promise<void> {
  if (!("caches" in globalThis)) return
  try {
    const keys = await caches.keys()
    await Promise.all(
      keys
        .filter((key) =>
          (LEGACY_PRIVATE_CACHES as readonly string[]).includes(key)
        )
        .map((key) => caches.delete(key))
    )
  } catch {
    /* Storage may be disabled. Never block account recovery on it. */
  }
}
