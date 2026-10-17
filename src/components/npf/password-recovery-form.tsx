"use client"
import { useState, type FormEvent } from "react"
import Link from "next/link"
import { requestPasswordReset, resetPassword } from "@/lib/auth/password-reset"
import { getRecoveryCopy } from "@/lib/i18n/recovery"
import type { Locale } from "@/lib/i18n/config"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function PasswordRecoveryForm({
  locale,
  enabled,
  token,
}: {
  locale: Locale
  enabled: boolean
  token?: string
}) {
  const c = getRecoveryCopy(locale)
  const [pending, setPending] = useState(false),
    [done, setDone] = useState(false),
    [error, setError] = useState("")
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (pending) return
    const data = new FormData(e.currentTarget)
    if (token && data.get("password") !== data.get("confirm")) {
      setError(c.mismatch)
      return
    }
    setPending(true)
    setError("")
    try {
      const result = token
        ? await resetPassword(token, String(data.get("password") ?? ""))
        : await requestPasswordReset(String(data.get("email") ?? ""))
      if (result.ok) {
        setDone(true)
        if (token)
          window.history.replaceState(null, "", `/${locale}/reset-password`)
      } else
        setError(
          result.error === "rate_limited"
            ? c.rate
            : result.error === "unavailable"
              ? c.unavailable
              : result.error === "invalid_token"
                ? c.invalid
                : result.error === "validation"
                  ? c.validation
                  : c.error
        )
    } catch {
      setError(c.error)
    } finally {
      setPending(false)
    }
  }
  if (!enabled)
    return (
      <div className="flex flex-col gap-5">
        <p
          role="note"
          className="text-sm leading-relaxed text-muted-foreground"
        >
          {c.unavailable}
        </p>
        <Link href={`/${locale}/contact`} className="quiet-link">
          {c.contact} ↗
        </Link>
      </div>
    )
  if (done)
    return (
      <div role="status" className="flex flex-col gap-5">
        <p>{token ? c.done : c.sent}</p>
        <Link href={`/${locale}/login`} className="quiet-link">
          {c.login} ↗
        </Link>
      </div>
    )
  return (
    <form
      onSubmit={submit}
      aria-busy={pending}
      aria-describedby={error ? "recovery-error" : undefined}
      className="flex flex-col gap-5"
    >
      {token ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="new-password">{c.password}</Label>
            <Input
              id="new-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">{c.confirm}</Label>
            <Input
              id="confirm-password"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
            />
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="recovery-email">{c.email}</Label>
          <Input
            id="recovery-email"
            name="email"
            type="email"
            dir="ltr"
            autoComplete="email"
            required
            maxLength={254}
          />
        </div>
      )}
      {error && (
        <p
          id="recovery-error"
          role="alert"
          className="text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="studio-button !px-5 disabled:opacity-50"
      >
        {pending ? "…" : token ? c.save : c.send}
      </button>
    </form>
  )
}
