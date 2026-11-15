import { describe, it, expect } from "vitest";
import { clientFor, tokens } from "./helpers";
import { createAdmin, type AR } from "../../src/lib/admin";
import { createLiveRepo } from "../../src/lib/repo";
const A = { e1: createAdmin(clientFor(tokens.editor)), e2: createAdmin(clientFor(tokens.editor2)), ad: createAdmin(clientFor(tokens.admin)), user: createAdmin(clientFor(tokens.user)), forged: createAdmin(clientFor(tokens.forged)), anon: createAdmin(clientFor(tokens.anon)) };
const pub = createLiveRepo(clientFor(tokens.anon)), raw = clientFor(tokens.editor);
function ok<T>(r: AR<T>): T { if (!r.ok) throw new Error("expected ok, got: " + r.message); return r.data; }
function bad(r: AR<unknown>, re: RegExp) { expect(r.ok).toBe(false); if (!r.ok) expect(r.message).toMatch(re); }
const visible = async (slug: string) => (await pub.getScholar(slug)).ok;
describe("admin API: access control (RLS + roles from app_metadata only)", () => {
  it("editors and admins see drafts and statistics; others do not", async () => {
    for (const k of ["e1", "ad"] as const) { const s = ok(await A[k].stats()); expect(s.byStatus.draft).toBeGreaterThanOrEqual(2); expect(s.byStatus.published).toBeGreaterThanOrEqual(9); expect(s.totals.sources).toBeGreaterThan(5); }
    for (const k of ["user", "forged", "anon"] as const) { const s = ok(await A[k].stats()); expect(s.byStatus.draft).toBe(0); expect(s.byStatus.in_review).toBe(0); }
  });
  it("draft listing and search: editors see Ala Hazrat's draft; a user_metadata 'admin' claim grants nothing", async () => {
    const l = ok(await A.e1.listScholars({ status: "draft", q: "ahmad raza" })); expect(l.rows.map(r => r.slug)).toEqual(["ahmad-raza-khan"]);
    for (const k of ["user", "forged"] as const) expect(ok(await A[k].listScholars({ status: "draft" })).total).toBe(0);
  });
  it("full editing payload for a draft is available to editors only", async () => {
    const id = ok(await A.e1.listScholars({ q: "ahmad raza" })).rows[0].id, s = ok(await A.e1.getScholar(id));
    expect([s.contributions.length, s.works.length, s.timeline_events.length]).toEqual([2, 6, 7]); expect(s.contributions[0].claim_sources[0].locator).toMatch(/^pp\./); expect(s.status).toBe("draft");
    bad(await A.user.getScholar(id), /not found|access/i); bad(await A.forged.getScholar(id), /not found|access/i);
  });
  it("the audit log is readable by editors only and cannot be altered, even by editors or admins", async () => {
    expect(ok(await A.e1.audit({ limit: 5 })).length).toBeGreaterThan(0); expect(ok(await A.user.audit({ limit: 5 }))).toEqual([]); expect((await A.anon.audit()).ok).toBe(false);
    for (const t of [tokens.editor, tokens.admin]) { const c = clientFor(t); expect((await c.from("audit_log").update({ action: "x" }).eq("id", 1)).error).toBeTruthy(); expect((await c.from("audit_log").delete().eq("id", 1)).error).toBeTruthy(); expect((await c.from("audit_log").insert({ action: "x", table_name: "y" })).error).toBeTruthy(); }
  });
});
describe("admin API: editorial lifecycle through the real publication gate", () => {
  let id = "", cs = "", k = "";
  it("create, translate (EN/UR/AR), classify disciplines; invalid input is rejected by the database", async () => {
    bad(await A.e1.createScholar({ slug: "Bad Slug", region: "Persia", period_group: "classical" }), /check|violates/i);
    id = ok(await A.e1.createScholar({ slug: "api-scholar", region: "Persia", period_group: "classical", scholar_kind: "individual" })).id;
    bad(await A.e1.createScholar({ slug: "api-scholar", region: "Persia", period_group: "classical" }), /duplicate|unique/i);
    ok(await A.e1.saveTranslation(id, "en", "API Scholar", "An English biography.")); ok(await A.e1.saveTranslation(id, "ur", "اے پی آئی عالم", null)); ok(await A.e1.saveTranslation(id, "ar", "عالم تجريبي", null));
    const ds = ok(await A.e1.listDisciplines()), pick = (n: string) => ds.find(d => d.name_en === n)!.id;
    ok(await A.e1.setDisciplines(id, [pick("Medicine"), pick("Optics")])); ok(await A.e1.setDisciplines(id, [pick("Optics"), pick("Botany")]));
    const s = ok(await A.e1.getScholar(id)); expect(s.scholar_disciplines.map((x: any) => x.disciplines.name_en).sort()).toEqual(["Botany", "Optics"]); expect(s.scholar_translations).toHaveLength(3);
    expect(await visible("api-scholar")).toBe(false);
  });
  it("contribution rules are enforced by the database (classification vs confidence)", async () => {
    bad(await A.e1.saveRow("contributions", { scholar_id: id, description: "x", kind: "original_invention", confidence: "medium" }), /strong_claims|check|violates/i);
    k = ok(await A.e1.saveRow("contributions", { scholar_id: id, description: "An explanation.", title: "A contribution", kind: "technical_improvement", confidence: "medium" })).id;
    const src = ok(await A.e1.addSource({ title: "API Test Source", author: "A. Author", source_type: "academic" })); cs = ok(await A.e1.addClaimSource({ contribution_id: k }, src.id, "academic_research", "§1")).id;
    expect(ok(await A.e1.listSources("api test")).map((s: any) => s.title)).toContain("API Test Source");
  });
  it("workflow: self-approval, stale review and unsourced publication are all refused", async () => {
    const nosrc = ok(await A.e1.createScholar({ slug: "api-nosrc", region: "Persia", period_group: "early" })).id; ok(await A.e1.saveTranslation(nosrc, "en", "No Source", null));
    ok(await A.e1.setStatus(nosrc, "in_review")); let r = ok(await A.e1.getScholar(nosrc)); ok(await A.e2.recordReview(nosrc, "approved", r.content_rev)); bad(await A.e2.setStatus(nosrc, "published"), /no source/i);
    ok(await A.e1.setStatus(id, "in_review")); r = ok(await A.e1.getScholar(id)); bad(await A.e2.recordReview(id, "approved", r.content_rev - 1), /Content changed/);
    ok(await A.e1.recordReview(id, "approved", r.content_rev)); bad(await A.e1.setStatus(id, "published"), /neither created nor last edited/); expect((await A.e1.getScholar(id)) && ok(await A.e1.getScholar(id)).status).toBe("in_review");
  });
  it("an independent review publishes; the public then sees all three languages", async () => {
    const r = ok(await A.e1.getScholar(id)); ok(await A.e2.recordReview(id, "approved", r.content_rev, "Checked sources.")); ok(await A.e2.setStatus(id, "published"));
    const p = await pub.getScholar("api-scholar"); if (!p.ok) throw new Error(p.message); expect([p.data.names.en, p.data.names.ur, p.data.names.ar]).toEqual(["API Scholar", "اے پی آئی عالم", "عالم تجريبي"]); expect(p.data.bios.en).toBe("An English biography."); expect(p.data.contributions[0].refs[0].locator).toBe("§1");
  });
  it("a changed published record leaves public view until re-reviewed; a no-op re-save does not", async () => {
    ok(await A.e1.saveTranslation(id, "en", "API Scholar", "An English biography.")); expect(await visible("api-scholar")).toBe(true);   // identical values: not a content change
    ok(await A.e1.saveTranslation(id, "en", "API Scholar", "A revised biography.")); expect(await visible("api-scholar")).toBe(false);
    expect(ok(await A.e1.getScholar(id)).status).toBe("in_review");
    const r = ok(await A.e1.getScholar(id)); ok(await A.e2.recordReview(id, "approved", r.content_rev)); ok(await A.e2.setStatus(id, "published")); expect(await visible("api-scholar")).toBe(true);
  });
  it("a published scholar cannot lose its last source", async () => { bad(await A.e1.removeClaimSource(cs), /must keep at least one source/); });
  it("RBAC: only an admin can delete, archive or restore", async () => {
    bad(await A.e1.deleteScholar(id), /administrator|Nothing was deleted/); bad(await A.e2.setStatus(id, "archived"), /administrator/);
    ok(await A.ad.setStatus(id, "archived")); expect(await visible("api-scholar")).toBe(false); bad(await A.e1.setStatus(id, "in_review"), /administrator/); expect(ok(await A.e1.getScholar(id)).status).toBe("archived");
    bad(await A.ad.setStatus(id, "published"), /in_review, not published/); ok(await A.ad.setStatus(id, "in_review")); expect(ok(await A.e1.getScholar(id)).status).toBe("in_review");
    bad(await A.ad.deleteScholar(id), /violates|foreign key|reviews/i);   // reviewed scholars are never deleted (audit trail)
    const d = ok(await A.e1.createScholar({ slug: "api-del", region: "Persia", period_group: "early" })).id; bad(await A.e1.deleteScholar(d), /administrator|Nothing was deleted/); ok(await A.ad.deleteScholar(d));
  });
  it("every step above was audited with the real actor and role", async () => {
    const rows = ok(await A.e1.audit({ scholarId: id, limit: 100 })), by = (t: string, a?: string) => rows.filter((r: any) => r.table_name === t && (!a || r.action === a));
    expect(by("scholars", "insert")[0]).toMatchObject({ actor: "00000000-0000-0000-0000-0000000000e1", actor_role: "editor" }); expect(by("contributions", "insert")).toHaveLength(1); expect(by("claim_sources", "insert")).toHaveLength(1); expect(by("editorial_reviews").length).toBeGreaterThanOrEqual(3);
    const arch = rows.find((r: any) => r.table_name === "scholars" && r.details?.status?.new?.includes("archived")); expect(arch).toMatchObject({ actor: "00000000-0000-0000-0000-0000000000d1", actor_role: "admin" });
    expect(by("scholar_translations", "update").length).toBeGreaterThanOrEqual(1); expect(rows.map((r: any) => r.id)).toEqual([...rows.map((r: any) => r.id)].sort((a: number, b: number) => b - a));
  });
  it("relationships and media records obey the database rules", async () => {
    const other = ok(await A.e1.listScholars({ q: "Fixture 1" })).rows[0].id;
    bad(await A.e1.saveRow("scholar_relationships", { scholar_id: id, related_scholar_id: other, relation_type: "member_of", confidence: "low" }), /member_of must link/); bad(await A.e1.saveRow("scholar_relationships", { scholar_id: id, related_scholar_id: id, relation_type: "collaborator", confidence: "low" }), /no_self_relation|violates/);
    ok(await A.e1.saveRow("scholar_relationships", { scholar_id: id, related_scholar_id: other, relation_type: "collaborator", confidence: "low", description: "Test" })); bad(await A.e1.saveRow("scholar_relationships", { scholar_id: id, related_scholar_id: other, relation_type: "collaborator", confidence: "low" }), /unique|duplicate/i);
    bad(await A.e1.saveRow("media_assets", { scholar_id: id, kind: "image", storage_path: "scholars/x/a.jpg", title: "T", alt_text: "alt", license: "", attribution: "A" }), /check|violates/i);
    ok(await A.e1.saveRow("media_assets", { scholar_id: id, kind: "image", storage_path: `scholars/${id}/a.jpg`, title: "Portrait", alt_text: "A portrait", license: "Public domain", attribution: "Museum", source_url: "https://example.org/a" }));
    bad(await A.user.saveRow("media_assets", { scholar_id: id, kind: "document", storage_path: "scholars/x/d.pdf", title: "D", license: "CC0", attribution: "A" }), /row-level security|violates|permission/i);
  });
  it("non-editors cannot write anything through the admin layer", async () => {
    for (const k2 of ["user", "forged", "anon"] as const) {
      bad(await A[k2].createScholar({ slug: "hack-" + k2, region: "R", period_group: "early" }), /row-level security|permission|violates/i);
      bad(await A[k2].addSource({ title: "hack" }), /row-level security|permission|violates/i); bad(await A[k2].updateScholar(id, { region: "X" }), /No record was updated|row-level|permission/i); bad(await A[k2].deleteScholar(id), /Nothing was deleted|permission/i);
    }
  });
  it("raw API: an editor cannot change content_rev, created_by or the audit trail directly", async () => {
    const before = ok(await A.e1.getScholar(id)); const r = await raw.from("scholars").update({ content_rev: 999, created_by: "00000000-0000-0000-0000-0000000000a1" }).eq("id", id).select("content_rev,created_by");
    expect(r.data?.[0].content_rev).toBe(before.content_rev); expect(r.data?.[0].created_by).toBe(before.created_by);
  });
});
