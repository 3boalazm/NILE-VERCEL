"use client"

import dynamic from "next/dynamic"

/**
 * Lazy entry point for the hero WebGL backdrop. The heavy-ish client chunk
 * (shaders + WebGL boot) is code-split and loaded client-side only when the
 * NEXT_PUBLIC_HERO_WEBGL flag is on — the flag is evaluated at build time in
 * hero.tsx, so when it's off this dynamic import never runs and the chunk
 * never ships to the client.
 */
const HeroWebGLBackdrop = dynamic(
  () => import("./hero-webgl-backdrop").then((m) => m.HeroWebGLBackdrop),
  { ssr: false }
)

export function HeroWebGL() {
  return <HeroWebGLBackdrop />
}
