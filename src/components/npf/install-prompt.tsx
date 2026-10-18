"use client"

import { useSyncExternalStore } from "react"
import { XIcon } from "lucide-react"
import { reportError } from "@/lib/telemetry/report-error"

/** Only the plain-string slice of the dictionary this component needs — never
 * pass the full Dictionary into a Client Component (see contact-form.tsx). */
type InstallPromptDictionary = {
  body: string
  dismiss: string
}

const DISMISS_KEY = "npf-install-prompt-dismissed"
const listeners = new Set<() => void>()

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

/** iOS Safari has no native "install this app" prompt (unlike Chrome/Edge/
 * Android, which show their own automatically once the manifest + service
 * worker criteria are met) — this is the one platform that needs a manual
 * hint, per Next.js's own PWA guide. */
function getSnapshot(): boolean {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window)
  if (!isIOS) return false

  const nav = navigator as Navigator & { standalone?: boolean }
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true
  if (isStandalone) return false

  try { return sessionStorage.getItem(DISMISS_KEY) !== "1" } catch { return false }
}

function getServerSnapshot() {
  return false
}

function dismiss() {
  try {
    sessionStorage.setItem(DISMISS_KEY, "1")
  } catch (error) {
    // F-65: a dropped connection here is invisible server-side, so the
    // failure is reported as well as shown (rate-limited, never throws).
    reportError(error, { scope: "client", action: "pwaInstallPrompt" })
    // sessionStorage unavailable (private mode) — dismissal just won't persist
  }
  listeners.forEach((listener) => listener())
}

export function InstallPrompt({ dictionary }: { dictionary: InstallPromptDictionary }) {
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  if (!visible) return null

  return (
    <div role="status" className="ngc-float ngc-float-row">
      <p>{dictionary.body}</p>
      <button
        type="button"
        onClick={dismiss}
        aria-label={dictionary.dismiss}
        title={dictionary.dismiss}
        className="ng-icon-btn"
        style={{ flex: "none" }}
      >
        <XIcon className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
