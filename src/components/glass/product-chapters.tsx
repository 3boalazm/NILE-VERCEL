"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Chapter index for the product file (replaces care-atlas/dossier-nav).
 * Scroll position is a progressive hint only: the links are native anchors,
 * so content, focus and navigation work without hydration. On narrow screens
 * the index is a horizontal strip that keeps the current chapter in view
 * without moving the page.
 */
export function ProductChapters({
  anchors,
  label,
  title,
}: {
  anchors: { id: string; label: string }[];
  label: string;
  title: string;
}) {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const sections = anchors
      .map((anchor) => document.getElementById(anchor.id))
      .filter((element): element is HTMLElement => Boolean(element));
    if (!sections.length) return;
    let frame = 0;
    function update() {
      frame = 0;
      // A chapter becomes current once its top passes just below the sticky
      // header + chapter strip (mobile) or header (desktop).
      const nav = root.current?.getBoundingClientRect();
      const threshold =
        window.innerWidth < 960 && nav ? Math.max(nav.bottom, 0) + 48 : 200;
      let current = sections[0].id;
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= threshold)
          current = section.id;
      }
      setActive(current);
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("hashchange", schedule);
    const resize =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(schedule)
        : null;
    const dossier = root.current?.closest("[data-dossier]");
    if (dossier) resize?.observe(dossier);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
      resize?.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [anchors]);
  useEffect(() => {
    const nav = root.current;
    const list = nav?.querySelector<HTMLElement>("ol");
    const link = nav?.querySelector<HTMLElement>('a[aria-current="location"]');
    if (!list || !link || window.innerWidth >= 960) return;
    const edge = list.getBoundingClientRect();
    const item = link.getBoundingClientRect();
    // Adjust this scroller only: scrollIntoView would also move the page.
    if (item.left < edge.left + 8)
      list.scrollBy({ left: item.left - edge.left - 8, behavior: "instant" });
    else if (item.right > edge.right - 8)
      list.scrollBy({ left: item.right - edge.right + 8, behavior: "instant" });
  }, [active]);
  if (!anchors.length) return null;
  return (
    <nav
      ref={root}
      aria-label={label}
      className="ng-chapters"
      data-testid="product-chapters"
    >
      <p className="ng-chapters-title" aria-hidden="true">
        {title}
      </p>
      <ol>
        {anchors.map((anchor, i) => (
          <li key={anchor.id}>
            <a
              href={`#${anchor.id}`}
              aria-current={active === anchor.id ? "location" : undefined}
            >
              <span className="ng-chapters-n ng-num" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{anchor.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
