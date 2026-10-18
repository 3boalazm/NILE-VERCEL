"use client";

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { HeartIcon, Loader2Icon } from "lucide-react"

import { getCurrentWishlistSlugs, mergeWishlistSlugs, pullWishlist, pushWishlist, useWishlist } from "@/lib/wishlist"
import { getWishlistProducts } from "@/lib/wishlist/actions"
import { getExperienceCopy } from "@/lib/i18n/experience"
import type { Product } from "@/lib/products"
import type { Locale } from "@/lib/i18n/config"
import type { ClientSafeDictionary } from "@/lib/i18n/dictionaries"
import { NPFProductGrid } from "@/components/npf/product-grid"

export function WishlistContent({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: ClientSafeDictionary;
}) {
  const { slugs } = useWishlist();
  const [products, setProducts] = useState<Product[] | null>(null);
  const base = `/${locale}`;
  const c = getExperienceCopy(locale);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // F-20 — account sync. On mount: pull the account list, merge (union) into
  // the local one, push the merged result back — anonymous visitors no-op
  // (pull reports synced:false). While the account sync is active, local
  // edits made on this page (remove/toggle) are pushed so removals propagate
  // too; sync semantics + the accepted device-shadow trade-off are documented
  // on the Wishlists collection and in reconcile.ts.
  const sync = useRef({ active: false, lastPushed: "" })
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const result = await pullWishlist()
      if (cancelled || !result.synced) return
      sync.current.active = true
      mergeWishlistSlugs(result.slugs)
      const merged = getCurrentWishlistSlugs()
      sync.current.lastPushed = merged.join("\n")
      void pushWishlist(merged)
    })()
    return () => {
      cancelled = true
    }
  }, [])
  useEffect(() => {
    if (!sync.current.active) return
    const key = slugs.join("\n")
    if (key === sync.current.lastPushed) return
    sync.current.lastPushed = key
    void pushWishlist(slugs)
  }, [slugs])

  useEffect(() => {
    let cancelled = false;
    // Always goes through the server action, even for an empty list —
    // Promise.all([]) resolves to [] on the next microtask either way, so
    // there's no need to special-case it with a synchronous setState here.
    getWishlistProducts(slugs, locale)
      .then((result) => {
        if (!cancelled) {
          setProducts(result);
          setFailed(false);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slugs, locale, attempt]);

  if (failed)
    return (
      <div className="ng-wrap ngc-empty" role="alert">
        <span className="ngc-empty-icon" data-tone="danger" aria-hidden="true">
          <HeartIcon />
        </span>
        <p className="ngc-sub">{c.wishlistError}</p>
        <button
          type="button"
          className="ng-btn ng-btn-primary"
          onClick={() => {
            setFailed(false);
            setProducts(null);
            setAttempt((a) => a + 1);
          }}
        >
          {c.retry}
        </button>
      </div>
    );

  if (products === null) {
    return (
      <div className="ng-wrap ngc-empty" style={{ paddingBlock: "48px" }}>
        <Loader2Icon className="ngc-spin size-6" aria-hidden="true" style={{ color: "var(--ng-ink-3)" }} />
        <p className="ngc-sub" role="status">{dictionary.wishlist.pageTitle}…</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="ng-wrap ngc-empty" style={{ paddingBlockStart: "24px" }}>
        <span className="ngc-empty-icon" aria-hidden="true">
          <HeartIcon />
        </span>
        <h2 className="ngc-title ngc-title-sm">{dictionary.wishlist.emptyTitle}</h2>
        <p className="ngc-sub">{dictionary.wishlist.emptyBody}</p>
        <Link href={`${base}/products`} className="ng-btn ng-btn-primary ng-btn-lg">
          {dictionary.wishlist.emptyCta}
          <span className="ng-arrow" aria-hidden="true">↗</span>
        </Link>
      </div>
    );
  }

  const someUnavailable = products.length < slugs.length;

  return (
    <div className="ng-wrap ngc-page" style={{ paddingBlockStart: "8px" }}>
      {someUnavailable && (
        <p className="ngc-info" style={{ marginBlockEnd: "20px" }}>
          {dictionary.wishlist.unavailableNote}
        </p>
      )}
      <NPFProductGrid products={products} locale={locale} dictionary={dictionary} />
    </div>
  );
}
