import Link from "next/link";
import { Reveal } from "@/components/npf/motion/reveal";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isValidLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { PageIntro, ContactBand, SectionHead } from "@/components/glass/sections";
import { EditorialFigure } from "@/components/glass/content";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/story">): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const s = getDictionary(locale).story;
  return buildPageMetadata({
    locale,
    path: "/story",
    title: s.pageTitle,
    description: s.heroSubtitle,
  });
}
export default async function StoryPage({
  params,
}: PageProps<"/[locale]/story">) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const d = getDictionary(locale),
    s = d.story,
    base = `/${locale}`;
  const chapters = [
    {
      title: s.section1Title,
      label: s.section1Eyebrow,
      body: s.section1Body,
      href: `${base}/about`,
      cta: d.nav.about,
    },
    {
      title: s.section2Title,
      label: s.section2Eyebrow,
      body: s.section2Body,
      href: `${base}/quality-sourcing`,
      cta: d.nav.quality,
    },
    {
      title: s.section3Title,
      label: s.section3Eyebrow,
      body: s.section3Body,
      href: `${base}/contact`,
      cta: s.section3Cta,
    },
  ];
  return (
    <div className="ng-content">
      <PageIntro eyebrow={s.heroEyebrow} title={s.pageTitle} accent={s.heroTitle} body={s.heroSubtitle} />

      <section className="ng-wrap ng-band-tight" aria-labelledby="story-beginning">
        <div className="ng-bento">
          <Reveal className="span-5 ng-glass ng-pad ng-fact" style={{ alignSelf: "stretch", alignContent: "center" }}>
            <span className="ng-eyebrow">{s.timeline[0]?.title}</span>
            <span className="ng-fact-value" aria-hidden="true">
              2019
            </span>
            <h2 id="story-beginning" className="ng-sr">
              {s.timeline[0]?.title} 2019
            </h2>
            <p className="ng-body" style={{ margin: 0 }}>
              {d.about.storyBody[0]}
            </p>
          </Reveal>
          <div className="span-7">
            <EditorialFigure kind="story" locale={locale} priority sizes="(min-width: 900px) 56vw, 100vw" />
          </div>
        </div>
      </section>

      <div className="ng-wrap ng-band ng-chapters">
        {chapters.map((chapter, index) => (
          <Reveal as="section" key={chapter.label} className="ng-tile ng-chapter" delay={index * 0.05}>
            <span className="ng-index" aria-hidden="true">
              0{index + 1}
            </span>
            <div>
              <span className="ng-eyebrow">{chapter.label}</span>
              <h2 className="ng-h3">{chapter.title}</h2>
            </div>
            <div>
              <p className="ng-body">{chapter.body}</p>
              <p style={{ margin: 0 }}>
                <Link className="ng-link" href={chapter.href}>
                  {chapter.cta}
                </Link>
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Timeline — deliberately limited to milestones that can be verified
          from the company's own record (founding year, today's line-up).
          Invented dates would be indistinguishable from real ones here, so
          nothing is added until the client supplies it. */}
      <section className="ng-wrap ng-band" aria-labelledby="story-timeline">
        <div className="ng-split">
          <SectionHead eyebrow={s.timelineEyebrow} title={s.timelineTitle} id="story-timeline" split={false} />
          <ol className="ng-timeline ng-glass ng-pad">
            {s.timeline.map((stop) => (
              <li key={stop.year}>
                <span className="ng-timeline-year">{stop.year}</span>
                <div>
                  <h3 className="ng-h4">{stop.title}</h3>
                  <p className="ng-body">{stop.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* The site's own rule, stated as a principle — and backed by the blog,
          which is where the evidence for each claim actually lives. */}
      <section className="ng-wrap ng-band" aria-labelledby="story-principle">
        <Reveal className="ng-callout ng-callout-info ng-pad ng-stack" style={{ ["--ng-stack" as string]: "16px" }}>
          <span className="ng-eyebrow">{s.principleEyebrow}</span>
          <h2 id="story-principle" className="ng-h2">
            {s.principleTitle}
          </h2>
          <p className="ng-lead">{s.principleBody}</p>
          <div className="ng-hero-cta">
            <Link href={`${base}/blogs`} className="ng-btn ng-btn-primary">
              {s.principleCta}
              <span className="ng-arrow" aria-hidden="true">↗</span>
            </Link>
          </div>
        </Reveal>
      </section>
      <ContactBand locale={locale} />
    </div>
  );
}
