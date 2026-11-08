import { listScholars } from "../lib/repo";
import { filterScholars, paginate, displayName, PERIODS } from "../lib/search";
import { tr, dName, rName, type Lang } from "../lib/i18n";
import { esc, chip } from "../lib/dom";
import type { Query } from "../lib/types";
const read = (): Query => { const u = new URLSearchParams(location.search); return { q: u.get("q") ?? "", d: u.get("d") ?? "", r: u.get("r") ?? "", p: u.get("p") ?? "", s: u.get("s") === "period" ? "period" : "az", page: +(u.get("page") ?? 1) || 1 }; };
const uniq = (a: string[]) => [...new Set(a)].sort();
export async function directory(el: HTMLElement, lang: Lang) {
  const t = (k: string) => tr(lang, k), { scholars, source } = await listScholars(), qy = read();
  const sel = (id: string, label: string, vals: [string, string][], cur: string) => `<label>${label}<select id="${id}"><option value="">${t("all")}</option>${vals.map(([v, n]) => `<option value="${esc(v)}"${v === cur ? " selected" : ""}>${esc(n)}</option>`).join("")}</select></label>`;
  el.innerHTML = `<section id="scholars"><div class="wrap"><p class="eyebrow">${t("d")}</p><h1>${t("t")}</h1>
  ${source === "sample" ? `<div class="banner">${t("note")}</div>` : ""}
  <div class="filters" role="search"><label>${t("search")}<input id="q" type="search" value="${esc(qy.q ?? "")}" placeholder="English, عربي, اردو"></label>
  ${sel("fd", t("dis"), uniq(scholars.flatMap(s => s.disciplines)).map(v => [v, dName(lang, v)] as [string, string]), qy.d ?? "")}${sel("fr", t("reg"), uniq(scholars.map(s => s.region)).map(v => [v, rName(lang, v)] as [string, string]), qy.r ?? "")}${sel("fp", t("per"), Object.keys(PERIODS).map(k => [k, t("p_" + k)] as [string, string]), qy.p ?? "")}
  <label>${t("sort")}<select id="fs"><option value="az">${t("az")}</option><option value="period"${qy.s === "period" ? " selected" : ""}>${t("per")}</option></select></label></div>
  <p class="muted" id="count" aria-live="polite"></p><div class="grid" id="list"></div>
  <div class="pager"><button class="btn" id="prev">${t("prev")}</button><span id="pg"></span><button class="btn" id="next">${t("next")}</button></div></div></section>`;
  const $ = <T extends HTMLElement>(id: string) => el.querySelector<T>("#" + id)!;
  const update = () => {
    const f = filterScholars(scholars, qy), pg = paginate(f, qy.page ?? 1); qy.page = pg.page;
    $("count").textContent = `${f.length} ${t("n")}`; $("pg").textContent = `${t("pg")} ${pg.page} / ${pg.pages}`;
    $<HTMLButtonElement>("prev").disabled = pg.page <= 1; $<HTMLButtonElement>("next").disabled = pg.page >= pg.pages;
    $("list").innerHTML = pg.items.map(s => `<div class="card"><h3>${esc(displayName(s, lang))}</h3><p class="muted">${esc(rName(lang, s.region))} · ${t("p_" + s.period)}</p><p class="muted">${esc(s.disciplines.map(d => dName(lang, d)).join(lang === "en" ? ", " : "، "))}</p>${s.sample ? chip("under_review", lang) : ""}<p><a class="more" href="/${lang}/scholars/${s.slug}">${t("view")}</a></p></div>`).join("") || `<p class="muted">${t("none")}</p>`;
    const u = new URLSearchParams(); (["q", "d", "r", "p"] as const).forEach(k => qy[k] && u.set(k, qy[k]!)); if (qy.s === "period") u.set("s", "period"); if ((qy.page ?? 1) > 1) u.set("page", String(qy.page));
    history.replaceState(null, "", location.pathname + (u.size ? "?" + u : ""));
  };
  const bind = (id: string, k: "q" | "d" | "r" | "p" | "s") => $<HTMLInputElement>(id).addEventListener("input", e => { (qy as Record<string, unknown>)[k] = (e.target as HTMLInputElement).value; qy.page = 1; update(); });
  bind("q", "q"); bind("fd", "d"); bind("fr", "r"); bind("fp", "p"); bind("fs", "s");
  $("prev").onclick = () => { qy.page = (qy.page ?? 1) - 1; update(); }; $("next").onclick = () => { qy.page = (qy.page ?? 1) + 1; update(); };
  update();
}
