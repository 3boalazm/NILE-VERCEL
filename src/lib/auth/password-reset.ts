"use server"

import { vendureRequest } from "@/lib/vendure/client"
import { clearVendureToken } from "@/lib/vendure/session"
import { getClientIp, isRateLimited } from "@/lib/security/rate-limit"
import { passwordResetEnabled } from "./reset-policy"

type Result = {
  ok: boolean
  error?:
    "unavailable" | "validation" | "rate_limited" | "network" | "invalid_token"
}

export async function requestPasswordReset(email: string): Promise<Result> {
  if (!passwordResetEnabled()) return { ok: false, error: "unavailable" }
  if (
    typeof email !== "string" ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  )
    return { ok: false, error: "validation" }
  if (isRateLimited(`reset-request:${await getClientIp()}`, 10 * 60 * 1000, 5))
    return { ok: false, error: "rate_limited" }
  try {
    // The same acknowledgement for known/unknown accounts. No session token
    // forwarded; no email address, reset token or password is logged.
    await vendureRequest(
      "mutation ResetRequest($email:String!){requestPasswordReset(emailAddress:$email){... on Success {success} ... on ErrorResult {errorCode}}}",
      { email: email.trim() },
      undefined
    )
    return { ok: true }
  } catch {
    return { ok: false, error: "network" }
  }
}

export async function resetPassword(
  token: string,
  password: string
): Promise<Result> {
  if (!passwordResetEnabled()) return { ok: false, error: "unavailable" }
  if (
    typeof token !== "string" ||
    !/^[A-Za-z0-9_-]{16,256}$/.test(token) ||
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 128
  )
    return { ok: false, error: "validation" }
  if (isRateLimited(`reset-confirm:${await getClientIp()}`, 10 * 60 * 1000, 10))
    return { ok: false, error: "rate_limited" }
  try {
    const { data } = await vendureRequest<{
      resetPassword: { id?: string; errorCode?: string }
    }>(
      "mutation ResetConfirm($token:String!,$password:String!){resetPassword(token:$token,password:$password){... on CurrentUser {id} ... on ErrorResult {errorCode}}}",
      { token, password },
      undefined
    )
    if (!data.resetPassword?.id || data.resetPassword.errorCode)
      return { ok: false, error: "invalid_token" }
    await clearVendureToken()
    return { ok: true }
  } catch {
    return { ok: false, error: "network" }
  }
}
