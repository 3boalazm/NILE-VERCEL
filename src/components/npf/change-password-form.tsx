"use client"

import { useState, type FormEvent } from "react"
import { Loader2Icon } from "lucide-react"

import { changePassword } from "@/lib/auth/actions"
import { getCommonErrors } from "@/lib/i18n/common-errors"
import type { Dictionary } from "@/lib/i18n/dictionaries"
import { reportError } from "@/lib/telemetry/report-error"
import { PasswordField } from "@/components/npf/password-field"

type AuthDictionary = Dictionary["auth"]

/**
 * F-63 — change-password UI for signed-in customers.
 *
 * Before this, a password could only be replaced via the *reset* flow
 * (email token), i.e. rotating a known password was impossible from the
 * account area. Requires the current password (server-enforced by Vendure),
 * checks the new/confirm pair client-side before the round trip, and maps
 * the server's `invalid_credentials` to a specific message so the user knows
 * WHICH field was wrong.
 */
export function ChangePasswordForm({ locale, dictionary }: { locale: string; dictionary: AuthDictionary }) {
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "invalid" | "error">("idle")
  const [mismatch, setMismatch] = useState(false)
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const common = getCommonErrors(locale)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus("idle")
    if (next !== confirm) {
      setMismatch(true)
      return
    }
    setMismatch(false)
    setSubmitting(true)
    try {
      const result = await changePassword({ currentPassword: current, newPassword: next })
      if (result.ok) {
        setStatus("success")
        setCurrent("")
        setNext("")
        setConfirm("")
      } else if (result.error === "invalid_credentials") {
        setStatus("invalid")
      } else {
        setStatus("error")
      }
    } catch (error) {
      reportError(error, { scope: "client", action: "changePassword" })
      setStatus("error")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form method="post" onSubmit={handleSubmit} className="ngc-form" noValidate={false}>
      <PasswordField
        id="currentPassword"
        name="currentPassword"
        label={`${dictionary.currentPasswordLabel} *`}
        showLabel={dictionary.showPassword}
        hideLabel={dictionary.hidePassword}
        autoComplete="current-password"
        required
        value={current}
        onValueChange={setCurrent}
        invalid={status === "invalid"}
        describedBy={status === "invalid" ? "chpwd-error" : undefined}
      />
      <PasswordField
        id="newPassword"
        name="newPassword"
        label={`${dictionary.newPasswordLabel} *`}
        showLabel={dictionary.showPassword}
        hideLabel={dictionary.hidePassword}
        hint={dictionary.registerPasswordHint}
        autoComplete="new-password"
        minLength={6}
        required
        value={next}
        onValueChange={(value) => {
          setNext(value)
          if (mismatch) setMismatch(value !== confirm)
        }}
      />
      <PasswordField
        id="confirmNewPassword"
        name="confirmNewPassword"
        label={`${dictionary.confirmNewPasswordLabel} *`}
        showLabel={dictionary.showPassword}
        hideLabel={dictionary.hidePassword}
        autoComplete="new-password"
        minLength={6}
        required
        value={confirm}
        onValueChange={(value) => {
          setConfirm(value)
          if (mismatch) setMismatch(value !== next)
        }}
        invalid={mismatch}
        describedBy={mismatch ? "chpwd-mismatch" : undefined}
      />
      {mismatch && (
        <p id="chpwd-mismatch" role="alert" className="ngc-alert">
          {dictionary.registerConfirmMismatch}
        </p>
      )}
      {status === "success" && (
        <p role="status" className="ngc-ok">
          {dictionary.changePasswordSuccess}
        </p>
      )}
      {status === "invalid" && (
        <p id="chpwd-error" role="alert" className="ngc-alert">
          {dictionary.changePasswordInvalid}
        </p>
      )}
      {status === "error" && (
        <p role="alert" className="ngc-alert">
          {common.networkError}
        </p>
      )}
      <button type="submit" disabled={submitting} className="ng-btn ng-btn-primary justify-self-start">
        {submitting && <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />}
        {dictionary.changePasswordCta}
      </button>
    </form>
  )
}

