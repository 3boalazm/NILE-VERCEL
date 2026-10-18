import { describe, expect, it } from "vitest";
import { careAtlasImage } from "./presentation";

describe("Care Atlas original product imagery", () => {
  it("uses the real-package crop for an existing checked-in source photograph", () => {
    expect(
      careAtlasImage({
        slug: "proxeed-plus",
        image: "/products/proxeed-plus-hero.webp",
      }),
    ).toBe("/care-atlas/packs/proxeed-plus.webp");
  });
  it("respects a CMS media replacement instead of silently showing an outdated pack", () => {
    expect(
      careAtlasImage({ slug: "proxeed-plus", image: "/media/new-pack.webp" }),
    ).toBe("/media/new-pack.webp");
  });
  it("does not invent imagery for a missing photo or unknown product", () => {
    expect(careAtlasImage({ slug: "proxeed-plus", image: null })).toBeNull();
    expect(
      careAtlasImage({ slug: "new-product", image: "/products/new.webp" }),
    ).toBe("/products/new.webp");
  });
});

describe("sortForListing", () => {
  it("puts the supplement family first, devices last, unknown slugs after known ones in input order", async () => {
    const { sortForListing } = await import("./presentation");
    const input = ["ca-mi-ir-thermometer", "zzz-new", "proxerex", "proxeed-plus", "aaa-new", "proxeed-men"].map((slug) => ({ slug }));
    expect(sortForListing(input).map((p) => p.slug)).toEqual([
      "proxeed-plus", "proxeed-men", "proxerex", "ca-mi-ir-thermometer", "zzz-new", "aaa-new",
    ]);
  });
});
