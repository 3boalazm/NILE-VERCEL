import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { getCareAtlasCopy } from "@/lib/i18n/care-atlas";
import { AtlasHeader } from "@/components/care-atlas/header";

export function NPFHeader({
  locale,
  dictionary: d,
  isSignedIn,
}: {
  locale: Locale;
  dictionary: Dictionary;
  isSignedIn: boolean;
}) {
  const c = getCareAtlasCopy(locale),
    base = `/${locale}`;
  return (
    <AtlasHeader
      locale={locale}
      links={[
        { href: `${base}/products`, label: c.navAtlas },
        { href: `${base}/about`, label: c.navWhy },
        { href: `${base}/quality-sourcing`, label: d.nav.quality },
      ]}
      account={{
        href: isSignedIn ? `${base}/account` : `${base}/login`,
        label: isSignedIn ? d.auth.accountNavLabel : d.auth.loginNavLabel,
      }}
      labels={{
        site: d.siteName,
        contact: c.navContact,
        wishlist: d.wishlist.navLabel,
        cart: d.nav.cart,
        menu: locale === "ar" ? "فتح القائمة" : "Open menu",
        light: locale === "ar" ? "تفعيل الوضع الفاتح" : "Switch to light mode",
        dark: locale === "ar" ? "تفعيل الوضع الداكن" : "Switch to dark mode",
      }}
    />
  );
}
