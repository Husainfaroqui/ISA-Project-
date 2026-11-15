import type { Scholar, TimelineEvent } from "./types";
import { displayName } from "./search";
import type { Lang } from "./i18n";
export interface FlatEvent extends TimelineEvent { scholarSlug: string; scholarName: string }
export const centuryOf = (y: number) => (y > 0 ? Math.ceil(y / 100) : 0);
export const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"}`;
/** Date label that keeps uncertainty visible: 1856 | c. 1856 | c. 1000–1010 | 1919–1920 (disputed) */
export function formatYears(e: Pick<TimelineEvent, "yearEarliest" | "yearLatest" | "certainty">): string {
  const r = e.yearEarliest === e.yearLatest ? String(e.yearEarliest) : `${e.yearEarliest}–${e.yearLatest}`;
  return e.certainty === "exact" ? r : e.certainty === "approximate" ? `c. ${r}` : `${r} (disputed)`;
}
export const collectEvents = (scholars: Scholar[], lang: Lang): FlatEvent[] => scholars.flatMap(s => s.events.map(e => ({ ...e, scholarSlug: s.slug, scholarName: displayName(s, lang) })));
export interface EventQuery { t?: string; s?: string; c?: string }
export function filterEvents(all: FlatEvent[], q: EventQuery): FlatEvent[] {
  return all.filter(e => (!q.t || e.type === q.t) && (!q.s || e.scholarSlug === q.s) && (!q.c || String(centuryOf(e.yearEarliest)) === q.c))
    .sort((a, b) => a.yearEarliest - b.yearEarliest || a.yearLatest - b.yearLatest || a.title.localeCompare(b.title));
}
export function groupByCentury(evs: FlatEvent[]): [number, FlatEvent[]][] {
  const m = new Map<number, FlatEvent[]>(); evs.forEach(e => { const c = centuryOf(e.yearEarliest); m.set(c, [...(m.get(c) ?? []), e]); });
  return [...m.entries()].sort((a, b) => a[0] - b[0]);
}
