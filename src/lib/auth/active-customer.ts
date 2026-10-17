import "server-only"

import { cache } from "react"

import { logWarn } from "@/lib/observability/log"
import { vendureRequest } from "@/lib/vendure/client"
import { getVendureToken } from "@/lib/vendure/session"
import {
  ACTIVE_CUSTOMER_QUERY,
  CUSTOMER_ADDRESSES_QUERY,
} from "@/lib/vendure/queries"
import {
  toAddress,
  toCustomer,
  type VendureActiveCustomerResponse,
  type VendureAddressResponse,
} from "./customer-mapper"
import type { Address, Customer } from "./types"

/**
 * Read-only, render-safe — same constraint as readActiveOrderItems/
 * readOrderByCode in active-order.ts: never writes the session cookie, so
 * it's safe to call from a Server Component (layouts, protected page
 * guards). Returns null for a guest session, not an error — every account
 * page checks this and redirects to /login when null.
 */
type CustomerReadState =
  | { status: "available"; customer: Customer | null }
  | { status: "unavailable"; customer: null }

export const readActiveCustomerState = cache(
  async function readActiveCustomerState(): Promise<CustomerReadState> {
    // cache(): the root layout, account layout, and account pages each call
    // this during one render — without request memoization that's 3
    // identical Vendure round trips per account page view.
    const token = await getVendureToken()
    if (!token) return { status: "available", customer: null }
    try {
      const { data } = await vendureRequest<{
        activeCustomer: VendureActiveCustomerResponse | null
      }>(ACTIVE_CUSTOMER_QUERY, {}, token)
      return { status: "available", customer: toCustomer(data.activeCustomer) }
    } catch {
      logWarn(
        "vendure:active-customer",
        "activeCustomer read failed; customer status unavailable"
      )
      return { status: "unavailable", customer: null }
    }
  }
)

/** Header can degrade without taking down editorial pages. */
export async function getActiveCustomer(): Promise<Customer | null> {
  return (await readActiveCustomerState()).customer
}
/** Protected pages must not interpret a backend outage as an empty account. */
export async function requireActiveCustomer(): Promise<Customer | null> {
  const state = await readActiveCustomerState()
  if (state.status === "unavailable")
    throw new Error("commerce_temporarily_unavailable")
  return state.customer
}

export async function getActiveCustomerAddresses(): Promise<Address[]> {
  const token = await getVendureToken()
  if (!token) return []
  try {
    const { data } = await vendureRequest<{
      activeCustomer: { id: string; addresses: VendureAddressResponse[] } | null
    }>(CUSTOMER_ADDRESSES_QUERY, {}, token)
    return (data.activeCustomer?.addresses ?? []).map(toAddress)
  } catch {
    logWarn(
      "vendure:customer-addresses",
      "customer addresses read failed; showing recovery state"
    )
    throw new Error("commerce_temporarily_unavailable")
  }
}
