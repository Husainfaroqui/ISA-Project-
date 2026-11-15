import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parse } from "../src/lib/router";
import { mapRow } from "../src/lib/repo";
import { KINDS, TIERS, LABELS, CONFIDENCE } from "../src/lib/taxonomy";
import { contributionHtml } from "../src/pages/contribution";
import type { Scholar, Contribution } from "../src/lib/types";
const sql = (f: string) => readFileSync(new URL("../supabase/migrations/" + f, import.meta.url), "utf8");
const enumVals = (text: string, name: string) => [...text.match(new RegExp(`create type ${name} as enum \\(([^)]*)\\)`))![1].matchAll(/'(\w+)'/g)].map(m => m[1]);
const UUID = "11111111-2222-3333-4444-555555555555";
const scholar: Scholar = { slug: "x", names: { en: "X" }, region: "R", period: "early", disciplines: [], bios: {}, works: [], contributions: [], events: [], relations: [], sample: false };
const contrib: Contribution = { id: UUID, text: "<b>expl</b>", label: "under_review", lang: "en", title: "T & <i>", kind: "technical_improvement", confidence: "medium", discipline: "Optics", periodText: "c. test", priorState: "before", detail: "detail",
  refs: [{ title: "Src", author: "A", url: "https://e.org", locator: "p.4", tier: "academic_research" }, { title: "NoLoc", url: "javascript:alert(1)" }] };
describe("phase 3 routing", () => {
  it("parses contribution and method routes", () => {
    expect(parse(`/en/scholars/al-biruni/contributions/${UUID}`)).toEqual({ lang: "en", name: "contribution", slug: "al-biruni", id: UUID });
    expect(parse("/ar/method")?.name).toBe("notfound");
    expect(parse("/en/scholars/x/contributions/not-a-uuid")?.name).toBe("notfound");
    expect(parse("/ur/scholars/x/contributions/")?.name).toBe("notfound");
  });
});
describe("taxonomy matches the SQL enums", () => {
  const m6 = sql("0006_contribution_layer.sql");
  it("contribution kinds", () => expect(Object.keys(KINDS).sort()).toEqual(enumVals(m6, "contribution_kind").sort()));
  it("evidence tiers", () => expect(Object.keys(TIERS).sort()).toEqual(enumVals(m6, "evidence_tier").sort()));
  it("TypeScript Label type lists every SQL label", () => {
    const ts = readFileSync(new URL("../src/lib/types.ts", import.meta.url), "utf8"); const sqlLabels = [...enumVals(sql("0001_core_schema.sql"), "verif_label"), ...[...m6.matchAll(/add value if not exists '(\w+)'/g)].map(m => m[1])];
    sqlLabels.forEach(l => expect(ts).toContain(`"${l}"`));
  });
  it("editorial labels (8)", () => {
    const sqlLabels = [...enumVals(sql("0001_core_schema.sql"), "verif_label"), ...[...m6.matchAll(/add value if not exists '(\w+)'/g)].map(m => m[1])];
    expect(LABELS.map(l => l.toLowerCase().replace(" scientific", "").replace(/ /g, "_")).sort()).toEqual(sqlLabels.sort());
  });
  it("confidence vocabulary matches the CHECK constraint", () => expect([...m6.match(/confidence in \(([^)]*)\)\)/)![1].matchAll(/'(\w+)'/g)].map(x => x[1])).toEqual([...CONFIDENCE]));
  it("all 10 classes and 7 tiers have definitions", () => { expect(Object.keys(KINDS)).toHaveLength(10); expect(Object.keys(TIERS)).toHaveLength(7); Object.values({ ...KINDS, ...TIERS }).forEach(([a, b]) => { expect(a).toBeTruthy(); expect(b.length).toBeGreaterThan(20); }); });
});
describe("contribution mapping and rendering", () => {
  it("maps the new contribution fields and evidence tier", () => {
    const s = mapRow({ slug: "y", region: "R", period_group: "early", contributions: [{ id: UUID, description: "d", label: "verified", lang: "en", title: "T", kind: "original_discovery", confidence: "high", period_text: "p", prior_state: "b", detail: "x", discipline: { name_en: "Optics" }, claim_sources: [{ locator: "f.2r", evidence_tier: "primary", sources: { title: "S", author: null, url: null } }] }] });
    expect(s.contributions[0]).toMatchObject({ id: UUID, kind: "original_discovery", confidence: "high", discipline: "Optics", periodText: "p", priorState: "b", detail: "x", title: "T" });
    expect(s.contributions[0].refs[0]).toMatchObject({ locator: "f.2r", tier: "primary" });
  });
  it("renders fields and citations without public confidence or evidence-tier labels", () => {
    const h = contributionHtml(scholar, contrib, "en");
    expect(h).toContain("TECHNICAL IMPROVEMENT"); expect(h).not.toContain("CONFIDENCE"); expect(h).toContain("What existed before"); expect(h).toContain("p.4"); expect(h).not.toContain("Academic historical research");
    expect(h).not.toContain("locator not verified"); expect(h).not.toContain("<b>expl</b>"); expect(h).toContain("&lt;b&gt;expl"); expect(h).not.toContain("javascript:"); expect(h).toContain('href="/en/scholars/x"');
  });
  it("omits empty optional fields and does not show editorial translation warnings", () => {
    const h = contributionHtml(scholar, { id: UUID, text: "t", label: "under_review", lang: "en", refs: [] }, "ur");
    expect(h).not.toContain("What existed before"); expect(h).not.toContain("ترجمہ"); expect(h).toContain("<h1>t</h1>");
  });
  it("does not expose a public methodology or verification page", () => {
    const header = readFileSync(new URL("../src/pages/header.html", import.meta.url), "utf8"), home = readFileSync(new URL("../src/pages/home.html", import.meta.url), "utf8");
    expect(parse("/en/method")?.name).toBe("notfound"); expect(header).not.toContain("/method"); expect(home).not.toContain("UNDER REVIEW"); expect(home).not.toContain("VERIFIED");
  });
});
