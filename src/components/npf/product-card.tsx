import Link from "next/link";
import { Reveal } from "./motion/reveal";
import Image from "next/image";
import type { Product } from "@/lib/products";
import type { Locale } from "@/lib/i18n/config";
import type { ClientSafeDictionary } from "@/lib/i18n/dictionaries";
import { getExperienceCopy } from "@/lib/i18n/experience";
import { careAtlasImage } from "@/lib/products/presentation";
import { AddToCartButton } from "./add-to-cart-button";
import { WishlistButton } from "./wishlist-button";

export function NPFProductCard({
  priority = false,
  product: p,
  locale,
  dictionary: d,
  accentIndex = 0,
  categoryName,
}: {
  /** F-40: set on the first card of a grid — its image is the mobile LCP. */
  priority?: boolean;
  product: Product;
  locale: Locale;
  dictionary: ClientSafeDictionary;
  accentIndex?: number;
  categoryName?: string;
}) {
  const href = `/${locale}/products/${p.slug}`,
    ui = getExperienceCopy(locale),
    src = careAtlasImage(p);
  return (
    <Reveal
      as="article"
      className="ca-catalog-card"
      delay={(accentIndex % 3) * 0.06}
    >
      <div className="ca-card-meta">
        <span className="ca-mono">
          {String(accentIndex + 1).padStart(2, "0")} / PRODUCT FILE
        </span>
        <span>{categoryName}</span>
      </div>
      <Link href={href} className="ca-card-art" aria-label={p.name}>
        {src && (
          <Image
            src={src}
            alt=""
            fill
            sizes="(min-width:1024px) 30vw, (min-width:640px) 45vw, 85vw"
            className="object-contain"
            priority={priority}
          />
        )}
        <span className="ca-card-circle" aria-hidden="true" />
        <span className="ca-card-arrow" aria-hidden="true">
          ↗
        </span>
      </Link>
      <div className="ca-card-copy">
        <h3>
          <Link href={href}>{p.name}</Link>
        </h3>
        <p>{p.shortDescription}</p>
        {p.availableForm && <small>{p.availableForm}</small>}
        <div className="ca-card-price">
          <span>{d.status[p.status]}</span>
          <span>
            {typeof p.price === "number" ? (
              <>
                {p.priceSource === "demo" && <small>{ui.priceDemo}</small>}
                {p.price} {locale === "en" ? "EGP" : "ج.م"}
              </>
            ) : (
              d.product.priceOnRequest
            )}
          </span>
        </div>
        <div className="ca-card-actions">
          <Link href={href} className="ca-solid-link">
            {d.product.viewDetails}
            <span aria-hidden="true">↗</span>
          </Link>
          <WishlistButton
            variant="inline"
            slug={p.slug}
            addLabel={d.product.addToWishlist}
            removeLabel={d.product.removeFromWishlist}
          />
          <AddToCartButton
            product={p}
            tone="onSurface"
            labels={{
              add: d.product.addToCart,
              added: d.product.addedToCart,
              unavailable: d.product.unavailableForOrder,
              error: d.product.addToCartError,
            }}
          />
        </div>
      </div>
    </Reveal>
  );
}
