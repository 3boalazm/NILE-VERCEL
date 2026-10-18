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
    <Reveal className="ngc-stack" style={{ ["--ngc-gap" as string]: "28px" }}>
      <section className="ngc-stack" style={{ ["--ngc-gap" as string]: "16px" }}>
        <h1 className="ngc-title ngc-title-sm">{dictionary.auth.profileTitle}</h1>
        <ProfileForm locale={locale} customer={customer} dictionary={dictionary.auth} />
      </section>

      {/* F-63: password rotation for signed-in users (previously only the
          email-token reset flow existed). */}
      <section className="ngc-panel ngc-stack" style={{ ["--ngc-gap" as string]: "16px" }} aria-labelledby="change-password-heading">
        <h2 id="change-password-heading" className="ngc-h2">
          {dictionary.auth.changePasswordTitle}
        </h2>
        <ChangePasswordForm locale={locale} dictionary={dictionary.auth} />
      </section>

      {/* F-58: GDPR erasure intake — danger zone, last on the page on
          purpose so it cannot be hit by a stray tap. */}
      <section className="ngc-stack" style={{ ["--ngc-gap" as string]: "12px" }} aria-labelledby="delete-account-heading">
        <h2 id="delete-account-heading" className="ngc-h2" style={{ color: "var(--ng-danger)" }}>
          {dictionary.auth.deleteAccountTitle}
        </h2>
        <DeleteAccountForm locale={locale} dictionary={dictionary.auth} />
      </section>
    </Reveal>
  )
}
