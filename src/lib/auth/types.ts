export type CustomerOrderSummary = {
  code: string
  state: string
  createdAt: string
  total: number
  currency: string
  itemCount: number
  firstItemImage: string | null
  firstItemName: string
  productSlugs: string[]
}

export type Customer = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  orders: CustomerOrderSummary[]
}

export type Address = {
  id: string
  fullName: string
  streetLine1: string
  city: string
  province: string
  postalCode: string
  phoneNumber: string
  isDefault: boolean
}

/** Mirrors the small set of order states this storefront's checkout can
 * actually produce (see cart/actions.ts placeOrder) — used only to pick a
 * dictionary label, not to drive any business logic. */
export type OrderStatusKey = "arranging_payment" | "payment_settled" | "shipped" | "delivered" | "cancelled" | "other"

export function toOrderStatusKey(state: string): OrderStatusKey {
  switch (state) {
    case "ArrangingPayment":
      return "arranging_payment"
    case "PaymentSettled":
      return "payment_settled"
    case "Shipped":
    case "PartiallyShipped":
      return "shipped"
    case "Delivered":
      return "delivered"
    case "Cancelled":
      return "cancelled"
    default:
      return "other"
  }
}
