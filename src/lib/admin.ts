import type { SupabaseClient } from "@supabase/supabase-js";
import { dbNorm } from "./repo";
export type Status = "draft" | "in_review" | "published" | "archived";
export type Role = "editor" | "admin";
export type Action = "submit" | "return_draft" | "review" | "publish" | "unpublish" | "archive" | "restore" | "delete";
export type AR<T> = { ok: true; data: T } | { ok: false; message: string; code?: string };
/** Role comes ONLY from app_metadata (set server-side). user_metadata is user-editable and is ignored. UX gating only: the database enforces every rule. */
export const roleFromClaims = (appMeta: { role?: unknown } | null | undefined): Role | null => (appMeta?.role === "admin" ? "admin" : appMeta?.role === "editor" ? "editor" : null);
/** Buttons the UI offers per status and role. These mirror (never replace) the database's gate. */
export function availableActions(status: Status, role: Role): Action[] {
  const admin = role === "admin";
  if (status === "draft") return ["submit", ...(admin ? ["delete" as const] : [])];
  if (status === "in_review") return ["return_draft", "review", "publish", ...(admin ? ["delete" as const] : [])];
  if (status === "published") return ["unpublish", ...(admin ? ["archive" as const] : [])];
  return admin ? ["restore"] : [];
}
const wrap = <T>(r: { data: T | null; error: { message: string; code?: string } | null }): AR<T> => (r.error ? { ok: false, message: r.error.message, code: r.error.code } : { ok: true, data: r.data as T });
export const CHILD_TABLES = ["contributions", "works", "timeline_events", "scholar_relationships", "media_assets"] as const;
export type ChildTable = (typeof CHILD_TABLES)[number];
export type Target = { contribution_id?: string; work_id?: string; timeline_event_id?: string; relationship_id?: string };
const CS = "claim_sources(id,locator,evidence_tier,evidence_notes,source_id,sources(title,author))";
const FULL = `*,scholar_translations(*),scholar_disciplines(discipline_id,disciplines(name_en)),contributions(*,${CS}),works(*,${CS}),timeline_events(*,${CS}),scholar_relationships!scholar_relationships_scholar_id_fkey(*,${CS},other:scholars!scholar_relationships_related_scholar_id_fkey(slug,scholar_translations(lang,name))),media_assets(*),editorial_reviews(*)`;
export function createAdmin(c: SupabaseClient) {
  const count = async (table: string, status?: string) => { let b: any = c.from(table).select("id", { count: "exact", head: true }); if (status) b = b.eq("status", status); const r = await b; return r.error ? NaN : (r.count ?? 0); };
  return {
    async stats(): Promise<AR<{ byStatus: Record<Status, number>; totals: Record<string, number> }>> {
      const st: Status[] = ["draft", "in_review", "published", "archived"], tb = ["sources", "contributions", "works", "timeline_events", "scholar_relationships", "media_assets"];
      const [a, b] = await Promise.all([Promise.all(st.map(s => count("scholars", s))), Promise.all(tb.map(t => count(t)))]);
      if ([...a, ...b].some(Number.isNaN)) return { ok: false, message: "Could not load statistics (are you signed in as an editor?)" };
      return { ok: true, data: { byStatus: Object.fromEntries(st.map((s, i) => [s, a[i]])) as Record<Status, number>, totals: Object.fromEntries(tb.map((t, i) => [t, b[i]])) } };
    },
    async listScholars(o: { status?: string; q?: string; page?: number; pageSize?: number } = {}) {
      const size = o.pageSize ?? 20, page = Math.max(1, o.page ?? 1), term = dbNorm(o.q ?? "").replace(/[%_*,()]/g, "");
      let b: any = c.from("scholars").select(`id,slug,status,region,period_group,scholar_kind,content_rev,updated_at,${term ? "scholar_translations!inner(lang,name,name_normalized)" : "scholar_translations(lang,name)"}`, { count: "exact" });
      if (o.status) b = b.eq("status", o.status); if (term) b = b.ilike("scholar_translations.name_normalized", `%${term}%`);
      const r = await b.order("updated_at", { ascending: false }).range((page - 1) * size, page * size - 1);
      return r.error ? ({ ok: false, message: r.error.message } as AR<never>) : ({ ok: true, data: { rows: r.data as any[], total: r.count ?? 0, page, pages: Math.max(1, Math.ceil((r.count ?? 0) / size)) } } as AR<{ rows: any[]; total: number; page: number; pages: number }>);
    },
    async getScholar(id: string): Promise<AR<any>> { const r = await c.from("scholars").select(FULL).eq("id", id).maybeSingle(); return r.error ? wrap(r as any) : r.data ? { ok: true, data: r.data } : { ok: false, message: "Not found, or you do not have access." }; },
    async createScholar(row: Record<string, unknown>): Promise<AR<{ id: string }>> { return wrap(await c.from("scholars").insert(row).select("id").single() as any); },
    async updateScholar(id: string, patch: Record<string, unknown>): Promise<AR<{ id: string }>> { const r = await c.from("scholars").update(patch).eq("id", id).select("id"); return r.error ? wrap(r as any) : r.data?.length ? { ok: true, data: r.data[0] as { id: string } } : { ok: false, message: "No record was updated (not found or not permitted)." }; },
    async saveTranslation(id: string, lang: "en" | "ur" | "ar", name: string, biography: string | null) { return wrap(await c.from("scholar_translations").upsert({ scholar_id: id, lang, name, biography: biography || null }, { onConflict: "scholar_id,lang" }).select("scholar_id") as any); },
    async listDisciplines() { return wrap(await c.from("disciplines").select("id,slug,name_en").order("name_en") as any) as AR<{ id: number; slug: string; name_en: string }[]>; },
    async setDisciplines(id: string, ids: number[]): Promise<AR<true>> {
      const cur = await c.from("scholar_disciplines").select("discipline_id").eq("scholar_id", id); if (cur.error) return { ok: false, message: cur.error.message };
      const have = new Set((cur.data ?? []).map((x: any) => x.discipline_id as number)), want = new Set(ids), add = ids.filter(i => !have.has(i)), del = [...have].filter(i => !want.has(i));
      if (del.length) { const d = await c.from("scholar_disciplines").delete().eq("scholar_id", id).in("discipline_id", del); if (d.error) return { ok: false, message: d.error.message }; }
      if (add.length) { const a = await c.from("scholar_disciplines").insert(add.map(discipline_id => ({ scholar_id: id, discipline_id }))); if (a.error) return { ok: false, message: a.error.message }; }
      return { ok: true, data: true };
    },
    async setStatus(id: string, status: Status) { return this.updateScholar(id, { status }); },
    async recordReview(id: string, decision: "approved" | "changes_requested" | "rejected", contentRev: number, notes?: string) { return wrap(await c.from("editorial_reviews").insert({ scholar_id: id, decision, content_rev: contentRev, notes: notes || null }).select("id") as any); },
    async deleteScholar(id: string): Promise<AR<true>> { const r = await c.from("scholars").delete().eq("id", id).select("id"); return r.error ? { ok: false, message: r.error.message } : r.data?.length ? { ok: true, data: true } : { ok: false, message: "Nothing was deleted (not found, or deletion is administrator-only)." }; },
    async saveRow(table: ChildTable, row: Record<string, unknown>, id?: string): Promise<AR<{ id: string }>> { const q: any = id ? c.from(table).update(row).eq("id", id) : c.from(table).insert(row); return wrap(await q.select("id").single()); },
    async removeRow(table: ChildTable, id: string): Promise<AR<true>> { const r = await c.from(table).delete().eq("id", id).select("id"); return r.error ? { ok: false, message: r.error.message } : r.data?.length ? { ok: true, data: true } : { ok: false, message: "Nothing was deleted." }; },
    async listSources(q = "") { let b: any = c.from("sources").select("id,title,author,publication,url,source_type").order("title").limit(200); const t = q.trim().replace(/[%_*,()]/g, ""); if (t) b = b.ilike("title", `%${t}%`); return wrap(await b) as AR<any[]>; },
    async addSource(row: { title: string; author?: string | null; publication?: string | null; url?: string | null; source_type?: string | null }) { return wrap(await c.from("sources").insert(row).select("id").single() as any) as AR<{ id: string }>; },
    async updateSource(id: string, row: { title: string; author?: string | null; publication?: string | null; url?: string | null; source_type?: string | null }): Promise<AR<true>> { const r = await c.from("sources").update(row).eq("id", id).select("id"); return r.error ? { ok: false, message: r.error.message } : r.data?.length ? { ok: true, data: true } : { ok: false, message: "No source was updated." }; },
    async deleteSource(id: string): Promise<AR<true>> { const r = await c.from("sources").delete().eq("id", id).select("id"); return r.error ? { ok: false, message: r.error.message } : r.data?.length ? { ok: true, data: true } : { ok: false, message: "No source was deleted." }; },
    async addClaimSource(target: Target, source_id: string, evidence_tier: string, locator?: string | null, evidence_notes?: string | null) { return wrap(await c.from("claim_sources").insert({ ...target, source_id, evidence_tier, locator: locator || null, evidence_notes: evidence_notes || null }).select("id").single() as any) as AR<{ id: string }>; },
    async removeClaimSource(id: string): Promise<AR<true>> { const r = await c.from("claim_sources").delete().eq("id", id).select("id"); return r.error ? { ok: false, message: r.error.message } : r.data?.length ? { ok: true, data: true } : { ok: false, message: "Nothing was deleted." }; },
    async audit(o: { scholarId?: string; table?: string; limit?: number } = {}) { let b: any = c.from("audit_log").select("id,at,actor,actor_role,action,table_name,row_id,scholar_id,details").order("id", { ascending: false }).limit(o.limit ?? 50); if (o.scholarId) b = b.eq("scholar_id", o.scholarId); if (o.table) b = b.eq("table_name", o.table); return wrap(await b) as AR<any[]>; },
    /** Upload to the private bucket, then record licence/attribution. Needs the Supabase Storage service (not covered by the PostgREST test harness). */
    async uploadMedia(scholarId: string, file: Blob & { name?: string }, meta: { kind: "image" | "document"; title: string; alt_text?: string | null; license: string; attribution: string; source_url?: string | null; provenance_note?: string | null }): Promise<AR<{ id: string }>> {
      const safe = (file.name ?? "file").toLowerCase().replace(/[^a-z0-9._-]+/g, "-").slice(-80), path = `scholars/${scholarId}/${crypto.randomUUID()}-${safe}`;
      const up = await c.storage.from("scholar-media").upload(path, file, { upsert: false, contentType: file.type });
      if (up.error) return { ok: false, message: up.error.message };
      const rec = await c.from("media_assets").insert({ scholar_id: scholarId, storage_path: path, ...meta }).select("id").single();
      if (rec.error) { await c.storage.from("scholar-media").remove([path]); return { ok: false, message: rec.error.message }; }   // do not leave an unrecorded file behind
      return { ok: true, data: rec.data as { id: string } };
    },
    async signedUrl(path: string): Promise<AR<string>> { const r = await c.storage.from("scholar-media").createSignedUrl(path, 300); return r.error ? { ok: false, message: r.error.message } : { ok: true, data: r.data.signedUrl }; },
  };
}
export type Admin = ReturnType<typeof createAdmin>;
