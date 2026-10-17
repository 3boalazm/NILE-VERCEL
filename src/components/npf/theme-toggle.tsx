"use client"

import { useSyncExternalStore } from "react"
import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
  return () => observer.disconnect()
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark")
}

function getServerSnapshot() {
  return false
}

export function ThemeToggle({
  lightLabel,
  darkLabel,
}: {
  lightLabel: string
  darkLabel: string
}) {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  function toggle() {
    const next = !isDark
    document.documentElement.classList.toggle("dark", next)
    try { window.localStorage.setItem("theme", next ? "dark" : "light") } catch { /* In-memory theme remains usable with blocked storage. */ }
  }

  return (
    <Button variant="ghost" size="icon" aria-label={isDark ? lightLabel : darkLabel} onClick={toggle}>
      {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </Button>
  )
}
