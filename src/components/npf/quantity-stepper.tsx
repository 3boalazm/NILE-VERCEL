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
        "inline-flex items-center rounded-full border border-border",
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
        className="inline-flex size-9 max-lg:size-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
      >
        <MinusIcon className="size-3.5" />
      </button>
      <span className="w-8 text-center text-sm font-medium tabular-nums">{value}</span>
      <button
        type="button"
        aria-label={`${label} +`}
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="inline-flex size-9 max-lg:size-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
      >
        <PlusIcon className="size-3.5" />
      </button>
    </div>
  )
}
