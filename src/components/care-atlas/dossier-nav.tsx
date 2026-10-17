"use client";

import { useEffect, useRef, useState } from "react";

/** Scroll position is a progressive hint. Native anchors, content and focus
 * work without hydration; reading a chapter never changes product data. */
export function DossierNav({
  anchors,
  label,
}: {
  anchors: { id: string; label: string }[];
  label: string;
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
      const threshold = window.innerWidth <= 900 ? 120 : 180;
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
    const dossier = root.current?.closest(".ca-product-dossier");
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
    const link = nav?.querySelector<HTMLElement>('a[aria-current="location"]');
    if (!nav || !link || window.innerWidth > 900) return;
    const edge = nav.getBoundingClientRect();
    const item = link.getBoundingClientRect();
    // Adjust this scroller only: scrollIntoView would also move the page and
    // could pull a reader away from the hero before reaching the file.
    if (item.left < edge.left + 8)
      nav.scrollBy({ left: item.left - edge.left - 8, behavior: "instant" });
    else if (item.right > edge.right - 8)
      nav.scrollBy({ left: item.right - edge.right + 8, behavior: "instant" });
  }, [active]);
  return (
    <nav ref={root} aria-label={label} className="ca-dossier-index">
      <span className="ca-mono">READ THE FILE</span>
      {anchors.map((anchor, i) => (
        <a
          key={anchor.id}
          href={`#${anchor.id}`}
          aria-current={active === anchor.id ? "location" : undefined}
        >
          <span className="ca-mono" aria-hidden="true">
            {String(i + 1).padStart(2, "0")}
          </span>
          {anchor.label}
          <span aria-hidden="true">↙</span>
        </a>
      ))}
    </nav>
  );
}
