import { getRepo } from "../lib/repo";
import { PERIODS, displayName } from "../lib/search";
import { tr, dName, rName, type Lang } from "../lib/i18n";
import { esc } from "../lib/dom";
import { loadingHtml, errorHtml } from "./states";
import type { Query, Scholar } from "../lib/types";
const read = (): Query => { const u = new URLSearchParams(location.search); return { q: u.get("q") ?? "", d: u.get("d") ?? "", r: u.get("r") ?? "", p: u.get("p") ?? "", s: u.get("s") === "period" ? "period" : "az", page: +(u.get("page") ?? 1) || 1 }; };
export function cardHtml(s: Scholar, lang: Lang): string {
  const t = (k: string) => tr(lang, k);
  return `<div class="card"><h3>${esc(displayName(s, lang))}</h3>${s.kind === "group" ? `<p class="muted">${t("grp")}</p>` : ""}<p class="muted">${esc(rName(lang, s.region))} · ${t("p_" + s.period)}</p><p class="muted">${esc(s.disciplines.map(d => dName(lang, d)).join(lang === "en" ? ", " : "، "))}</p><p><a class="more" href="/${lang}/scholars/${esc(s.slug)}">${t("view")}</a></p></div>`;
}
export async function directory(el: HTMLElement, lang: Lang) {
  const t = (k: string) => tr(lang, k), repo = await getRepo(), qy = read();
  el.innerHTML = `<section><div class="wrap">${loadingHtml(lang)}</div></section>`;
  const opts = await repo.filterOptions();
  if (!opts.ok) { el.innerHTML = `<section><div class="wrap"><h1>${t("t")}</h1>${errorHtml(lang, opts, true)}</div></section>`; el.querySelector("[data-retry]")?.addEventListener("click", () => directory(el, lang)); return; }
  const sel = (id: string, label: string, vals: [string, string][], cur: string) => `<label>${label}<select id="${id}"><option value="">${t("all")}</option>${vals.map(([v, n]) => `<option value="${esc(v)}"${v === cur ? " selected" : ""}>${esc(n)}</option>`).join("")}</select></label>`;
  el.innerHTML = `<section id="scholars"><div class="wrap"><p class="eyebrow">${t("d")}</p><h1>${t("t")}</h1>
  <div class="filters" role="search"><label>${t("search")}<input id="q" type="search" value="${esc(qy.q ?? "")}" placeholder="English, عربي, اردو"></label>
  ${sel("fd", t("dis"), opts.data.disciplines.map(v => [v, dName(lang, v)] as [string, string]), qy.d ?? "")}${sel("fr", t("reg"), opts.data.regions.map(v => [v, rName(lang, v)] as [string, string]), qy.r ?? "")}${sel("fp", t("per"), Object.keys(PERIODS).map(k => [k, t("p_" + k)] as [string, string]), qy.p ?? "")}
  <label>${t("sort")}<select id="fs"><option value="az">${t("az")}</option><option value="period"${qy.s === "period" ? " selected" : ""}>${t("per")}</option></select></label></div>
  <p class="muted" id="count" aria-live="polite"></p><div class="grid" id="list"></div>
  <div class="pager"><button class="btn" id="prev">${t("prev")}</button><span id="pg"></span><button class="btn" id="next">${t("next")}</button></div></div></section>`;
  const $ = <T extends HTMLElement>(id: string) => el.querySelector<T>("#" + id)!;
  let seq = 0, pages = 1;
  const update = async () => {
    const me = ++seq; $("list").innerHTML = loadingHtml(lang);
    const r = await repo.listScholars(qy, lang);
    if (me !== seq) return;                                    // a newer request superseded this one
    if (!r.ok) { $("list").innerHTML = errorHtml(lang, r, true); $("list").querySelector("[data-retry]")?.addEventListener("click", update); return; }
    qy.page = r.data.page; pages = r.data.pages;
    $("count").textContent = `${r.data.total} ${t("n")}`; $("pg").textContent = `${t("pg")} ${r.data.page} / ${r.data.pages}`;
    $<HTMLButtonElement>("prev").disabled = r.data.page <= 1; $<HTMLButtonElement>("next").disabled = r.data.page >= r.data.pages;
    $("list").innerHTML = r.data.items.map(s => cardHtml(s, lang)).join("") || `<p class="muted">${t("none")}</p>`;
    const u = new URLSearchParams(); (["q", "d", "r", "p"] as const).forEach(k => qy[k] && u.set(k, qy[k]!)); if (qy.s === "period") u.set("s", "period"); if ((qy.page ?? 1) > 1) u.set("page", String(qy.page));
    history.replaceState(null, "", location.pathname + (u.size ? "?" + u : ""));
  };
  let timer: ReturnType<typeof setTimeout> | undefined;
  const bind = (id: string, k: "q" | "d" | "r" | "p" | "s", wait = 0) => $<HTMLInputElement>(id).addEventListener("input", e => { (qy as Record<string, unknown>)[k] = (e.target as HTMLInputElement).value; qy.page = 1; clearTimeout(timer); timer = setTimeout(update, wait); });
  bind("q", "q", 250); bind("fd", "d"); bind("fr", "r"); bind("fp", "p"); bind("fs", "s");
  $("prev").onclick = () => { qy.page = Math.max(1, (qy.page ?? 1) - 1); update(); }; $("next").onclick = () => { qy.page = Math.min(pages, (qy.page ?? 1) + 1); update(); };
  await update();
}
