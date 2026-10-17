"use server"

import { cookies } from "next/headers"

import { vendureRequest } from "@/lib/vendure/client"
import { readActiveOrderItems } from "@/lib/vendure/active-order"
import { withToken } from "@/lib/vendure/with-token"
import { resolveVariantIdBySlug } from "@/lib/vendure/product-map"
import { logError, logWarn } from "@/lib/observability/log"
import {
  toCartItems,
  toEligibleShippingMethods,
  toOrderSummary,
  type VendureOrderResponse,
} from "@/lib/vendure/order-mapper"
import {
  ACTIVE_ORDER_QUERY,
  ADD_ITEM_TO_ORDER_MUTATION,
  ADD_PAYMENT_TO_ORDER_MUTATION,
  ADJUST_ORDER_LINE_MUTATION,
  ELIGIBLE_SHIPPING_METHODS_QUERY,
  REMOVE_ORDER_LINE_MUTATION,
  SET_CUSTOMER_FOR_ORDER_MUTATION,
  SET_ORDER_CUSTOM_FIELDS_MUTATION,
  SET_SHIPPING_ADDRESS_MUTATION,
  SET_SHIPPING_METHOD_MUTATION,
  TRANSITION_ORDER_TO_STATE_MUTATION,
  ELIGIBLE_PAYMENT_METHODS_QUERY,
} from "@/lib/vendure/queries"
import type { CartItem, CartReadState, CheckoutCustomer, EligibleShippingMethod, FulfillmentMode, Order, PaymentMethod } from "./types"
import { validateCheckoutCustomer } from "./validation"

const PAYMENT_METHOD_CODE = "manual-settlement"

// Proof-of-purchase cookie: set only by placeOrder on success, read only
// by the confirmation page. Lets that page tell "the browser that just
// placed this order" apart from "anyone who guessed a code in the URL"
// (see confirmation/page.tsx). httpOnly so page JS can't forge or leak it.
const LAST_ORDER_COOKIE = "npf_last_order"
const LAST_ORDER_COOKIE_MAX_AGE = 60 * 60 * 12 // 12h — same-day revisits still work

export async function refreshCart(): Promise<CartReadState> {
  return readActiveOrderItems()
}

function isErrorResult(value: unknown): value is { errorCode: string; message: string } {
  return typeof value === "object" && value !== null && "errorCode" in value
}

export async function addToCart(
  slug: string,
  qty: number
): Promise<{ items: CartItem[]; error?: string }> {
  if (process.env.NPF_PREVIEW_MODE === "1") return {items:[],error:"preview_unavailable"}
  if (typeof slug !== "string" || !/^[a-z0-9-]{1,120}$/.test(slug) || !Number.isInteger(qty) || qty < 1 || qty > 99) return {items:[],error:"invalid_input"}
  try {
    const variantId = await resolveVariantIdBySlug(slug)
    if (!variantId) {
      // Silent here = invisible in prod. Warn so a broken slug-bridge shows
      // up in ops logs instead of just a UX-level "didn't add".
      logWarn("cart:add", "variant resolution returned null", { slug })
      return { items: [], error: "product_not_found" }
    }

    const data = await withToken<{ addItemToOrder: VendureOrderResponse | { errorCode: string; message: string } }>(
      (token) => vendureRequest(ADD_ITEM_TO_ORDER_MUTATION, { productVariantId: variantId, quantity: qty }, token)
    )
    const result = data.addItemToOrder
    if (isErrorResult(result)) {
      logWarn("cart:add", "vendure rejected the add", { slug, code: result.errorCode, message: result.message })
      return { items: [], error: result.errorCode }
    }
    return { items: toCartItems(result) }
  } catch (error) {
    logError("cart:add", error, { slug })
    return { items: [], error: "network_error" }
  }
}

export type ReorderResult = { items: CartItem[]; addedSlugs: string[]; unavailableSlugs: string[] }

/**
 * Re-adds a previous order's line items to the CURRENT cart, one at a time,
 * through the exact same addToCart() path a customer clicking "Add to
 * Cart" on a product page would use — same current-price/current-stock
 * resolution, same variant lookup, nothing about the historical order's
 * price or availability is trusted or restored. Continues past individual
 * failures (deleted/renamed/out-of-stock product) so one bad line doesn't
 * block the rest; the caller gets back exactly which slugs made it in and
 * which didn't, to tell the customer honestly rather than claim a full
 * reorder that wasn't.
 */
export async function reorderItems(lines: Array<{ slug: string; qty: number }>): Promise<ReorderResult> {
  const addedSlugs: string[] = []
  const unavailableSlugs: string[] = []
  let items: CartItem[] = []

  for (const line of lines) {
    const result = await addToCart(line.slug, line.qty)
    if (result.error) {
      unavailableSlugs.push(line.slug)
    } else {
      addedSlugs.push(line.slug)
      items = result.items
    }
  }

  // If every single line failed, `items` never got assigned — fetch the
  // (unchanged) cart once so the caller still gets an accurate current
  // state instead of an empty array that looks like the cart was cleared.
  if (addedSlugs.length === 0) {
    const current = await withToken<{ activeOrder: VendureOrderResponse | null }>((token) =>
      vendureRequest(ACTIVE_ORDER_QUERY, {}, token)
    )
    items = toCartItems(current.activeOrder)
  }

  return { items, addedSlugs, unavailableSlugs }
}

export async function updateCartLine(
  lineId: string,
  qty: number
): Promise<{ items: CartItem[]; error?: string }> {
  try {
    const mutation = qty <= 0 ? REMOVE_ORDER_LINE_MUTATION : ADJUST_ORDER_LINE_MUTATION
    const variables = qty <= 0 ? { orderLineId: lineId } : { orderLineId: lineId, quantity: qty }

    const data = await withToken<{
      adjustOrderLine?: VendureOrderResponse | { errorCode: string; message: string }
      removeOrderLine?: VendureOrderResponse | { errorCode: string; message: string }
    }>((token) => vendureRequest(mutation, variables, token))

    const result = data.adjustOrderLine ?? data.removeOrderLine
    if (!result || isErrorResult(result)) return { items: [], error: isErrorResult(result) ? result.errorCode : "unknown_error" }
    return { items: toCartItems(result) }
  } catch (error) {
    logError("cart:update", error, { lineId })
    return { items: [], error: "network_error" }
  }
}

export async function removeCartLine(lineId: string): Promise<{ items: CartItem[]; error?: string }> {
  return updateCartLine(lineId, 0)
}

// Prepaid (bank transfer) orders get 50% off door-to-door/branch-pickup
// shipping — read by the npf-shipping calculators via
// order.customFields.prepaidShipping (see apps/commerce/src/plugins/npf-shipping.ts).
// Must be set before the eligibleShippingMethods query so the price shown
// to the customer already reflects it.
async function setPrepaidShipping(paymentMethod: PaymentMethod) {
  const result = await withToken<{
    setOrderCustomFields: { id: string } | { errorCode: string; message: string }
  }>((token) =>
    vendureRequest(
      SET_ORDER_CUSTOM_FIELDS_MUTATION,
      { input: { customFields: { prepaidShipping: paymentMethod === "bank_transfer" || paymentMethod === "card" } } },
      token
    )
  )
  if (isErrorResult(result.setOrderCustomFields)) return result.setOrderCustomFields.errorCode
  return undefined
}

async function setCustomerNotes(notes: string | undefined) {
  const result = await withToken<{
    setOrderCustomFields: { id: string } | { errorCode: string; message: string }
  }>((token) =>
    vendureRequest(
      SET_ORDER_CUSTOM_FIELDS_MUTATION,
      { input: { customFields: { customerNotes: notes ?? "" } } },
      token
    )
  )
  if (isErrorResult(result.setOrderCustomFields)) return result.setOrderCustomFields.errorCode
  return undefined
}

export async function getEligibleShippingMethods(
  customer: Pick<CheckoutCustomer, "governorate" | "city" | "address" | "name" | "phone" | "company">,
  paymentMethod: PaymentMethod
): Promise<{ methods: EligibleShippingMethod[]; error?: string }> {
  try {
    const addressResult = await withToken<{
      setOrderShippingAddress: VendureOrderResponse | { errorCode: string; message: string }
    }>((token) =>
      vendureRequest(
        SET_SHIPPING_ADDRESS_MUTATION,
        {
          input: {
            fullName: customer.name,
            company: customer.company,
            streetLine1: customer.address,
            city: customer.city,
            province: customer.governorate,
            postalCode: "00000",
            countryCode: "EG",
            phoneNumber: customer.phone,
          },
        },
        token
      )
    )
    if (isErrorResult(addressResult.setOrderShippingAddress)) {
      return { methods: [], error: addressResult.setOrderShippingAddress.errorCode }
    }

    const prepaidError = await setPrepaidShipping(paymentMethod)
    if (prepaidError) return { methods: [], error: prepaidError }

    const methodsData = await withToken<{
      eligibleShippingMethods: Array<{ id: string; code: string; name: string; priceWithTax: number }>
    }>((token) => vendureRequest(ELIGIBLE_SHIPPING_METHODS_QUERY, {}, token))

    return { methods: toEligibleShippingMethods(methodsData.eligibleShippingMethods) }
  } catch (error) {
    // Without this, a Vendure outage mid-checkout throws an unhandled
    // rejection in the client's blur handler instead of a readable error.
    logError("cart:shipping-methods", error)
    return { methods: [], error: "network_error" }
  }
}

export type PlaceOrderInput = {
  customer: CheckoutCustomer
  paymentMethod: PaymentMethod
  fulfillmentMode: FulfillmentMode
  /** Client-side checkbox state — re-checked here because the browser is never trusted. */
  agreedToTerms: boolean
  /** Optional InstaPay / Vodafone Cash transaction reference typed by the
   * customer — stored in payment metadata for manual reconciliation. Trimmed
   * and length-capped server-side; it is NEVER a payment signal. */
  transferRef?: string
  /** Amount explicitly reviewed by the browser; server rejects repricing. */
  expectedTotal?: number
}

/** Reconciliation refs are free-form bank/app strings — cap the noise. */
const TRANSFER_REF_MAX_LENGTH = 60

function sanitizeTransferRef(value: string | undefined): string | undefined {
  const trimmed = value?.trim().slice(0, TRANSFER_REF_MAX_LENGTH)
  return trimmed ? trimmed : undefined
}

export type PlaceOrderResult = {
  order: Order | null
  error?: string
  /** Card gateways only: the hosted-payment page the customer must be
   * redirected to (from the created payment's metadata.public.redirectUrl). */
  redirectUrl?: string
}

/** Only LIVE gateway codes — fawry is still a safe Declined stub, so it must
 * never surface in the storefront's card rail. */
const CARD_GATEWAY_CODES = ["paymob", "kashier"] as const

/** The first eligible card-gateway payment method code (paymob/kashier), or
 * null — the storefront's card rail renders only when this returns a code. */
export async function getCardGatewayCode(): Promise<string | null> {
  try {
    const data = await withToken<{
      eligiblePaymentMethods: Array<{ code: string; isEligible: boolean }>
    }>((token) => vendureRequest(ELIGIBLE_PAYMENT_METHODS_QUERY, {}, token))
    const card = data.eligiblePaymentMethods.find(
      (method) => method.isEligible && (CARD_GATEWAY_CODES as readonly string[]).includes(method.code)
    )
    return card?.code ?? null
  } catch {
    return null
  }
}

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  if (process.env.NPF_PREVIEW_MODE === "1") return { order: null, error: "preview_unavailable" }
  if (
    !input ||
    typeof input !== "object" ||
    !["cod", "bank_transfer", "card"].includes(input.paymentMethod) ||
    !["door_to_door", "branch_pickup", "company_pickup"].includes(input.fulfillmentMode)
  ) {
    return { order: null, error: "invalid_checkout_data" }
  }
  if (input.expectedTotal !== undefined && (!Number.isFinite(input.expectedTotal) || input.expectedTotal < 0)) {
    return { order: null, error: "invalid_checkout_data" }
  }
  if (input.agreedToTerms !== true) {
    return { order: null, error: "terms_not_accepted" }
  }

  const validation = validateCheckoutCustomer(input.customer)
  if (!validation.ok) return { order: null, error: validation.error }
  const customer = validation.customer

  try {
    const nameParts = customer.name.split(/\s+/)
    const firstName = nameParts[0] ?? customer.name
    const lastName = nameParts.slice(1).join(" ") || firstName

    const customerResult = await withToken<{
      setCustomerForOrder: { id: string } | { errorCode: string; message: string }
    }>((token) =>
      vendureRequest(
        SET_CUSTOMER_FOR_ORDER_MUTATION,
        {
          input: {
            firstName,
            lastName,
            emailAddress: customer.email || `guest-${Date.now()}@nilepharmafood.local`,
            phoneNumber: customer.phone,
          },
        },
        token
      )
    )
    if (
      isErrorResult(customerResult.setCustomerForOrder) &&
      customerResult.setCustomerForOrder.errorCode !== "ALREADY_LOGGED_IN_ERROR"
    ) {
      // ALREADY_LOGGED_IN_ERROR isn't a failure — Vendure rejects an explicit
      // setCustomerForOrder call for an authenticated session because the
      // order is already correctly attached to that customer. Any other
      // error here is real and should stop checkout.
      return { order: null, error: customerResult.setCustomerForOrder.errorCode }
    }

    const addressResult = await withToken<{
      setOrderShippingAddress: VendureOrderResponse | { errorCode: string; message: string }
    }>((token) =>
      vendureRequest(
        SET_SHIPPING_ADDRESS_MUTATION,
        {
          input: {
            fullName: customer.name,
            company: customer.company,
            streetLine1: customer.address,
            city: customer.city,
            province: customer.governorate,
            postalCode: "00000",
            countryCode: "EG",
            phoneNumber: customer.phone,
          },
        },
        token
      )
    )
    if (isErrorResult(addressResult.setOrderShippingAddress)) {
      return { order: null, error: addressResult.setOrderShippingAddress.errorCode }
    }

    const prepaidError = await setPrepaidShipping(input.paymentMethod)
    if (prepaidError) return { order: null, error: prepaidError }
    const notesError = await setCustomerNotes(customer.notes)
    if (notesError) return { order: null, error: notesError }

    const methodsData = await withToken<{
      eligibleShippingMethods: Array<{ id: string; code: string; name: string; priceWithTax: number }>
    }>((token) => vendureRequest(ELIGIBLE_SHIPPING_METHODS_QUERY, {}, token))
    const methods = toEligibleShippingMethods(methodsData.eligibleShippingMethods)
    const chosen = methods.find((method) => method.mode === input.fulfillmentMode)
    if (!chosen) {
      return {
        order: null,
        error: methods.length > 0 ? "fulfillment_selection_changed" : "no_eligible_shipping_method",
      }
    }

    const shippingResult = await withToken<{
      setOrderShippingMethod: VendureOrderResponse | { errorCode: string; message: string }
    }>((token) => vendureRequest(SET_SHIPPING_METHOD_MUTATION, { id: [chosen.id] }, token))
    if (isErrorResult(shippingResult.setOrderShippingMethod)) {
      return { order: null, error: shippingResult.setOrderShippingMethod.errorCode }
    }

    if (input.expectedTotal !== undefined && Math.round(input.expectedTotal * 100) !== shippingResult.setOrderShippingMethod.totalWithTax) {
      return {order:null,error:"order_total_changed"}
    }

    const transitionResult = await withToken<{
      transitionOrderToState: { id: string; state: string } | { errorCode: string; message: string }
    }>((token) => vendureRequest(TRANSITION_ORDER_TO_STATE_MUTATION, { state: "ArrangingPayment" }, token))
    if (isErrorResult(transitionResult.transitionOrderToState)) {
      return { order: null, error: transitionResult.transitionOrderToState.errorCode }
    }

    // Card gateways: charge through the registered gateway PaymentMethod
    // (paymob/kashier) instead of the manual-settlement rail. The gateway
    // handler returns state Authorized + a hosted-payment redirectUrl; the
    // customer is redirected there and the gateway's SIGNED webhook is what
    // settles the payment — never this code path.
    let paymentMethodCode = PAYMENT_METHOD_CODE
    let paymentMetadata: Record<string, unknown> = {
      public: { paymentMethod: input.paymentMethod, transferRef: sanitizeTransferRef(input.transferRef) },
    }
    if (input.paymentMethod === "card") {
      const gatewayCode = await getCardGatewayCode()
      if (!gatewayCode) return { order: null, error: "card_gateway_unavailable" }
      paymentMethodCode = gatewayCode
      paymentMetadata = { public: { paymentMethod: "card", gateway: gatewayCode } }
    }

    const paymentResult = await withToken<{
      addPaymentToOrder: VendureOrderResponse | { errorCode: string; message: string }
    }>((token) =>
      vendureRequest(
        ADD_PAYMENT_TO_ORDER_MUTATION,
        // Vendure's Shop API only exposes payment.metadata.public (Admin API
        // sees everything else) — nest under `public` or the confirmation
        // page's order-by-code lookup can never read this back.
        {
          input: {
            method: paymentMethodCode,
            metadata: paymentMetadata,
          },
        },
        token
      )
    )
    if (isErrorResult(paymentResult.addPaymentToOrder)) {
      return { order: null, error: paymentResult.addPaymentToOrder.errorCode }
    }

    let redirectUrl: string | undefined
    if (input.paymentMethod === "card") {
      // Vendure's Shop API exposes only metadata.public — the redirect URL
      // is stored under public by the gateway handlers for exactly this read.
      const payments = await withToken<{
        activeOrder: { payments: Array<{ state: string; metadata: { public?: { redirectUrl?: string } } | null }> } | null
      }>((token) =>
        vendureRequest(
          `query { activeOrder { id payments { state metadata } } }`,
          {},
          token
        )
      )
      const payment = payments.activeOrder?.payments?.[0]
      redirectUrl = payment?.metadata?.public?.redirectUrl
      if (typeof redirectUrl !== "string") redirectUrl = undefined
    }

    const order = toOrderSummary(paymentResult.addPaymentToOrder)
    // Proof-of-purchase for the confirmation page (see LAST_ORDER_COOKIE
    // above) — set here, on the success path only, so a failed checkout
    // never grants view access to anything.
    const cookieStore = await cookies()
    cookieStore.set(LAST_ORDER_COOKIE, order.orderNumber, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: LAST_ORDER_COOKIE_MAX_AGE,
      path: "/",
    })
    return { order, redirectUrl }
  } catch (error) {
    logError("cart:place-order", error)
    return { order: null, error: "network_error" }
  }
}
