import { LANGS, type Lang } from "./i18n";
export type Route = { lang: Lang; name: "home" | "directory" | "notfound" } | { lang: Lang; name: "profile"; slug: string };
export function parse(path: string): Route | null {
  const m = path.replace(/\/+$/, "").match(/^\/(en|ur|ar)(\/.*)?$/);
  if (!m) return null;
  const lang = m[1] as Lang, rest = m[2] ?? "";
  if (rest === "") return { lang, name: "home" };
  if (rest === "/scholars") return { lang, name: "directory" };
  const p = rest.match(/^\/scholars\/([a-z0-9-]+)$/);
  return p ? { lang, name: "profile", slug: p[1] } : { lang, name: "notfound" };
}
export const stored = (): Lang => { try { const s = localStorage.getItem("isa-lang"); if (s && (LANGS as string[]).includes(s)) return s as Lang; } catch { /* ignore */ } return "en"; };
export const swapLang = (path: string, l: Lang) => path.replace(/^\/(en|ur|ar)(?=\/|$)/, "/" + l);
export function go(href: string) { history.pushState(null, "", href); window.dispatchEvent(new Event("isa:nav")); }
