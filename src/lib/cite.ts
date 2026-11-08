import type { Ref, Scholar } from "./types";
import type { Lang } from "./i18n";
export interface Cite { n: number; locator?: string }
/** Numbers unique sources across a profile; each claim gets [n, locator] markers. */
export function numberRefs() {
  const list: Ref[] = [], key = (r: Ref) => [r.title, r.author ?? "", r.url ?? ""].join("|");
  const cite = (refs: Ref[]): Cite[] => refs.map(r => {
    let i = list.findIndex(x => key(x) === key(r));
    if (i < 0) { list.push({ title: r.title, author: r.author, url: r.url }); i = list.length - 1; }
    return { n: i + 1, locator: r.locator };
  });
  return { list, cite };
}
/** Contributions in the reader's language, falling back to English (flagged). */
export function contributionsFor(s: Scholar, l: Lang) {
  const own = s.contributions.filter(c => c.lang === l);
  return own.length || l === "en" ? { items: own, fallback: false } : { items: s.contributions.filter(c => c.lang === "en"), fallback: s.contributions.some(c => c.lang === "en") };
}
export const bioFor = (s: Scholar, l: Lang) => (s.bios[l] ? { text: s.bios[l]!, fallback: false } : s.bios.en ? { text: s.bios.en, fallback: l !== "en" } : null);
