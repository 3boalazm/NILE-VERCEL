import { describe, expect, it } from "vitest"

import { MECS_BRANCHES, MECS_CARRIER, MECS_RATE_CARD, mecsTelHref } from "./mecs"

/**
 * The MECS branch locator ships real customer-facing addresses/phones — data
 * integrity here is not cosmetic: a branch without an address or with a
 * malformed phone renders a dead card on the shipping page.
 */
describe("MECS carrier branches (official mecs-eg.com data)", () => {
  it("exposes the carrier identity used across checkout and the shipping page", () => {
    expect(MECS_CARRIER.nameAr).toBe("شركة ميدل ايست لكوريير سيرفيس")
    expect(MECS_CARRIER.nameEn).toBe("Middle East Courier Service (MECS)")
    expect(MECS_CARRIER.website).toBe("https://mecs-eg.com")
  })

  it("covers a national network — 20+ governorates, 40+ branches", () => {
    expect(MECS_BRANCHES.length).toBeGreaterThanOrEqual(20)
    const total = MECS_BRANCHES.reduce((sum, group) => sum + group.branches.length, 0)
    expect(total).toBeGreaterThanOrEqual(40)
  })

  it("every branch has a non-empty name and address", () => {
    for (const group of MECS_BRANCHES) {
      for (const branch of group.branches) {
        expect(branch.name.trim().length, `${group.governorateEn}/${branch.name} name`).toBeGreaterThan(0)
        expect(branch.address.trim().length, `${group.governorateEn}/${branch.name} address`).toBeGreaterThan(0)
      }
    }
  })

  it("every phone is an Egyptian local-format number a tel: link can carry", () => {
    for (const group of MECS_BRANCHES) {
      for (const branch of group.branches) {
        for (const phone of branch.phones) {
          expect(phone, `${group.governorateEn}/${branch.name} phone`).toMatch(/^0\d{8,10}$/)
        }
      }
    }
  })

  it("no duplicate branch names inside a governorate", () => {
    for (const group of MECS_BRANCHES) {
      const names = group.branches.map((branch) => branch.name)
      expect(new Set(names).size, group.governorateEn).toBe(names.length)
    }
  })

  it("governorate labels exist in both languages", () => {
    for (const group of MECS_BRANCHES) {
      expect(group.governorateAr.trim().length).toBeGreaterThan(0)
      expect(group.governorateEn.trim().length).toBeGreaterThan(0)
    }
  })

  it("every branch carries an Arabic address (client's 2026 sheets)", () => {
    for (const group of MECS_BRANCHES) {
      for (const branch of group.branches) {
        expect(branch.addressAr.trim().length, `${group.governorateEn}/${branch.name} addressAr`).toBeGreaterThan(0)
        expect(branch.addressAr, `${group.governorateEn}/${branch.name} should be Arabic`).toMatch(/[\u0600-\u06FF]/)
      }
    }
  })

  it("Assiut 2 uses the 2026 sheet's mobile number", () => {
    const assiut = MECS_BRANCHES.find((group) => group.governorateEn === "Assiut")
    const assiut2 = assiut?.branches.find((branch) => branch.name.startsWith("أسيوط 2"))
    expect(assiut2?.phones).toContain("01221535896")
  })

  it("rate card: 2026 ladder with the client's official coverage split", () => {
    const tiers = MECS_RATE_CARD.destinationTiersEGP
    expect(tiers.map((tier) => tier.priceEGP)).toEqual([75, 80, 85, 90, 95, 105, 120, 170, 400, 550, 1400])
    // Cairo row confirmed; 80 was never assigned in the client's split
    expect(tiers[0].pendingCoverage).toBe(false)
    expect(tiers[1]).toMatchObject({ priceEGP: 80, pendingCoverage: true })
    expect(tiers.filter((tier) => tier.priceEGP !== 80).every((tier) => !tier.pendingCoverage)).toBe(true)
    // spot-check the split the client delivered in writing
    const at = (price: number) => tiers.find((tier) => tier.priceEGP === price)?.coverageAr ?? ""
    expect(at(85)).toContain("الدلتا")
    expect(at(90)).toContain("العين السخنة")
    expect(at(1400)).toContain("المناطق النائية")
    expect(at(550)).toContain("مرسى علم")
    expect(MECS_RATE_CARD.baseWeightKg).toBe(1)
    expect(MECS_RATE_CARD.extraPerKgEGP).toEqual({ greaterCairoAlexandriaDeltaCanal: 15, restOfEgypt: 17 })
  })

  it("address pickup/delivery fees (+30/+35) are door-to-door add-ons the store absorbs", () => {
    // Client confirmed 2026-09-24: NOT waiting/refusal fees.
    expect(MECS_RATE_CARD.addressPickupDeliveryFeeEGP).toEqual({
      greaterCairoAlexandriaCanalCities: 30,
      restOfEgypt: 35,
    })
    expect(MECS_RATE_CARD.collectionReturnFeesEGP[0]).toBe(50)
  })

  it("mecsTelHref builds international tel: links (one leading 0 dropped)", () => {
    expect(mecsTelHref("0227762827")).toBe("tel:+20227762827")
    expect(mecsTelHref("01000130156")).toBe("tel:+201000130156")
  })

  it("the head office and the client's own neighbourhood branch (El Obour) are listed", () => {
    const cairo = MECS_BRANCHES.find((group) => group.governorateEn === "Cairo")
    expect(cairo?.branches.some((branch) => branch.name.includes("Head Office"))).toBe(true)
    const qalyubia = MECS_BRANCHES.find((group) => group.governorateEn === "Qalyubia")
    expect(qalyubia?.branches.some((branch) => branch.name.includes("Obour"))).toBe(true)
  })
})
