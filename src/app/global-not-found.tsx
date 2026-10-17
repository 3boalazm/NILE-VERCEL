import { SUPPORT_EMAIL, THEME_COLOR_DARK, THEME_COLOR_LIGHT } from "@/lib/site-config"

/**
 * F-73 — a 404 page that actually renders without JavaScript.
 *
 * The root layout lives inside the `[locale]` segment (the standard i18n
 * pattern), so routes that match *no* segment — `/ar/does-not-exist`, a bad
 * top-level path, `/whatever.jpg` — fell through to Next's built-in fallback,
 * which serves an empty `<div id="__next_error__">` shell and hydrates the
 * real UI client-side. With JavaScript disabled (crawlers on a budget,
 * corporate proxies, old devices, `curl`) visitors got a blank page with a 404
 * status: correct code, zero content.
 *
 * `app/global-not-found.tsx` + `experimental.globalNotFound` (next.config.ts)
 * replaces that fallback. It renders with **no layouts at all** — which is why
 * it carries its own `<html>`/`<body>` and an inline `<style>` block instead of
 * relying on globals.css or Tailwind classes: a 404 must survive even when the
 * stylesheet request itself is what failed. Everything here is static markup;
 * there is deliberately nothing to hydrate.
 *
 * It is bilingual and self-directed (Arabic first — the default locale — then
 * English) because at this point there is no locale segment to negotiate from.
 */
export default function GlobalNotFound() {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <title>404 — الصفحة غير موجودة | Page not found</title>
        <style>{`
          :root { color-scheme: light; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 24px;
            background: ${THEME_COLOR_LIGHT};
            color: ${THEME_COLOR_DARK};
            font-family: system-ui, -apple-system, "Segoe UI", Tahoma, sans-serif;
            text-align: center;
          }
          main { max-width: 34rem; }
          p.code {
            margin: 0 0 8px;
            font-size: clamp(56px, 14vw, 96px);
            font-weight: 800;
            letter-spacing: 0.02em;
            line-height: 1;
          }
          h1 { margin: 0 0 8px; font-size: clamp(20px, 4.5vw, 28px); }
          p.en { margin: 0 0 24px; font-size: 15px; opacity: 0.8; direction: ltr; }
          nav { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
          a.btn {
            display: inline-block;
            padding: 10px 22px;
            border-radius: 999px;
            background: ${THEME_COLOR_DARK};
            color: #fff;
            text-decoration: none;
            font-weight: 600;
          }
          a.btn.ghost { background: transparent; color: ${THEME_COLOR_DARK}; border: 1px solid ${THEME_COLOR_DARK}; }
          p.mail { margin-top: 28px; font-size: 14px; opacity: 0.75; }
          p.mail a { color: inherit; }
        `}</style>
      </head>
      <body>
        <main>
          <p className="code" aria-hidden="true">
            404
          </p>
          {/* Same wording as the localized not-found dictionary entry, so the
              site has ONE voice for "page not found" across both surfaces. */}
          <h1>الصفحة غير موجودة</h1>
          <p className="en" lang="ar" dir="rtl">
            الصفحة اللي بتدور عليها مش موجودة، ممكن تكون اتحذفت أو الرابط غلط.
          </p>
          <p className="en" lang="en" dir="ltr">
            The page you are looking for doesn&apos;t exist or has been moved.
          </p>
          {/* eslint-disable @next/next/no-html-link-for-pages -- deliberate:
              this page renders OUTSIDE the App Router with no layouts and no
              client JS to hydrate, so next/link's client-side navigation would
              never run; plain anchors are the only navigation that works on a
              JS-free 404. */}
          <nav aria-label="روابط بديلة / Alternative links">
            <a className="btn" href="/ar">
              العودة للرئيسية
            </a>
            <a className="btn ghost" href="/en" lang="en" dir="ltr">
              Go to homepage
            </a>
          </nav>
          <p className="mail">
            لو فا إن ده خطأ من عندنا، كلّمنا على{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} dir="ltr">
              {SUPPORT_EMAIL}
            </a>
          </p>
        </main>
      </body>
    </html>
  )
}
