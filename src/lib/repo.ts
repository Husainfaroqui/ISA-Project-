import { supabase } from "./supabase";
import { SAMPLE } from "../data/sample";
import type { Scholar, Label, Period, Ref } from "./types";
import type { Lang } from "./i18n";
export interface Result { scholars: Scholar[]; source: "supabase" | "sample" }
let cache: Promise<Result> | null = null;
const CS = "claim_sources(locator,sources(title,author,url))";
const SELECT = `slug,region,period_group,birth_year,death_year,dates_note,scholar_translations(lang,name,biography),scholar_disciplines(disciplines(name_en)),contributions(description,label,lang,${CS}),works(original_title,authorship_status,${CS})`;
/* eslint-disable @typescript-eslint/no-explicit-any */
export const mapRefs = (cs: any[] | null | undefined): Ref[] => (cs ?? []).filter(c => c?.sources?.title).map(c => ({ title: c.sources.title, author: c.sources.author ?? undefined, url: c.sources.url ?? undefined, locator: c.locator ?? undefined }));
export function mapRow(r: any): Scholar {
  const tr: any[] = r.scholar_translations ?? [], names: any = {}, bios: any = {};
  tr.forEach(t => { names[t.lang] = t.name; if (t.biography) bios[t.lang] = t.biography; });
  const dates = r.dates_note ?? (r.birth_year && r.death_year ? `${r.birth_year}–${r.death_year} CE` : undefined);
  return { slug: r.slug, names: { en: names.en ?? r.slug, ...names }, region: r.region, period: r.period_group as Period, dates,
    disciplines: (r.scholar_disciplines ?? []).map((d: any) => d.disciplines?.name_en).filter(Boolean), bios,
    works: (r.works ?? []).map((w: any) => ({ title: w.original_title, status: w.authorship_status as Label, refs: mapRefs(w.claim_sources) })),
    contributions: (r.contributions ?? []).map((c: any) => ({ text: c.description, label: c.label as Label, lang: (c.lang ?? "en") as Lang, refs: mapRefs(c.claim_sources) })), sample: false };
}
export function listScholars(): Promise<Result> {
  return (cache ??= (async (): Promise<Result> => {
    if (!supabase) return { scholars: SAMPLE, source: "sample" };
    const { data, error } = await supabase.from("scholars").select(SELECT).eq("status", "published");
    if (error) { console.warn("Supabase error, using sample data:", error.message); return { scholars: SAMPLE, source: "sample" }; }
    return { scholars: (data ?? []).map(mapRow), source: "supabase" };
  })());
}
