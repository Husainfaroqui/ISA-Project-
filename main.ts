import "./styles/main.css";
import header from "./pages/header.html?raw";
import footer from "./pages/footer.html?raw";
import { homeHtml, homeMount } from "./pages/home";
import { directory } from "./pages/directory";
import { profile } from "./pages/profile";
import { parse, go, stored, swapLang } from "./lib/router";
import { T, tr, dir, LANGS, cName, termName, type Lang } from "./lib/i18n";

const app = document.getElementById("app")!;
const i18n = (root: HTMLElement, l: Lang) => {
  if (l === "en") return;
  root.querySelectorAll<HTMLElement>("[data-i18n]").forEach(n => { const v = T[l]?.[n.dataset.i18n!]; if (v) n.textContent = v; });
  root.querySelectorAll<HTMLElement>("main .chip").forEach(n => { const k = n.textContent!.trim(); const v = cName(l, k); if (v !== k) n.textContent = v; });
  root.querySelectorAll<HTMLElement>("#dossier h3, #discList h3, ol.steps li").forEach(n => { n.textContent = termName(l, n.textContent!.trim()); });
};
function head(l: Lang, title: string) {
  document.title = title; const base = location.origin;
  document.querySelectorAll("link[data-seo]").forEach(n => n.remove());
  const add = (rel: string, href: string, hl?: string) => { const k = document.createElement("link"); k.rel = rel; k.href = href; if (hl) k.hreflang = hl; k.dataset.seo = "1"; document.head.appendChild(k); };
  add("canonical", base + location.pathname);
  LANGS.forEach(x => add("alternate", base + swapLang(location.pathname, x), x));
}
async function render() {
  let r = parse(location.pathname);
  if (!r) { history.replaceState(null, "", `/${stored()}/`); r = parse(location.pathname)!; }
  const l = r.lang; document.documentElement.lang = l; document.documentElement.dir = dir(l);
  try { localStorage.setItem("isa-lang", l); } catch { /* ignore */ }
  app.innerHTML = header.replaceAll("{L}", l) + `<main id="top"></main>` + footer.replaceAll("{L}", l);
  app.querySelectorAll<HTMLButtonElement>(".lang button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === l)));
  const main = app.querySelector<HTMLElement>("main")!; let title = "Islamic Science Archive (ISA)";
  if (r.name === "home") { main.innerHTML = homeHtml.replaceAll("{L}", l); homeMount(main); }
  else if (r.name === "directory") { await directory(main, l); title = tr(l, "t") + " – ISA"; }
  else if (r.name === "profile") { title = (await profile(main, l, r.slug)) + " – ISA"; }
  else main.innerHTML = `<section><div class="wrap"><h1>404</h1><p><a href="/${l}/">${tr(l, "back")}</a></p></div></section>`;
  i18n(app, l); head(l, title);
  const h = location.hash && app.querySelector(location.hash); (h as HTMLElement | null)?.scrollIntoView(); if (!location.hash) scrollTo(0, 0);
}
document.addEventListener("click", e => {
  const t = e.target as HTMLElement, b = t.closest<HTMLButtonElement>("button[data-lang]");
  if (b) return go(swapLang(location.pathname, b.dataset.lang as Lang) + location.search + location.hash);
  const a = t.closest<HTMLAnchorElement>("a[href^='/']");
  if (a && !e.metaKey && !e.ctrlKey && a.origin === location.origin) { e.preventDefault(); go(a.pathname + a.search + a.hash); }
});
addEventListener("isa:nav", render); addEventListener("popstate", render); render();
