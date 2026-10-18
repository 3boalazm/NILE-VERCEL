import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("editorial assets and original brand mark", () => {
  it("uses only the original symbol path, not the embedded wordmark or new AI artwork", () => {
    const original = readFileSync("public/npf-logo-white.svg", "utf8");
    const mark = readFileSync("public/npf-mark-white.svg", "utf8");
    const symbol = original.match(/d="(m215\.21,86\.15[^\"]+)"/)?.[1];
    expect(symbol).toBeTruthy();
    expect(mark).toContain(`d="${symbol}"`);
    expect(mark.match(/<path\b/g)).toHaveLength(1);
    expect(mark).not.toMatch(/<text\b|<image\b/);
  });
  it("ships four optimized real JPEG files rather than raw generation outputs", () => {
    for (const file of [
      "about-garden",
      "story-courtyard",
      "quality-materials",
      "contact-conversation",
    ]) {
      const path = `public/care-atlas/editorial/${file}.jpg`;
      expect([...readFileSync(path).subarray(0, 3)]).toEqual([255, 216, 255]);
      expect(statSync(path).size).toBeLessThan(300_000);
    }
  });
});
