import { getRepo } from "../lib/repo";
import { errorHtml, loadingHtml } from "./states";
import { groupByCentury, formatYears, centuryOf, ordinal, type FlatEvent, type EventQuery } from "../lib/timeline";
import { EVENT_TYPES } from "../lib/taxonomy";
import { tr, type Lang } from "../lib/i18n";
import { esc, safeUrl } from "../lib/dom";
import type { TimelineEvent, Ref } from "../lib/types";
const refLine = (r: Ref) => `${r.author ? esc(r.author) + ". " : ""}${safeUrl(r.url) ? `<a href="${esc(r.url!)}" rel="noopener noreferrer">${esc(r.title)}</a>` : esc(r.title)}${r.locator ? " (" + esc(r.locator) + ")" : ""}`;
/** One event card (pure, unit-tested). `marks` replaces the inline source list when the caller numbers citations itself. */
export function eventItemHtml(e: TimelineEvent, lang: Lang, opts: { scholar?: { slug: string; name: string }; marks?: string } = {}): string {
  const src = opts.marks ?? (e.refs.length ? e.refs.map(refLine).join("; ") : "");
  return `<li><span class="yr">${esc(formatYears(e))}</span><h3>${esc(e.title)}</h3><p class="muted">${esc(EVENT_TYPES[e.type] ?? e.type)}${opts.scholar ? ` · <a href="/${lang}/scholars/${opts.scholar.slug}">${esc(opts.scholar.name)}</a>` : ""}</p>
  ${e.description ? `<p>${esc(e.description)}</p>` : ""}${e.dateNote ? `<p class="muted"><small>Date note: ${esc(e.dateNote)}</small></p>` : ""}${src ? `<p class="src">${src}</p>` : ""}</li>`;
}
export const timelineListHtml = (evs: FlatEvent[], lang: Lang) => evs.length ? groupByCentury(evs).map(([c, g]) => `<h2>${c ? ordinal(c) + " century" : "Before the common era"}</h2><ol class="tl">${g.map(e => eventItemHtml(e, lang, { scholar: { slug: e.scholarSlug, name: e.scholarName } })).join("")}</ol>`).join("") : `<p class="muted">${tr(lang, "tl_none")}</p>`;
export async function timelinePage(el: HTMLElement, lang: Lang) {
  const t = (k: string) => tr(lang, k), repo = await getRepo();
  el.innerHTML = `<section><div class="wrap"><p class="eyebrow">${t("tl")}</p><h1>${t("tl")}</h1>${loadingHtml(lang)}</div></section>`;
  const first = await repo.timelineEvents({}, lang);
  if (!first.ok) { el.innerHTML = `<section><div class="wrap"><h1>${t("tl")}</h1>${errorHtml(lang, first, true)}</div></section>`; el.querySelector("[data-retry]")?.addEventListener("click", () => timelinePage(el, lang)); return; }
  const all = first.data, u = new URLSearchParams(location.search), q: EventQuery = { t: u.get("t") ?? "", s: u.get("s") ?? "", c: u.get("c") ?? "" };
  const opt = (v: string, n: string, cur?: string) => `<option value="${esc(v)}"${v === cur ? " selected" : ""}>${esc(n)}</option>`;
  const sel = (id: string, label: string, opts: string) => `<label>${label}<select id="${id}"><option value="">${t("all")}</option>${opts}</select></label>`;
  const scholarsWith = [...new Map(all.map(e => [e.scholarSlug, e.scholarName])).entries()];
  const centuries = [...new Set(all.map(e => centuryOf(e.yearEarliest)))].sort((a, b) => a - b);
  el.innerHTML = `<section><div class="wrap"><p class="eyebrow">${t("tl")}</p><h1>${t("tl")}</h1>
  <p class="muted">Dates retain the ranges and qualifications recorded in the historical sources.</p>
  <div class="filters" role="search">${sel("ft", t("type"), Object.entries(EVENT_TYPES).map(([k, v]) => opt(k, v, q.t)).join(""))}${sel("fs", t("t"), scholarsWith.map(([k, v]) => opt(k, v, q.s)).join(""))}${sel("fc", t("century"), centuries.map(c => opt(String(c), c ? ordinal(c) : "BCE", q.c)).join(""))}</div>
  <p class="muted" id="count" aria-live="polite"></p><div id="tl"></div></div></section>`;
  let seq = 0;
  const update = async () => {
    const me = ++seq, box = el.querySelector("#tl")!; box.innerHTML = loadingHtml(lang);
    const r = await repo.timelineEvents(q, lang); if (me !== seq) return;
    if (!r.ok) { box.innerHTML = errorHtml(lang, r, true); box.querySelector("[data-retry]")?.addEventListener("click", update); return; }
    el.querySelector("#count")!.textContent = `${r.data.length} ${t("ev_n")}`; box.innerHTML = timelineListHtml(r.data, lang);
    const p = new URLSearchParams(); (["t", "s", "c"] as const).forEach(k => q[k] && p.set(k, q[k]!)); history.replaceState(null, "", location.pathname + (p.size ? "?" + p : ""));
  };
  ([["ft", "t"], ["fs", "s"], ["fc", "c"]] as const).forEach(([id, k]) => el.querySelector<HTMLSelectElement>("#" + id)!.addEventListener("input", e => { q[k] = (e.target as HTMLSelectElement).value; update(); }));
  await update();
}
