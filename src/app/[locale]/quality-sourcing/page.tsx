import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isValidLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { productRepository } from "@/lib/products";
import { readCmsList } from "@/lib/cms/read";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { AlertTriangleIcon, CheckCircle2Icon, DownloadIcon, FileTextIcon, MailIcon } from "lucide-react";
import { Reveal } from "@/components/npf/motion/reveal";
import { PageIntro, ReadingBand, SectionHead } from "@/components/glass/sections";
import { EditorialFigure } from "@/components/glass/content";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/quality-sourcing">): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const q = getDictionary(locale).quality;
  return buildPageMetadata({
    locale,
    path: "/quality-sourcing",
    title: q.pageTitle,
    description: q.pageSubtitle,
  });
}
export default async function QualityPage({
  params,
}: PageProps<"/[locale]/quality-sourcing">) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const d = getDictionary(locale),
    q = d.quality,
    base = `/${locale}`;
  const reportHref = `mailto:${d.contact.email}?subject=${encodeURIComponent(q.batchSubject)}`;
  const leafletRead = await readCmsList("quality:leaflets", () =>
    productRepository.getAllProducts(),
  );
  // A CMS outage must not delete the sourcing page — only the leaflet list
  // (which is supplementary) goes away.
  const leaflets = leafletRead.items.filter((p) => p.downloadUrl);
  // The static leaflet list below already covers the core line; the CMS list
  // only adds what it does not (no product is listed twice).
  const listed = new Set(q.documents.map((doc) => doc.product.trim().toLowerCase()));
  const extraLeaflets = leaflets.filter((p) => !listed.has(p.name.trim().toLowerCase()));
  return (
    <div className="ng-content">
      <PageIntro
        eyebrow={d.siteName}
        title={q.pageTitle}
        accent={q.pageSubtitle}
        body={q.distributorBadge}
      />
      <div className="ng-wrap ng-band-tight">
        <EditorialFigure kind="quality" locale={locale} wide priority />
      </div>

      <section className="ng-wrap ng-band-tight" aria-label={q.sourcingTitle}>
        <div className="ng-route">
          <Reveal className="ng-tile">
            <span className="ng-index" aria-hidden="true">01</span>
            <Image src="/alfasigma-logo.svg" width={140} height={40} alt="Alfasigma" style={{ blockSize: "auto" }} />
            <span className="ng-muted">{locale === "ar" ? "إيطاليا" : "Italy"}</span>
          </Reveal>
          <span className="ng-route-arrow" aria-hidden="true" />
          <Reveal className="ng-tile" delay={0.06}>
            <span className="ng-index" aria-hidden="true">02</span>
            <strong dir="ltr" style={{ justifySelf: "start" }}>NILE PHARMA FOOD</strong>
            <span className="ng-muted">{locale === "ar" ? "الموزّع في مصر" : "Distribution in Egypt"}</span>
          </Reveal>
          <span className="ng-route-arrow" aria-hidden="true" />
          <Reveal className="ng-tile" delay={0.12}>
            <span className="ng-index" aria-hidden="true">03</span>
            <strong>{locale === "ar" ? "المعلومة بين يديك" : "Information in your hands"}</strong>
            <a href="#source-files" className="ng-link" style={{ justifySelf: "start" }}>
              {d.product.downloads} ↓
            </a>
          </Reveal>
        </div>
      </section>

      <section className="ng-wrap ng-band" aria-label={q.regulatoryTitle}>
        <div className="ng-split ng-split-even">
          {[
            { title: q.sourcingTitle, body: q.sourcingBody },
            { title: q.regulatoryTitle, body: q.regulatoryBody },
          ].map((item, i) => (
            <Reveal key={item.title} className="ng-tile" delay={i * 0.06}>
              <span className="ng-index" style={{ fontSize: "1.6rem" }} aria-hidden="true">
                0{i + 1}
              </span>
              <h2 className="ng-h3">{item.title}</h2>
              <p className="ng-body">{item.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* The product journey — replaces the abstract "we maintain quality"
          with the five steps a pack actually goes through. Every step
          describes a real part of the company's own operation. */}
      <section className="ng-wrap ng-band" aria-labelledby="quality-journey">
        <div className="ng-split">
          <SectionHead title={q.journeyTitle} id="quality-journey" split={false} />
          <Reveal as="ol" className="ng-steps ng-glass ng-pad">
            {q.journeySteps.map((step) => (
              <li key={step.title}>
                <div>
                  <h3 className="ng-h4">{step.title}</h3>
                  <p className="ng-body ng-small">{step.body}</p>
                </div>
              </li>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Who makes what — the existing paragraph named the manufacturers
          "depending on the product"; this states the mapping per line so a
          pharmacist does not have to email to find out. */}
      <section className="ng-wrap ng-band" aria-labelledby="quality-makers">
        <SectionHead title={q.makersTitle} body={q.makersBody} id="quality-makers" />
        <Reveal
          className="ng-table-frame"
          style={{ marginBlockStart: "clamp(20px, 3vw, 32px)" }}
          tabIndex={0}
          role="region"
          aria-labelledby="quality-makers"
        >
          <table className="ng-table ng-table-stack">
            <thead>
              <tr>
                <th scope="col">{q.makersColumns.line}</th>
                <th scope="col">{q.makersColumns.maker}</th>
                <th scope="col">{q.makersColumns.country}</th>
              </tr>
            </thead>
            <tbody>
              {q.makers.map((row) => (
                <tr key={row.line}>
                  <th scope="row" style={{ fontWeight: 600, color: "var(--ng-ink)" }}>
                    {row.line}
                  </th>
                  <td className="ng-muted" data-label={q.makersColumns.maker}>
                    <bdi dir="ltr">{row.maker}</bdi>
                  </td>
                  <td className="ng-muted" data-label={q.makersColumns.country}>
                    {row.country}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
        <p className="ng-muted ng-small" style={{ marginBlockStart: 12 }}>
          {q.makersNote}
        </p>
      </section>

      {/* Pack problem — the practical, checkable side of "quality". */}
      <section className="ng-wrap ng-band" aria-labelledby="quality-batch">
        <Reveal className="ng-callout">
          <div className="ng-callout-title">
            <span className="ng-callout-icon">
              <AlertTriangleIcon className="size-5" aria-hidden="true" />
            </span>
            <h2 id="quality-batch" className="ng-h3">
              {q.batchTitle}
            </h2>
          </div>
          <p className="ng-body">{q.batchBody}</p>
          <ul className="ng-checks">
            {q.batchChecklist.map((item) => (
              <li key={item}>
                <CheckCircle2Icon className="size-4" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="ng-hero-cta">
            <a href={reportHref} className="ng-btn ng-btn-primary">
              <MailIcon className="size-4" aria-hidden="true" />
              {q.batchCta}
            </a>
          </div>
        </Reveal>
      </section>

      {/* Official leaflets — already downloadable from each product page,
          gathered here so a pharmacist has one place to look. */}
      <section id="source-files" className="ng-wrap ng-band" aria-labelledby="quality-documents">
        <SectionHead title={q.documentsTitle} body={q.documentsBody} id="quality-documents" />
        <ul className="ng-docs" style={{ marginBlockStart: "clamp(20px, 3vw, 32px)" }}>
          {q.documents.map((doc) => (
            <li key={doc.file}>
              <a href={doc.file} download className="ng-doc">
                <span className="ng-doc-icon">
                  <DownloadIcon className="size-4" aria-hidden="true" />
                </span>
                <strong>{doc.product}</strong>
                <small>{q.documentsDownloadLabel}</small>
              </a>
            </li>
          ))}
        </ul>
        {extraLeaflets.length > 0 && (
          <>
            <h3 className="ng-h4" style={{ marginBlock: "clamp(28px, 4vw, 40px) 16px" }}>
              {d.product.downloads}
            </h3>
            <ul className="ng-docs">
              {extraLeaflets.map((p) => (
                <li key={p.id}>
                  <a href={p.downloadUrl} target="_blank" rel="noopener noreferrer" className="ng-doc">
                    <span className="ng-doc-icon">
                      <FileTextIcon className="size-4" aria-hidden="true" />
                    </span>
                    <strong dir="ltr">{p.name}</strong>
                    <small>PDF ↗</small>
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
        <p style={{ marginBlockStart: 20 }}>
          <Link href={`${base}/contact`} className="ng-link">
            {d.nav.contact}
          </Link>
        </p>
      </section>

      {/* FAQ — answers restricted to facts already published on the site. */}
      <section className="ng-wrap ng-band" aria-labelledby="quality-faq">
        <div className="ng-split">
          <SectionHead title={q.faqTitle} id="quality-faq" split={false} />
          <div className="ng-acc">
            {q.faq.map((item, index) => (
              <details key={item.question} open={index === 0}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <ReadingBand
        locale={locale}
        leaflet={
          leaflets[0]?.downloadUrl
            ? { name: leaflets[0].name, url: leaflets[0].downloadUrl }
            : undefined
        }
      />
    </div>
  );
}
