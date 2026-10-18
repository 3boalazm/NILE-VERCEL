import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "لا يوجد اتصال بالإنترنت",
};

/* Nile Glass, restated inline: this document must look right when served from
   the precache with no other asset reachable (see layout.tsx). System fonts
   only; no backdrop-filter (the backdrop is a static gradient, a blur would be
   invisible); logical properties; reduced-motion / reduced-transparency /
   forced-colors respected. */
const css = `
:root {
  color-scheme: light dark;
  --ink: #0a1a2b; --ink-2: #2c4258; --ink-3: #4f6579;
  --brand: #00426e; --brand-hi: #0a5f9e; --aqua: #27b3e6;
  --bg: #edf3f8; --bg-2: #f7fafc;
  --glass: rgba(255, 255, 255, 0.72); --edge: rgba(255, 255, 255, 0.9);
  --hair: rgba(10, 26, 43, 0.1); --btn-fg: #fff;
}
@media (prefers-color-scheme: dark) {
  :root {
    --ink: #eaf3fb; --ink-2: #c3d4e3; --ink-3: #9db3c6;
    --brand: #7cc8f5; --brand-hi: #a6dcff;
    --bg: #06121f; --bg-2: #0a1c2e;
    --glass: rgba(17, 40, 62, 0.72); --edge: rgba(255, 255, 255, 0.14);
    --hair: rgba(255, 255, 255, 0.12); --btn-fg: #04121f;
  }
}
@media (prefers-reduced-transparency: reduce) {
  :root { --glass: var(--bg-2); }
}
* { box-sizing: border-box; }
html, body { margin: 0; }
body {
  min-block-size: 100vh;
  min-block-size: 100dvh;
  display: grid;
  place-items: center;
  padding: 24px 16px;
  color: var(--ink);
  font-family: "IBM Plex Sans Arabic", "Noto Sans Arabic", "Segoe UI", Tahoma, system-ui, sans-serif;
  line-height: 1.8;
  background:
    radial-gradient(60vmax 46vmax at 88% -8%, color-mix(in srgb, var(--aqua) 30%, transparent), transparent 62%),
    radial-gradient(52vmax 44vmax at 4% 18%, rgba(255, 196, 173, 0.32), transparent 60%),
    radial-gradient(60vmax 50vmax at 70% 108%, rgba(182, 234, 217, 0.4), transparent 62%),
    linear-gradient(180deg, var(--bg-2), var(--bg));
  background-attachment: fixed;
}
@media (prefers-color-scheme: dark) {
  body {
    background:
      radial-gradient(60vmax 46vmax at 88% -8%, rgba(39, 179, 230, 0.2), transparent 62%),
      radial-gradient(52vmax 44vmax at 4% 18%, rgba(244, 163, 194, 0.1), transparent 60%),
      linear-gradient(180deg, var(--bg-2), var(--bg));
  }
}
main {
  inline-size: min(100%, 34rem);
  padding: clamp(28px, 7vw, 48px) clamp(20px, 6vw, 44px);
  border-radius: 28px;
  background: var(--glass);
  border: 1px solid var(--edge);
  box-shadow: 0 0 0 1px var(--hair), 0 30px 64px -26px rgba(8, 40, 72, 0.3);
  text-align: center;
  display: grid;
  justify-items: center;
  gap: 14px;
}
.mark {
  display: grid; place-items: center;
  inline-size: 72px; block-size: 72px;
  border-radius: 22px;
  background: var(--bg-2);
  border: 1px solid var(--hair);
  margin-block-end: 6px;
}
.mark img { inline-size: 44px; block-size: auto; display: block; }
@media (prefers-color-scheme: dark) { .mark img { filter: brightness(0) invert(1); } }
.signal { color: var(--brand); }
h1 {
  margin: 0;
  font-size: clamp(1.5rem, 1.1rem + 2.4vw, 2.1rem);
  line-height: 1.35;
  font-weight: 700;
  text-wrap: balance;
}
p { margin: 0; color: var(--ink-2); max-inline-size: 30rem; text-wrap: pretty; }
p[lang="en"] {
  font-family: "Manrope", "Segoe UI", system-ui, sans-serif;
  font-size: 0.9375rem;
  color: var(--ink-3);
  line-height: 1.7;
  padding-block-start: 12px;
  border-block-start: 1px solid var(--hair);
}
a.btn {
  margin-block-start: 10px;
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  min-block-size: 52px; padding: 0 28px;
  border-radius: 999px;
  background: var(--brand);
  background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.18), transparent 60%);
  color: var(--btn-fg);
  font-weight: 700; font-size: 1rem;
  text-decoration: none;
  transition: transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
a.btn:hover { transform: translateY(-2px); background-color: var(--brand-hi); }
a.btn:focus-visible { outline: 3px solid var(--aqua); outline-offset: 3px; }
a.btn small { font-weight: 600; opacity: 0.85; font-size: 0.8125rem; }
@media (prefers-reduced-motion: reduce) { a.btn { transition: none; } a.btn:hover { transform: none; } }
@media (forced-colors: active) { main { border-color: CanvasText; } }
`;

export default function OfflinePage() {
  return (
    <main>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <span className="mark">
        {/* eslint-disable-next-line @next/next/no-img-element -- plain <img> so this
            offline fallback caches on the SVG's own URL, not next/image's /_next/image
            proxy route (which needs its own separate precache entry). */}
        <img src="/npf-logo.svg" alt="نايل فارما فود" width={44} height={52} />
      </span>
      <svg className="signal" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20h.01" />
        <path d="M8.5 16.43a5 5 0 0 1 7 0" />
        <path d="M5 12.86a10 10 0 0 1 5.17-2.69" />
        <path d="M19 12.86a10 10 0 0 0-2-1.5" />
        <path d="M2 8.82a15 15 0 0 1 4.17-2.65" />
        <path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76" />
        <path d="m2 2 20 20" />
      </svg>
      <h1>لا يوجد اتصال بالإنترنت</h1>
      <p>
        لحماية خصوصيتك، صفحات الحساب والطلبات مش بتتحفظ أوفلاين. ارجع لما يرجع الاتصال وحاول تاني.
      </p>
      <p lang="en" dir="ltr">
        For your privacy, account and order pages are never saved offline. Reconnect and try again.
      </p>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- deliberate
          full browser navigation, not next/link's client-side router: offline,
          the router's RSC-payload fetch would just fail, while a real navigation
          lets the browser + service worker retry against the network. */}
      <a href="/" className="btn">
        إعادة المحاولة
        <small lang="en" dir="ltr">Retry</small>
      </a>
    </main>
  );
}
