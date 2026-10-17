import type { Metadata } from "next"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import { isValidLocale, type Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { getActiveCustomer } from "@/lib/auth/active-customer"
import { readOrderByCode } from "@/lib/vendure/active-order"
import type { Order } from "@/lib/cart"
import { NPFOrderConfirmation } from "@/components/npf/order-confirmation"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/checkout/confirmation">): Promise<Metadata> {
  const { locale: localeParam } = await params
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "ar"
  // Transactional page carrying a specific customer's order — never indexed
  // (also excluded from sitemap.ts).
  return { title: getDictionary(locale).checkout.confirmation.title, robots: { index: false, follow: false } }
}

export default async function CheckoutConfirmationPage({
  params,
  searchParams,
}: PageProps<"/[locale]/checkout/confirmation">) {
  const { locale: localeParam } = await params
  if (!isValidLocale(localeParam)) notFound()
  const locale: Locale = localeParam
  const dictionary = getDictionary(locale)

  const { order: orderCode } = await searchParams

  // View gate: readOrderByCode() has no ownership check built in (same
  // caveat the account order page documents), and the code sits in the URL
  // — so a guessed or shared code must not render anyone's order. Two
  // ways through, either is sufficient:
  //   1. the httpOnly `npf_last_order` cookie placeOrder sets on success
  //      matches — i.e. this is the browser that just placed the order
  //      (covers guests, who have no account to check against);
  //   2. a signed-in customer whose own order list contains the code
  //      (covers same-account revisits after the cookie expired).
  // Anything else renders the existing empty state, leaking nothing.
  let order: Order | null = null
  if (typeof orderCode === "string" && orderCode) {
    const placedCode = (await cookies()).get("npf_last_order")?.value
    if (placedCode === orderCode) {
      order = await readOrderByCode(orderCode)
    } else {
      const customer = await getActiveCustomer()
      if (customer?.orders.some((owned) => owned.code === orderCode)) {
        order = await readOrderByCode(orderCode)
      }
    }
  }

  return (
    <NPFOrderConfirmation
      locale={locale}
      dictionary={dictionary.checkout.confirmation}
      checkoutDictionary={{
        paymentCod: dictionary.checkout.paymentCod,
        paymentBank: dictionary.checkout.paymentBank,
        paymentBankNote: dictionary.checkout.paymentBankNote,
        paymentCard: dictionary.checkout.paymentCard,
        paymentCardNote: dictionary.checkout.paymentCardNote,
        paymentInstapayCta: dictionary.checkout.paymentInstapayCta,
        paymentInstapay: dictionary.checkout.paymentInstapay,
        paymentVodafone: dictionary.checkout.paymentVodafone,
        copyNumberLabel: dictionary.checkout.copyNumberLabel,
        copyAliasLabel: dictionary.checkout.copyAliasLabel,
        copiedVodafoneLabel: dictionary.checkout.copiedVodafoneLabel,
        copiedInstapayLabel: dictionary.checkout.copiedInstapayLabel,
        transferAmountLabel: dictionary.checkout.transferAmountLabel,
        transferRefRecordedLabel: dictionary.checkout.transferRefRecordedLabel,
        whatsappPendingNote: dictionary.checkout.whatsappPendingNote,
        whatsappReceiptCta: dictionary.checkout.whatsappReceiptCta,
        whatsappTransferTemplate: dictionary.checkout.whatsappTransferTemplate,
        fulfillmentDoorToDoor: dictionary.checkout.fulfillmentDoorToDoor,
        fulfillmentBranchPickup: dictionary.checkout.fulfillmentBranchPickup,
        fulfillmentCompanyPickup: dictionary.checkout.fulfillmentCompanyPickup,
      }}
      order={order}
    />
  )
}
