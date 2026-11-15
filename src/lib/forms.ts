import { esc } from "./dom";
export interface Field { name: string; label: string; type: "text" | "textarea" | "number" | "select" | "csv"; options?: [string, string][]; required?: boolean; dir?: "rtl" | "ltr" }
export function formHtml(fields: Field[], values: Record<string, unknown>, o: { action: string; submit: string; data?: Record<string, string> }): string {
  const val = (f: Field) => { const v = values[f.name]; return v == null ? "" : Array.isArray(v) ? v.join(", ") : String(v); };
  const input = (f: Field) => {
    const common = `name="${esc(f.name)}"${f.required ? " required" : ""}${f.dir ? ` dir="${f.dir}"` : ""}`;
    if (f.type === "textarea") return `<textarea ${common} rows="3">${esc(val(f))}</textarea>`;
    if (f.type === "select") return `<select ${common}>${f.required ? "" : '<option value=""></option>'}${(f.options ?? []).map(([v, n]) => `<option value="${esc(v)}"${v === val(f) ? " selected" : ""}>${esc(n)}</option>`).join("")}</select>`;
    return `<input ${common} type="${f.type === "number" ? "number" : "text"}" value="${esc(val(f))}">`;
  };
  const data = Object.entries(o.data ?? {}).map(([k, v]) => ` data-${esc(k)}="${esc(v)}"`).join("");
  return `<form class="aform" data-action="${esc(o.action)}"${data}>${fields.map(f => `<label>${esc(f.label)}${f.required ? " *" : ""}${input(f)}</label>`).join("")}<button class="btn" type="submit" style="color:var(--ink)">${esc(o.submit)}</button></form>`;
}
/** Form values -> row. Empty optional fields become null; numbers are validated; CSV fields become arrays. */
export function parseForm(fields: Field[], get: (name: string) => string | null | undefined): { ok: true; row: Record<string, unknown> } | { ok: false; message: string } {
  const row: Record<string, unknown> = {};
  for (const f of fields) {
    const raw = (get(f.name) ?? "").trim();
    if (!raw) { if (f.required) return { ok: false, message: `${f.label} is required.` }; row[f.name] = null; continue; }
    if (f.type === "number") { if (!/^-?\d+$/.test(raw)) return { ok: false, message: `${f.label} must be a whole number.` }; row[f.name] = parseInt(raw, 10); }
    else if (f.type === "csv") row[f.name] = raw.split(",").map(x => x.trim()).filter(Boolean);
    else row[f.name] = raw;
  }
  return { ok: true, row };
}
