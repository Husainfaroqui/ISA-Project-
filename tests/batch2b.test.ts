import { describe, expect, it } from "vitest";
import { SAMPLE } from "../src/data/sample";
import batch2b from "../content/batch-2b.json";

describe("Batch 2B demo integration", () => {
  it("makes every researched profile available with a biography and source-backed records", () => {
    for (const draft of batch2b.scholars) {
      const scholar = SAMPLE.find(x => x.slug === draft.slug);
      expect(scholar, draft.slug).toBeTruthy();
      expect(scholar!.researchDraft, draft.slug).toBe(true);
      expect(scholar!.bios.en?.length, draft.slug).toBeGreaterThan(80);
      expect(scholar!.works.length, draft.slug).toBeGreaterThan(0);
      expect(scholar!.contributions.length, draft.slug).toBeGreaterThan(0);
      expect(scholar!.events.length, draft.slug).toBeGreaterThan(0);
      for (const row of [...scholar!.works, ...scholar!.contributions, ...scholar!.events]) {
        expect(row.refs.length, draft.slug).toBeGreaterThan(0);
        for (const ref of row.refs) expect(ref.url, `${draft.slug}: ${ref.title}`).toMatch(/^https?:\/\//);
      }
    }
  });

  it("keeps all Batch 2B profile and claim content in the review state", () => {
    for (const draft of batch2b.scholars) {
      const scholar = SAMPLE.find(x => x.slug === draft.slug)!;
      expect(scholar.works.every(x => x.status === "under_review"), draft.slug).toBe(true);
      expect(scholar.contributions.every(x => x.label === "under_review"), draft.slug).toBe(true);
    }
  });
});
