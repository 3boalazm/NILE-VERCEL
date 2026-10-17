/**
 * F-54 — input shape guards for identifiers that reach the databases.
 *
 * A malformed id used to travel all the way into Payload/Vendure and come
 * back as a 500: the request was never valid, so the honest answers are 404
 * (path segment — the resource shape cannot exist) or "no match" (lookup
 * returns null), never a server error. Guarding at the repository/transport
 * edge means EVERY caller is covered, not just the pages we remembered.
 *
 * Patterns are deliberately permissive about legitimate values (Vendure
 * order codes are uppercase alphanumerics; our slugs are kebab-case) and
 * reject everything else, including quotes, spaces and SQL/GraphQL
 * metacharacters.
 */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+){0,12}$/
export const ORDER_CODE_PATTERN = /^[A-Z0-9][A-Z0-9-]{4,23}$/i

export function isValidSlug(value: string): boolean {
  return value.length <= 80 && SLUG_PATTERN.test(value)
}

export function isValidOrderCode(value: string): boolean {
  return ORDER_CODE_PATTERN.test(value)
}
