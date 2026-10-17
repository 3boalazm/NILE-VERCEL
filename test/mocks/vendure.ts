import { vi } from "vitest"

/**
 * Replaces global.fetch with a scripted Vendure Shop API: each handler is
 * keyed by an operation-name substring (e.g. "AddItemToOrder") matched
 * against the request's GraphQL query, and returns the `data` payload.
 * Every call is recorded (query + variables) for assertions on mutation
 * sequences and inputs. Unhandled operations fail loudly — a test that
 * triggers an unexpected Vendure call is a test worth hearing about.
 */

export type VendureHandler = (variables: Record<string, unknown>) => unknown

export type VendureCall = { query: string; variables: Record<string, unknown> }

export function mockVendureFetch(
  handlers: Record<string, VendureHandler>,
  options?: { token?: string }
): VendureCall[] {
  const calls: VendureCall[] = []
  global.fetch = vi.fn(async (_url: unknown, init?: { body?: unknown }) => {
    const body = JSON.parse(String(init?.body ?? "{}")) as {
      query: string
      variables?: Record<string, unknown>
    }
    calls.push({ query: body.query, variables: body.variables ?? {} })
    const key = Object.keys(handlers).find((operation) => body.query.includes(operation))
    if (!key) throw new Error(`Unhandled Vendure operation in test: ${body.query.slice(0, 120)}`)
    const data = handlers[key](body.variables ?? {})
    return {
      ok: true,
      headers: {
        get: (name: string) =>
          name === "vendure-auth-token" ? (options?.token ?? null) : null,
      },
      json: async () => ({ data }),
    }
  }) as unknown as typeof fetch
  return calls
}

/** Every Shop API call throws — simulates Vendure down / unreachable. */
export function mockVendureDown(): void {
  global.fetch = vi.fn(async () => {
    throw new Error("fetch failed")
  }) as unknown as typeof fetch
}

export function operationNames(calls: VendureCall[]): string[] {
  return calls.map((call) => {
    const match = call.query.match(/(query|mutation)\s+(\w+)/)
    return match ? match[2] : "<unknown>"
  })
}
