// Vitest-only stub for `next/headers` (see vitest.config.ts) — an
// in-memory cookie jar + header map so Server Actions under test can run
// outside a real request scope. Tests reach the `__`-prefixed helpers via
// a direct relative import; app code keeps importing "next/headers" and
// resolves to this same module instance through the alias.

type CookieEntry = { value: string }

const jar = new Map<string, CookieEntry>()
const headerMap = new Map<string, string>()

export async function cookies() {
  return {
    get: (name: string): CookieEntry | undefined => jar.get(name),
    set: (name: string, value: string): void => {
      jar.set(name, { value })
    },
    delete: (name: string): void => {
      jar.delete(name)
    },
  }
}

export async function headers() {
  return {
    get: (name: string): string | null => headerMap.get(name.toLowerCase()) ?? null,
  }
}

export function __resetTestTransport(): void {
  jar.clear()
  headerMap.clear()
}

export function __setTestCookie(name: string, value: string): void {
  jar.set(name, { value })
}

export function __getTestCookie(name: string): string | undefined {
  return jar.get(name)?.value
}

export function __setTestHeader(name: string, value: string): void {
  headerMap.set(name.toLowerCase(), value)
}
