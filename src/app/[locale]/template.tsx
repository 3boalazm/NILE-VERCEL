"use client";

import { usePathname } from "next/navigation";

/**
 * Gentle page-transition fade. In Next's app router a template (unlike a
 * layout) re-mounts on every navigation, so the `page-enter` CSS animation
 * (globals.css) replays for each incoming page.
 *
 * Deliberately CSS-only: the previous framer-motion version rendered
 * `style="opacity:0"` on this wrapper in the server HTML, which hid the
 * entire page until hydration finished — with JS disabled or a failed
 * hydration the site was a blank canvas. The animation only runs under
 * `html.js` (set before first paint) and `prefers-reduced-motion:
 * no-preference`, so server HTML is always visible; it also starts from a
 * visible opacity so the hero remains Chrome's LCP candidate.
 *
 * Cart, checkout and account flows get no transition at all (audit rule:
 * no motion where people type card details or review an order).
 */
const NO_TRANSITION =
  /^\/[a-z]{2}\/(cart|checkout|account|login|register|forgot-password|reset-password)(\/|$)/;

export default function LocaleTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const animate = !NO_TRANSITION.test(pathname);
  const utility =
    !/^\/[a-z]{2}\/?$/.test(pathname) &&
    !/^\/[a-z]{2}\/(products|about|story|quality-sourcing|contact)(\/|$)/.test(
      pathname,
    );
  return (
    <div
      className={`${animate ? "page-enter" : ""} ${utility ? "ng-functional" : ""}`}
    >
      {children}
    </div>
  );
}
