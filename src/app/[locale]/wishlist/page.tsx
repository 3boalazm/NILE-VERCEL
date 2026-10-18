import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary, toClientSafeDictionary } from "@/lib/i18n/dictionaries";
import { PageIntro } from "@/components/glass/sections";
import { WishlistContent } from "@/components/npf/wishlist-content";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/wishlist">): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "ar";
  const dictionary = getDictionary(locale);
  // Personal, browser-local list — never indexed (no canonical/hreflang
  // useful for a per-visitor localStorage page either).
  return {
    title: dictionary.wishlist.pageTitle,
    robots: { index: false, follow: false },
  };
}

export default async function WishlistPage({
  params,
}: PageProps<"/[locale]/wishlist">) {
  const { locale: localeParam } = await params;
  if (!isValidLocale(localeParam)) notFound();
  const locale: Locale = localeParam;
  const dictionary = getDictionary(locale);

  return (
    <>
      <PageIntro eyebrow={dictionary.siteName} title={dictionary.wishlist.pageTitle} />
      <WishlistContent
        locale={locale}
        dictionary={toClientSafeDictionary(dictionary)}
      />
    </>
  );
}
