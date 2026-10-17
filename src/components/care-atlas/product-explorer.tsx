"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useAnimate, useReducedMotion } from "framer-motion";
import Image from "next/image";
import type { Locale } from "@/lib/i18n/config";
import type { Product } from "@/lib/products/types";
import { matchesCatalogSearch } from "@/lib/products/catalog-discovery";
import { getDiscoveryCopy } from "@/lib/i18n/discovery";
import { careAtlasImage } from "@/lib/products/presentation";
import { getCareAtlasCopy } from "@/lib/i18n/care-atlas";

type AtlasProduct = Pick<
  Product,
  | "id"
  | "slug"
  | "name"
  | "nameArabic"
  | "categorySlug"
  | "image"
  | "shortDescription"
  | "availableForm"
  | "composition"
  | "compositionNote"
  | "usage"
  | "downloadUrl"
>;
export function ProductExplorer({
  locale,
  products,
}: {
  locale: Locale;
  products: AtlasProduct[];
}) {
  const recovery = getDiscoveryCopy(locale);
  const c = getCareAtlasCopy(locale),
    base = `/${locale}`,
    id = useId();
  const [selected, setSelected] = useState(
    products.find((p) => p.slug === "proxeed-plus")?.slug ?? products[0]?.slug,
  );
  const [category, setCategory] = useState("all"),
    [query, setQuery] = useState("");
  const [detail, setDetail] = useState<"composition" | "usage" | "leaflet">(
    "composition",
  );
  const list = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const visible = products.filter(
    (p) =>
      (category === "all" || p.categorySlug === category) &&
      matchesCatalogSearch(p, query),
  );
  const product = visible.find((p) => p.slug === selected) ?? visible[0];
  const src = product && careAtlasImage(product);
  const [stage, animate] = useAnimate<HTMLElement>();
  const reduced = useReducedMotion();
  const productSlug = product?.slug;
  const previousProduct = useRef(productSlug);
  const previousDetail = useRef(`${productSlug}:${detail}`);
  // Only animate user-initiated changes, never the initial server render.
  useEffect(() => {
    const changed = previousProduct.current !== productSlug;
    previousProduct.current = productSlug;
    const image =
      stage.current?.querySelector<HTMLElement>(".ca-stage-art img");
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
    const panel =
      stage.current?.querySelector<HTMLElement>(".ca-product-detail");
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
  const groups = [
    { key: "all", label: c.filterAll },
    { key: "supplements", label: c.filterSupplements },
    { key: "medical-devices", label: c.filterDevices },
  ].filter(
    (g) => g.key === "all" || products.some((p) => p.categorySlug === g.key),
  );
  return (
    <div className="ca-product-explorer">
      <div className="ca-atlas-toolbar">
        <span
          className="ca-catalog-count ca-mono"
          data-count-target={products.length}
          aria-live="polite"
        >
          {String(visible.length).padStart(2, "0")} / {c.productCount}
        </span>
        <div className="ca-filters" role="group" aria-label={c.filterLabel}>
          {groups.map((g) => (
            <button
              key={g.key}
              className={`ca-filter ${category === g.key ? "active" : ""}`}
              aria-pressed={category === g.key}
              onClick={() => {
                setCategory(g.key);
                setDetail("composition");
              }}
            >
              {g.label}
            </button>
          ))}
        </div>
        <label className="ca-catalog-search">
          <span aria-hidden="true">⌕</span>
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
            aria-label={c.search}
          />
          <span className="ca-mono" aria-hidden="true">
            ↵
          </span>
        </label>
      </div>
      <div
        className="ca-atlas-workspace"
        data-empty={visible.length === 0 || undefined}
      >
        <div className="ca-product-index">
          <p className="ca-index-label">
            {c.indexLabel}
            <span aria-hidden="true">↓</span>
          </p>
          <div
            className="ca-product-list"
            ref={list}
            role="group"
            aria-label={c.listLabel}
          >
            {visible.map((p) => (
              <button
                key={p.slug}
                type="button"
                className={`ca-product-row ${product?.slug === p.slug ? "active" : ""}`}
                aria-pressed={product?.slug === p.slug}
                aria-controls={id}
                onClick={() => select(p.slug)}
                onKeyDown={(e) => {
                  if (
                    ![
                      "ArrowDown",
                      "ArrowUp",
                      "ArrowLeft",
                      "ArrowRight",
                      "Home",
                      "End",
                    ].includes(e.key)
                  )
                    return;
                  e.preventDefault();
                  const i = visible.indexOf(p),
                    next =
                      e.key === "Home"
                        ? 0
                        : e.key === "End"
                          ? visible.length - 1
                          : (i +
                              (["ArrowDown", "ArrowRight"].includes(e.key)
                                ? 1
                                : -1) +
                              visible.length) %
                            visible.length;
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
                <span className="ca-mono" aria-hidden="true">
                  {String(products.indexOf(p) + 1).padStart(2, "0")}
                </span>
                <span className="ca-row-label">
                  <strong>{p.name}</strong>
                  <small>
                    {locale === "ar"
                      ? p.nameArabic
                      : p.categorySlug === "medical-devices"
                        ? c.filterDevices
                        : c.filterSupplements}
                  </small>
                </span>
                <span className="ca-row-arrow" aria-hidden="true">
                  ↙
                </span>
              </button>
            ))}
          </div>
          {!visible.length && (
            <div>
              <p className="ca-empty" role="status">
                {c.empty}
              </p>
              <div className="ca-atlas-empty-actions">
                {query && (
                  <button
                    type="button"
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
          <Link href={`${base}/products`} className="ca-index-help">
            {c.filterAll}
            <span aria-hidden="true">↗</span>
          </Link>
          <noscript>
            <div className="ca-noscript-note">
              {locale === "ar"
                ? "روابط المنتجات والمجموعات بدون JavaScript:"
                : "Product links without JavaScript:"}
              {products.map((p) => (
                <Link key={p.slug} href={`${base}/products/${p.slug}`}>
                  {p.name}
                </Link>
              ))}
            </div>
          </noscript>
        </div>
        {product && (
          <section
            className="ca-product-stage"
            ref={stage}
            id={id}
            aria-label={c.stageLabel}
          >
            <div className="ca-stage-meta">
              <span className="ca-mono">
                {product.categorySlug === "medical-devices"
                  ? c.filterDevices
                  : c.filterSupplements}
              </span>
              <span className="ca-mono">
                {String(products.indexOf(product) + 1).padStart(2, "0")} —{" "}
                {String(products.length).padStart(2, "0")}
              </span>
            </div>
            <div className="ca-stage-art">
              <span className="ca-stage-ring" aria-hidden="true" />
              <span className="ca-stage-word" aria-hidden="true">
                CARE.
              </span>
              {src && (
                <Image
                  src={src}
                  alt={product.name}
                  width={600}
                  height={600}
                  sizes="(min-width:1024px) 30vw, 70vw"
                />
              )}
              <span className="ca-stage-cross" aria-hidden="true">
                +
              </span>
              <span className="ca-stage-caption ca-mono">
                PRODUCT, IN FOCUS
              </span>
            </div>
            <div className="ca-product-overview">
              <div>
                <p className="ca-product-subtitle">{product.availableForm}</p>
                <h3 dir="ltr">{product.name}</h3>
              </div>
              <Link
                href={`${base}/products/${product.slug}`}
                className="ca-product-seal"
                aria-label={`${locale === "ar" ? "تفاصيل" : "Details"}: ${product.name}`}
              >
                <span aria-hidden="true">↙</span>
              </Link>
            </div>
            <p className="ca-product-description">{product.shortDescription}</p>
            <div
              className="ca-product-tabs"
              role="group"
              aria-label={c.detailLabel}
            >
              {(["composition", "usage", "leaflet"] as const).map((tab) => (
                <button
                  key={tab}
                  className={`ca-detail-tab ${detail === tab ? "active" : ""}`}
                  aria-pressed={detail === tab}
                  aria-controls={`${id}-detail`}
                  onClick={() => setDetail(tab)}
                >
                  {tab === "composition" &&
                  product.categorySlug === "medical-devices"
                    ? c.specifications
                    : c[tab]}
                </button>
              ))}
            </div>
            <div
              id={`${id}-detail`}
              className="ca-product-detail"
              aria-live="polite"
            >
              {detail === "composition" && (
                <>
                  {product.composition?.length ? (
                    <>
                      <table
                        className="ca-composition-table"
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
                              <td>{item.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {product.compositionNote && (
                        <p className="ca-composition-note">
                          {product.compositionNote}
                        </p>
                      )}
                    </>
                  ) : (
                    <p>{c.noComposition}</p>
                  )}
                </>
              )}
              {detail === "usage" && (
                <p className="ca-usage-copy">{product.usage || c.noInfo}</p>
              )}
              {detail === "leaflet" &&
                (product.downloadUrl ? (
                  <a
                    className="ca-pdf-link"
                    href={product.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>
                      {c.openLeaflet} / {product.name}
                      <small>{c.newWindow}</small>
                    </span>
                    <span aria-hidden="true">↗</span>
                  </a>
                ) : (
                  <>
                    <p>{c.noLeaflet}</p>
                    <Link
                      className="ca-line-link"
                      href={`${base}/contact?product=${encodeURIComponent(product.slug)}`}
                    >
                      {c.askProduct}
                      <span aria-hidden="true">↗</span>
                    </Link>
                  </>
                ))}
            </div>
            <p className="ca-medical-note">{c.medicalNote}</p>
            <div className="ca-file-links">
              <Link href={`${base}/products/${product.slug}`}>
                {locale === "ar"
                  ? "افتح ملف المنتج الكامل"
                  : "Open the full product file"}{" "}
                ↗
              </Link>
              <Link
                href={`${base}/contact?product=${encodeURIComponent(product.slug)}`}
              >
                {c.askProduct} ↗
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
