import Link from "next/link";
import { Reveal } from "@/components/npf/motion/reveal";
import { MagneticLink } from "./magnetic-link";
import type { Locale } from "@/lib/i18n/config";
import { getCareAtlasCopy } from "@/lib/i18n/care-atlas";

export function PageIntro({
  index,
  title,
  body,
  accent,
}: {
  index: string;
  title: string;
  body?: string;
  accent?: string;
}) {
  return (
    <section className="ca-page-intro ca-section-pad">
      <div className="ca-section-index">
        <span className="ca-mono">{index}</span>
        <span aria-hidden="true">✳</span>
      </div>
      <h1>
        {title}
        {accent && <span>{accent}</span>}
      </h1>
      {body && <p>{body}</p>}
    </section>
  );
}
export function CareContact({ locale }: { locale: Locale }) {
  const c = getCareAtlasCopy(locale);
  return (
    <section
      id="contact"
      className="ca-contact ca-section-pad"
      aria-labelledby="care-contact-title"
    >
      <div className="ca-section-index">
        <span className="ca-mono">04 / AN OPEN CONVERSATION</span>
        <span>{c.contactLabel}</span>
      </div>
      <Reveal className="ca-contact-heading">
        <h2 id="care-contact-title">
          <span>{c.contact1}</span>
          <span>{c.contact2}</span>
        </h2>
        <MagneticLink
          href={`/${locale}/contact`}
          className="ca-contact-orbit"
          aria-label={c.contactAction}
        >
          <span aria-hidden="true">↗</span>
          <small>{c.contactAction}</small>
        </MagneticLink>
      </Reveal>
      <div className="ca-contact-bottom">
        <p>{c.contactBody}</p>
        <div className="ca-contact-links">
          <a href="mailto:info@nilepharmafood.com">info@nilepharmafood.com ↗</a>
          <a href="tel:01027639857" dir="ltr">
            010 276 39857 ↗
          </a>
        </div>
        <span className="ca-contact-location">
          <span className="ca-mono">EL OBOUR / EGYPT</span>
          <span>{c.location}</span>
        </span>
      </div>
    </section>
  );
}
export function CareReading({
  locale,
  leaflet,
}: {
  locale: Locale;
  leaflet?: { name: string; url: string };
}) {
  const c = getCareAtlasCopy(locale);
  return (
    <section
      id="reading"
      className="ca-reading ca-section-pad"
      aria-labelledby="care-reading-title"
    >
      <div className="ca-section-index">
        <span className="ca-mono">03 / READ BETWEEN THE LINES</span>
        <span>{c.readingLabel}</span>
      </div>
      <div className="ca-reading-layout">
        <Reveal className="ca-reading-intro">
          <span className="ca-reading-symbol" aria-hidden="true">
            ↗
          </span>
          <h2 id="care-reading-title">
            <span>{c.reading1}</span>
            <span>{c.reading2}</span>
          </h2>
          <p>{c.readingBody}</p>
        </Reveal>
        <div className="ca-reading-questions">
          {[1, 2, 3].map((number, index) => {
            const question = [c.question1, c.question2, c.question3][index],
              answer = [c.answer1, c.answer2, c.answer3][index];
            return (
              <details key={number} open={index === 0}>
                <summary>
                  <span className="ca-mono">
                    {String(number).padStart(2, "0")}
                  </span>
                  <span>{question}</span>
                  <span className="ca-details-sign" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p>{answer}</p>
              </details>
            );
          })}
          {leaflet && (
            <a
              className="ca-reading-document"
              href={leaflet.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="ca-document-icon" aria-hidden="true">
                ↧
              </span>
              <span>
                <small>{c.documentLabel}</small>
                <strong dir="ltr">{leaflet.name}</strong>
                <small>{c.documentType}</small>
              </span>
              <span className="ca-document-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          )}
          <Link
            href={`/${locale}/quality-sourcing`}
            className="ca-reading-source-link"
          >
            {locale === "ar"
              ? "المصدر والتوزيع: تعرّف على الحكاية"
              : "Sourcing & distribution: the full story"}{" "}
            ↗
          </Link>
        </div>
      </div>
    </section>
  );
}
