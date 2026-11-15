import { RELATIONS } from "../lib/taxonomy";
import { esc } from "../lib/dom";
import type { Lang } from "../lib/i18n";
import type { Relation } from "../lib/types";
/** Related-scholars list (pure, unit-tested). `nameOf` localises names when the other scholar is loaded; `marksOf` supplies numbered citations. */
export function relationsHtml(rels: Relation[], lang: Lang, nameOf: (r: Relation) => string, marksOf: (r: Relation) => string, none: string): string {
  if (!rels.length) return `<p class="muted">${none}</p>`;
  return "<ul>" + rels.map(r => `<li>${esc((RELATIONS[r.type] ?? [r.type, r.type])[r.direction === "out" ? 0 : 1])}: <a href="/${lang}/scholars/${esc(r.otherSlug)}">${esc(nameOf(r))}</a> ${marksOf(r)}${r.description ? `<br><small class="muted">${esc(r.description)}</small>` : ""}</li>`).join("") + "</ul>";
}
