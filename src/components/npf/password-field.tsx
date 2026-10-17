"use client"

import { useId, useState } from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

/**
 * F-59 — password input with a show/hide toggle, shared by every form that
 * takes a password (login, register, reset).
 *
 * Masking passwords is correct by default but hostile in practice: on a
 * phone, under sunlight, with an Arabic-keyboard transliteration, a mistyped
 * password is invisible until the server rejects it. The toggle is the
 * standard fix, and keeping it in ONE component means the aria wiring
 * (`aria-pressed`, label swap) cannot drift between forms.
 */
export function PasswordField({
  id,
  name,
  label,
  showLabel,
  hideLabel,
  hint,
  autoComplete,
  minLength,
  required,
  value,
  onValueChange,
  children,
  labelSuffix,
  invalid,
  describedBy,
}: {
  id: string
  name: string
  label: string
  showLabel: string
  hideLabel: string
  hint?: string
  autoComplete: "password" | "new-password" | "current-password"
  minLength?: number
  required?: boolean
  /** Controlled value — register needs it for the strength meter. */
  value?: string
  onValueChange?: (value: string) => void
  /** Extra content rendered under the input (e.g. the strength meter). */
  children?: React.ReactNode
  /** Rendered on the label's baseline row (login uses it for the recovery link). */
  labelSuffix?: React.ReactNode
  invalid?: boolean
  describedBy?: string
}) {
  const [showPassword, setShowPassword] = useState(false)
  const hintId = useId()

  return (
    <div className="flex flex-col gap-1.5">
      {labelSuffix ? (
        <div className="flex items-baseline justify-between gap-3">
          <Label htmlFor={id}>{label}</Label>
          {labelSuffix}
        </div>
      ) : (
        <Label htmlFor={id}>{label}</Label>
      )}
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          value={value}
          onChange={onValueChange ? (event) => onValueChange(event.target.value) : undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy ?? (hint ? hintId : undefined)}
          className="pe-11"
        />
        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          aria-pressed={showPassword}
          aria-label={showPassword ? hideLabel : showLabel}
          title={showPassword ? hideLabel : showLabel}
          className="absolute inset-y-0 end-0 inline-flex min-w-11 items-center justify-center rounded-e-md text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {showPassword ? <EyeOffIcon className="size-4" aria-hidden="true" /> : <EyeIcon className="size-4" aria-hidden="true" />}
        </button>
      </div>
      {hint && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {children}
    </div>
  )
}

export type StrengthScore = 0 | 1 | 2 | 3 | 4

/**
 * F-19 — password-strength meter for registration.
 *
 * A heuristic, not a cracker: one point each for length ≥ 8, mixed case, a
 * digit, and a symbol. Deliberately dependency-free (zxcvbn's dictionary is
 * ~800KB) and deliberately advisory — the server's policy check remains the
 * authority; this only gives feedback *before* submit so users learn the
 * policy instead of being rejected by it.
 */
export function passwordStrength(password: string): StrengthScore {
  if (!password) return 0
  let score = 0
  if (password.length >= 8) score += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  // A very short password never reads as strong regardless of variety.
  if (password.length < 6) score = Math.min(score, 1)
  return score as StrengthScore
}

export function PasswordStrengthMeter({
  score,
  labels,
  ariaLabel,
}: {
  score: StrengthScore
  /** [weak, fair, good, strong] — index score-1; empty password hides it. */
  labels: [string, string, string, string]
  ariaLabel: string
}) {
  if (score === 0) return null
  const level = score - 1
  return (
    <div
      className="flex items-center gap-2"
      role="status"
      aria-label={`${ariaLabel}: ${labels[level]}`}
    >
      <div className="flex flex-1 gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= level
                ? score <= 1
                  ? "bg-destructive"
                  : score === 2
                    ? "bg-amber-500"
                    : score === 3
                      ? "bg-lime-600"
                      : "bg-emerald-600"
                : "bg-muted"
            )}
          />
        ))}
      </div>
      <span className="w-16 text-end text-xs text-muted-foreground">{labels[level]}</span>
    </div>
  )
}
