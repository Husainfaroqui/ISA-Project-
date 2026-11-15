import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase, mode } from "./supabase";
import { PAGE_SIZE } from "./search";
import type { Query } from "./types";
import type { FlatEvent, EventQuery } from "./timeline";
import type { Scholar, Label, Period, Ref } from "./types";
import type { Lang } from "./i18n";
const CS = "claim_sources(locator,evidence_tier,sources(title,author,url))";
const REL = (me: string, other: string) => `id,relation_type,description,confidence,label,other:scholars!scholar_relationships_${other}_fkey(slug,scholar_translations(lang,name)),${CS}`;
const SELECT = `slug,scholar_kind,region,period_group,birth_year,death_year,dates_note,scholar_translations(lang,name,biography),scholar_disciplines(disciplines(name_en)),contributions(id,description,label,lang,title,kind,confidence,period_text,prior_state,detail,discipline:disciplines(name_en),${CS}),works(original_title,authorship_status,subject,original_language,publication_note,${CS}),rel_out:scholar_relationships!scholar_relationships_scholar_id_fkey(${REL("scholar_id", "related_scholar_id")}),rel_in:scholar_relationships!scholar_relationships_related_scholar_id_fkey(${REL("related_scholar_id", "scholar_id")}),timeline_events(id,title,event_type,year_earliest,year_latest,date_certainty,date_note,description,confidence,label,${CS})`;
/* eslint-disable @typescript-eslint/no-explicit-any */
export const mapRefs = (cs: any[] | null | undefined): Ref[] => (cs ?? []).filter(c => c?.sources?.title).map(c => ({ title: c.sources.title, author: c.sources.author ?? undefined, url: c.sources.url ?? undefined, locator: c.locator ?? undefined, tier: c.evidence_tier ?? undefined }));
const relNames = (o: any): Record<string, string> => Object.fromEntries((o?.scholar_translations ?? []).map((t: any) => [t.lang, t.name]));
const relName = (o: any): string => ((o?.scholar_translations ?? []).find((t: any) => t.lang === "en")?.name) ?? o?.slug ?? "";
const mapRel = (x: any, direction: "out" | "in") => ({ id: x.id, type: x.relation_type, direction, otherSlug: x.other?.slug ?? "", otherName: relName(x.other), otherNames: relNames(x.other), description: x.description ?? undefined, confidence: x.confidence, label: x.label as Label, refs: mapRefs(x.claim_sources) });
export function mapRow(r: any): Scholar {
  const tr: any[] = r.scholar_translations ?? [], names: any = {}, bios: any = {};
  tr.forEach(t => { names[t.lang] = t.name; if (t.biography) bios[t.lang] = t.biography; });
  const dates = r.dates_note ?? (r.birth_year && r.death_year ? `${r.birth_year}–${r.death_year} CE` : undefined);
  return { slug: r.slug, names: { en: names.en ?? r.slug, ...names }, region: r.region, period: r.period_group as Period, dates,
    disciplines: (r.scholar_disciplines ?? []).map((d: any) => d.disciplines?.name_en).filter(Boolean), bios,
    works: (r.works ?? []).map((w: any) => ({ title: w.original_title, status: w.authorship_status as Label, refs: mapRefs(w.claim_sources), subject: w.subject ?? undefined, language: w.original_language ?? undefined, dateNote: w.publication_note ?? undefined })),
    contributions: (r.contributions ?? []).map((c: any) => ({ id: c.id, text: c.description, label: c.label as Label, lang: (c.lang ?? "en") as Lang, refs: mapRefs(c.claim_sources), title: c.title ?? undefined, kind: c.kind ?? undefined, confidence: c.confidence ?? undefined, discipline: c.discipline?.name_en ?? undefined, periodText: c.period_text ?? undefined, priorState: c.prior_state ?? undefined, detail: c.detail ?? undefined })), events: (r.timeline_events ?? []).map((e: any) => ({ id: e.id, title: e.title, type: e.event_type, yearEarliest: e.year_earliest, yearLatest: e.year_latest, certainty: e.date_certainty, dateNote: e.date_note ?? undefined, description: e.description ?? undefined, confidence: e.confidence, label: e.label as Label, refs: mapRefs(e.claim_sources) })), relations: [...(r.rel_out ?? []).map((x: any) => mapRel(x, "out")), ...(r.rel_in ?? []).map((x: any) => mapRel(x, "in"))], kind: r.scholar_kind === "group" ? "group" : "individual", sample: false };
}

// ---------- data access (live Supabase when configured; otherwise bundled local archive) ----------
export type Res<T> = { ok: true; data: T } | { ok: false; kind: "unconfigured" | "error" | "notfound"; message: string };
export interface ScholarPage { items: Scholar[]; total: number; page: number; pages: number }
export interface Repo {
  listScholars(q: Query, lang: Lang): Promise<Res<ScholarPage>>;
  getScholar(slug: string): Promise<Res<Scholar>>;
  filterOptions(): Promise<Res<{ disciplines: string[]; regions: string[] }>>;
  timelineEvents(q: EventQuery, lang: Lang): Promise<Res<FlatEvent[]>>;
}
/** Same normalisation as the database trigger private.fill_name_normalized (0009), so client search terms match stored names. */
export const dbNorm = (s: string) => s.replace(/[أإآ]/g, "ا").replace(/[يى]/g, "ی").replace(/ك/g, "ک").replace(/[\u064B-\u065F\u0670]/g, "").toLowerCase().trim();
const LIST = "slug,scholar_kind,region,period_group,dates_note,birth_year,death_year,scholar_translations(lang,name),scholar_disciplines(disciplines(name_en))";
const fail = (e: { message?: string } | null | undefined): Res<never> => ({ ok: false, kind: "error", message: e?.message ?? "Unknown database error" });
const names = (rows: any[] | undefined): Record<string, string> => Object.fromEntries((rows ?? []).map(t => [t.lang, t.name]));
export function createLiveRepo(client: SupabaseClient): Repo {
  async function page(q: Query, pageNo: number) {
    const term = dbNorm(q.q ?? "").replace(/[%_*,()]/g, "");
    const sel = ["id,slug,period_rank", term ? "scholar_translations!inner(name_normalized)" : "", q.d ? "scholar_disciplines!inner(disciplines!inner(name_en))" : ""].filter(Boolean).join(",");
    let b: any = client.from("scholars").select(sel, { count: "exact" }).eq("status", "published");
    if (q.r) b = b.eq("region", q.r);
    if (q.p) b = b.eq("period_group", q.p);
    if (term) b = b.ilike("scholar_translations.name_normalized", `%${term}%`);
    if (q.d) b = b.eq("scholar_disciplines.disciplines.name_en", q.d);
    b = q.s === "period" ? b.order("period_rank").order("slug") : b.order("slug");
    return b.range((pageNo - 1) * PAGE_SIZE, pageNo * PAGE_SIZE - 1);
  }
  return {
    async listScholars(q) {
      let pageNo = Math.max(1, Math.floor(q.page ?? 1)), r = await page(q, pageNo);
      if (r.error?.code === "PGRST103") { pageNo = 1; r = await page(q, 1); }   // page past the end: fall back to page 1
      if (r.error) return fail(r.error);
      const ids: string[] = (r.data ?? []).map((x: any) => x.id), total: number = r.count ?? ids.length;
      if (!ids.length) return { ok: true, data: { items: [], total, page: pageNo, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) } };
      const d = await client.from("scholars").select(`id,${LIST}`).in("id", ids);
      if (d.error) return fail(d.error);
      const byId = new Map((d.data ?? []).map((x: any) => [x.id, mapRow(x)]));
      return { ok: true, data: { items: ids.map(i => byId.get(i)!).filter(Boolean), total, page: pageNo, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) } };
    },
    async getScholar(slug) {
      const r = await client.from("scholars").select(SELECT).eq("slug", slug).eq("status", "published").maybeSingle();
      if (r.error) return fail(r.error);
      return r.data ? { ok: true, data: mapRow(r.data) } : { ok: false, kind: "notfound", message: "No published scholar with this address." };
    },
    async filterOptions() {
      const [d, g] = await Promise.all([client.from("scholar_disciplines").select("disciplines(name_en)"), client.from("scholars").select("region").eq("status", "published")]);
      if (d.error || g.error) return fail(d.error ?? g.error);
      const uniq = (a: (string | undefined)[]) => [...new Set(a.filter(Boolean) as string[])].sort();
      return { ok: true, data: { disciplines: uniq((d.data ?? []).map((x: any) => x.disciplines?.name_en)), regions: uniq((g.data ?? []).map((x: any) => x.region)) } };
    },
    async timelineEvents(q, lang) {
      let b: any = client.from("timeline_events").select("id,title,event_type,year_earliest,year_latest,date_certainty,date_note,description,confidence,label,scholar:scholars!inner(slug,scholar_translations(lang,name)),claim_sources(locator,evidence_tier,sources(title,author,url))");
      if (q.t) b = b.eq("event_type", q.t);
      if (q.s) b = b.eq("scholar.slug", q.s);
      if (q.c) b = b.gte("year_earliest", (Number(q.c) - 1) * 100 + 1).lte("year_earliest", Number(q.c) * 100);
      const r = await b.order("year_earliest").order("year_latest").order("title").limit(500);
      if (r.error) return fail(r.error);
      return { ok: true, data: (r.data ?? []).map((e: any): FlatEvent => { const n = names(e.scholar?.scholar_translations); return { id: e.id, title: e.title, type: e.event_type, yearEarliest: e.year_earliest, yearLatest: e.year_latest, certainty: e.date_certainty, dateNote: e.date_note ?? undefined, description: e.description ?? undefined, confidence: e.confidence, label: e.label as Label, refs: mapRefs(e.claim_sources), scholarSlug: e.scholar?.slug ?? "", scholarName: n[lang] ?? n.en ?? e.scholar?.slug ?? "" }; }) };
    },
  };
}
let repo: Promise<Repo> | null = null;
let localRepo: Promise<Repo> | null = null;
const getLocalRepo = () => (localRepo ??= import("./local").then(m => m.createLocalRepo()));
const offlineMessage = (s: string) => /failed to fetch|networkerror|fetch failed|load failed|internet disconnected|err_network|econnrefused|timed? ?out/i.test(s);
export async function withOfflineFallback<T>(live: () => Promise<Res<T>>, local: () => Promise<Res<T>>): Promise<Res<T>> {
  try {
    const r = await live();
    return !r.ok && r.kind === "error" && offlineMessage(r.message) ? await local() : r;
  } catch (e) {
    const message = String((e as Error)?.message ?? e);
    return offlineMessage(message) ? await local() : { ok: false, kind: "error", message };
  }
}
function addOfflineFallback(live: Repo): Repo {
  return {
    listScholars: (q, l) => withOfflineFallback(() => live.listScholars(q, l), async () => (await getLocalRepo()).listScholars(q, l)),
    getScholar: (slug) => withOfflineFallback(() => live.getScholar(slug), async () => (await getLocalRepo()).getScholar(slug)),
    filterOptions: () => withOfflineFallback(() => live.filterOptions(), async () => (await getLocalRepo()).filterOptions()),
    timelineEvents: (q, l) => withOfflineFallback(() => live.timelineEvents(q, l), async () => (await getLocalRepo()).timelineEvents(q, l)),
  };
}
export const getRepo = (): Promise<Repo> => (repo ??= mode === "live" && supabase ? Promise.resolve(addOfflineFallback(createLiveRepo(supabase))) : getLocalRepo());
