"use client"

import { useState, useTransition } from "react"
import { LogOutIcon } from "lucide-react"

import { logout } from "@/lib/auth/actions"
import { purgePrivatePageCaches } from "@/lib/pwa/cache-policy"
import { getCommonErrors } from "@/lib/i18n/common-errors"
import { cn } from "@/lib/utils"
import { reportError } from "@/lib/telemetry/report-error"

/**
 * `className` is applied to the wrapper, not the button: it carries the flex
 * sizing the parent sidebar passes in (`shrink-0 lg:shrink`), and the wrapper
 * is the parent's flex child now that a failure message can render underneath.
 */
export function LogoutButton({
  locale,
  label,
  className,
}: {
  locale: string
  label: string
  className?: string
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const common = getCommonErrors(locale)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      try {
        // The action already tolerates an unreachable Vendure (it clears the
        // local session regardless), so this catch only fires when the
        // browser's own connection drops.
        await logout()
        // Drop any private pages the service worker cached for this session,
        // then hard-navigate so no signed-in state survives in memory.
        await purgePrivatePageCaches()
        window.location.replace("/")
      } catch (error) {
        // F-65: a dropped connection here is invisible server-side, so the
        // failure is reported as well as shown (rate-limited, never throws).
        reportError(error, { scope: "client", action: "logout" })
        // F-64: previously the rejection vanished — the button re-enabled and
        // the visitor was left signed in with no idea the click had failed.
        setError(common.networkError)
      }
    })
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-describedby={error ? "logout-error" : undefined}
        className="flex w-full items-center gap-2.5 rounded-xl border border-border px-4 py-2.5 text-sm font-medium whitespace-nowrap text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
      >
        <LogOutIcon className="size-4 shrink-0" />
        {label}
      </button>
      {error && (
        <p id="logout-error" role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
