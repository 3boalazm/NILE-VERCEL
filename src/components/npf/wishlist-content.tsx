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
import { ctaButtonVariants } from "@/components/ui/button"
import { NPFProductGrid } from "@/components/npf/product-grid"
import { cn } from "@/lib/utils"

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
      <div
        className="mx-auto flex max-w-lg flex-col items-center gap-5 px-6 py-20 text-center"
        role="alert"
      >
        <p>{c.wishlistError}</p>
        <button
          className="studio-button !px-6"
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
      <div className="flex flex-col items-center gap-3 py-24 text-center text-muted-foreground">
        <Loader2Icon className="size-6 animate-spin" aria-hidden="true" />
        <p role="status">{dictionary.wishlist.pageTitle}…</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <HeartIcon className="size-6" />
        </div>
        <h2 className="mt-4 font-heading text-2xl font-semibold">
          {dictionary.wishlist.emptyTitle}
        </h2>
        <p className="mt-2 text-pretty text-muted-foreground">
          {dictionary.wishlist.emptyBody}
        </p>
        <Link
          href={`${base}/products`}
          className={cn(ctaButtonVariants({ variant: "onLight" }), "mt-8")}
        >
          {dictionary.wishlist.emptyCta}
        </Link>
      </div>
    );
  }

  const someUnavailable = products.length < slugs.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {someUnavailable && (
        <p className="mt-2 text-sm text-muted-foreground">
          {dictionary.wishlist.unavailableNote}
        </p>
      )}
      <div className="mt-8">
        <NPFProductGrid
          products={products}
          locale={locale}
          dictionary={dictionary}
        />
      </div>
    </div>
  );
}
