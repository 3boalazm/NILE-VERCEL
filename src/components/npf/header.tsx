import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { GlassHeader } from "@/components/glass/header";
import { GlassDock } from "@/components/glass/dock";

export function NPFHeader({
  locale,
  dictionary: d,
  isSignedIn,
}: {
  locale: Locale;
  dictionary: Dictionary;
  isSignedIn: boolean;
}) {
  const base = `/${locale}`;
  const account = {
    href: isSignedIn ? `${base}/account` : `${base}/login`,
    label: isSignedIn ? d.auth.accountNavLabel : d.auth.loginNavLabel,
  };
  return (
    <>
      <GlassHeader
        locale={locale}
        links={[
          { href: `${base}/products`, label: d.nav.products },
          { href: `${base}/about`, label: d.nav.about },
          { href: `${base}/quality-sourcing`, label: d.nav.quality },
          { href: `${base}/blogs`, label: d.nav.blogs },
        ]}
        account={account}
        labels={{
          site: d.siteName,
          contact: d.nav.contact,
          wishlist: d.wishlist.navLabel,
          cart: d.nav.cart,
          menu: d.nav.openMenu,
          light: d.nav.switchToLight,
          dark: d.nav.switchToDark,
        }}
      />
      <GlassDock
        locale={locale}
        accountHref={account.href}
        labels={{
          home: d.nav.home,
          products: d.nav.products,
          cart: d.nav.cart,
          account: account.label,
          nav: d.nav.mainNavLabel,
        }}
      />
    </>
  );
}
