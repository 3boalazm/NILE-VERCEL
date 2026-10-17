import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getActiveCustomer } from "@/lib/auth/active-customer";
import { NPFLoginForm } from "@/components/npf/login-form";
import { AccessFrame } from "@/components/care-atlas/access-frame";
import { buildPageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/login">): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "ar";
  const dictionary = getDictionary(locale);
  return buildPageMetadata({
    locale,
    path: "/login",
    title: dictionary.auth.loginTitle,
    description: dictionary.auth.loginSubtitle,
    // Transactional page like cart/checkout — no reason to index it.
    noIndex: true,
  });
}

export default async function LoginPage({
  params,
}: PageProps<"/[locale]/login">) {
  const { locale: localeParam } = await params;
  if (!isValidLocale(localeParam)) notFound();
  const locale: Locale = localeParam;
  const dictionary = getDictionary(locale);

  // Already signed in — no reason to show the login form again.
  const customer = await getActiveCustomer();
  if (customer) redirect(`/${locale}/account`);

  return (
    <AccessFrame
      title={dictionary.auth.loginTitle}
      subtitle={dictionary.auth.loginSubtitle}
    >
      <NPFLoginForm locale={locale} dictionary={dictionary.auth} />
    </AccessFrame>
  );
}
