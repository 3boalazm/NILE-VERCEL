import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isValidLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getCareAtlasCopy } from "@/lib/i18n/care-atlas";
import { productRepository, localizeProduct } from "@/lib/products";
import { publicCatalogProduct } from "@/lib/evidence/store";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { Reveal } from "@/components/npf/motion/reveal";
import { ProductExplorer } from "@/components/care-atlas/product-explorer";
import { CareContact, CareReading } from "@/components/care-atlas/sections";

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
  });
}
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const c = getCareAtlasCopy(locale),
    base = `/${locale}`;
  const products = (await productRepository.getAllProducts()).map((p) =>
    localizeProduct(publicCatalogProduct(p), locale),
  );
  const leafletProduct =
    products.find((p) => p.slug === "proxeed-plus" && p.downloadUrl) ??
    products.find((p) => p.downloadUrl);
  return (
    <div className="ca-home">
      <section className="ca-hero" aria-labelledby="hero-title">
        <Image
          className="ca-hero-photo"
          src="/care-atlas/coastal-couple-modest.jpg"
          alt=""
          fill
          sizes="100vw"
          preload
        />
        <div className="ca-hero-shade" />
        <div className="ca-hero-grid" aria-hidden="true" />
        <div className="ca-hero-meta">
          <span className="ca-mono">CAIRO, EGYPT · NILE PHARMA FOOD</span>
          <span>
            <span className="ca-small-cross" aria-hidden="true">
              ✳
            </span>
            {c.heroEyebrow}
          </span>
        </div>
        <div className="ca-hero-copy">
          <h1 id="hero-title">
            <span>{c.heroLine1}</span>
            <span className="ca-hero-second">
              <i className="ca-hero-star" aria-hidden="true">
                ✳
              </i>
              <span>{c.heroLine2}</span>
            </span>
          </h1>
          <p>{c.heroBody}</p>
          <Link href={`${base}/products`} className="ca-hero-cta">
            {c.heroCta}
            <span className="ca-round-arrow" aria-hidden="true">
              ↙
            </span>
          </Link>
        </div>
        <a className="ca-hero-field-note" href="#reading">
          <span className="ca-mono">A NOTE ON CARE / 001</span>
          <p>{c.heroNote}</p>
          <div>
            <span>{c.heroNoteCta}</span>
            <span aria-hidden="true">↗</span>
          </div>
        </a>
        <div className="ca-hero-bottom">
          <span>{c.heroBottom}</span>
          <a href="#perspective">
            {c.scroll}
            <span aria-hidden="true">↓</span>
          </a>
          <span className="ca-mono">01 — LIFE, FIRST</span>
        </div>
      </section>
      <section
        id="perspective"
        className="ca-perspective ca-section-pad"
        aria-labelledby="perspective-title"
      >
        <span id="trust" />
        <div className="ca-section-index">
          <span className="ca-mono">01 / PERSPECTIVE</span>
          <span className="ca-tiny-mark" aria-hidden="true">
            ✳
          </span>
          <span>{c.perspectiveLabel}</span>
        </div>
        <div className="ca-perspective-layout">
          <Reveal as="h2" id="perspective-title">
            <span>{c.perspective1}</span>
            <span>{c.perspective2}</span>
          </Reveal>
          <Reveal className="ca-perspective-side" delay={0.08}>
            <p>{c.perspectiveBody}</p>
            <Link href={`${base}/about`} className="ca-line-link">
              {c.navWhy}
              <span aria-hidden="true">↗</span>
            </Link>
            <Link href={`${base}/quality-sourcing`} className="ca-partner">
              <Image
                src="/alfasigma-logo.svg"
                width={135}
                height={35}
                alt="Alfasigma"
              />
              <span>{c.partner}</span>
            </Link>
          </Reveal>
        </div>
        <div className="ca-editorial-rule">
          <span className="ca-mono">INFORMATION, NOT ASSUMPTIONS.</span>
          <span>{c.perspectiveRule}</span>
        </div>
      </section>
      <section id="atlas" className="ca-atlas" aria-labelledby="atlas-title">
        <div className="ca-atlas-heading ca-section-pad">
          <div className="ca-section-index">
            <span className="ca-mono">02 / THE CARE ATLAS</span>
            <span>{c.atlasLabel}</span>
          </div>
          <div className="ca-atlas-title-row">
            <Reveal as="h2" id="atlas-title">
              {c.atlasTitle}
            </Reveal>
            <p>{c.atlasBody}</p>
          </div>
        </div>
        <ProductExplorer
          locale={locale}
          products={products.map((p) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            nameArabic: p.nameArabic,
            categorySlug: p.categorySlug,
            image: p.image,
            shortDescription: p.shortDescription,
            availableForm: p.availableForm,
            composition: p.composition,
            compositionNote: p.compositionNote,
            usage: p.usage,
            downloadUrl: p.downloadUrl,
          }))}
        />
      </section>
      <CareReading
        locale={locale}
        leaflet={
          leafletProduct?.downloadUrl
            ? { name: leafletProduct.name, url: leafletProduct.downloadUrl }
            : undefined
        }
      />
      <CareContact locale={locale} />
    </div>
  );
}
