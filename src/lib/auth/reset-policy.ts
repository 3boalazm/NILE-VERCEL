/** Set only after the deployed Vendure SMTP sender has passed delivery tests.
 * Never expose SMTP credentials to the storefront or browser. */
export function passwordResetEnabled(): boolean {
  return (
    process.env.PASSWORD_RESET_ENABLED === "true" &&
    process.env.NPF_PREVIEW_MODE !== "1"
  )
}
