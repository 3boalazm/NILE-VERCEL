/** `lineId` is Vendure's OrderLine id — the key updateQty/removeItem operate
 * on internally. `productId` is kept as the product slug so existing
 * components (keys, links) don't need to change. */
export type CartItem = {
  productId: string
  lineId: string
  slug: string
  name: string
  image?: string | null
  price?: number
  currency?: string
  sku?: string
  qty: number
}

export type CartReadState = {
  status: "available" | "unavailable"
  items: CartItem[]
  /** One-way session identity used only to remount the client provider when
   * the server-side Vendure token changes. The raw token never reaches the browser. */
  sessionKey: string
}

export type CheckoutCustomer = {
  name: string
  phone: string
  email?: string
  company?: string
  governorate: string
  city: string
  address: string
  notes?: string
}

export type PaymentMethod = "cod" | "bank_transfer" | "card"

/** The three real fulfillment modes from the storefront's own shipping page
 * / the Vendure shipping plugin (src/plugins/npf-shipping.ts) — matched by
 * shipping method `code`, not a free-form label. */
export type FulfillmentMode = "door_to_door" | "branch_pickup" | "company_pickup"

export type EligibleShippingMethod = {
  id: string
  mode: FulfillmentMode | null
  name: string
  priceWithTax: number
}

export type Order = {
  orderNumber: string
  createdAt: string
  items: CartItem[]
  subtotal: number
  shippingCost: number
  total: number
  hasUnpricedItems: boolean
  customer: CheckoutCustomer
  paymentMethod: PaymentMethod
  fulfillmentMode: FulfillmentMode | null
  /** Optional transfer reference the customer typed at checkout (InstaPay /
   * Vodafone Cash transaction id) — reconciliation aid only, never a payment
   * signal. */
  transferRef?: string
}
