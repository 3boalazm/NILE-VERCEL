import type { CartItem, EligibleShippingMethod, FulfillmentMode, Order, PaymentMethod } from "@/lib/cart/types"

/** Matches the field selections in queries.ts's `NpfOrder` fragment. */
export type VendureOrderResponse = {
  id: string
  code: string
  state: string
  createdAt: string
  currencyCode: string
  subTotalWithTax: number
  shippingWithTax: number
  totalWithTax: number
  customFields?: { customerNotes?: string | null } | null
  shippingAddress?: {
    fullName?: string | null
    company?: string | null
    streetLine1?: string | null
    city?: string | null
    province?: string | null
    postalCode?: string | null
    phoneNumber?: string | null
  } | null
  shippingLines: Array<{
    shippingMethod: { id: string; code: string; name: string }
    priceWithTax: number
  }>
  customer?: {
    firstName?: string | null
    lastName?: string | null
    emailAddress?: string | null
    phoneNumber?: string | null
  } | null
  payments?: Array<{ id: string; method: string; metadata: Record<string, unknown> }> | null
  lines: Array<{
    id: string
    quantity: number
    linePriceWithTax: number
    productVariant: {
      id: string
      sku: string
      name: string
      product: {
        slug: string
        featuredAsset?: { preview: string } | null
      }
    }
  }>
}

const SHIPPING_CODE_TO_MODE: Record<string, FulfillmentMode> = {
  "door-to-door": "door_to_door",
  "branch-dropoff": "branch_pickup",
  "company-pickup": "company_pickup",
}

/** Minor units (piastres) -> major units (EGP), matching how the storefront
 * has always displayed prices (mock-repository.ts prices are whole EGP). */
function toMajorUnits(minorUnits: number): number {
  return minorUnits / 100
}

export function toCartItems(order: VendureOrderResponse | null | undefined): CartItem[] {
  if (!order) return []
  return order.lines.map((line) => ({
    productId: line.productVariant.product.slug,
    lineId: line.id,
    slug: line.productVariant.product.slug,
    name: line.productVariant.name,
    image: line.productVariant.product.featuredAsset?.preview ?? null,
    price: toMajorUnits(line.linePriceWithTax / line.quantity),
    currency: order.currencyCode,
    sku: line.productVariant.sku,
    qty: line.quantity,
  }))
}

export function toFulfillmentMode(order: VendureOrderResponse | null | undefined): FulfillmentMode | null {
  const code = order?.shippingLines[0]?.shippingMethod.code
  return code ? (SHIPPING_CODE_TO_MODE[code] ?? null) : null
}

export function toEligibleShippingMethods(
  methods: Array<{ id: string; code: string; name: string; priceWithTax: number }>
): EligibleShippingMethod[] {
  return methods.map((method) => ({
    id: method.id,
    mode: SHIPPING_CODE_TO_MODE[method.code] ?? null,
    name: method.name,
    priceWithTax: toMajorUnits(method.priceWithTax),
  }))
}

const VALID_PAYMENT_METHODS: PaymentMethod[] = ["cod", "bank_transfer", "card"]

/** Vendure only has one real PaymentMethod entity (`manual-settlement`,
 * dummy handler — no online gateway yet, see TODO.md BLOCKED). The
 * customer's actual cod/bank_transfer choice is preserved in the payment's
 * `metadata`, set once when placeOrder calls addPaymentToOrder, and read
 * back here so the confirmation page works correctly even on a fresh
 * page load (not just right after placing the order). Read from
 * `metadata.public` — Vendure's Shop API only ever exposes that nested key
 * (Admin API sees the rest), so anything written outside it is invisible
 * here even though it's genuinely stored. */
/**
 * The customer-typed transfer reference (InstaPay / Vodafone Cash transaction
 * id), stored in payment.metadata.public at checkout — reconciliation aid for
 * the admin, never a payment signal: settlement stays a manual admin check.
 */
function transferRefFromOrder(order: VendureOrderResponse): string | undefined {
  const metadata = order.payments?.[0]?.metadata?.public as Record<string, unknown> | undefined
  const value = typeof metadata?.transferRef === "string" ? metadata.transferRef.trim() : ""
  return value || undefined
}

function paymentMethodFromOrder(order: VendureOrderResponse): PaymentMethod {
  const metadata = order.payments?.[0]?.metadata?.public as Record<string, unknown> | undefined
  const chosen = metadata?.paymentMethod
  return VALID_PAYMENT_METHODS.includes(chosen as PaymentMethod) ? (chosen as PaymentMethod) : "cod"
}

export function toOrderSummary(order: VendureOrderResponse): Order {
  return {
    orderNumber: order.code,
    createdAt: order.createdAt,
    items: toCartItems(order),
    subtotal: toMajorUnits(order.subTotalWithTax),
    shippingCost: toMajorUnits(order.shippingWithTax),
    total: toMajorUnits(order.totalWithTax),
    hasUnpricedItems: false,
    customer: {
      name: [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(" "),
      phone: order.customer?.phoneNumber ?? order.shippingAddress?.phoneNumber ?? "",
      email: order.customer?.emailAddress ?? undefined,
      company: order.shippingAddress?.company ?? undefined,
      governorate: order.shippingAddress?.province ?? "",
      city: order.shippingAddress?.city ?? "",
      address: order.shippingAddress?.streetLine1 ?? "",
      notes: order.customFields?.customerNotes ?? undefined,
    },
    paymentMethod: paymentMethodFromOrder(order),
    fulfillmentMode: toFulfillmentMode(order),
    transferRef: transferRefFromOrder(order),
  }
}
