import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import b from "../content/batch-2a.json";
import { SAMPLE } from "../src/data/sample";
import { mapRow } from "../src/lib/repo";
import { KINDS, TIERS, LABELS, EVENT_TYPES, RELATIONS, CERTAINTIES } from "../src/lib/taxonomy";
import { relationsHtml } from "../src/pages/relations";
import { eventItemHtml } from "../src/pages/timeline";
import { contributionHtml } from "../src/pages/contribution";
import { L } from "../src/lib/i18n";
const src = Object.fromEntries(b.sources.map(s => [s.id, s]));
const sqlText = readFileSync(new URL("../supabase/migrations/0008_scholar_relationships.sql", import.meta.url), "utf8");
const locOk = /^(§\d+(\.\d+)?|entry: [A-Za-z0-9 .,'’()–\/:-]+)$/;
const allRefs = [...b.claims.flatMap(c => c.sources), ...b.works.flatMap(w => w.sources), ...b.events.flatMap(e => e.sources), ...b.relationships.flatMap(r => r.sources), ...b.contributions.flatMap(c => c.refs.map(r => ({ id: r.source, locator: r.locator })))];
const academicRead = (ids: string[]) => new Set(ids.filter(i => src[i].read && src[i].tier === "academic_research")).size;
describe("Batch 2A ledger: evidence discipline", () => {
  it("ids unique; every cited source exists; vocabularies valid", () => {
    const ids = [...b.claims.map(c => c.id), ...b.works.map(w => w.id), ...b.events.map(e => e.id), ...b.relationships.map(r => r.id), ...b.sources.map(s => s.id)];
    expect(new Set(ids).size).toBe(ids.length); allRefs.forEach(r => expect(src[r.id], r.id).toBeDefined());
    b.claims.forEach(c => { expect(LABELS as readonly string[], c.id).toContain(c.label); expect(Object.keys(TIERS), c.id).toContain(c.tier); });
    b.events.forEach(e => { expect(Object.keys(EVENT_TYPES)).toContain(e.type); expect(CERTAINTIES as readonly string[]).toContain(e.date_certainty); expect(LABELS as readonly string[]).toContain(e.label); });
    b.relationships.forEach(r => expect(Object.keys(RELATIONS)).toContain(r.type));
  });
  it("VERIFIED only where two independent academic sources that were read agree (claims and events)", () => {
    [...b.claims, ...b.events].filter(x => x.label === "VERIFIED").forEach(x => expect(academicRead(x.sources.map(r => r.id)), x.id).toBeGreaterThanOrEqual(2));
    expect(b.claims.filter(c => c.label === "VERIFIED").length).toBeGreaterThan(0);
  });
  it("PRIMARY SOURCE is not used (no primary text was read)", () => [...b.claims, ...b.events].forEach(x => expect(x.label).not.toBe("PRIMARY SOURCE")));
  it("a single source never carries more than ACADEMICALLY SUPPORTED/UNDER REVIEW/DISPUTED/ATTRIBUTION UNCERTAIN", () => {
    [...b.claims, ...b.events].filter(x => x.sources.length === 1).forEach(x => expect(["VERIFIED", "PRIMARY SOURCE"], x.id).not.toContain(x.label));
  });
  it("locators exist only for sources that were read, and are section/entry-level", () => allRefs.forEach(r => { if (r.locator) { expect(src[r.id].read, r.id).toBe(true); expect(r.locator, r.id).toMatch(locOk); } }));
  it("unread sources are never cited as evidence", () => allRefs.forEach(r => expect(src[r.id].read, r.id).toBe(true)));
  it("sourceless claims are only UNVERIFIED leads or drafted modern assessments awaiting an expert citation", () => {
    b.claims.filter(c => c.sources.length === 0).forEach(c => { expect(["UNVERIFIED", "MODERN SCIENTIFIC ASSESSMENT"], c.id).toContain(c.label); expect(c.needs, c.id).toBeTruthy(); });
  });
  it("popular-web claims about the Banu Musa are recorded as UNVERIFIED and not used", () => { const c = b.claims.find(x => x.id === "B-12")!; expect(c.label).toBe("UNVERIFIED"); expect(c.sources).toEqual([]); expect(b.contributions.every(x => !/gas mask|programmable/i.test(x.text + x.detail))).toBe(true); });
  it("documented disagreements are preserved as DISPUTED, not silently resolved", () => ["K-01", "K-02", "K-06", "K-12", "K-17", "Q-09"].forEach(id => expect(b.claims.find(c => c.id === id)!.label, id).toBe("DISPUTED")));
  it("every cited academic-but-single-source scholar claim names its source count honestly (Banu Musa and al-Kindi stay single-source)", () => {
    b.claims.filter(c => c.scholar !== "al-khwarizmi" && c.sources.length).forEach(c => expect(new Set(c.sources.map(s => s.id)).size, c.id).toBe(1));
  });
});
describe("Batch 2A: works, contributions, events, relationships", () => {
  it("no invented bibliographic data", () => b.works.forEach(w => { expect(w.original_script_title).toBeNull(); expect(["academically_supported", "attribution_uncertain", "under_review"]).toContain(w.authorship_status); expect(w.sources.length).toBeGreaterThan(0); }));
  it("contributions never claim invention/discovery and obey the DB constraints", () => b.contributions.forEach(c => {
    expect(Object.keys(KINDS)).toContain(c.kind); expect(["original_invention", "original_discovery"]).not.toContain(c.kind); expect(c.label).toBe("under_review"); expect(c.refs.length).toBeGreaterThan(0);
    if (c.kind === "disputed_attribution") expect(["low", "uncertain"]).toContain(c.confidence);
  }));
  it("Banu Musa is modeled as a group; works are attributed only as BEA states", () => {
    const grp = b.scholars.find(s => s.slug === "banu-musa")!; expect(grp.kind).toBe("group");
    expect(b.works.filter(w => w.scholar === "al-hasan-ibn-musa-ibn-shakir")).toEqual([]); expect(b.contributions.filter(c => c.scholar === "al-hasan-ibn-musa-ibn-shakir")).toEqual([]);
    expect(b.works.filter(w => w.scholar === "banu-musa").map(w => w.id)).toEqual(["W-B1", "W-B2", "W-B3"]);
    expect(b.works.filter(w => w.scholar === "ahmad-ibn-musa-ibn-shakir").every(w => w.notes.includes("Reportedly") || w.id === "W-A1")).toBe(true);
    expect(b.works.find(w => w.id === "W-B3")!.authorship_status).toBe("attribution_uncertain");
  });
  it("events: DB constraints mirrored; unsourced events do not exist in this batch", () => b.events.forEach(e => {
    expect(e.year_earliest).toBeLessThanOrEqual(e.year_latest); if (e.date_certainty === "exact") expect(e.year_earliest).toBe(e.year_latest); if (e.date_certainty === "disputed") expect(e.date_note).toBeTruthy();
    expect(e.sources.length, e.id).toBeGreaterThan(0);
  }));
  it("approximate dates stay approximate (no exact year without a source that states it)", () => b.events.filter(e => e.type === "birth" || e.type === "death").forEach(e => { if (e.id !== "E-M1") expect(e.date_certainty).toBe("approximate"); }));
  it("relationships: member_of links an individual to a group, each sourced, no inference from proximity", () => {
    const kind = Object.fromEntries(b.scholars.map(s => [s.slug, s.kind]));
    b.relationships.forEach(r => { expect(r.type).toBe("member_of"); expect(kind[r.scholar]).toBe("individual"); expect(kind[r.related]).toBe("group"); expect(r.sources.length).toBeGreaterThan(0); });
    expect(b.relationships).toHaveLength(3); expect(b.leads.join(" ")).toContain("Thabit ibn Qurra");
  });
  it("migration 0008 enforces sourcing, privacy and group rules", () => ["every relationship needs a source", "must keep a source", "member_of must link an individual scholar to a group scholar", "a.status = 'published' and b.status = 'published'", "pub_read on scholar_relationships", "no_self_relation"].forEach(x => expect(sqlText).toContain(x)));
});
describe("Batch 2A in the app", () => {
  const find = (slug: string) => SAMPLE.find(s => s.slug === slug)!;
  it("all six records exist as research drafts (not sample, not published)", () => b.scholars.forEach(sc => { const s = find(sc.slug); expect(s.researchDraft, sc.slug).toBe(true); expect(s.sample).toBe(false); expect(s.names.en).toBe(sc.name_en); }));
  it("relations are recorded on both sides with the right direction", () => {
    const g = find("banu-musa"), m = find("muhammad-ibn-musa-ibn-shakir");
    expect(g.relations.filter(r => r.direction === "in")).toHaveLength(3); expect(m.relations).toEqual([expect.objectContaining({ direction: "out", type: "member_of", otherSlug: "banu-musa" })]); expect(find("al-kindi").relations).toEqual([]);
  });
  it("Banu Musa public profile has a sourced collective biography and clickable research references", () => {
    const g = find("banu-musa"), c = g.contributions.find(x => x.id === "54e5d9a4-64b9-47b4-9936-cd5b8cf15244")!;
    expect(g.bios.en).toContain("Muḥammad, Aḥmad, and Ḥasan");
    expect(g.bios.en).toContain("Pingree"); expect(g.bios.en).toContain("Casulleras");
    expect(c.refs.map(r => r.author)).toEqual(["David Pingree", "Josep Casulleras"]);
    expect(c.refs.every(r => r.url?.startsWith("https://"))).toBe(true);
  });
  it("renders relationships and citations without public moderation labels", () => {
    const g = find("banu-musa"), h = relationsHtml(g.relations, "en", r => r.otherName, () => "[1: entry: x]", "none");
    expect(h).toContain("Members include"); expect(h).not.toContain("CONFIDENCE"); expect(h).not.toContain("UNDER REVIEW"); expect(h).toContain("[1: entry: x]"); expect(h).toContain('href="/en/scholars/muhammad-ibn-musa-ibn-shakir"');
    expect(relationsHtml([], "ar", r => r.otherName, () => "", "لا توجد علاقات")).toContain("لا توجد");
    expect(relationsHtml(find("muhammad-ibn-musa-ibn-shakir").relations, "ur", r => "<b>x</b>", () => "", "")).not.toContain("<b>x</b>");
  });
  it("al-Khwarizmi's date range, disputes and events render", () => {
    const k = find("al-khwarizmi"); expect(k.region).toBe("Iraq"); expect(k.dates).toContain("approximate"); expect(k.events.map(e => e.id)).toContain("E-K6");
    expect(eventItemHtml(k.events[0], "en")).toContain("c. 780"); expect(contributionHtml(k, k.contributions[0], "en")).toContain("What existed before");
  });
  it("al-Kindi's disputed work stays attribution_uncertain and its contribution is classed disputed_attribution", () => {
    const q = find("al-kindi"); expect(q.works.find(w => w.title.includes("Rays"))!.status).toBe("attribution_uncertain"); expect(q.contributions.find(c => c.title?.includes("Rays"))!.kind).toBe("disputed_attribution");
  });
  it("maps Supabase relationship rows (both directions)", () => {
    const s = mapRow({ slug: "g", scholar_kind: "group", region: "R", period_group: "early",
      rel_in: [{ id: "r1", relation_type: "member_of", description: "d", confidence: "medium", label: "academically_supported", other: { slug: "m", scholar_translations: [{ lang: "en", name: "M" }] }, claim_sources: [{ locator: "entry: x", evidence_tier: "academic_research", sources: { title: "S", author: "A", url: null } }] }],
      rel_out: [{ id: "r2", relation_type: "teacher_of", confidence: "low", label: "under_review", other: { slug: "o", scholar_translations: [] }, claim_sources: [] }] });
    expect(s.kind).toBe("group"); expect(s.relations).toHaveLength(2); expect(s.relations[1]).toMatchObject({ direction: "in", otherSlug: "m", otherName: "M", refs: [expect.objectContaining({ locator: "entry: x" })] }); expect(s.relations[0]).toMatchObject({ direction: "out", otherName: "o" });
    expect(mapRow({ slug: "q", region: "R", period_group: "early" }).relations).toEqual([]);
  });
  it("new UI keys exist in all three languages", () => ["rel", "rel_none", "grp"].forEach(k => { expect(L.en[k]).toBeTruthy(); expect(L.ur[k]).toBeTruthy(); expect(L.ar[k]).toBeTruthy(); }));
  it("generated SQL and dossier include every work and contain no published status", () => {
    const sql = readFileSync(new URL("../supabase/content/batch_2a_draft.sql", import.meta.url), "utf8"), md = readFileSync(new URL("../docs/BATCH_2A_DOSSIERS_DRAFT.md", import.meta.url), "utf8");
    b.works.forEach(w => expect(sql).toContain(w.title.replace(/'/g, "''"))); b.claims.forEach(c => expect(md).toContain(c.id)); expect(sql).not.toContain("'published'");
  });
});
