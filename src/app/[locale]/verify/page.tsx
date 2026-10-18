import { notFound } from "next/navigation"
import type { Metadata } from "next"

import { isValidLocale, type Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { NPFVerifyTokenForm } from "@/components/npf/verify-token-form"
import { AccessPanel } from "@/components/glass/access-panel"
import { buildPageMetadata } from "@/lib/seo/page-metadata"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/verify">): Promise<Metadata> {
  const { locale: localeParam } = await params
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "ar"
  return buildPageMetadata({
    locale,
    path: "/verify",
    title: getDictionary(locale).auth.verifyAccountTitle,
    description: getDictionary(locale).auth.verifyAccountBody,
    // Token-bearing account route — never indexed.
    noIndex: true,
  })
}

/**
 * Account email verification (F-52). Target of the `verifyEmailAddressUrl`
 * template variable in `vendure-config.ts`; Vendure appends `?token=…`.
 */
export default async function VerifyAccountPage({
  params,
  searchParams,
}: PageProps<"/[locale]/verify">) {
  const { locale: localeParam } = await params
  if (!isValidLocale(localeParam)) notFound()
  const locale: Locale = localeParam
  const dictionary = getDictionary(locale)

  const query = await searchParams
  const rawToken = query?.token
  const token = Array.isArray(rawToken) ? (rawToken[0] ?? "") : (rawToken ?? "")

  return (
    <AccessPanel>
      <NPFVerifyTokenForm locale={locale} dictionary={dictionary.auth} token={token} mode="account" />
    </AccessPanel>
  )
}
