import { listScholars } from "../lib/repo";
import { displayName, PERIODS } from "../lib/search";
import { tr, dName, rName, type Lang } from "../lib/i18n";
import { esc, chip, safeUrl } from "../lib/dom";
import { numberRefs, contributionsFor, bioFor, type Cite } from "../lib/cite";
export async function profile(el: HTMLElement, lang: Lang, slug: string): Promise<string> {
  const t = (k: string) => tr(lang, k), s = (await listScholars()).scholars.find(x => x.slug === slug);
  const back = `<p><a href="/${lang}/scholars">${t("back")}</a></p>`;
  if (!s) { el.innerHTML = `<section><div class="wrap">${back}<h1>404</h1><p>${t("unk")}</p></div></section>`; return t("unk"); }
  const name = displayName(s, lang), none = (k: string) => `<p class="muted">${t(k)}</p>`, { list, cite } = numberRefs();
  const marks = (c: Cite[]) => c.length ? c.map(x => `<a class="cite" href="#ref-${x.n}">[${x.n}${x.locator ? ": " + esc(x.locator) : ""}]</a>`).join(" ") : `<span class="chip unver">${t("nosrc")}</span>`;
  const bio = bioFor(s, lang), con = contributionsFor(s, lang), fb = `<p class="muted"><small>${t("fb")}</small></p>`;
  const conHtml = con.items.length ? (con.fallback ? fb : "") + "<ul>" + con.items.map(c => `<li>${esc(c.text)} ${chip(c.label, lang)} ${marks(cite(c.refs))}</li>`).join("") + "</ul>" : none("conT");
  const wkHtml = s.works.length ? "<ul>" + s.works.map(w => `<li><i>${esc(w.title)}</i> ${chip(w.status, lang)} ${marks(cite(w.refs))}</li>`).join("") + "</ul>" + none("wkN") : none("wkN");
  const refHtml = list.length ? "<ol>" + list.map((r, i) => `<li id="ref-${i + 1}">${r.author ? esc(r.author) + ". " : ""}${safeUrl(r.url) ? `<a href="${esc(r.url!)}" rel="noopener noreferrer">${esc(r.title)}</a>` : esc(r.title)}</li>`).join("") + "</ol>" : none("refT");
  el.innerHTML = `<section><div class="wrap">${back}<p class="eyebrow">${t("d")}</p><h1>${esc(name)}</h1>${s.names.ar ? `<p class="arname" lang="ar">${esc(s.names.ar)}</p>` : ""}
  ${s.sample ? `<div class="banner">${t("ban")}</div><p>${chip("under_review", lang)}</p>` : ""}
  <dl class="facts"><dt>${t("dt")}</dt><dd>${s.dates ? esc(s.dates) : t("dtp")}</dd><dt>${t("reg")}</dt><dd>${esc(rName(lang, s.region))}</dd><dt>${t("per")}</dt><dd>${t("p_" + s.period)}</dd><dt>${t("dis")}</dt><dd>${esc(s.disciplines.map(d => dName(lang, d)).join(lang === "en" ? ", " : "، "))}</dd></dl>
  <h2>${t("bio")}</h2>${bio ? (bio.fallback ? fb : "") + `<p>${esc(bio.text)}</p>` : none("bioT")}
  <h2>${t("con")}</h2>${conHtml}<h2>${t("wk")}</h2>${wkHtml}<h2>${t("ref")}</h2>${refHtml}</div></section>`;
  return name;
}
export { PERIODS };
