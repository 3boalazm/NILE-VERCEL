import "server-only"

/**
 * Low-level Shop API transport. Server-only (ADR-006) — the browser never
 * talks to Vendure directly, only through Next.js Server Actions that use
 * this. Session identity is the `vendure-auth-token` bearer token, not
 * Vendure's own cookie (see src/lib/vendure/session.ts for how that token
 * is stored on the Next.js side).
 */

const SHOP_API_URL = process.env.VENDURE_SHOP_API_URL ?? "http://localhost:3001/shop-api"
export const VENDURE_REQUEST_TIMEOUT_MS = 10_000

type VendureRequestErrorCode = "timeout" | "http" | "graphql" | "invalid_response"

export class VendureRequestError extends Error {
  constructor(
    message: string,
    public readonly graphQLErrors?: unknown,
    public readonly status?: number,
    public readonly code?: VendureRequestErrorCode
  ) {
    super(message)
    this.name = "VendureRequestError"
  }
}

export async function vendureRequest<TData>(
  query: string,
  variables: Record<string, unknown> | undefined,
  token: string | undefined
): Promise<{ data: TData; token: string | undefined }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers.Authorization = `Bearer ${token}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), VENDURE_REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(SHOP_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
      signal: controller.signal,
    })

    const nextToken = response.headers.get("vendure-auth-token") ?? token
    let body: { data?: TData; errors?: unknown }
    try {
      body = (await response.json()) as { data?: TData; errors?: unknown }
    } catch (error) {
      throw new VendureRequestError(
        `Vendure Shop API returned invalid JSON (${response.status})`,
        error,
        response.status,
        "invalid_response"
      )
    }

    if (!response.ok || body.errors) {
      throw new VendureRequestError(
        `Vendure Shop API request failed (${response.status})`,
        body.errors,
        response.status,
        body.errors ? "graphql" : "http"
      )
    }

    return { data: body.data as TData, token: nextToken }
  } catch (error) {
    if (controller.signal.aborted) {
      throw new VendureRequestError(
        `Vendure Shop API request timed out after ${VENDURE_REQUEST_TIMEOUT_MS}ms`,
        undefined,
        undefined,
        "timeout"
      )
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}
