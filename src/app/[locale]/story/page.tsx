import Link from "next/link";
import { Reveal } from "@/components/npf/motion/reveal";
import { EditorialVisual } from "@/components/care-atlas/editorial-visual";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isValidLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { PageIntro, CareContact } from "@/components/care-atlas/sections";

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
    <>
      <PageIntro
        index="NPF / OUR STORY — SINCE 2019"
        title={s.pageTitle}
        body={s.heroSubtitle}
      />
      <section className="ca-story-cover ca-section-pad">
        <div>
          <span className="ca-mono">THE BEGINNING</span>
          <strong>2019</strong>
          <p>{d.about.storyBody[0]}</p>
        </div>
        <EditorialVisual kind="story" locale={locale} />
      </section>
      <div className="ca-story-chapters ca-section-pad">
        {chapters.map((chapter, index) => (
          <section key={chapter.label}>
            <span className="ca-chapter-number" aria-hidden="true">
              0{index + 1}
            </span>
            <div>
              <span className="ca-eyebrow">{chapter.label}</span>
              <h2>{chapter.title}</h2>
            </div>
            <div>
              <p>{chapter.body}</p>
              <Link className="ca-line-link" href={chapter.href}>
                {chapter.cta}
                <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </section>
        ))}
      </div>
      {/* Timeline — deliberately limited to milestones that can be verified
          from the company's own record (founding year, today's line-up).
          Invented dates would be indistinguishable from real ones here, so
          nothing is added until the client supplies it. Fixed light/dark
          tokens for the same reason as the chapters above: this page opts
          out of the site-wide theme toggle. */}
      <section className="bg-anti-flash-white text-anti-flash-navy">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <Reveal className="flex flex-col gap-3">
            <span className="eyebrow text-anti-flash-navy/70">{s.timelineEyebrow}</span>
            <h2 className="text-balance font-heading text-3xl font-semibold sm:text-4xl">
              {s.timelineTitle}
            </h2>
          </Reveal>
          <ol className="mt-10 flex flex-col">
            {s.timeline.map((stop, index) => (
              <li key={stop.year} className="relative flex flex-col gap-2 pb-10 last:pb-0 sm:flex-row sm:gap-10">
                {index < s.timeline.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute start-[3px] top-16 bottom-0 hidden w-px bg-anti-flash-navy/20 sm:block"
                  />
                )}
                <span className="font-heading text-4xl font-black tabular-nums sm:w-32 sm:shrink-0">
                  {stop.year}
                </span>
                <div className="flex flex-col gap-2 border-s-2 border-anti-flash-navy/20 ps-5 sm:border-s-0 sm:ps-0">
                  <h3 className="font-heading text-lg font-semibold">{stop.title}</h3>
                  <p className="max-w-2xl text-pretty leading-relaxed text-anti-flash-navy/70">
                    {stop.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* The site's own rule, stated as a principle — and backed by the blog,
          which is where the evidence for each claim actually lives. */}
      <section className="bg-anti-flash-white text-anti-flash-navy">
        <Reveal className="mx-auto flex max-w-3xl flex-col items-start gap-4 px-4 py-20 sm:px-6 lg:px-8">
          <span className="eyebrow text-anti-flash-navy/70">{s.principleEyebrow}</span>
          <h2 className="text-balance font-heading text-3xl font-semibold sm:text-4xl">
            {s.principleTitle}
          </h2>
          <p className="text-pretty leading-relaxed text-anti-flash-navy/70">{s.principleBody}</p>
          <Link
            href={`${base}/blogs`}
            className="mt-2 inline-flex w-fit items-center justify-center gap-2.5 rounded-full bg-anti-flash-navy px-6 py-3 text-sm font-medium whitespace-nowrap text-anti-flash-white transition-all hover:bg-anti-flash-navy/85"
          >
            {s.principleCta}
          </Link>
        </Reveal>
      </section>
      <CareContact locale={locale} />
    </>
  );
}
