import { notFound } from "next/navigation"
import type { Metadata } from "next"

import { isValidLocale, type Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { NPFVerifyTokenForm } from "@/components/npf/verify-token-form"
import { AccessPanel } from "@/components/glass/access-panel"
import { buildPageMetadata } from "@/lib/seo/page-metadata"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/verify-email-change">): Promise<Metadata> {
  const { locale: localeParam } = await params
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "ar"
  return buildPageMetadata({
    locale,
    path: "/verify-email-change",
    title: getDictionary(locale).auth.verifyEmailChangeTitle,
    description: getDictionary(locale).auth.verifyEmailChangeBody,
    // Token-bearing account route — never indexed.
    noIndex: true,
  })
}

/**
 * Email-address change confirmation (F-52). Target of the
 * `changeEmailAddressUrl` template variable.
 *
 * A separate route from `/verify` even though the screens look the same,
 * because Vendure requires a different mutation for this token kind — see
 * `confirmEmailAddressChange`. The storefront does not currently expose an
 * "edit email address" form (the profile page states email is not editable),
 * so nothing generates these tokens yet; the route exists so the configured
 * email URL resolves to real behaviour instead of the dead
 * `localhost:8080/verify-email-address-change` scaffold it replaced.
 */
export default async function VerifyEmailChangePage({
  params,
  searchParams,
}: PageProps<"/[locale]/verify-email-change">) {
  const { locale: localeParam } = await params
  if (!isValidLocale(localeParam)) notFound()
  const locale: Locale = localeParam
  const dictionary = getDictionary(locale)

  const query = await searchParams
  const rawToken = query?.token
  const token = Array.isArray(rawToken) ? (rawToken[0] ?? "") : (rawToken ?? "")

  return (
    <AccessPanel>
      <NPFVerifyTokenForm
        locale={locale}
        dictionary={dictionary.auth}
        token={token}
        mode="email-change"
      />
    </AccessPanel>
  )
}
