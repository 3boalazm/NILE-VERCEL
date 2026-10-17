/** Vendure-only configuration. Never imported by a client component. */
export function getEmailTransportConfig(
  env: Record<string, string | undefined> = process.env
) {
  if (env.VENDURE_EMAIL_ENABLED !== "true") return null
  const requireValue = (name: string) => {
    const value = env[name]?.trim()
    if (!value || /[\r\n]/.test(value))
      throw new Error(
        `Valid ${name} is required when VENDURE_EMAIL_ENABLED=true`
      )
    return value
  }
  const host = requireValue("SMTP_HOST"),
    user = requireValue("SMTP_USER"),
    pass = requireValue("SMTP_PASS"),
    from = requireValue("SMTP_FROM")
  const port = Number(env.SMTP_PORT || 587)
  if (
    ![465, 587].includes(port) ||
    !/^[A-Za-z0-9.-]+$/.test(host) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(from)
  )
    throw new Error("Invalid SMTP host, sender or TLS port (465/587)")
  const storefront = new URL(requireValue("STOREFRONT_URL"))
  if (
    storefront.username ||
    storefront.password ||
    storefront.search ||
    storefront.hash ||
    (storefront.protocol !== "https:" &&
      !(env.APP_ENV === "dev" && storefront.protocol === "http:"))
  )
    throw new Error("STOREFRONT_URL must be a public HTTPS URL")
  return {
    host,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: true },
    fromAddress: `"Nile Pharma Food" <${from}>`,
    storefront: storefront.origin,
  }
}
