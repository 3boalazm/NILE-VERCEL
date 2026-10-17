"use server"

import { getPayloadClient } from "@/lib/cms/payload-client"
import { vendureRequest } from "@/lib/vendure/client"
import { withToken } from "@/lib/vendure/with-token"
import { getActiveCustomer } from "@/lib/auth/active-customer"
import { clearVendureToken, getVendureToken } from "@/lib/vendure/session"
import { getClientIp, isRateLimited } from "@/lib/security/rate-limit"
import { logError, logWarn } from "@/lib/observability/log"
import {
  CREATE_CUSTOMER_ADDRESS_MUTATION,
  DELETE_CUSTOMER_ADDRESS_MUTATION,
  LOGIN_MUTATION,
  LOGOUT_MUTATION,
  REGISTER_CUSTOMER_ACCOUNT_MUTATION,
  REQUEST_PASSWORD_RESET_MUTATION,
  RESET_PASSWORD_MUTATION,
  UPDATE_CUSTOMER_EMAIL_ADDRESS_MUTATION,
  UPDATE_CUSTOMER_MUTATION,
  UPDATE_CUSTOMER_PASSWORD_MUTATION,
  VERIFY_CUSTOMER_ACCOUNT_MUTATION,
} from "@/lib/vendure/queries"

function isErrorResult(value: unknown): value is { errorCode: string; message: string } {
  return typeof value === "object" && value !== null && "errorCode" in value
}

export async function login(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  // Brute-force baseline: 10 attempts per 10 minutes per IP. Real users
  // never type a wrong password that fast; bots do.
  if (isRateLimited(`login:${await getClientIp()}`, 10 * 60 * 1000, 10)) {
    return { ok: false, error: "rate_limited" }
  }
  if (process.env.NPF_PREVIEW_MODE === "1") return {ok:false,error:"network_error"}
  try {
    const data = await withToken<{
      login: { id: string; identifier: string } | { errorCode: string; message: string }
    }>((token) => vendureRequest(LOGIN_MUTATION, { email, password }, token))
    if (isErrorResult(data.login)) return { ok: false, error: data.login.errorCode }
    return { ok: true }
  } catch (error) {
    logError("auth:login", error)
    return { ok: false, error: "network_error" }
  }
}

export async function register(input: {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
}): Promise<{ ok: boolean; error?: string }> {
  if (process.env.NPF_PREVIEW_MODE === "1") return {ok:false,error:"network_error"}
  // Account-creation spam is slower-burn than login brute force, so the
  // budget is tighter: 5 accounts per hour per IP.
  if (isRateLimited(`register:${await getClientIp()}`, 60 * 60 * 1000, 5)) {
    return { ok: false, error: "rate_limited" }
  }
  try {
    const data = await withToken<{
      registerCustomerAccount: { success: boolean } | { errorCode: string; message: string }
    }>((token) =>
      vendureRequest(
        REGISTER_CUSTOMER_ACCOUNT_MUTATION,
        {
          input: {
            firstName: input.firstName,
            lastName: input.lastName,
            emailAddress: input.email,
            password: input.password,
            phoneNumber: input.phone || undefined,
          },
        },
        token
      )
    )
    if (isErrorResult(data.registerCustomerAccount)) {
      return { ok: false, error: data.registerCustomerAccount.errorCode }
    }
    // requireVerification is off (see vendure-config.ts) — the account is
    // immediately active, but registerCustomerAccount itself doesn't log
    // the caller in. Log in right after with the same credentials so
    // registration reads as one seamless step to the customer.
    return login(input.email, input.password)
  } catch (error) {
    logError("auth:register", error)
    return { ok: false, error: "network_error" }
  }
}

export async function updateProfile(input: {
  firstName: string
  lastName: string
}): Promise<{ ok: boolean; error?: string }> {
  if (process.env.NPF_PREVIEW_MODE === "1") return {ok:false,error:"network_error"}
  try {
    // updateCustomer returns a plain Customer, not an ErrorResult union
    // (see queries.ts) — reaching this line at all means it succeeded;
    // an auth/validation failure throws instead, caught below.
    await withToken<{ updateCustomer: { id: string } }>((token) =>
      vendureRequest(
        UPDATE_CUSTOMER_MUTATION,
        { input: { firstName: input.firstName, lastName: input.lastName } },
        token
      )
    )
    return { ok: true }
  } catch (error) {
    logError("auth:update-profile", error)
    return { ok: false, error: "network_error" }
  }
}

/**
 * F-63 — change the signed-in customer's password.
 *
 * The register/reset flows existed but a signed-in user had no way to rotate
 * a known password anywhere in the storefront. Vendure's shop API exposes
 * `updateCustomerPassword(currentPassword, newPassword)`; the current
 * password is required so a walked-away session cannot silently re-lock the
 * account. Wrong-current-password arrives in-band as an ErrorResult
 * (InvalidCredentialsError), mapped to `invalid_credentials` so the UI can
 * say "the current password is wrong" instead of a generic failure.
 */
export async function changePassword(input: {
  currentPassword: string
  newPassword: string
}): Promise<{ ok: boolean; error?: "validation" | "invalid_credentials" | "network_error" }> {
  if (!input.currentPassword || input.newPassword.length < 6) {
    return { ok: false, error: "validation" }
  }
  // Brute-forcing the current password through this endpoint is exactly what
  // a per-IP limit is for: 5 attempts per 15 minutes.
  if (isRateLimited(`chpwd:${await getClientIp()}`, 15 * 60 * 1000, 5)) {
    return { ok: false, error: "invalid_credentials" }
  }
  try {
    const result = await withToken<{
      updateCustomerPassword: { success?: boolean } | { errorCode: string; message: string }
    }>((token) =>
      vendureRequest(
        UPDATE_CUSTOMER_PASSWORD_MUTATION,
        { currentPassword: input.currentPassword, newPassword: input.newPassword },
        token
      )
    )
    if (isErrorResult(result.updateCustomerPassword)) {
      return { ok: false, error: "invalid_credentials" }
    }
    return { ok: true }
  } catch (error) {
    logError("auth:change-password", error)
    return { ok: false, error: "network_error" }
  }
}

/**
 * F-58 — GDPR erasure intake (right to be forgotten).
 *
 * Vendure's shop API has no customer-delete mutation — erasure is an admin
 * operation by design — so the honest storefront flow is a verified intake:
 * the signed-in customer confirms, we record the request against their
 * Vendure customer id in the `erasure-requests` Payload collection, and ops
 * completes the erasure per the SOP in docs/OPS.md (≤ 30 days, GDPR
 * Art. 12(3)). The UI states exactly that; it never claims the data is
 * already gone.
 */
export async function requestAccountDeletion(input: {
  locale: string
  confirmed: boolean
}): Promise<{ ok: boolean; error?: "validation" | "not_authenticated" | "rate_limited" | "server_error" }> {
  if (!input.confirmed) return { ok: false, error: "validation" }
  const token = await getVendureToken()
  if (!token) return { ok: false, error: "not_authenticated" }
  // 3 requests/hour/IP: a real erasure request happens once; a loop is abuse.
  if (isRateLimited(`erasure:${await getClientIp()}`, 60 * 60 * 1000, 3)) {
    return { ok: false, error: "rate_limited" }
  }
  try {
    const customer = await getActiveCustomer()
    if (!customer) return { ok: false, error: "not_authenticated" }
    // Loaded on demand: a missing runtime CMS environment must fail *inside*
    // this try/catch (a clean "server_error" for the form) instead of
    // rejecting the whole action when the module is loaded.
    const payload = await getPayloadClient()
    await payload.create({
      collection: "erasure-requests",
      data: {
        customerId: customer.id,
        email: customer.email,
        locale: input.locale === "en" ? "en" : "ar",
        status: "new",
      },
      overrideAccess: true,
    })
    return { ok: true }
  } catch (error) {
    logError("auth:erasure-request", error)
    return { ok: false, error: "server_error" }
  }
}

export async function logout(): Promise<void> {
  const token = await getVendureToken()
  try {
    await vendureRequest(LOGOUT_MUTATION, {}, token)
  } catch (error) {
    // Fall through to clearing the local cookie regardless — an
    // unreachable Vendure shouldn't leave the customer stuck "logged in"
    // in their own browser. Warn, not error: the user-visible outcome is
    // still correct.
    logWarn("auth:logout", "vendure unreachable during logout; local session cleared anyway", {
      message: error instanceof Error ? error.message : String(error),
    })
  }
  await clearVendureToken()
}

export async function createAddress(input: {
  fullName: string
  streetLine1: string
  city: string
  province: string
  phoneNumber: string
}): Promise<{ ok: boolean; error?: string }> {
  if (process.env.NPF_PREVIEW_MODE === "1") return {ok:false,error:"network_error"}
  try {
    const data = await withToken<{
      createCustomerAddress: { id: string } | { errorCode: string; message: string }
    }>((token) =>
      vendureRequest(
        CREATE_CUSTOMER_ADDRESS_MUTATION,
        {
          input: {
            fullName: input.fullName,
            streetLine1: input.streetLine1,
            city: input.city,
            province: input.province,
            postalCode: "00000",
            countryCode: "EG",
            phoneNumber: input.phoneNumber,
          },
        },
        token
      )
    )
    if (isErrorResult(data.createCustomerAddress)) return { ok: false, error: data.createCustomerAddress.errorCode }
    return { ok: true }
  } catch (error) {
    logError("auth:create-address", error)
    return { ok: false, error: "network_error" }
  }
}

export async function deleteAddress(id: string): Promise<{ ok: boolean }> {
  if (process.env.NPF_PREVIEW_MODE === "1") return {ok:false}
  try {
    const data = await withToken<{ deleteCustomerAddress: { success: boolean } }>((token) =>
      vendureRequest(DELETE_CUSTOMER_ADDRESS_MUTATION, { id }, token)
    )
    return { ok: data.deleteCustomerAddress.success }
  } catch (error) {
    logError("auth:delete-address", error)
    return { ok: false }
  }
}

/**
 * Password recovery, step 1 of 2 (F-04).
 *
 * Returns `{ ok: true }` for *any* address Vendure can or cannot find. That is
 * deliberate: `requestPasswordReset` answers with `InvalidCredentialsError`
 * when no verified customer matches, so relaying that error to the browser
 * would turn this form into an account-enumeration oracle — an attacker could
 * confirm which emails hold an account. The real outcome is logged server-side
 * instead, and the UI shows one uniform "check your inbox" message.
 *
 * Rate limited harder than login (3 per 15 min per IP): a reset request sends
 * email, so it is both an abuse vector and a cost.
 */
export async function requestPasswordReset(email: string): Promise<{ ok: boolean; error?: string }> {
  const address = email.trim().toLowerCase()
  if (!address || !address.includes("@") || address.length > 254) {
    return { ok: false, error: "invalid_email" }
  }
  if (isRateLimited(`password-reset:${await getClientIp()}`, 15 * 60 * 1000, 3)) {
    return { ok: false, error: "rate_limited" }
  }
  try {
    const data = await withToken<{
      requestPasswordReset: { success: boolean } | { errorCode: string; message: string }
    }>((token) => vendureRequest(REQUEST_PASSWORD_RESET_MUTATION, { emailAddress: address }, token))
    if (isErrorResult(data.requestPasswordReset)) {
      // Unknown/unverified address — logged, never echoed to the caller.
      logWarn("auth:request-password-reset", "no reset issued", {
        errorCode: data.requestPasswordReset.errorCode,
      })
    }
    return { ok: true }
  } catch (error) {
    logError("auth:request-password-reset", error)
    return { ok: false, error: "network_error" }
  }
}

/**
 * Password recovery, step 2 of 2 (F-04).
 *
 * Consumes the single-use token from the emailed link. Unlike step 1 the
 * error code *is* returned to the browser: the token holder already proved
 * mailbox ownership by clicking the link, so telling them it expired leaks
 * nothing and is the only way to explain why the form was rejected.
 *
 * Validation mirrors the register flow (min 6 characters, per
 * `registerPasswordHint`) and is re-checked here rather than trusted from the
 * client, because a server action is a public endpoint.
 */
export async function resetPassword(
  token: string,
  password: string,
  confirmPassword: string
): Promise<{ ok: boolean; error?: string }> {
  if (!token) return { ok: false, error: "invalid_token" }
  if (password !== confirmPassword) return { ok: false, error: "password_mismatch" }
  if (password.length < 6) return { ok: false, error: "password_too_short" }
  if (isRateLimited(`password-reset-confirm:${await getClientIp()}`, 10 * 60 * 1000, 5)) {
    return { ok: false, error: "rate_limited" }
  }
  try {
    const data = await withToken<
      { resetPassword: { id: string; identifier: string } | { errorCode: string; message: string } }
    >((sessionToken) => vendureRequest(RESET_PASSWORD_MUTATION, { token, password }, sessionToken))
    if (isErrorResult(data.resetPassword)) return { ok: false, error: data.resetPassword.errorCode }
    // Vendure invalidates the token on success; the visitor is not logged in
    // by it, so they go to the login page next (see the reset-password route).
    return { ok: true }
  } catch (error) {
    logError("auth:reset-password", error)
    return { ok: false, error: "network_error" }
  }
}

/**
 * Confirms a customer's email address from the verification link (F-52).
 *
 * Only issues tokens when `NPF_REQUIRE_EMAIL_VERIFICATION` is enabled in
 * `vendure-config.ts`; with verification off, Vendure never emails a token and
 * this action can only ever return an invalid-token result. It is implemented
 * anyway so that flipping the flag is a configuration change rather than a
 * feature build — the previous state was the dangerous one, where enabling
 * verification would have locked every new customer out with no route to
 * consume the emailed link.
 *
 * On success Vendure returns the authenticated user, so the session token is
 * persisted by `withToken` and the caller can send the visitor straight to
 * their account.
 */
export async function verifyCustomerAccount(
  token: string
): Promise<{ ok: boolean; error?: string }> {
  if (!token) return { ok: false, error: "invalid_token" }
  if (isRateLimited(`verify-account:${await getClientIp()}`, 10 * 60 * 1000, 10)) {
    return { ok: false, error: "rate_limited" }
  }
  try {
    const data = await withToken<{
      verifyCustomerAccount: { id: string; identifier: string } | { errorCode: string; message: string }
    }>((sessionToken) =>
      vendureRequest(VERIFY_CUSTOMER_ACCOUNT_MUTATION, { token, password: null }, sessionToken)
    )
    if (isErrorResult(data.verifyCustomerAccount)) {
      return { ok: false, error: data.verifyCustomerAccount.errorCode }
    }
    return { ok: true }
  } catch (error) {
    logError("auth:verify-customer-account", error)
    return { ok: false, error: "network_error" }
  }
}

/**
 * Confirms an email-address change (F-52).
 *
 * Deliberately NOT merged into `verifyCustomerAccount` above: Vendure issues a
 * different token kind for address changes and only this mutation accepts it,
 * so a shared route would reject one of the two flows.
 */
export async function confirmEmailAddressChange(
  token: string
): Promise<{ ok: boolean; error?: string }> {
  if (!token) return { ok: false, error: "invalid_token" }
  if (isRateLimited(`verify-email-change:${await getClientIp()}`, 10 * 60 * 1000, 10)) {
    return { ok: false, error: "rate_limited" }
  }
  try {
    const data = await withToken<{
      updateCustomerEmailAddress: { success: boolean } | { errorCode: string; message: string }
    }>((sessionToken) =>
      vendureRequest(UPDATE_CUSTOMER_EMAIL_ADDRESS_MUTATION, { token }, sessionToken)
    )
    if (isErrorResult(data.updateCustomerEmailAddress)) {
      return { ok: false, error: data.updateCustomerEmailAddress.errorCode }
    }
    return { ok: data.updateCustomerEmailAddress.success }
  } catch (error) {
    logError("auth:confirm-email-change", error)
    return { ok: false, error: "network_error" }
  }
}
