import { tr, type Lang } from "../lib/i18n";
import { esc } from "../lib/dom";
export const loadingHtml = (lang: Lang) => `<p class="muted" role="status">${tr(lang, "loading")}</p>`;
/** Error / unconfigured / not-found block. Never shows mock data. */
export function errorHtml(lang: Lang, r: { kind: "unconfigured" | "error" | "notfound"; message: string }, retry = false): string {
  if (r.kind === "notfound") return `<h1>404</h1><p>${tr(lang, "unk")}</p>`;
  return `<div class="banner" role="alert"><strong>${tr(lang, "err_title")}</strong><br>${r.kind === "unconfigured" ? tr(lang, "err_cfg") + " <small>(see README: Supabase setup)</small>" : esc(r.message)}${retry ? ` <button class="btn" data-retry style="color:var(--ink)">${tr(lang, "retry")}</button>` : ""}</div>`;
}
