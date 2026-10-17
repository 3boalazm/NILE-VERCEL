import type { Address, Customer, CustomerOrderSummary } from "./types"

/** Matches queries.ts's `NpfCustomerOrder` fragment selection. */
export type VendureCustomerOrderResponse = {
  id: string
  code: string
  state: string
  createdAt: string
  currencyCode: string
  totalWithTax: number
  lines: Array<{
    id: string
    quantity: number
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

export type VendureActiveCustomerResponse = {
  id: string
  firstName: string
  lastName: string
  emailAddress: string
  phoneNumber?: string | null
  orders: { totalItems: number; items: VendureCustomerOrderResponse[] }
}

export type VendureAddressResponse = {
  id: string
  fullName?: string | null
  streetLine1: string
  city?: string | null
  province?: string | null
  postalCode?: string | null
  phoneNumber?: string | null
  defaultShippingAddress: boolean
}

function toMajorUnits(minorUnits: number): number {
  return minorUnits / 100
}

function toOrderSummary(order: VendureCustomerOrderResponse): CustomerOrderSummary {
  const firstLine = order.lines[0]
  return {
    code: order.code,
    state: order.state,
    createdAt: order.createdAt,
    total: toMajorUnits(order.totalWithTax),
    currency: order.currencyCode,
    itemCount: order.lines.reduce((sum, line) => sum + line.quantity, 0),
    firstItemImage: firstLine?.productVariant.product.featuredAsset?.preview ?? null,
    firstItemName: firstLine?.productVariant.name ?? "",
    productSlugs: order.lines.map((line) => line.productVariant.product.slug),
  }
}

export function toCustomer(response: VendureActiveCustomerResponse | null | undefined): Customer | null {
  if (!response) return null
  return {
    id: response.id,
    firstName: response.firstName,
    lastName: response.lastName,
    email: response.emailAddress,
    phone: response.phoneNumber ?? null,
    // Orders still forming (no payment yet) aren't a customer's real order
    // history — matches what the checkout flow itself treats as "placed"
    // (see cart/actions.ts: nothing before addPaymentToOrder is a real order).
    orders: response.orders.items.filter((order) => order.state !== "AddingItems").map(toOrderSummary),
  }
}

export function toAddress(response: VendureAddressResponse): Address {
  return {
    id: response.id,
    fullName: response.fullName ?? "",
    streetLine1: response.streetLine1,
    city: response.city ?? "",
    province: response.province ?? "",
    postalCode: response.postalCode ?? "",
    phoneNumber: response.phoneNumber ?? "",
    isDefault: response.defaultShippingAddress,
  }
}
