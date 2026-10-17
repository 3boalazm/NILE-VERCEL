import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"

import { isValidLocale, type Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { requireActiveCustomer, getActiveCustomerAddresses } from "@/lib/auth/active-customer"
import { AddressesList } from "@/components/npf/addresses-list"
import { Reveal } from "@/components/npf/motion/reveal"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/account/addresses">): Promise<Metadata> {
  const { locale: localeParam } = await params
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "ar"
  return { title: getDictionary(locale).auth.addressesTitle, robots: { index: false, follow: false } }
}

export default async function AccountAddressesPage({ params }: PageProps<"/[locale]/account/addresses">) {
  const { locale: localeParam } = await params
  if (!isValidLocale(localeParam)) notFound()
  const locale: Locale = localeParam
  const dictionary = getDictionary(locale)

  const customer = await requireActiveCustomer()
  if (!customer) redirect(`/${locale}/login`)

  const addresses = await getActiveCustomerAddresses()

  return (
    <Reveal>
      <AddressesList locale={locale} dictionary={dictionary.auth} addresses={addresses} />
    </Reveal>
  )
}
