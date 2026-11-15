import type { Scholar, Query } from "./types";
import type { Lang } from "./i18n";
export const PERIODS = { early: "Early (8th–10th c.)", classical: "Classical (11th–13th c.)", modern: "Modern (19th–20th c.)" } as const;
export const PAGE_SIZE = 6;
export const norm = (s: string) => s.normalize("NFKD").replace(/[\u064B-\u065F\u0670]/g, "").replace(/[أإآ]/g, "ا").replace(/[يى]/g, "ی").replace(/ك/g, "ک").toLowerCase().trim();
export const displayName = (s: Scholar, l: Lang) => s.names[l] ?? s.names.en;
const searchableText = (s: Scholar) => [
  ...Object.values(s.names), s.slug, s.region, ...s.disciplines,
  ...Object.values(s.bios), ...s.works.map(w => w.title),
  ...s.contributions.flatMap(c => [c.title, c.text, c.discipline, c.detail, c.priorState]),
  ...s.events.flatMap(e => [e.title, e.description, e.dateNote]),
  ...s.relations.flatMap(r => [r.otherName, r.description, r.type]),
].filter(Boolean).join(" ");
export function filterScholars(all: Scholar[], q: Query): Scholar[] {
  const n = norm(q.q ?? "");
  const r = all.filter(s => (!n || norm(searchableText(s)).includes(n)) && (!q.d || s.disciplines.includes(q.d)) && (!q.r || s.region === q.r) && (!q.p || s.period === q.p));
  const order = Object.keys(PERIODS);
  return r.sort((a, b) => (q.s === "period" ? order.indexOf(a.period) - order.indexOf(b.period) : 0) || a.names.en.localeCompare(b.names.en));
}
export function paginate<T>(a: T[], page: number, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(a.length / size)), p = Math.min(Math.max(1, page || 1), pages);
  return { items: a.slice((p - 1) * size, p * size), page: p, pages };
}
