import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getActiveCustomer } from "@/lib/auth/active-customer";
import { NPFRegisterForm } from "@/components/npf/register-form";
import { AccessFrame } from "@/components/care-atlas/access-frame";
import { buildPageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/register">): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "ar";
  const dictionary = getDictionary(locale);
  return buildPageMetadata({
    locale,
    path: "/register",
    title: dictionary.auth.registerTitle,
    description: dictionary.auth.registerSubtitle,
    // Transactional page like cart/checkout — no reason to index it.
    noIndex: true,
  });
}

export default async function RegisterPage({
  params,
}: PageProps<"/[locale]/register">) {
  const { locale: localeParam } = await params;
  if (!isValidLocale(localeParam)) notFound();
  const locale: Locale = localeParam;
  const dictionary = getDictionary(locale);

  const customer = await getActiveCustomer();
  if (customer) redirect(`/${locale}/account`);

  return (
    <AccessFrame
      title={dictionary.auth.registerTitle}
      subtitle={dictionary.auth.registerSubtitle}
    >
      <NPFRegisterForm locale={locale} dictionary={dictionary.auth} />
    </AccessFrame>
  );
}
