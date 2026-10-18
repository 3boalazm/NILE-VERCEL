"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2Icon } from "lucide-react"

import { register } from "@/lib/auth/actions"
import { getCommonErrors } from "@/lib/i18n/common-errors"
import type { Dictionary } from "@/lib/i18n/dictionaries"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { reportError } from "@/lib/telemetry/report-error"
import { reconcileWishlist } from "@/lib/wishlist"
import { PasswordField, PasswordStrengthMeter, passwordStrength } from "@/components/npf/password-field"

type AuthDictionary = Dictionary["auth"]

export function NPFRegisterForm({ locale, dictionary }: { locale: string; dictionary: AuthDictionary }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // F-19: the strength meter and the confirm field both need the password in
  // React state (the meter re-renders per keystroke; the mismatch check runs
  // before submit), so these two fields are controlled.
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [mismatch, setMismatch] = useState(false)
  const router = useRouter()
  const base = `/${locale}`
  const common = getCommonErrors(locale)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    // F-19: catch a typo between the two password fields BEFORE the round
    // trip — registering with a password the user never typed is a locked-out
    // account waiting to happen.
    if (password !== confirm) {
      setMismatch(true)
      return
    }
    setMismatch(false)
    setSubmitting(true)
    const data = new FormData(event.currentTarget)
    try {
      const result = await register({
        firstName: String(data.get("firstName") ?? ""),
        lastName: String(data.get("lastName") ?? ""),
        email: String(data.get("email") ?? ""),
        password: String(data.get("password") ?? ""),
        phone: String(data.get("phone") ?? ""),
      })
      if (!result.ok) {
        setError(
          result.error === "rate_limited"
            ? dictionary.registerErrorRateLimited
            : dictionary.registerErrorGeneric
        )
        return
      }
      // F-20: reconcile (creates the account document from day one, usually
      // from an empty local list); fire-and-forget, same contract as login.
      reconcileWishlist().catch(() => {})
      router.push(`${base}/account`)
      router.refresh()
    } catch (error) {
      // F-65: a dropped connection here is invisible server-side, so the
      // failure is reported as well as shown (rate-limited, never throws).
      reportError(error, { scope: "client", action: "register" })
      // F-64: browser-side connection drop — the action call itself rejected,
      // so no `result` exists. Report it and keep the form submittable; the
      // entered values stay in the DOM because nothing re-rendered them away.
      setError(common.networkError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form method="post" aria-busy={submitting} aria-describedby={error ? "form-feedback" : undefined} onSubmit={handleSubmit} className="ngc-form">
      <div className="ngc-grid-2">
        <div className="ngc-field">
          <Label htmlFor="firstName">{dictionary.registerFirstName} *</Label>
          <Input id="firstName" name="firstName" required autoComplete="given-name" />
        </div>
        <div className="ngc-field">
          <Label htmlFor="lastName">{dictionary.registerLastName} *</Label>
          <Input id="lastName" name="lastName" required autoComplete="family-name" />
        </div>
      </div>
      <div className="ngc-field">
        <Label htmlFor="email">{dictionary.registerEmail} *</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="ngc-field">
        <Label htmlFor="phone">{dictionary.registerPhone}</Label>
        <Input id="phone" name="phone" type="tel" autoComplete="tel" />
      </div>
      <PasswordField
        id="password"
        name="password"
        label={`${dictionary.registerPassword} *`}
        showLabel={dictionary.showPassword}
        hideLabel={dictionary.hidePassword}
        hint={dictionary.registerPasswordHint}
        autoComplete="new-password"
        minLength={6}
        required
        value={password}
        onValueChange={(value) => {
          setPassword(value)
          if (mismatch) setMismatch(value !== confirm)
        }}
      >
        {/* F-19: live advisory meter — see passwordStrength() for why this is
            a heuristic and not the enforcement point. */}
        <PasswordStrengthMeter
          score={passwordStrength(password)}
          labels={[
            dictionary.strengthWeak,
            dictionary.strengthFair,
            dictionary.strengthGood,
            dictionary.strengthStrong,
          ]}
          ariaLabel={dictionary.strengthLabel}
        />
      </PasswordField>
      <PasswordField
        id="confirmPassword"
        name="confirmPassword"
        label={`${dictionary.registerConfirmPassword} *`}
        showLabel={dictionary.showPassword}
        hideLabel={dictionary.hidePassword}
        autoComplete="new-password"
        minLength={6}
        required
        value={confirm}
        onValueChange={(value) => {
          setConfirm(value)
          if (mismatch) setMismatch(value !== password)
        }}
        invalid={mismatch}
        describedBy={mismatch ? "confirm-mismatch" : undefined}
      />
      {mismatch && (
        <p id="confirm-mismatch" role="alert" className="ngc-alert">
          {dictionary.registerConfirmMismatch}
        </p>
      )}

      {error && (
        <p className="ngc-alert" id="form-feedback" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="ng-btn ng-btn-primary ng-btn-lg ngc-block"
      >
        {submitting && <Loader2Icon className="size-4 animate-spin" />}
        {submitting ? dictionary.registerSubmitting : dictionary.registerSubmit}
      </button>

      <p className="ngc-form-foot">
        {dictionary.registerHaveAccount}{" "}
        <Link href={`${base}/login`} className="ngc-inline-link">
          {dictionary.registerLoginLink}
        </Link>
      </p>
    </form>
  )
}
