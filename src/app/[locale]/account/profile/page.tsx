import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"

import { isValidLocale, type Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { requireActiveCustomer } from "@/lib/auth/active-customer"
import { ProfileForm } from "@/components/npf/profile-form"
import { ChangePasswordForm } from "@/components/npf/change-password-form"
import { DeleteAccountForm } from "@/components/npf/delete-account-form"
import { Reveal } from "@/components/npf/motion/reveal"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/account/profile">): Promise<Metadata> {
  const { locale: localeParam } = await params
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "ar"
  return { title: getDictionary(locale).auth.profileTitle, robots: { index: false, follow: false } }
}

export default async function AccountProfilePage({ params }: PageProps<"/[locale]/account/profile">) {
  const { locale: localeParam } = await params
  if (!isValidLocale(localeParam)) notFound()
  const locale: Locale = localeParam
  const dictionary = getDictionary(locale)

  const customer = await requireActiveCustomer()
  if (!customer) redirect(`/${locale}/login`)

  return (
    <Reveal className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-semibold">{dictionary.auth.profileTitle}</h1>
      <ProfileForm locale={locale} customer={customer} dictionary={dictionary.auth} />

      {/* F-63: password rotation for signed-in users (previously only the
          email-token reset flow existed). */}
      <section className="flex flex-col gap-4 border-t border-border pt-6" aria-labelledby="change-password-heading">
        <h2 id="change-password-heading" className="font-heading text-lg font-semibold">
          {dictionary.auth.changePasswordTitle}
        </h2>
        <ChangePasswordForm locale={locale} dictionary={dictionary.auth} />
      </section>

      {/* F-58: GDPR erasure intake — danger zone, last on the page on
          purpose so it cannot be hit by a stray tap. */}
      <section className="flex flex-col gap-4 border-t border-border pt-6" aria-labelledby="delete-account-heading">
        <h2 id="delete-account-heading" className="font-heading text-lg font-semibold text-destructive">
          {dictionary.auth.deleteAccountTitle}
        </h2>
        <DeleteAccountForm locale={locale} dictionary={dictionary.auth} />
      </section>
    </Reveal>
  )
}
