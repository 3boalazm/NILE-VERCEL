"use client"

import { useEffect, type ReactNode } from "react"

/** Native registration is optional enhancement, never a rendering dependency.
 * Blocked registration/private mode/insecure origins must leave the site usable. */
export function SerwistProvider({ children, swUrl }: { children: ReactNode; swUrl: string }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator) || !window.isSecureContext) return
    void navigator.serviceWorker.register(swUrl, { scope: "/", updateViaCache: "none" }).catch(() => {
      // Offline install is optional. Never turn a rejected registration into
      // a render failure, and don't expose internals in customer-facing UI.
    })
  }, [swUrl])
  return children
}
