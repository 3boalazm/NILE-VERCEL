import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isValidLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getCareAtlasCopy } from "@/lib/i18n/care-atlas";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { Reveal } from "@/components/npf/motion/reveal";
import { PageIntro, ContactBand, SectionHead } from "@/components/glass/sections";
import { EditorialFigure } from "@/components/glass/content";

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
    <div className="ng-content">
      <PageIntro
        eyebrow={a.pageSubtitle}
        title={a.pageTitle}
        accent={c.brandSub}
        body={c.perspectiveBody}
      />

      <div className="ng-wrap ng-band-tight">
        <EditorialFigure kind="about" locale={locale} wide priority />
      </div>

      <section className="ng-wrap ng-band" aria-labelledby="about-story">
        <div className="ng-split">
          <Reveal className="ng-fact">
            <span className="ng-eyebrow">{a.storyTitle}</span>
            <span className="ng-fact-value" aria-hidden="true">
              2019
            </span>
            <h2 id="about-story" className="ng-h3">
              {d.siteName}
            </h2>
            <p style={{ margin: 0 }}>
              <Link href={`${base}/story`} className="ng-link">
                {d.story.pageTitle}
              </Link>
            </p>
          </Reveal>
          <Reveal className="ng-prose-stack" delay={0.06}>
            {a.storyBody.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="ng-wrap ng-band" aria-labelledby="about-principles">
        <SectionHead
          eyebrow={a.principlesEyebrow}
          title={a.principlesTitle}
          id="about-principles"
          split={false}
        />
        <ol className="ng-numbered" style={{ marginBlockStart: "clamp(24px, 4vw, 44px)" }}>
          {a.principles.map((principle, i) => (
            <Reveal as="li" key={principle.title} delay={i * 0.06} className="ng-tile">
              <span className="ng-index" aria-hidden="true">
                0{i + 1}
              </span>
              <h3 className="ng-h4">{principle.title}</h3>
              <p className="ng-body">{principle.description}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="ng-wrap ng-band">
        <div className="ng-bento">
          <Reveal className="span-6 ng-glass ng-pad ng-stack" style={{ ["--ng-stack" as string]: "14px" }}>
            <h2 className="ng-eyebrow" style={{ margin: 0 }}>{a.visionTitle}</h2>
            <p className="ng-statement">{a.visionBody}</p>
          </Reveal>
          <Reveal
            className="span-6 ng-glass ng-pad ng-stack"
            delay={0.06}
            style={{ ["--ng-stack" as string]: "14px" }}
          >
            <h2 className="ng-eyebrow" style={{ margin: 0 }}>{a.missionTitle}</h2>
            <p className="ng-statement">{a.missionBody}</p>
          </Reveal>
          <Reveal className="span-7 ng-glass ng-pad ng-stack" style={{ ["--ng-stack" as string]: "14px" }}>
            <h2 className="ng-h3">{a.presenceTitle}</h2>
            <p className="ng-body">{a.presenceSubtitle}</p>
            <div className="ng-hero-cta">
              <Link href={`${base}/contact`} className="ng-btn ng-btn-primary">
                {d.nav.contact}
                <span className="ng-arrow" aria-hidden="true">↗</span>
              </Link>
              <Link href={`${base}/careers`} className="ng-btn ng-btn-ghost">
                {d.nav.careers}
              </Link>
            </div>
          </Reveal>
          <div className="span-5 ng-acc">
            <details>
              <summary>{d.quality.sourcingTitle}</summary>
              <div>
                <p className="ng-body">{a.manufacturingNote}</p>
                <p style={{ marginBlockStart: 12 }}>
                  <Link href={`${base}/quality-sourcing`} className="ng-link">
                    {d.quality.pageTitle}
                  </Link>
                </p>
              </div>
            </details>
          </div>
        </div>
      </section>

      <ContactBand locale={locale} />
    </div>
  );
}
