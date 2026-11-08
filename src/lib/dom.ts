import { cName, type Lang } from "./i18n";
export const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
export const safeUrl = (u?: string) => (u && /^https?:\/\//i.test(u) ? u : undefined);
export const chip = (label: string, lang: Lang = "en") => `<span class="chip ${({ verified: "verified", under_review: "review", disputed: "disputed", unverified: "unver", primary_source: "primary-s", modern_assessment: "modern" } as Record<string, string>)[label] ?? "review"}">${cName(lang, label.replace("_", " ").toUpperCase())}</span>`;
