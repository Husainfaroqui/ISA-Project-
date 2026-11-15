import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import d from "../content/ala-hazrat.json";
import { SAMPLE } from "../src/data/sample";
import { KINDS, TIERS, LABELS, CONFIDENCE } from "../src/lib/taxonomy";
const srcs = Object.fromEntries(d.sources.map(s => [s.id, s]));
const locatorOk = /^(pp?\.) \d+(–\d+)?(, \d+(–\d+)?)*$/;
describe("Ala Hazrat research ledger: evidence discipline", () => {
  it("ids are unique and every cited source exists", () => {
    const ids = [...d.claims.map(c => c.id), ...d.works.map(w => w.id), ...d.sources.map(s => s.id)];
    expect(new Set(ids).size).toBe(ids.length);
    d.claims.forEach(c => c.sources.forEach(r => expect(srcs[r.id], c.id).toBeDefined()));
    d.works.forEach(w => w.sources.forEach(r => expect(srcs[r.id], w.id).toBeDefined()));
  });
  it("labels and tiers come from the controlled vocabulary", () => {
    d.claims.forEach(c => { expect(LABELS as readonly string[], c.id).toContain(c.label); expect(Object.keys(TIERS), c.id).toContain(c.tier); });
    d.sources.forEach(s => expect(Object.keys(TIERS)).toContain(s.tier));
    d.contributions.forEach(c => { expect(Object.keys(KINDS)).toContain(c.kind); expect(CONFIDENCE as readonly string[]).toContain(c.confidence); });
  });
  it("NO claim is VERIFIED or PRIMARY SOURCE yet (needs two independent sources incl. academic/archival, and a read source)", () => {
    d.claims.forEach(c => expect(["VERIFIED", "PRIMARY SOURCE"], c.id).not.toContain(c.label));
  });
  it("page locators exist only for sources that were actually read", () => {
    [...d.claims.flatMap(c => c.sources), ...d.works.flatMap(w => w.sources), ...d.contributions.flatMap(c => c.refs.map(r => ({ id: r.source, locator: r.locator })))].forEach(r => {
      if (r.locator) { expect(srcs[r.id].read, r.id).toBe(true); expect(r.locator).toMatch(locatorOk); }
    });
  });
  it("sourceless claims are only unverified leads or drafted modern assessments that need an expert citation", () => {
    d.claims.filter(c => c.sources.length === 0).forEach(c => { expect(["UNVERIFIED", "MODERN SCIENTIFIC ASSESSMENT"], c.id).toContain(c.label); expect(c.needs, c.id).toBeTruthy(); });
  });
  it("community/traditional-only claims are never labeled above UNDER REVIEW/UNVERIFIED", () => {
    d.claims.filter(c => ["community_devotional", "later_traditional"].includes(c.tier)).forEach(c => expect(["UNDER REVIEW", "UNVERIFIED"], c.id).toContain(c.label));
  });
  it("work-level manuscript and original-title leads remain sourced and under review", () => {
    d.works.forEach(w => {
      expect(w.authorship_status).toBe("under_review"); expect(Object.keys(w)).not.toContain("isbn");
      if (w.original_script_title || w.manuscripts !== "none identified") expect(w.sources.some(r => srcs[r.id]?.read)).toBe(true);
    });
    expect(d.works.find(w => w.id === "W-008")?.year).toContain("unverified");
  });
  it("contributions never claim invention/discovery and respect the DB constraints", () => {
    d.contributions.forEach(c => { expect(["original_invention", "original_discovery"]).not.toContain(c.kind); expect(c.label).toBe("under_review"); });
  });
  it("the earth-motion work states the modern assessment alongside the historical argument", () => {
    const fauz = d.contributions.find(c => c.title.includes("Fauz"))!;
    expect(fauz.text).toMatch(/Earth rotates and orbits the Sun/); expect(d.claims.some(c => c.id === "M-001")).toBe(true);
  });
  it("the app's Ala Hazrat entry is built from the ledger and flagged as a draft, not verified", () => {
    const s = SAMPLE.find(x => x.slug === "ahmad-raza-khan")!;
    expect(s.researchDraft).toBe(true); expect(s.contributions).toHaveLength(2); expect(s.works).toHaveLength(8);
    expect(s.bios.en).toContain("Dars-i Nizami"); expect(s.bios.en).toContain("Kanz al-Iman");
    expect(s.bios.en).toContain("does not endorse their physical conclusions");
    expect(s.bios.en).toContain("before age fourteen");
    const firstFatwa = d.claims.find(c => c.id === "C-032")!;
    expect(firstFatwa.label).toBe("UNDER REVIEW");
    expect(firstFatwa.tier).toBe("primary");
    expect(firstFatwa.sources.map(r => r.id)).toEqual(["S10", "S11"]);
    expect(d.sources.find(x => x.id === "S10")?.notes).toContain("spelled out in the same passage as 86");
    s.contributions.forEach(c => { expect(c.label).toBe("under_review"); c.refs.forEach(r => expect(r.locator).toBeTruthy()); });
    s.works.forEach(w => expect(w.status).toBe("under_review"));
    expect(s.events.map(e => e.id)).toContain("E-013");
    expect(s.events.find(e => e.id === "E-011")?.refs.map(r => r.author)).toEqual(["Usha Sanyal", "Usha Sanyal"]);
    expect(s.works.find(w => w.title.includes("Fatawa-e Rizwiyya"))?.refs[0].locator).toBe("pp. 71–72");
    expect(s.works.find(w => w.title.includes("Kashf al-ʿIllah"))?.refs.map(r => r.locator)).toEqual([undefined, undefined]);
  });
  it("generated files are in sync with the ledger", () => {
    const md = readFileSync(new URL("../docs/ALA_HAZRAT_DOSSIER_DRAFT.md", import.meta.url), "utf8"), sql = readFileSync(new URL("../supabase/content/ala_hazrat_draft.sql", import.meta.url), "utf8");
    d.claims.forEach(c => expect(md).toContain(c.id)); d.works.forEach(w => expect(sql).toContain(w.title.replace(/'/g, "''"))); expect(sql).toContain("'draft'"); expect(sql).not.toMatch(/status\s*=\s*'published'|'published'/);
  });
});

