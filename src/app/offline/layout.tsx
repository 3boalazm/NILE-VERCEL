/**
 * The /offline fallback is precached by the service worker and served when a
 * navigation fails, so it must render correctly with NOTHING else available:
 * no stylesheet chunk, no webfont, no JavaScript. Its styles therefore live
 * inline in page.tsx (Nile Glass tokens, restated as plain CSS) and this
 * layout deliberately imports no global CSS.
 */
export default function OfflineLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
