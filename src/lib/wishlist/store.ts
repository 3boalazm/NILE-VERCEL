"use client"

import { useSyncExternalStore } from "react"

const STORAGE_KEY = "npf-wishlist"

type Listener = () => void
let listeners: Listener[] = []
let cachedSnapshot: string[] | null = null

function readStoredSlugs(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? [...new Set(parsed.filter((item): item is string => typeof item === "string" && /^[a-z0-9-]{1,120}$/.test(item)))].slice(0,50) : []
  } catch {
    return []
  }
}

function emitChange() {
  for (const listener of listeners) listener()
}

/**
 * Same useSyncExternalStore pattern as theme-toggle.tsx/install-prompt.tsx
 * (the project's own established way to read a browser-only source without
 * a hydration mismatch) — a plain module-level store rather than a Context
 * provider, since nothing here needs a per-subtree value, just one shared
 * client-side list. getSnapshot returns a cached reference (not a fresh
 * array every call) so React doesn't loop re-rendering forever.
 */
function storageChanged(event: StorageEvent) {
  if (event.key === STORAGE_KEY || event.key === null) { cachedSnapshot = null; emitChange() }
}
export function subscribe(onChange: Listener) {
  if (listeners.length === 0) window.addEventListener("storage", storageChanged)
  listeners.push(onChange)
  return () => {
    listeners = listeners.filter((listener) => listener !== onChange)
    if (listeners.length === 0) window.removeEventListener("storage", storageChanged)
  }
}

export function getSnapshot(): string[] {
  if (cachedSnapshot === null) cachedSnapshot = readStoredSlugs()
  return cachedSnapshot
}

// A fresh [] literal on every call reads as "changed" to useSyncExternalStore
// (it compares by reference), which can trigger an infinite render loop —
// one stable, shared empty array fixes it.
const EMPTY_SLUGS: string[] = []

export function getServerSnapshot(): string[] {
  return EMPTY_SLUGS
}

function persist(next: string[]) {
  cachedSnapshot = next
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Storage unavailable (private mode, quota) — the in-memory snapshot
    // still updates for this tab session, just doesn't survive a reload.
  }
  emitChange()
}

export function toggleWishlistSlug(slug: string) {
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return
  const current = getSnapshot()
  if (!current.includes(slug) && current.length >= 50) return
  persist(current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug])
}

export function removeWishlistSlug(slug: string) {
  const current = getSnapshot()
  if (current.includes(slug)) persist(current.filter((s) => s !== slug))
}

/**
 * F-20 — merge server-synced slugs into the local list (union, order:
 * local first so the visitor's own additions stay at the top of the page).
 * A no-op when nothing is new; safe against tampered server payloads
 * (non-string entries are dropped before this is called, in sync.ts).
 */
export function mergeWishlistSlugs(serverSlugs: string[]) {
  const merged = [...getSnapshot()]
  for (const slug of serverSlugs) {
    if (!merged.includes(slug)) merged.push(slug)
  }
  if (merged.length !== getSnapshot().length) persist(merged)
}

export function useWishlist() {
  const slugs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return {
    slugs,
    isWishlisted: (slug: string) => slugs.includes(slug),
    toggle: toggleWishlistSlug,
    remove: removeWishlistSlug,
  }
}
