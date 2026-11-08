import type { Lang } from "./i18n";
export type Period = "early" | "classical" | "modern";
export type Label = "verified" | "under_review" | "disputed" | "unverified" | "primary_source" | "modern_assessment";
export interface Ref { title: string; author?: string; url?: string; locator?: string }
export interface Scholar {
  slug: string; names: Partial<Record<Lang, string>> & { en: string };
  region: string; period: Period; dates?: string; disciplines: string[];
  bios: Partial<Record<Lang, string>>;
  works: { title: string; status: Label; refs: Ref[] }[];
  contributions: { text: string; label: Label; lang: Lang; refs: Ref[] }[];
  sample: boolean;
}
export interface Query { q?: string; d?: string; r?: string; p?: string; s?: "az" | "period"; page?: number }
