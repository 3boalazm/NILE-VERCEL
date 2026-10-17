#!/usr/bin/env node
/**
 * F-33 — regenerate the maskable PWA icon.
 *
 * `public/icon-512.png` is a squircle with transparent corners. Android's
 * maskable treatment crops the icon into a circle/squircle chosen by the
 * launcher, and transparent corners show through as the system wallpaper or a
 * hard white — which is why the manifest needed an icon with
 * `purpose: "maskable"`: one that is full-bleed (opaque to every edge) with
 * all meaningful artwork inside the central safe zone.
 *
 * This script builds that icon deterministically from the existing artwork
 * instead of asking anyone to redraw it by hand:
 *   1. an opaque 512×512 canvas in the brand navy (#0a2240 — the same Prussian
 *      Blue the header/CTAs use, so the installed icon matches the site),
 *   2. the artwork scaled to 72% and centred — inside the "safe zone" the
 *      platform docs define as the central 80%-diameter circle, with margin.
 *
 * Run:  node scripts/build-maskable-icon.mjs
 * Deps: sharp (already a direct dependency for Payload's image handling).
 */

import { createRequire } from "node:module"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const require = createRequire(import.meta.url)
const sharp = require("sharp")

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const SOURCE = join(ROOT, "public/icon-512.png")
const OUT = join(ROOT, "public/icon-maskable-512.png")
const SIZE = 512
const BRAND_NAVY = "#0a2240"
/** 72% of the canvas: comfortably inside the 80% safe-zone diameter. */
const ART = Math.round(SIZE * 0.72)
const OFFSET = Math.round((SIZE - ART) / 2)

const canvas = sharp({
  create: { width: SIZE, height: SIZE, channels: 4, background: BRAND_NAVY },
})

const art = await sharp(SOURCE)
  .resize(ART, ART, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer()

await canvas
  .composite([{ input: art, left: OFFSET, top: OFFSET }])
  .png({ compressionLevel: 9 })
  .toFile(OUT)

// Prove the result is what a maskable icon must be: fully opaque, full-bleed.
const meta = await sharp(OUT).metadata()
const stats = await sharp(OUT).stats()
const alphaMin = stats.channels[3]?.min ?? 255
console.log(`wrote ${OUT} (${meta.width}x${meta.height})`)
console.log(`  min alpha across the canvas: ${alphaMin} ${alphaMin === 255 ? "(fully opaque — maskable-safe)" : "(NOT opaque!)"}`)
process.exit(alphaMin === 255 ? 0 : 1)
