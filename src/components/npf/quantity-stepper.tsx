"use client"

import { MinusIcon, PlusIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  label,
  disabled = false,
  className,
}: {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  label: string
  disabled?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "ngc-stepper",
        className
      )}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        aria-label={`${label} −`}
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <MinusIcon aria-hidden="true" />
      </button>
      <span aria-live="polite">{value}</span>
      <button
        type="button"
        aria-label={`${label} +`}
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <PlusIcon aria-hidden="true" />
      </button>
    </div>
  )
}
