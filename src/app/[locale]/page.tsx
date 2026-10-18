import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isValidLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getCareAtlasCopy } from "@/lib/i18n/care-atlas";
import { productRepository, localizeProduct } from "@/lib/products";
import { sortForListing } from "@/lib/products/presentation";
import { readCms } from "@/lib/cms/read";
import { publicCatalogProduct } from "@/lib/evidence/store";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { Reveal } from "@/components/npf/motion/reveal";
import { HeroStage } from "@/components/glass/hero-stage";
import { ContactBand, PhotoPanel, ReadingBand, SectionHead } from "@/components/glass/sections";
import { NPFProductGrid } from "@/components/npf/product-grid";
import { CatalogUnavailable } from "@/components/npf/catalog-unavailable";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return buildPageMetadata({
    locale,
    path: "",
    title: getDictionary(locale).siteName,
    description: getCareAtlasCopy(locale).heroBody,
    // Real product photography (no generated art) for link previews.
    image: { url: "/care-atlas/packs/proxeed-plus.webp", alt: "Proxeed Plus — Alfasigma" },
  });
}
const STAGE_SLUGS = ["proxeed-plus", "proxeed-women", "proxerex", "ellamuselle"] as const;

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const c = getCareAtlasCopy(locale),
    d = getDictionary(locale),
    base = `/${locale}`;
  const catalogRead = await readCms("home:products", () =>
    productRepository.getAllProducts(),
  );
  const localizedProducts = sortForListing(
    (catalogRead.status === "ok" ? catalogRead.value : []).map((p) =>
      localizeProduct(publicCatalogProduct(p), locale),
    ),
  );
  const leafletProduct =
    localizedProducts.find((p) => p.slug === "proxeed-plus" && p.downloadUrl) ??
    localizedProducts.find((p) => p.downloadUrl);
  const slides = STAGE_SLUGS.map((slug) => {
    const product = localizedProducts.find((p) => p.slug === slug);
    return product
      ? { slug, name: product.name, href: `${base}/products/${slug}`, image: `/products/${slug}-hero.webp` }
      : null;
  }).filter((x): x is NonNullable<typeof x> => x !== null);
  const stage = slides.length
    ? slides
    : [{ slug: "proxeed-plus", name: "Proxeed Plus", href: `${base}/products`, image: "/products/proxeed-plus-hero.webp" }];
  const categories = [
    { id: "all", label: c.filterAll },
    { id: "supplements", label: c.filterSupplements },
    { id: "medical-devices", label: c.filterDevices },
  ];
  const categoryNames = Object.fromEntries(
    [
      ["supplements", c.filterSupplements],
      ["medical-devices", c.filterDevices],
    ],
  );
  return (
    <>
      <section className="ng-wrap ng-hero" aria-labelledby="hero-title">
        <div className="ng-hero-grid">
          <div className="ng-hero-copy">
            <span className="ng-eyebrow hero-enter-soft">{c.heroEyebrow}</span>
            <h1 id="hero-title" className="ng-display hero-enter">
              {c.heroLine1} <span className="ng-accent">{c.heroLine2}</span>
            </h1>
            <p className="ng-lead hero-enter" style={{ ["--enter-delay" as string]: "0.08s" }}>
              {c.heroBody}
            </p>
            <div className="ng-hero-cta hero-enter" style={{ ["--enter-delay" as string]: "0.16s" }}>
              <Link href={`${base}/products`} className="ng-btn ng-btn-primary ng-btn-lg">
                {c.heroCta}
                <span className="ng-arrow" aria-hidden="true">↗</span>
              </Link>
              <Link href={`${base}/contact`} className="ng-btn ng-btn-lg">
                {c.navContact}
              </Link>
            </div>
          </div>
          <div className="hero-enter-media">
            <HeroStage
              slides={stage}
              partner={c.partner}
              eyebrow={c.atlasLabel}
              logoSrc="/alfasigma-logo.svg"
              openLabel={d.product.viewDetails}
            />
          </div>
        </div>
      </section>

      <section className="ng-wrap" aria-label={c.perspectiveLabel} id="trust">
        <Reveal className="ng-trust-wrap">
          <div className="ng-trust">
            <div>
              <Image src="/alfasigma-logo.svg" width={104} height={27} alt="Alfasigma" />
              <span>
                <strong>{c.partner}</strong>
                <small>Alfasigma · Italy</small>
              </span>
            </div>
            <div>
              <a href="#reading" className="ng-trust-note" data-testid="hero-reading-note" style={{ display: "contents", color: "inherit", textDecoration: "none" }}>
                <span>
                  <strong>{c.heroNoteCta}</strong>
                  <small>{c.heroNote.replace("\n", " ")}</small>
                </span>
              </a>
            </div>
            <div>
              <span>
                <strong>{c.perspectiveRule}</strong>
                <small>{c.heroBottom}</small>
              </span>
            </div>
          </div>
        </Reveal>
      </section>

      <section id="atlas" className="ng-wrap ng-section" aria-labelledby="atlas-title">
        <SectionHead eyebrow={c.atlasLabel} title={c.atlasTitle} body={c.atlasBody} id="atlas-title" />
        {catalogRead.status === "unavailable" ? (
          <CatalogUnavailable locale={locale} />
        ) : (
          <div className="ng-filtered">
            <fieldset className="ng-filter" aria-label={c.filterLabel}>
              {categories.map((cat, i) => (
                <span key={cat.id} style={{ display: "contents" }}>
                  <input
                    type="radio"
                    name="home-cat"
                    id={cat.id === "all" ? "cat-all" : `cat-${cat.id}`}
                    defaultChecked={i === 0}
                  />
                  <label htmlFor={cat.id === "all" ? "cat-all" : `cat-${cat.id}`}>{cat.label}</label>
                </span>
              ))}
            </fieldset>
            <NPFProductGrid
              products={localizedProducts}
              locale={locale}
              dictionary={d}
              categoryNames={categoryNames}
              headingLevel="h3"
            />
          </div>
        )}
      </section>

      <section id="perspective" className="ng-wrap ng-section" aria-labelledby="perspective-title">
        <div className="ng-bento">
          <PhotoPanel
            className="span-7"
            src="/care-atlas/coastal-couple-modest.jpg"
            alt=""
            note={<span style={{ fontSize: "0.8125rem" }}>{c.imageNote}</span>}
          />
          <Reveal className="span-5 ng-glass ng-pad ng-stack" style={{ ["--ng-stack" as string]: "20px", alignSelf: "stretch", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <span className="ng-eyebrow">{c.perspectiveLabel}</span>
            <h2 id="perspective-title" className="ng-h2">
              {c.perspective1} <span className="ng-accent">{c.perspective2}</span>
            </h2>
            <p className="ng-body">{c.perspectiveBody}</p>
            <div className="ng-hero-cta">
              <Link href={`${base}/about`} className="ng-btn">
                {c.navWhy}
                <span className="ng-arrow" aria-hidden="true">↗</span>
              </Link>
              <Link href={`${base}/quality-sourcing`} className="ng-btn ng-btn-ghost">
                {d.nav.quality}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <ReadingBand
        locale={locale}
        leaflet={
          leafletProduct?.downloadUrl
            ? { name: leafletProduct.name, url: leafletProduct.downloadUrl }
            : undefined
        }
      />
      <ContactBand locale={locale} />
    </>
  );
}
