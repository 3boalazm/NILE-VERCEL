import type { ReactNode } from "react";
export function AccessFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="ca-access ca-section-pad">
      <div className="ca-access-heading">
        <span className="ca-mono">NPF / YOUR SPACE</span>
        <span className="ca-access-mark" aria-hidden="true">
          ✳
        </span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="ca-access-form">{children}</div>
    </section>
  );
}
