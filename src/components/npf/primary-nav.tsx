"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function PrimaryNav({
  links,
}: {
  links: { href: string; label: string }[]
}) {
  const pathname = usePathname()
  return (
    <nav
      className="hidden items-center gap-1 lg:flex"
      aria-label={links.map((l) => l.label).join(" · ")}
    >
      {links.map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(`${link.href}/`)
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`nav-link ${active ? "nav-link-active" : ""}`}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
