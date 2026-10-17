import { afterEach, beforeEach, describe, it, expect } from "vitest"
import {
  __resetTestTransport,
  __setTestCookie,
} from "../../../test/stubs/next-headers"
import { mockVendureDown, mockVendureFetch } from "../../../test/mocks/vendure"
import {
  getActiveCustomer,
  requireActiveCustomer,
  getActiveCustomerAddresses,
} from "./active-customer"
const realFetch = global.fetch
beforeEach(() => {
  __resetTestTransport()
  mockVendureDown()
})
afterEach(() => {
  global.fetch = realFetch
})
describe("account outages are not empty accounts", () => {
  it("doesn't call commerce for an anonymous visitor", async () => {
    expect(await requireActiveCustomer()).toBeNull()
    expect(global.fetch).not.toHaveBeenCalled()
  })
  it("lets the public header degrade but protected routes show a recovery error", async () => {
    __setTestCookie("npf-vendure-token", "session")
    expect(await getActiveCustomer()).toBeNull()
    await expect(requireActiveCustomer()).rejects.toThrow(
      "commerce_temporarily_unavailable"
    )
  })
  it("doesn't render an address service failure as no saved addresses", async () => {
    __setTestCookie("npf-vendure-token", "session")
    await expect(getActiveCustomerAddresses()).rejects.toThrow(
      "commerce_temporarily_unavailable"
    )
  })
  it("still treats an expired session confirmed by the backend as signed out", async () => {
    __setTestCookie("npf-vendure-token", "session")
    mockVendureFetch({ ActiveCustomer: () => ({ activeCustomer: null }) })
    expect(await requireActiveCustomer()).toBeNull()
  })
})
