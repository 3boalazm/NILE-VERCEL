import { notFound } from "next/navigation"
import type { Metadata } from "next"

import { isValidLocale, type Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { NPFForgotPasswordForm } from "@/components/npf/forgot-password-form"
import { Reveal } from "@/components/npf/motion/reveal"
import { buildPageMetadata } from "@/lib/seo/page-metadata"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/login/forgot-password">): Promise<Metadata> {
  const { locale: localeParam } = await params
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "ar"
  const dictionary = getDictionary(locale)
  return buildPageMetadata({
    locale,
    path: "/login/forgot-password",
    title: dictionary.auth.forgotPasswordTitle,
    description: dictionary.auth.forgotPasswordSubtitle,
    // Transactional account-recovery page — never indexed.
    noIndex: true,
  })
}

/**
 * Password recovery, step 1 (F-04).
 *
 * Lives under `/login/forgot-password` rather than at the top level so it
 * inherits the auth flow's place in the site structure, and so the login page
 * can link to it as a sibling. The reset form itself (step 2) is a separate
 * route because it is reached from an emailed link carrying a token, not from
 * in-app navigation.
 */
export default async function ForgotPasswordPage({
  params,
}: PageProps<"/[locale]/login/forgot-password">) {
  const { locale: localeParam } = await params
  if (!isValidLocale(localeParam)) notFound()
  const locale: Locale = localeParam
  const dictionary = getDictionary(locale)

  return (
    <section className="bg-anti-flash-white dark:bg-card">
      <Reveal className="mx-auto flex max-w-md flex-col gap-6 px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-heading text-2xl font-semibold">{dictionary.auth.forgotPasswordTitle}</h1>
          <p className="text-sm text-muted-foreground">{dictionary.auth.forgotPasswordSubtitle}</p>
        </div>
        <div className="rounded-2xl border border-border bg-background p-6">
          <NPFForgotPasswordForm locale={locale} dictionary={dictionary.auth} />
        </div>
      </Reveal>
    </section>
  )
}
