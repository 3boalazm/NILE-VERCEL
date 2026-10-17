"use server"

import { getPayloadClient } from "@/lib/cms/payload-client"
import { getClientIp, isRateLimited } from "@/lib/security/rate-limit"
import { logError } from "@/lib/observability/log"
import { FIELD_LIMITS } from "@/lib/forms/field-limits"

export type SubmitContactInput = {
  name: string
  email: string
  phone?: string
  company?: string
  subject: string
  message: string
  locale: string
}

export type SubmitContactError = "validation" | "rate_limited" | "server_error"

// F-59: the limits live in ONE place (field-limits.ts) and the UI's
// maxLength attributes use the same map, so client and server cannot drift.
const {
  personName: MAX_NAME_LENGTH,
  emailAddress: MAX_EMAIL_LENGTH,
  phoneNumber: MAX_PHONE_LENGTH,
  organization: MAX_COMPANY_LENGTH,
  subject: MAX_SUBJECT_LENGTH,
  message: MAX_MESSAGE_LENGTH,
} = FIELD_LIMITS

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValid(input: SubmitContactInput): boolean {
  if (!input || typeof input !== "object" || ["name","email","subject","message","locale"].some(k => typeof (input as unknown as Record<string,unknown>)[k] !== "string") || ["phone","company"].some(k => (input as unknown as Record<string,unknown>)[k] !== undefined && typeof (input as unknown as Record<string,unknown>)[k] !== "string")) return false
  const name = input.name.trim()
  const email = input.email.trim()
  const subject = input.subject.trim()
  const message = input.message.trim()
  if (!name || !email || !subject || !message) return false
  if (name.length > MAX_NAME_LENGTH) return false
  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) return false
  if ((input.phone ?? "").trim().length > MAX_PHONE_LENGTH) return false
  if ((input.company ?? "").trim().length > MAX_COMPANY_LENGTH) return false
  if (subject.length > MAX_SUBJECT_LENGTH) return false
  if (message.length > MAX_MESSAGE_LENGTH) return false
  return true
}

/**
 * Persists a contact-form submission to the `inquiries` collection for the
 * sales team to triage in the Payload admin panel. Server-side validation
 * mirrors the client-side constraints (never trust the browser), plus a
 * per-IP rate limit against form spam. Returns a coarse error code, never
 * internals.
 */
export async function submitContactInquiry(
  input: SubmitContactInput
): Promise<{ ok: true } | { ok: false; error: SubmitContactError }> {
  if (process.env.NPF_PREVIEW_MODE === "1") return {ok:false,error:"server_error"}
  if (!isValid(input)) return { ok: false, error: "validation" }

  // 5 submissions per 10 minutes per IP — a real visitor never submits
  // that fast; spam bots do.
  if (isRateLimited(`contact:${await getClientIp()}`, 10 * 60 * 1000, 5)) {
    return { ok: false, error: "rate_limited" }
  }

  try {
    const payload = await getPayloadClient()
    await payload.create({
      collection: "inquiries",
      data: {
        name: input.name.trim(),
        email: input.email.trim(),
        phone: input.phone?.trim() || undefined,
        company: input.company?.trim() || undefined,
        locale: input.locale === "en" ? "en" : "ar",
        subject: input.subject.trim(),
        message: input.message.trim(),
        status: "new",
      },
      overrideAccess: true,
    })
    return { ok: true }
  } catch (error) {
    logError("contact:submit", error)
    return { ok: false, error: "server_error" }
  }
}
