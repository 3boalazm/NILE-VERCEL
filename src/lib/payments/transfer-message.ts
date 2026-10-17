/**
 * Builds the pre-filled WhatsApp transfer-confirmation message from the
 * ACTUAL order facts (order number, localized payment-method label, formatted
 * total). Pure string interpolation — no fetching, no mutation, no state: the
 * result only ever becomes a wa.me link's encoded `text` parameter, so it can
 * never mark a payment PAID. Settlement stays an admin verification step.
 *
 * Templates come from the project dictionary (`checkout.whatsappTransfer*`),
 * one per locale, with `{orderNumber}` / `{paymentMethod}` / `{orderTotal}`
 * placeholders. The checkout-stage template has no order yet — any line whose
 * placeholders cannot be filled is dropped rather than rendered half-empty.
 */
export function buildTransferConfirmationMessage(
  template: string,
  vars: { orderNumber?: string; paymentMethod: string; orderTotal: string }
): string {
  const lines = template.split("\n")
  const filled = lines.filter((line) => {
    if (!line.includes("{orderNumber}")) return true
    return Boolean(vars.orderNumber)
  })
  return filled
    .map((line) =>
      line
        .replace("{orderNumber}", vars.orderNumber ?? "")
        .replace("{paymentMethod}", vars.paymentMethod)
        .replace("{orderTotal}", vars.orderTotal)
    )
    .join("\n")
    .trim()
}
