import Link from "next/link";
import Image from "next/image";
import { EditorialVisual } from "@/components/care-atlas/editorial-visual";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isValidLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { productRepository } from "@/lib/products";
import { readCmsList } from "@/lib/cms/read";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { PageIntro, CareReading } from "@/components/care-atlas/sections";
import { AlertTriangleIcon, CheckCircle2Icon, DownloadIcon, MailIcon } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ctaButtonVariants } from "@/components/ui/button";
import { Reveal } from "@/components/npf/motion/reveal";
import { cn } from "@/lib/utils";

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
  return (
    <>
      <PageIntro
        index="NPF / AT THE SOURCE"
        title={q.pageTitle}
        accent={q.pageSubtitle}
        body={q.distributorBadge}
      />
      <div className="ca-editorial-banner ca-section-pad">
        <EditorialVisual kind="quality" locale={locale} />
      </div>
      <section className="ca-source-route ca-section-pad">
        <div>
          <span className="ca-mono">01 / THE BRAND</span>
          <Image
            src="/alfasigma-logo.svg"
            width={175}
            height={50}
            alt="Alfasigma"
          />
          <span>{locale === "ar" ? "إيطاليا" : "Italy"}</span>
        </div>
        <span aria-hidden="true">←</span>
        <div>
          <span className="ca-mono">02 / DISTRIBUTION</span>
          <strong>NILE PHARMA FOOD</strong>
          <span>
            {locale === "ar" ? "الموزّع في مصر" : "Distribution in Egypt"}
          </span>
        </div>
        <span aria-hidden="true">←</span>
        <div>
          <span className="ca-mono">03 / INFORMATION</span>
          <strong>
            {locale === "ar"
              ? "المعلومة بين يديك"
              : "Information in your hands"}
          </strong>
          <a href="#source-files">{d.product.downloads} ↓</a>
        </div>
      </section>
      <div className="ca-source-content ca-section-pad">
        {[
          { title: q.sourcingTitle, body: q.sourcingBody },
          { title: q.regulatoryTitle, body: q.regulatoryBody },
        ].map((s, i) => (
          <section key={s.title}>
            <span className="ca-mono">0{i + 1}</span>
            <h2>{s.title}</h2>
            <p>{s.body}</p>
          </section>
        ))}
        <section id="source-files">
          <span className="ca-mono">03 / ORIGINAL DOCUMENTS</span>
          <h2>{d.product.downloads}</h2>
          <div className="ca-source-files">
            {leaflets.map((p) => (
              <a
                key={p.id}
                href={p.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <strong>{p.name}</strong>
                <span>PDF ↗</span>
              </a>
            ))}
          </div>
          <Link href={`${base}/contact`} className="ca-line-link">
            {d.nav.contact}
            <span aria-hidden="true">↗</span>
          </Link>
        </section>
      </div>
      <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
        {/* The product journey — replaces the abstract "we maintain quality"
            with the five steps a pack actually goes through. Every step
            describes a real part of the company's own operation. */}
        <Reveal as="section" className="mt-20">
          <h2 className="font-heading text-2xl font-semibold">{q.journeyTitle}</h2>
          <ol className="mt-8 flex flex-col gap-0">
            {q.journeySteps.map((step, index) => (
              <li key={step.title} className="relative flex gap-5 pb-8 last:pb-0">
                {/* Connector line between the numbered markers */}
                {index < q.journeySteps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute start-[19px] top-11 bottom-1 w-px bg-border"
                  />
                )}
                <span className="z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-anti-flash-navy font-heading text-sm font-bold text-anti-flash-white">
                  {index + 1}
                </span>
                <div className="flex flex-col gap-1.5 pt-1">
                  <h3 className="font-heading text-base font-semibold">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>

        {/* Who makes what — the existing paragraph named the manufacturers
            "depending on the product"; this states the mapping per line so a
            pharmacist does not have to email to find out. */}
        <Reveal as="section" delay={0.06} className="mt-16">
          <h2 className="font-heading text-2xl font-semibold">{q.makersTitle}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{q.makersBody}</p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-start text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th scope="col" className="py-3 pe-4 text-start font-medium">
                    {q.makersColumns.line}
                  </th>
                  <th scope="col" className="py-3 pe-4 text-start font-medium">
                    {q.makersColumns.maker}
                  </th>
                  <th scope="col" className="py-3 text-start font-medium">
                    {q.makersColumns.country}
                  </th>
                </tr>
              </thead>
              <tbody>
                {q.makers.map((row) => (
                  <tr key={row.line} className="border-b last:border-0">
                    <td className="py-3 pe-4 font-medium">{row.line}</td>
                    <td className="py-3 pe-4 text-muted-foreground" dir="ltr">
                      {row.maker}
                    </td>
                    <td className="py-3 text-muted-foreground">{row.country}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">{q.makersNote}</p>
        </Reveal>

        {/* Pack problem — the practical, checkable side of "quality". */}
        <Reveal as="section" delay={0.08} className="mt-16">
          <div className="rounded-2xl border border-chart-3/40 bg-chart-3/5 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-chart-3/15 text-chart-3">
                <AlertTriangleIcon className="size-5" aria-hidden="true" />
              </span>
              <h2 className="font-heading text-xl font-semibold">{q.batchTitle}</h2>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{q.batchBody}</p>
            <ul className="mt-4 flex flex-col gap-3">
              {q.batchChecklist.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed">
                  <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-chart-3" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <a href={reportHref} className={cn(ctaButtonVariants({ variant: "onLight" }), "mt-6")}>
              <MailIcon className="size-4" aria-hidden="true" />
              {q.batchCta}
            </a>
          </div>
        </Reveal>

        {/* Official leaflets — already downloadable from each product page,
            gathered here so a pharmacist has one place to look. */}
        <Reveal as="section" delay={0.1} className="mt-16">
          <h2 className="font-heading text-2xl font-semibold">{q.documentsTitle}</h2>
          <p className="mt-3 text-sm text-muted-foreground">{q.documentsBody}</p>
          <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {q.documents.map((doc) => (
              <li key={doc.file}>
                <a
                  href={doc.file}
                  download
                  className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-sm transition-colors hover:border-primary/30"
                >
                  <span className="flex items-center gap-3">
                    <DownloadIcon className="size-4 text-primary" aria-hidden="true" />
                    <span className="font-medium">{doc.product}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{q.documentsDownloadLabel}</span>
                </a>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* FAQ — answers restricted to facts already published on the site. */}
        <Reveal as="section" delay={0.12} className="mt-16">
          <h2 className="font-heading text-2xl font-semibold">{q.faqTitle}</h2>
          <Accordion className="mt-6 border-t">
            {q.faq.map((item, index) => (
              <AccordionItem key={item.question} value={`quality-faq-${index}`} className="py-1">
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>
                  <p className="text-pretty pb-3 text-sm leading-relaxed text-muted-foreground">
                    {item.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
      <CareReading
        locale={locale}
        leaflet={
          leaflets[0]?.downloadUrl
            ? { name: leaflets[0].name, url: leaflets[0].downloadUrl }
            : undefined
        }
      />
    </>
  );
}
