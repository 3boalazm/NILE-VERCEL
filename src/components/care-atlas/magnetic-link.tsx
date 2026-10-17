"use client";

import Link from "next/link";
import { useRef, useSyncExternalStore, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";

const MotionLink = motion.create(Link);
const query = "(hover: hover) and (pointer: fine)";
function subscribe(callback: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
const finePointer = () => window.matchMedia(query).matches;
const serverPointer = () => false;

/** Native link first. A bounded spring only enhances fine-pointer desktops;
 * no tracking, global mouse listener, hidden initial state or touch movement. */
export function MagneticLink({
  href,
  className,
  children,
  "aria-label": label,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
}) {
  const element = useRef<HTMLAnchorElement>(null);
  const fine = useSyncExternalStore(subscribe, finePointer, serverPointer);
  const reduced = useReducedMotion();
  const enabled = fine && !reduced;
  const x = useMotionValue(0),
    y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 240, damping: 25, mass: 0.65 });
  const springY = useSpring(y, { stiffness: 240, damping: 25, mass: 0.65 });
  function reset() {
    x.set(0);
    y.set(0);
  }
  return (
    <MotionLink
      ref={element}
      href={href}
      className={className}
      aria-label={label}
      data-ca-magnetic=""
      initial={false}
      style={{ x: enabled ? springX : 0, y: enabled ? springY : 0 }}
      whileHover={enabled ? { scale: 1.035 } : undefined}
      whileTap={enabled ? { scale: 0.98 } : undefined}
      onPointerMove={(event) => {
        if (!enabled || event.pointerType === "touch" || !element.current)
          return;
        const rect = element.current.getBoundingClientRect();
        const bound = (value: number) =>
          Math.max(-8, Math.min(8, value * 0.08));
        x.set(
          bound(event.clientX - rect.left - rect.width / 2 + springX.get()),
        );
        y.set(
          bound(event.clientY - rect.top - rect.height / 2 + springY.get()),
        );
      }}
      onPointerLeave={reset}
      onBlur={reset}
      onFocus={reset}
      transition={{ type: "spring", stiffness: 240, damping: 25 }}
    >
      {children}
    </MotionLink>
  );
}
