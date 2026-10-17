import "server-only"

import { createHash } from "node:crypto"

import type { CartReadState, Order } from "@/lib/cart/types"
import { logWarn } from "@/lib/observability/log"
import { isValidOrderCode } from "@/lib/validation/identifiers"
import { vendureRequest } from "./client"
import { getVendureToken } from "./session"
import { ACTIVE_ORDER_QUERY, ORDER_BY_CODE_QUERY } from "./queries"
import { toCartItems, toOrderSummary, type VendureOrderResponse } from "./order-mapper"

/**
 * Read-only — safe to call during Server Component rendering (e.g. the
 * root layout, for the header cart count). Never writes the session
 * cookie: Next.js only allows `cookies().set()` from a Server Action or
 * Route Handler, not during render. If Vendure happens to issue a fresh
 * token on a plain read (it usually doesn't — sessions are normally
 * established on the first real mutation), that token is intentionally
 * discarded here; a real session gets persisted the first time the
 * customer actually adds an item (see cart/actions.ts). The cart read also
 * preserves the distinction between an available empty cart and an
 * unavailable commerce service.
 */
export async function readActiveOrderItems(): Promise<CartReadState> {
  const token = await getVendureToken()
  const sessionKey = token ? createHash("sha256").update(token).digest("hex") : "anonymous"
  if (!token) return { status: "available", items: [], sessionKey }
  try {
    const { data } = await vendureRequest<{ activeOrder: VendureOrderResponse | null }>(
      ACTIVE_ORDER_QUERY,
      {},
      token
    )
    return { status: "available", items: toCartItems(data.activeOrder), sessionKey }
  } catch (error) {
    // Empty and unavailable are different states. Keep the render alive, but
    // let the cart provider show a recoverable outage state instead of
    // telling the customer that a real server-side cart is empty.
    logWarn("vendure:active-order", "activeOrder read failed; cart availability is unknown", {
      message: error instanceof Error ? error.message : String(error),
    })
    return { status: "unavailable", items: [], sessionKey }
  }
}

/** Same render-safe constraint as readActiveOrderItems — the confirmation
 * page (a Server Component) looks up a just-placed order by its Vendure
 * code from the URL, which must never write the session cookie either. */
export async function readOrderByCode(code: string): Promise<Order | null> {
  // F-54: order codes come from the URL (?order=…), i.e. from anyone. A
  // malformed one must read as "no such order" (null → the page's empty
  // state / 404), never as a GraphQL error → 500.
  if (!isValidOrderCode(code)) return null
  const token = await getVendureToken()
  try {
    const { data } = await vendureRequest<{ orderByCode: VendureOrderResponse | null }>(
      ORDER_BY_CODE_QUERY,
      { code },
      token
    )
    return data.orderByCode ? toOrderSummary(data.orderByCode) : null
  } catch {
    logWarn("vendure:order-by-code", "orderByCode read failed")
    return null
  }
}
