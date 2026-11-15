import { getRepo } from "../lib/repo";
import { errorHtml } from "./states";
import { displayName } from "../lib/search";
import { tr, dName, type Lang } from "../lib/i18n";
import { esc, safeUrl } from "../lib/dom";
import { kindLabel } from "../lib/taxonomy";
import type { Scholar, Contribution } from "../lib/types";
const row = (k: string, v?: string) => (v ? `<dt>${k}</dt><dd>${esc(v)}</dd>` : "");
/** Pure renderer (unit-tested). Editorial field names are English until reviewed translations exist. */
export function contributionHtml(s: Scholar, c: Contribution, lang: Lang): string {
  const t = (k: string) => tr(lang, k);
  const refs = c.refs.length ? "<ol>" + c.refs.map(r => `<li>${r.author ? esc(r.author) + ". " : ""}${safeUrl(r.url) ? `<a href="${esc(r.url!)}" rel="noopener noreferrer">${esc(r.title)}</a>` : esc(r.title)}${r.locator ? " — " + esc(r.locator) : ""}</li>`).join("") + "</ol>" : "";
  return `<section><div class="wrap"><p><a href="/${lang}/scholars/${s.slug}">← ${esc(displayName(s, lang))}</a></p><p class="eyebrow">${c.kind ? esc(kindLabel(c.kind)) : "Contribution"}</p><h1>${esc(c.title ?? c.text)}</h1>
  <dl class="facts">${row("Scholar", displayName(s, lang))}${row("Discipline", c.discipline ? dName(lang, c.discipline) : undefined)}${row("Period", c.periodText)}${row("What existed before", c.priorState)}${row("What the scholar contributed", c.detail)}</dl>
  <h2>Explanation</h2><p>${esc(c.text)}</p>${refs ? `<h2>${t("ref")}</h2>${refs}` : ""}</div></section>`;
}
export async function contributionPage(el: HTMLElement, lang: Lang, slug: string, id: string): Promise<string> {
  const r = await (await getRepo()).getScholar(slug), c = r.ok ? r.data.contributions.find(x => x.id === id) : undefined;
  if (!r.ok || !c) { const e = r.ok ? { kind: "notfound" as const, message: "" } : r; el.innerHTML = `<section><div class="wrap"><p><a href="/${lang}/scholars">${tr(lang, "back")}</a></p>${errorHtml(lang, e)}</div></section>`; return tr(lang, "unk"); }
  el.innerHTML = contributionHtml(r.data, c, lang); return c.title ?? c.text;
}
