import type { ReactNode } from "react"

/**
 * Nile Glass auth frame (login, register, password recovery, email verify).
 * Intro column (eyebrow, title, lead, a quiet orb composition on desktop)
 * beside a single strong-glass card that holds the form. `title` is optional
 * for flows whose form renders its own <h1> (verify) — the frame then
 * collapses to the centred card alone.
 */
export function AccessPanel({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string
  title?: string
  subtitle?: string
  children: ReactNode
}) {
  if (!title) {
    return (
      <section className="ng-wrap ngc-access ngc-access-solo">
        <div className="ngc-access-card">{children}</div>
      </section>
    )
  }
  return (
    <section className="ng-wrap ngc-access" aria-labelledby="access-title">
      <div className="ngc-access-intro">
        {eyebrow && <span className="ng-eyebrow">{eyebrow}</span>}
        <h1 id="access-title" className="ngc-title">
          {title}
        </h1>
        {subtitle && <p className="ng-lead">{subtitle}</p>}
        <div className="ngc-access-art" aria-hidden="true">
          <span className="ng-orb" />
          <span className="ng-orb" />
          <span className="ng-orb" />
        </div>
      </div>
      <div className="ngc-access-card">{children}</div>
    </section>
  )
}
