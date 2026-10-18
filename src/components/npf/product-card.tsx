import Link from "next/link";
import Image from "next/image";
import { Reveal } from "./motion/reveal";
import type { Product } from "@/lib/products";
import type { Locale } from "@/lib/i18n/config";
import type { ClientSafeDictionary } from "@/lib/i18n/dictionaries";
import { getExperienceCopy } from "@/lib/i18n/experience";
import { productTone } from "@/lib/products/presentation";
import { AddToCartButton } from "./add-to-cart-button";
import { WishlistButton } from "./wishlist-button";

/**
 * Glass product card. The whole card is one click target (the title link's
 * ::after covers it); wishlist and quick-add sit above that layer.
 */
export function NPFProductCard({
  priority = false,
  product: p,
  locale,
  dictionary: d,
  accentIndex = 0,
  categoryName,
  headingLevel = "h2",
}: {
  /** F-40: set on the first card of a grid — its image is the mobile LCP. */
  priority?: boolean;
  product: Product;
  locale: Locale;
  dictionary: ClientSafeDictionary;
  accentIndex?: number;
  categoryName?: string;
  headingLevel?: "h2" | "h3";
}) {
  const href = `/${locale}/products/${p.slug}`,
    ui = getExperienceCopy(locale),
    Heading = headingLevel;
  return (
    <Reveal
      as="article"
      className="ng-card"
      delay={(accentIndex % 3) * 0.06}
      data-tone={productTone(p)}
      data-cat={p.categorySlug}
      data-testid="product-card"
    >
      <div className="ng-card-media">
        {p.image && (
          <Image
            src={p.image}
            alt=""
            fill
            sizes="(min-width:1024px) 22vw, (min-width:640px) 45vw, 90vw"
            priority={priority}
          />
        )}
      </div>
      {p.status !== "active" && (
        <span className="ng-pill ng-card-badge">{d.status[p.status]}</span>
      )}
      <WishlistButton
        variant="inline"
        className="ng-card-wish ng-wish"
        slug={p.slug}
        addLabel={d.product.addToWishlist}
        removeLabel={d.product.removeFromWishlist}
      />
      <div className="ng-card-body">
        {categoryName && <span className="ng-eyebrow">{categoryName}</span>}
        <Heading className="ng-card-title">
          <Link href={href}>{p.name}</Link>
        </Heading>
        {p.availableForm && <p className="ng-card-sub">{p.availableForm}</p>}
        <div className="ng-card-foot">
          <span className="ng-price ng-num">
            {typeof p.price === "number" ? (
              <>
                {p.price.toLocaleString(locale === "ar" ? "ar-EG" : "en-US", {
                  useGrouping: true,
                })}
                <small>{locale === "en" ? "EGP" : "ج.م"}</small>
                {p.priceSource === "demo" && <small> · {ui.priceDemo}</small>}
              </>
            ) : (
              <span className="ng-price-na">{d.product.priceOnRequest}</span>
            )}
          </span>
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
