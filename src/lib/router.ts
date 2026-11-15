import { LANGS, type Lang } from "./i18n";
export type Route = { lang: Lang; name: "home" | "directory" | "timeline" | "library" | "admin" | "notfound" } | { lang: Lang; name: "contribution"; slug: string; id: string } | { lang: Lang; name: "profile"; slug: string };
export function parse(path: string): Route | null {
  const m = path.replace(/\/+$/, "").match(/^\/(en|ur|ar)(\/.*)?$/);
  if (!m) return null;
  const lang = m[1] as Lang, rest = m[2] ?? "";
  if (rest === "") return { lang, name: "home" };
  if (rest === "/scholars") return { lang, name: "directory" };
  if (rest === "/timeline") return { lang, name: "timeline" };
  if (rest === "/library") return { lang, name: "library" };
  if (rest === "/admin") return { lang, name: "admin" };
  const cm = rest.match(/^\/scholars\/([a-z0-9-]+)\/contributions\/([0-9a-f-]{36})$/);
  if (cm) return { lang, name: "contribution", slug: cm[1], id: cm[2] };
  const p = rest.match(/^\/scholars\/([a-z0-9-]+)$/);
  return p ? { lang, name: "profile", slug: p[1] } : { lang, name: "notfound" };
}
export const stored = (): Lang => { try { const s = localStorage.getItem("isa-lang"); if (s && (LANGS as string[]).includes(s)) return s as Lang; } catch { /* ignore */ } return "en"; };
export const swapLang = (path: string, l: Lang) => path.replace(/^\/(en|ur|ar)(?=\/|$)/, "/" + l);
export function go(href: string) { history.pushState(null, "", href); window.dispatchEvent(new Event("isa:nav")); }
