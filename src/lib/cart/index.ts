export type { CartItem, CartReadState, Order, CheckoutCustomer, PaymentMethod, FulfillmentMode, EligibleShippingMethod } from "./types"
export { CartProvider, useCart } from "./provider"
export { getCardGatewayCode, getEligibleShippingMethods, placeOrder, type PlaceOrderInput, type PlaceOrderResult } from "./actions"

export const DEFAULT_CURRENCY = "ج.م"
