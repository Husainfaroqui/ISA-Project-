import type { Repo } from "./repo";
import { filterScholars, paginate } from "./search";
import { collectEvents, filterEvents } from "./timeline";
/** Local published-content layer; placeholder-only sample entries never reach public pages. */
export async function createLocalRepo(): Promise<Repo> {
  const { SAMPLE } = await import("../data/sample");
  const archive = SAMPLE.filter(s => s.researchDraft && [...s.works, ...s.contributions, ...s.events, ...s.relations].some(x => x.refs.length > 0));
  return {
    async listScholars(q) { const matches = filterScholars(archive, q); const p = paginate(matches, q.page ?? 1); return { ok: true, data: { items: p.items, total: matches.length, page: p.page, pages: p.pages } }; },
    async getScholar(slug) { const s = archive.find(x => x.slug === slug); return s ? { ok: true, data: s } : { ok: false, kind: "notfound", message: "Not found" }; },
    async filterOptions() { const u = (a: string[]) => [...new Set(a)].sort(); return { ok: true, data: { disciplines: u(archive.flatMap(s => s.disciplines)), regions: u(archive.map(s => s.region)) } }; },
    async timelineEvents(q, lang) { return { ok: true, data: filterEvents(collectEvents(archive, lang), q) }; },
  };
}
