import Link from "next/link";
import { EditorialVisual } from "@/components/care-atlas/editorial-visual";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isValidLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getCareAtlasCopy } from "@/lib/i18n/care-atlas";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { PageIntro, CareContact } from "@/components/care-atlas/sections";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/about">): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const d = getDictionary(locale);
  return buildPageMetadata({
    locale,
    path: "/about",
    title: d.about.pageTitle,
    description: getCareAtlasCopy(locale).perspectiveBody,
  });
}
export default async function AboutPage({
  params,
}: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const d = getDictionary(locale),
    a = d.about,
    c = getCareAtlasCopy(locale),
    base = `/${locale}`;
  return (
    <>
      <PageIntro
        index="NPF / OUR PERSPECTIVE"
        title={a.pageTitle}
        accent={c.brandSub}
        body={c.perspectiveBody}
      />
      <div className="ca-editorial-banner ca-section-pad">
        <EditorialVisual kind="about" locale={locale} />
      </div>
      <section className="ca-company-origin ca-section-pad">
        <div>
          <span className="ca-mono">ESTABLISHED IN EGYPT</span>
          <strong className="ca-origin-year">2019</strong>
          <Link href={`${base}/story`} className="ca-line-link">
            {a.storyTitle}
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="ca-company-prose">
          {a.storyBody.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>
      <section className="ca-principles ca-section-pad">
        <div className="ca-section-index">
          <span className="ca-mono">THE WAY WE WORK</span>
          <span>{a.principlesEyebrow}</span>
        </div>
        <h2>{a.principlesTitle}</h2>
        <ol>
          {a.principles.map((principle, i) => (
            <li key={principle.title}>
              <span className="ca-mono">0{i + 1}</span>
              <h3>{principle.title}</h3>
              <p>{principle.description}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="ca-presence ca-presence-text ca-section-pad">
        <div>
          <span className="ca-mono">IN PERSON / IN THE FIELD</span>
          <h2>{a.presenceTitle}</h2>
          <p>{a.presenceSubtitle}</p>
          <Link href={`${base}/contact`} className="ca-line-link">
            {d.nav.contact}
            <span aria-hidden="true">↗</span>
          </Link>
          <Link href={`${base}/careers`} className="ca-line-link">
            {d.nav.careers}
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>
      <section className="ca-company-statements ca-section-pad">
        {[
          { title: a.visionTitle, body: a.visionBody },
          { title: a.missionTitle, body: a.missionBody },
        ].map((s) => (
          <div key={s.title}>
            <h2>{s.title}</h2>
            <p>{s.body}</p>
          </div>
        ))}
        <details className="ca-long-read">
          <summary>
            {d.quality.sourcingTitle}
            <span aria-hidden="true">+</span>
          </summary>
          <p>{a.manufacturingNote}</p>
          <Link href={`${base}/quality-sourcing`}>{d.quality.pageTitle} ↗</Link>
        </details>
      </section>
      <CareContact locale={locale} />
    </>
  );
}
