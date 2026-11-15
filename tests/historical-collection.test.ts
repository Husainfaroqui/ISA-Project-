import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SAMPLE } from "../src/data/sample";
import { historicalCollectionHtml } from "../src/data/historical-collection";

describe("historical visual archive", () => {
  it("renders locally stored, source-linked historical images for every current scholar", () => {
    expect(SAMPLE).toHaveLength(18);
    for (const scholar of SAMPLE) {
      const html = historicalCollectionHtml(scholar, "en");
      expect(html, scholar.slug).toContain("scholar-visual-archive");
      expect(html, scholar.slug).toContain("scholar-artifact");
      expect(html, scholar.slug).toContain("Source and rights record");
      expect(html, scholar.slug).not.toMatch(/src="\/images\/ill-/);
      const paths = [...html.matchAll(/src="(\/images\/scholars\/[^\"]+)"/g)].map(match => match[1]);
      expect(paths.length, scholar.slug).toBeGreaterThan(0);
      for (const path of paths) expect(existsSync(`public${path}`), `${scholar.slug}: ${path}`).toBe(true);
      expect(html, scholar.slug).toMatch(/alt="[^"]{10,}"/);
      expect(html, scholar.slug).toMatch(/https:\/\/(commons\.wikimedia\.org|archive\.org)\//);
    }
  });

  it("keeps the Dargah image out of the Aala Hazrat visual archive", () => {
    const html = historicalCollectionHtml(SAMPLE.find(s => s.slug === "ahmad-raza-khan")!, "en");
    expect(html).toContain("radd-ur-rafaza-1902.jpg");
    expect(html).toContain("Radd-ur-Rafaza");
    expect(html).not.toMatch(/dargah|dargah-arch/i);
  });

  it("labels contextual images and keeps translated headings available", () => {
    const contextual = SAMPLE.find(s => s.slug === "al-farghani")!;
    expect(historicalCollectionHtml(contextual, "en")).toContain("Context image from a related historical scholarly tradition");
    expect(historicalCollectionHtml(contextual, "ur")).toContain("بصری آرکائیو");
    expect(historicalCollectionHtml(contextual, "ar")).toContain("الأرشيف البصري");
  });
});
