"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAnimate, useReducedMotion } from "framer-motion";
import type { Locale } from "@/lib/i18n/config";
import type { Product } from "@/lib/products/types";
import { matchesCatalogSearch } from "@/lib/products/catalog-discovery";
import { getDiscoveryCopy } from "@/lib/i18n/discovery";
import { getCareAtlasCopy } from "@/lib/i18n/care-atlas";
import { getCatalogGlassCopy } from "@/lib/i18n/catalog-glass";

/**
 * Only what the evidence workflow lets a product page show. The server page
 * gates every field before it reaches this client component, so nothing
 * unapproved is serialised into the browser payload.
 */
export type AtlasProduct = Pick<
  Product,
  | "id"
  | "slug"
  | "name"
  | "nameArabic"
  | "categorySlug"
  | "downloadUrl"
> & {
  image: string | null;
  tone: "aqua" | "rose" | "mint";
  form: string | null;
  description: string | null;
  composition: { label: string; value: string }[] | null;
  compositionNote: string | null;
  usage: string | null;
};

type Detail = "composition" | "usage" | "leaflet";

/**
 * "Quick read" atlas (replaces care-atlas/product-explorer): a keyboard
 * navigable index beside a stage that shows one product's published
 * composition, usage and official leaflet. Progressive: without JS the
 * <noscript> list still links every product file.
 */
export function ProductAtlas({
  locale,
  products,
}: {
  locale: Locale;
  products: AtlasProduct[];
}) {
  const recovery = getDiscoveryCopy(locale);
  const c = getCareAtlasCopy(locale),
    g = getCatalogGlassCopy(locale),
    base = `/${locale}`,
    id = useId();
  const [selected, setSelected] = useState(
    products.find((p) => p.slug === "proxeed-plus")?.slug ?? products[0]?.slug,
  );
  const [category, setCategory] = useState("all"),
    [query, setQuery] = useState("");
  const [detail, setDetail] = useState<Detail>("composition");
  const list = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const visible = products.filter(
    (p) =>
      (category === "all" || p.categorySlug === category) &&
      matchesCatalogSearch(
        { name: p.name, nameArabic: p.nameArabic, shortDescription: p.description },
        query,
      ),
  );
  const product = visible.find((p) => p.slug === selected) ?? visible[0];
  const [stage, animate] = useAnimate<HTMLElement>();
  const reduced = useReducedMotion();
  const productSlug = product?.slug;
  const previousProduct = useRef(productSlug);
  const previousDetail = useRef(`${productSlug}:${detail}`);
  // Only animate user-initiated changes, never the initial server render.
  useEffect(() => {
    const changed = previousProduct.current !== productSlug;
    previousProduct.current = productSlug;
    const image = stage.current?.querySelector<HTMLElement>(".ng-atlas-art img");
    if (!changed || reduced || !image) return;
    const controls = animate(
      image,
      { y: [10, 0], scale: [0.97, 1], opacity: [0.75, 1] },
      { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
    );
    return () => {
      controls.stop();
      image.style.removeProperty("transform");
      image.style.removeProperty("opacity");
    };
  }, [productSlug, reduced, animate, stage]);
  useEffect(() => {
    const key = `${productSlug}:${detail}`;
    const changed = previousDetail.current !== key;
    previousDetail.current = key;
    const panel = stage.current?.querySelector<HTMLElement>(".ng-atlas-detail");
    if (!changed || reduced || !panel) return;
    const controls = animate(
      panel,
      { y: [6, 0], opacity: [0.7, 1] },
      { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
    );
    return () => {
      controls.stop();
      panel.style.removeProperty("transform");
      panel.style.removeProperty("opacity");
    };
  }, [productSlug, detail, reduced, animate, stage]);

  function select(slug: string) {
    setSelected(slug);
    setDetail("composition");
  }
  const kind = (p: AtlasProduct) =>
    p.categorySlug === "medical-devices" ? c.filterDevices : c.filterSupplements;
  const groups = [
    { key: "all", label: c.filterAll },
    { key: "supplements", label: c.filterSupplements },
    { key: "medical-devices", label: c.filterDevices },
  ].filter(
    (grp) => grp.key === "all" || products.some((p) => p.categorySlug === grp.key),
  );
  const inquiry = (p: AtlasProduct) =>
    `${base}/contact?product=${encodeURIComponent(p.slug)}`;
  return (
    <div className="ng-atlas" data-testid="product-atlas">
      <div className="ng-atlas-toolbar">
        <div className="ng-atlas-filters" role="group" aria-label={c.filterLabel}>
          {groups.map((grp) => (
            <button
              key={grp.key}
              type="button"
              className="ng-chip"
              aria-pressed={category === grp.key}
              onClick={() => {
                setCategory(grp.key);
                setDetail("composition");
              }}
            >
              {grp.label}
            </button>
          ))}
        </div>
        <label className="ng-atlas-search">
          <span className="ng-sr">{c.search}</span>
          <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            ref={searchInput}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value.slice(0, 200));
              setDetail("composition");
            }}
            maxLength={200}
            placeholder={c.search}
            data-testid="atlas-search"
          />
        </label>
        <span className="ng-atlas-count ng-num" aria-live="polite">
          {visible.length} / {products.length} · {c.productCount}
        </span>
      </div>
      <div
        className="ng-atlas-workspace"
        data-testid="atlas-workspace"
        data-empty={visible.length === 0 || undefined}
      >
        <div className="ng-atlas-index" data-testid="atlas-index">
          <p className="ng-atlas-label">{c.indexLabel}</p>
          <div
            className="ng-atlas-list"
            ref={list}
            role="group"
            aria-label={c.listLabel}
          >
            {visible.map((p) => (
              <button
                key={p.slug}
                type="button"
                className="ng-atlas-row"
                data-testid="atlas-row"
                data-tone={p.tone}
                aria-pressed={product?.slug === p.slug}
                aria-controls={id}
                onClick={() => select(p.slug)}
                onKeyDown={(e) => {
                  if (
                    !["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Home", "End"].includes(
                      e.key,
                    )
                  )
                    return;
                  e.preventDefault();
                  // Logical order: "next" is the reading direction in both scripts.
                  const forward =
                    e.key === "ArrowDown" ||
                    (e.key === "ArrowLeft" && locale === "ar") ||
                    (e.key === "ArrowRight" && locale !== "ar");
                  const i = visible.indexOf(p),
                    next =
                      e.key === "Home"
                        ? 0
                        : e.key === "End"
                          ? visible.length - 1
                          : (i + (forward ? 1 : -1) + visible.length) % visible.length;
                  select(visible[next].slug);
                  const target = list.current?.querySelectorAll("button")[next];
                  target?.focus({ preventScroll: true });
                  target?.scrollIntoView({
                    block: "nearest",
                    inline: "nearest",
                    behavior: "instant",
                  });
                }}
              >
                <span className="ng-atlas-thumb" aria-hidden="true">
                  {p.image && <Image src={p.image} alt="" width={64} height={64} />}
                </span>
                <span className="ng-atlas-row-label">
                  <strong dir="ltr">{p.name}</strong>
                  <small>{locale === "ar" && p.nameArabic ? p.nameArabic : kind(p)}</small>
                </span>
              </button>
            ))}
          </div>
          {!visible.length && (
            <div className="ng-atlas-empty">
              <p role="status" data-testid="atlas-empty">
                {c.empty}
              </p>
              <div className="ng-atlas-empty-actions" data-testid="atlas-empty-actions">
                {query && (
                  <button
                    type="button"
                    className="ng-btn"
                    onClick={() => {
                      setQuery("");
                      searchInput.current?.focus({ preventScroll: true });
                    }}
                  >
                    {recovery.resetSearch}
                  </button>
                )}
                {(query || category !== "all") && (
                  <button
                    type="button"
                    className="ng-btn ng-btn-ghost"
                    onClick={() => {
                      setQuery("");
                      setCategory("all");
                      searchInput.current?.focus({ preventScroll: true });
                    }}
                  >
                    {recovery.all}
                  </button>
                )}
              </div>
            </div>
          )}
          <noscript>
            <div className="ng-atlas-noscript" data-testid="atlas-noscript">
              <p>{g.noscriptLinks}</p>
              {products.map((p) => (
                <Link key={p.slug} href={`${base}/products/${p.slug}`} dir="ltr">
                  {p.name}
                </Link>
              ))}
            </div>
          </noscript>
        </div>
        {product && (
          <section
            className="ng-atlas-stage"
            data-testid="atlas-stage"
            data-tone={product.tone}
            ref={stage}
            id={id}
            aria-label={c.stageLabel}
          >
            <div className="ng-atlas-art">
              {product.image && (
                <Image
                  src={product.image}
                  alt={product.name}
                  width={480}
                  height={480}
                  sizes="(min-width:960px) 240px, 40vw"
                />
              )}
            </div>
            <div className="ng-atlas-head">
              <span className="ng-eyebrow">{kind(product)}</span>
              <h3 className="ng-h3" dir="ltr">
                {product.name}
              </h3>
              {product.form && <p className="ng-card-sub">{product.form}</p>}
            </div>
            {product.description && (
              <p className="ng-atlas-desc">{product.description}</p>
            )}
            <div
              className="ng-atlas-tabs"
              data-testid="atlas-tabs"
              role="group"
              aria-label={c.detailLabel}
            >
              {(["composition", "usage", "leaflet"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  aria-pressed={detail === tab}
                  aria-controls={`${id}-detail`}
                  onClick={() => setDetail(tab)}
                >
                  {tab === "composition" && product.categorySlug === "medical-devices"
                    ? c.specifications
                    : c[tab]}
                </button>
              ))}
            </div>
            <div
              id={`${id}-detail`}
              className="ng-atlas-detail"
              data-testid="atlas-detail"
              aria-live="polite"
            >
              {detail === "composition" &&
                (product.composition?.length ? (
                  <>
                    <table
                      className="ng-spec-table"
                      aria-label={
                        product.categorySlug === "medical-devices"
                          ? c.specifications
                          : c.composition
                      }
                    >
                      <tbody>
                        {product.composition.map((item) => (
                          <tr key={item.label}>
                            <th scope="row">{item.label}</th>
                            <td dir="auto">{item.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {product.compositionNote && (
                      <p className="ng-atlas-note">{product.compositionNote}</p>
                    )}
                  </>
                ) : (
                  <p>{c.noComposition}</p>
                ))}
              {detail === "usage" && <p>{product.usage || c.noInfo}</p>}
              {detail === "leaflet" &&
                (product.downloadUrl ? (
                  <a
                    className="ng-pdf"
                    data-testid="atlas-pdf-link"
                    href={product.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="ng-pdf-icon" aria-hidden="true">
                      PDF
                    </span>
                    <span className="ng-pdf-text">
                      <strong>
                        {c.openLeaflet} · <span dir="ltr">{product.name}</span>
                      </strong>
                      <small>{c.newWindow}</small>
                    </span>
                    <span aria-hidden="true">↗</span>
                  </a>
                ) : (
                  <>
                    <p>{c.noLeaflet}</p>
                    <Link className="ng-link" href={inquiry(product)}>
                      {c.askProduct}
                    </Link>
                  </>
                ))}
            </div>
            <p className="ng-atlas-medical">{c.medicalNote}</p>
            <div className="ng-atlas-links" data-testid="atlas-file-links">
              <Link href={`${base}/products/${product.slug}`} className="ng-btn ng-btn-primary">
                {g.openFile}
                <span className="ng-arrow" aria-hidden="true">
                  ↗
                </span>
              </Link>
              <Link href={inquiry(product)} className="ng-btn ng-btn-ghost">
                {c.askProduct}
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
