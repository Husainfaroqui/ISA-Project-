import { describe, expect, it } from "vitest";
import { manuscriptsForScholar, validateManuscripts, verifiedManuscripts } from "../src/data/manuscripts";

describe("local manuscript archive", () => {
  it("has complete, traceable and HTTPS-only metadata", () => { expect(validateManuscripts()).toEqual([]); });
  it("associates the QDL item only with the scholar whose work it comments on", () => {
    const khwarizmi = manuscriptsForScholar("al-khwarizmi");
    expect(khwarizmi).toHaveLength(1);
    expect(khwarizmi[0]).toMatchObject({ materialType: "later_commentary_copy", catalogueReference: "Delhi Arabic 1897, ff. 1r–124v", language: "Arabic" });
    expect(manuscriptsForScholar("banu-musa")).toEqual([]);
  });
  it("publishes only real source-linked image records", () => {
    expect(verifiedManuscripts().map(m => m.id)).toEqual(["qdl-delhi-arabic-1897-khuzai-algebra-commentary"]);
    expect(verifiedManuscripts()[0].imageUrl).toContain("iiif.qdl.qa/iiif/images/");
  });
});
