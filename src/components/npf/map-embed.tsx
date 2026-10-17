"use client"

import { useState } from "react"
import { MapPinIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { ctaButtonVariants } from "@/components/ui/button"

/**
 * Google Maps, loaded only when the visitor asks for it.
 *
 * The embedded iframe sets third-party cookies for every visitor who opens
 * the contact page, which is exactly the kind of tracking the site's
 * no-cookie-banner stance is meant to avoid. Nothing is requested from
 * Google until the button is pressed, and the plain "open in Maps" link
 * costs nothing (no request happens until someone clicks it).
 */
export function NPFMapEmbed({
  query,
  title,
  buttonLabel,
  note,
  openLabel,
}: {
  query: string
  title: string
  buttonLabel: string
  note: string
  openLabel: string
}) {
  const [shown, setShown] = useState(false)
  const encoded = encodeURIComponent(query)
  const mapsHref = `https://maps.google.com/?q=${encoded}`

  if (shown) {
    return (
      <div className="overflow-hidden rounded-2xl">
        <iframe
          title={title}
          src={`https://maps.google.com/maps?q=${encoded}&output=embed`}
          className="h-64 w-full"
          loading="lazy"
        />
        <a
          href={mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm text-primary hover:underline"
        >
          {openLabel}
        </a>
      </div>
    )
  }

  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-muted/30 p-6 text-center">
      <MapPinIcon className="size-6 text-primary" aria-hidden="true" />
      <button
        type="button"
        onClick={() => setShown(true)}
        className={cn(ctaButtonVariants({ variant: "onLight" }), "text-sm")}
      >
        {buttonLabel}
      </button>
      <p className="max-w-xs text-xs text-muted-foreground">{note}</p>
      <a
        href={mapsHref}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-primary hover:underline"
      >
        {openLabel}
      </a>
    </div>
  )
}
