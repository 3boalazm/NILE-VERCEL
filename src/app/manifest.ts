import type { MetadataRoute } from "next"

import { BACKGROUND_COLOR, THEME_COLOR_DARK } from "@/lib/site-config"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "نايل فارما فود",
    short_name: "نايل فارما فود",
    description:
      "الموزّع الرسمي المعتمد لمنتجات Alfasigma الإيطالية في مصر — مكملات غذائية وأجهزة طبية.",
    start_url: "/ar",
    lang: "ar",
    dir: "rtl",
    display: "standalone",
    background_color: BACKGROUND_COLOR,
    theme_color: THEME_COLOR_DARK,
    icons: [
      // `purpose: "any"` on the regular icons is now explicit rather than
      // implied: once an icon set contains a maskable entry, the platform
      // treats an unmarked entry's purpose as implementation-defined, and the
      // squircle artwork (transparent corners) is exactly what "any" means —
      // use it only where the launcher shows the full square.
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      // F-33: the manifest had no maskable icon, so Android launchers that
      // apply an adaptive mask cropped the squircle's transparent corners and
      // showed wallpaper through them. This one is full-bleed brand navy with
      // the artwork inside the 80% safe zone — see
      // scripts/build-maskable-icon.mjs, which regenerates it from
      // public/icon-512.png and self-checks that the result is fully opaque.
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
