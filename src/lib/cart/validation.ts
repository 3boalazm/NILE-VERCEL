import type { CheckoutCustomer } from "./types"

const MAX_NAME_LENGTH = 160
const MAX_COMPANY_LENGTH = 160
const MAX_LOCATION_LENGTH = 160
const MAX_ADDRESS_LENGTH = 500
const MAX_NOTES_LENGTH = 1000
const MAX_EMAIL_LENGTH = 254
const EGYPTIAN_PHONE_PATTERN = /^(?:\+?20|0)?1[0125]\d{8}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type CheckoutValidationResult =
  | { ok: true; customer: CheckoutCustomer }
  | { ok: false; error: "invalid_checkout_data" }

/** Server-side counterpart to the checkout form constraints. Server Actions
 * can be invoked without a browser, so HTML required/pattern attributes are
 * never treated as the validation boundary. */
export function validateCheckoutCustomer(value: unknown): CheckoutValidationResult {
  if (!value || typeof value !== "object") return { ok: false, error: "invalid_checkout_data" }
  const raw = value as Record<string, unknown>
  if (["name","phone","governorate","city","address"].some(key => typeof raw[key] !== "string") || ["email","company","notes"].some(key => raw[key] !== undefined && typeof raw[key] !== "string")) return { ok: false, error: "invalid_checkout_data" }
  const input = value as CheckoutCustomer
  const customer: CheckoutCustomer = {
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || undefined,
    company: input.company?.trim() || undefined,
    governorate: input.governorate.trim(),
    city: input.city.trim(),
    address: input.address.trim(),
    notes: input.notes?.trim() || undefined,
  }

  if (
    !customer.name ||
    customer.name.length > MAX_NAME_LENGTH ||
    !EGYPTIAN_PHONE_PATTERN.test(customer.phone) ||
    customer.governorate.length === 0 ||
    customer.governorate.length > MAX_LOCATION_LENGTH ||
    customer.city.length === 0 ||
    customer.city.length > MAX_LOCATION_LENGTH ||
    customer.address.length === 0 ||
    customer.address.length > MAX_ADDRESS_LENGTH
  ) {
    return { ok: false, error: "invalid_checkout_data" }
  }

  if (
    (customer.email && (customer.email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(customer.email))) ||
    (customer.company && customer.company.length > MAX_COMPANY_LENGTH) ||
    (customer.notes && customer.notes.length > MAX_NOTES_LENGTH)
  ) {
    return { ok: false, error: "invalid_checkout_data" }
  }

  return { ok: true, customer }
}
