import "server-only"
import { cookies } from "next/headers"

/**
 * The Vendure session identity lives in a Next.js-owned httpOnly cookie
 * holding the `vendure-auth-token` bearer token — never Vendure's own
 * session cookie (that would require sharing cookies across the
 * storefront's and Vendure's origins). Readable from Server Components;
 * writable only from Server Actions/Route Handlers (Next.js restriction).
 */
const VENDURE_TOKEN_COOKIE = "npf-vendure-token"

/**
 * F-56 — session lifetime was one year, which turns a lost phone or a shared
 * family computer into a year-long open session on a pharmacy account with
 * order history and saved addresses. Thirty days is the ceiling the register
 * asks for; it is tunable downwards (a stricter deployment may want 7) but
 * clamped at 30 so a typo in the environment cannot silently reinstate the
 * year-long session. Changing this does not log anyone out mid-session: the
 * cookie is rewritten on every `setVendureToken`, so active users keep rolling
 * forward and only genuinely idle sessions expire.
 */
const MAX_SESSION_DAYS = 30
const requestedDays = Number(process.env.NPF_SESSION_MAX_AGE_DAYS)
const SESSION_DAYS =
  Number.isFinite(requestedDays) && requestedDays > 0
    ? Math.min(MAX_SESSION_DAYS, Math.floor(requestedDays))
    : MAX_SESSION_DAYS
const SESSION_MAX_AGE_SECONDS = SESSION_DAYS * 24 * 60 * 60

export async function getVendureToken(): Promise<string | undefined> {
  const store = await cookies()
  return store.get(VENDURE_TOKEN_COOKIE)?.value
}

export async function setVendureToken(token: string | undefined) {
  if (!token) return
  const store = await cookies()
  store.set(VENDURE_TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
}

/** Logout needs to actually remove the cookie, not just skip setting a new
 * one — setVendureToken(undefined) is a no-op by design (every other
 * caller passes "keep whatever token we already had" when Vendure doesn't
 * issue a fresh one), so a separate function is clearer than overloading
 * that one with a special-case flag. */
export async function clearVendureToken() {
  const store = await cookies()
  store.delete(VENDURE_TOKEN_COOKIE)
}
