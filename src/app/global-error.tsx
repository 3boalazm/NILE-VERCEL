"use client"

import { useEffect } from "react"

import { reportError } from "@/lib/telemetry/report-error"

/** Root layouts may fail before fonts/providers/styles load. Standalone,
 * bilingual fallback deliberately does not depend on the failed layout. */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    // F-65: a root-layout crash is the worst case — nothing else renders, so
    // if this is not reported the team hears about it from a customer.
    reportError(error, { scope: "global-error" })
  }, [error])

  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          background: "#f3f5f0",
          color: "#153a35",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <main
          style={{
            maxWidth: 560,
            margin: "15vh auto",
            padding: 32,
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 12, letterSpacing: 2 }}>NILE PHARMA FOOD</p>
          <h1>حصل عطل مؤقت</h1>
          <p>مقدرناش نحمّل الموقع دلوقتي. حاول مرة تانية.</p>
          <p lang="en" dir="ltr">
            A temporary interruption. Please retry or return home.
          </p>
          <button
            onClick={retry}
            style={{
              border: 0,
              borderRadius: 30,
              padding: "16px 24px",
              background: "#153a35",
              color: "white",
              cursor: "pointer",
              margin: 12,
            }}
          >
            حاول تاني · Try again
          </button>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- full reload recovers a failed root layout */}
          <a
            href="/ar"
            style={{ color: "#153a35", display: "inline-block", padding: 16 }}
          >
            الرئيسية · Home
          </a>
        </main>
      </body>
    </html>
  )
}
