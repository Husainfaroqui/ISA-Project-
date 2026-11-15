import { describe, it, expect } from "vitest";
import { clientFor, tokens, mint } from "./helpers";
import { createLiveRepo } from "../../src/lib/repo";
import { displayName } from "../../src/lib/search";
const anon = clientFor(tokens.anon), repo = createLiveRepo(anon);
const slugs = async (q = {}) => { const r = await repo.listScholars(q, "en"); if (!r.ok) throw new Error(r.message); return r.data; };
describe("public data layer against a real API (anon)", () => {
  it("lists only published scholars; drafts and unpublished members never appear", async () => {
    const d = await slugs(); expect(d.total).toBe(9);
    const all = [...(await slugs({ page: 1 })).items, ...(await slugs({ page: 2 })).items].map(s => s.slug);
    expect(all).not.toContain("ahmad-raza-khan"); expect(all).not.toContain("al-hasan-ibn-musa-ibn-shakir"); expect(all).toContain("al-kindi");
  });
  it("server-side pagination and ordering (A–Z by slug)", async () => {
    const p1 = await slugs({ page: 1 }), p2 = await slugs({ page: 2 });
    expect(p1.items.map(s => s.slug)).toEqual(["ahmad-ibn-musa-ibn-shakir", "al-khwarizmi", "al-kindi", "banu-musa", "fx-1", "fx-2"]); expect(p2.items.map(s => s.slug)).toEqual(["fx-3", "fx-4", "muhammad-ibn-musa-ibn-shakir"]);
    expect([p1.pages, p2.page, p2.pages]).toEqual([2, 2, 2]);
  });
  it("a page past the end falls back to page 1 instead of failing", async () => { const d = await slugs({ page: 99 }); expect(d.page).toBe(1); expect(d.items).toHaveLength(6); });
  it("sort by period uses the chronological rank, not alphabetical order", async () => {
    const d = await slugs({ s: "period" }); expect(d.items.map(s => s.slug)).toEqual(["ahmad-ibn-musa-ibn-shakir", "al-khwarizmi", "al-kindi", "banu-musa", "muhammad-ibn-musa-ibn-shakir", "fx-1"]);
    expect((await slugs({ s: "period", page: 2 })).items.map(s => s.slug)).toEqual(["fx-2", "fx-3", "fx-4"]);
  });
  it("filters by region, period and discipline (server-side)", async () => {
    expect((await slugs({ r: "Iraq" })).total).toBe(5); expect((await slugs({ r: "South Asia" })).total).toBe(2); expect((await slugs({ p: "classical" })).items.map(s => s.slug)).toEqual(["fx-1", "fx-2"]);
    expect((await slugs({ d: "Optics" })).items.map(s => s.slug)).toEqual(["al-kindi"]); expect((await slugs({ d: "Philosophy" })).total).toBe(4); expect((await slugs({ d: "Medicine", r: "Persia" })).items.map(s => s.slug)).toEqual(["fx-1"]);
    expect((await slugs({ d: "Medicine", r: "Iraq" })).total).toBe(0);
  });
  it("name search is database-side, case-insensitive, and works in Latin, Arabic and Urdu script", async () => {
    expect((await slugs({ q: "kindi" })).items.map(s => s.slug)).toEqual(["al-kindi"]); expect((await slugs({ q: "KINDI" })).total).toBe(1);
    expect((await slugs({ q: "ibn" })).total).toBe(5);
    expect((await slugs({ q: "الخوارزمي" })).items.map(s => s.slug)).toEqual(["al-khwarizmi"]);
    expect((await slugs({ q: "موسى" })).items.map(s => s.slug)).toEqual(["al-khwarizmi"]);   // Arabic alef maksura
    expect((await slugs({ q: "موسی" })).items.map(s => s.slug)).toEqual(["al-khwarizmi"]);   // Persian/Urdu yeh finds the same record
    expect((await slugs({ q: "nobody-here" })).total).toBe(0); expect((await slugs({ q: "100%_x" })).total).toBe(0);
    expect((await slugs({ q: "ibn", r: "Iraq", d: "Astronomy", s: "period" })).total).toBeGreaterThan(0);
  });
  it("Arabic yeh (ي) in a name is searchable with either yeh form (client and database fold identically)", async () => {
    expect((await slugs({ q: "سينا" })).items.map(s => s.slug)).toEqual(["fx-1"]);     // Arabic yeh
    expect((await slugs({ q: "سینا" })).items.map(s => s.slug)).toEqual(["fx-1"]);     // Persian/Urdu yeh
    expect((await slugs({ q: "ابن" })).items.map(s => s.slug)).toEqual(["fx-1"]);
    const r = await repo.getScholar("fx-1"); if (!r.ok) throw new Error(r.message); expect(displayName(r.data, "ar")).toBe("ابن سينا"); expect(displayName(r.data, "ur")).toBe("Fixture 1");
  });
  it("multilingual content comes from the database", async () => {
    const r = await repo.getScholar("al-khwarizmi"); if (!r.ok) throw new Error(r.message);
    expect(r.data.names.ar).toBe("محمد بن موسى الخوارزمي"); expect(displayName(r.data, "ar")).toContain("الخوارزمي"); expect(displayName(r.data, "ur")).toContain("الخوارزمی"); expect(displayName(r.data, "en")).toBe("Muhammad ibn Musa al-Khwarizmi");
    const k = await repo.getScholar("al-kindi"); if (!k.ok) throw new Error(k.message); expect(displayName(k.data, "ar")).toBe(k.data.names.en);   // honest English fallback
  });
  it("profile: full record with works, contributions, events and cited sources", async () => {
    const r = await repo.getScholar("al-khwarizmi"); if (!r.ok) throw new Error(r.message); const s = r.data;
    expect([s.works.length, s.contributions.length, s.events.length]).toEqual([7, 4, 6]); expect(s.region).toBe("Iraq"); expect(s.kind).toBe("individual"); expect(s.sample).toBe(false);
    const alg = s.contributions.find(c => c.kind === "mathematical_development")!; expect(alg.confidence).toBe("high"); expect(alg.refs.length).toBeGreaterThan(1); expect(alg.refs.every(x => x.locator?.startsWith("entry:") && x.tier === "academic_research")).toBe(true);
    expect(s.events.find(e => e.title.startsWith("Active in Baghdad"))!.label).toBe("verified"); expect(s.disciplines.sort()).toEqual(["Algebra", "Astronomy", "Geography", "Mathematics"]);
  });
  it("relationships come through the nested embeds, only where BOTH scholars are published", async () => {
    const g = await repo.getScholar("banu-musa"), m = await repo.getScholar("muhammad-ibn-musa-ibn-shakir"); if (!g.ok || !m.ok) throw new Error("missing");
    expect(g.data.kind).toBe("group"); expect(g.data.relations.filter(x => x.direction === "in").map(x => x.otherSlug).sort()).toEqual(["ahmad-ibn-musa-ibn-shakir", "muhammad-ibn-musa-ibn-shakir"]);
    expect(m.data.relations).toHaveLength(1); expect(m.data.relations[0]).toMatchObject({ direction: "out", type: "member_of", otherSlug: "banu-musa", confidence: "medium" }); expect(m.data.relations[0].refs[0].locator).toMatch(/^entry:/);
    expect(m.data.relations[0].otherNames?.en).toContain("Banu Musa");
  });
  it("missing, draft and unpublished records are 'notfound' (not errors, not mock data)", async () => {
    for (const slug of ["ahmad-raza-khan", "al-hasan-ibn-musa-ibn-shakir", "no-such-person"]) { const r = await repo.getScholar(slug); expect(r.ok).toBe(false); if (!r.ok) expect(r.kind).toBe("notfound"); }
  });
  it("filter options come from published data only", async () => {
    const o = await repo.filterOptions(); if (!o.ok) throw new Error(o.message);
    expect(o.data.regions).toEqual(["Andalusia", "Iraq", "Persia", "South Asia"]); expect(o.data.disciplines).toEqual(expect.arrayContaining(["Astronomy", "Philosophy", "Medicine", "Mechanical inventions", "Optics"])); expect(o.data.disciplines).not.toContain("Botany");
  });
  it("timeline: published scholars' events only; server-side filters; ordered; cited", async () => {
    const all = await repo.timelineEvents({}, "en"); if (!all.ok) throw new Error(all.message);
    expect(all.data).toHaveLength(11); expect(all.data.map(e => e.yearEarliest)).toEqual([...all.data.map(e => e.yearEarliest)].sort((a, b) => a - b)); expect(all.data.some(e => e.scholarSlug === "ahmad-raza-khan")).toBe(false);
    const d = await repo.timelineEvents({ t: "death" }, "en"); if (!d.ok) throw new Error(d.message); expect(d.data.map(e => e.scholarSlug).sort()).toEqual(["al-khwarizmi", "al-kindi", "muhammad-ibn-musa-ibn-shakir"]);
    const c8 = await repo.timelineEvents({ c: "8" }, "en"), c9 = await repo.timelineEvents({ c: "9" }, "en"); if (!c8.ok || !c9.ok) throw new Error("x"); expect([c8.data.length, c9.data.length]).toEqual([2, 9]);
    const one = await repo.timelineEvents({ s: "al-kindi" }, "ar"); if (!one.ok) throw new Error(one.message); expect(one.data).toHaveLength(3); expect(one.data[0].refs[0].locator).toMatch(/^§/); expect(one.data[0].scholarName).toBe("Abu Yusuf Ya'qub ibn Ishaq al-Kindi");
  });
});
describe("anonymous access and token handling at the API", () => {
  it("drafts, private tables and writes are closed to the public", async () => {
    expect((await anon.from("scholars").select("slug").eq("slug", "ahmad-raza-khan")).data).toEqual([]);
    expect((await anon.from("works").select("id")).data).toHaveLength(20);          // 20 works of published scholars, not the 26 in the database
    expect((await anon.from("audit_log").select("id")).error).toBeTruthy(); expect((await anon.from("editorial_reviews").select("id")).error).toBeTruthy();
    expect((await anon.from("scholars").insert({ slug: "hack", region: "R", period_group: "early" })).error).toBeTruthy();
    expect((await anon.from("scholars").select("created_by")).error).toBeTruthy();   // internal columns are not exposed
    expect((await anon.rpc("is_editor")).error).toBeTruthy();                       // no RPC surface
  });
  it("expired and wrongly signed tokens are rejected", async () => {
    const expired = await clientFor(mint({ role: "anon" }, { exp: Math.floor(Date.now() / 1000) - 60 })).from("scholars").select("slug");
    const forgedSig = await clientFor(mint({ role: "authenticated", app_metadata: { role: "admin" } }, { secret: "x".repeat(40) })).from("scholars").select("slug");
    expect(expired.error).toBeTruthy(); expect(forgedSig.error).toBeTruthy(); expect(expired.data).toBeNull(); expect(forgedSig.data).toBeNull();
  });
});
