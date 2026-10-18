"use client"

import { useRef, useState } from "react"
import { CheckIcon, CopyIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Copy-to-clipboard for payment rails (Vodafone Cash wallet number, InstaPay
 * alias). Copies the SHARED site-config constant's value — the number itself
 * is never duplicated in components. Visual feedback via a short "copied"
 * state; `aria-live` announces it for assistive tech.
 */
export function CopyToClipboardButton({
  value,
  label,
  copiedLabel,
  className,
}: {
  value: string
  label: string
  copiedLabel: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard permission denied / unsupported context — the number stays
      // visible as text right next to the button, so silently keep it.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-live="polite"
      data-copied={copied}
      className={cn("ngc-pill-btn", className)}
    >
      {copied ? (
        <CheckIcon aria-hidden="true" />
      ) : (
        <CopyIcon aria-hidden="true" />
      )}
      {copied ? copiedLabel : label}
    </button>
  )
}
