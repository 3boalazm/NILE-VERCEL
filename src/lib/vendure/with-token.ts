import "server-only"

import { getVendureToken, setVendureToken } from "./session"

/**
 * Shared wrapper for every authenticated/session-bearing Shop API call:
 * reads the current session token, runs the request, persists whatever
 * token Vendure returns (a fresh one on login, an unchanged one otherwise).
 * Originally lived only in cart/actions.ts — extracted so auth/actions.ts
 * can reuse the exact same session mechanics rather than reimplementing
 * them, since Vendure's customer-login token and the cart's anonymous
 * order-session token are the same `vendure-auth-token` bearer, stored in
 * the same cookie (see session.ts).
 */
export async function withToken<T>(
  run: (token: string | undefined) => Promise<{ data: T; token: string | undefined }>
): Promise<T> {
  const token = await getVendureToken()
  const { data, token: nextToken } = await run(token)
  await setVendureToken(nextToken)
  return data
}
