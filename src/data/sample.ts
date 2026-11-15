import type { Scholar, Period, Ref, Label } from "../lib/types";
import dossier from "../../content/ala-hazrat.json";
import batch from "../../content/batch-2a.json";
import batch2b from "../../content/batch-2b.json";
// Local archive records are derived from the cited research files below; generic placeholder profiles are excluded.
const mk = (slug: string, en: string, ar: string, region: string, period: Period, disciplines: string[], works: string[] = [], extra: Partial<Scholar> = {}): Scholar =>
  ({ slug, names: { en, ar }, region, period, disciplines, bios: {}, works: works.map(title => ({ title, status: "under_review" as const, refs: [] })), contributions: [], events: [], relations: [], sample: true, ...extra });
export const SAMPLE: Scholar[] = [
  mk("al-khwarizmi", "Muhammad ibn Musa al-Khwarizmi", "محمد بن موسى الخوارزمي", "Central Asia & Iraq", "early", ["Mathematics", "Algebra", "Astronomy", "Geography"], ["al-Kitab al-mukhtasar fi hisab al-jabr wa-l-muqabala"]),
  mk("ahmad-raza-khan", "Imam Ahmad Raza Khan (Ala Hazrat)", "امام احمد رضا خان", "South Asia", "modern", ["Mathematics", "Astronomy", "Philosophy"], ["Fauz-e-Mubeen Dar Radd-e-Harkat-e-Zameen"], { dates: "1856–1921 CE", names: { en: "Imam Ahmad Raza Khan (Ala Hazrat)", ar: "امام احمد رضا خان", ur: "امام احمد رضا خان" } }),
];
const UR: Record<string, string> = {"al-khwarizmi": "محمد بن موسیٰ الخوارزمی"};
SAMPLE.forEach(s => { if (UR[s.slug]) s.names.ur = UR[s.slug]; });
export const DISCIPLINES = ["Mathematics","Algebra","Geometry","Trigonometry","Astronomy","Physics","Optics","Chemistry","Medicine","Anatomy","Pharmacology","Engineering","Mechanical inventions","Geography","Geology","Botany","Zoology","Agriculture","Philosophy","Linguistics"];

// Ala Hazrat: researched DRAFT (content/ala-hazrat.json). Nothing here is VERIFIED; see docs/ALA_HAZRAT_DOSSIER_DRAFT.md.
const src = Object.fromEntries(dossier.sources.map(x => [x.id, x]));
const ref = (id: string, locator?: string | null, tier?: string): Ref => ({ title: src[id].title, author: src[id].author ?? undefined, url: src[id].url ?? undefined, locator: locator ?? undefined, tier: tier ?? src[id].tier });
const AH = SAMPLE.find(x => x.slug === "ahmad-raza-khan")!;
AH.sample = false; AH.researchDraft = true; AH.disciplines = ["Mathematics", "Astronomy", "Philosophy"];
AH.bios.en = dossier.scholar.biography;
AH.works = dossier.works.map(w => ({ title: w.title, status: "under_review" as const, refs: w.sources.map(r => ref(r.id, r.locator)), subject: w.subject ?? undefined, dateNote: w.year ?? undefined }));
AH.contributions = dossier.contributions.map(c => ({ id: c.id, text: c.text, label: "under_review" as const, lang: "en" as const, title: c.title, kind: c.kind, confidence: c.confidence, discipline: c.discipline, periodText: c.period, priorState: c.prior, detail: c.detail, refs: c.refs.map(r => ref(r.source, r.locator, r.tier)) }));
AH.events = dossier.events.map(e => ({ id: e.id, title: e.title, type: e.type, yearEarliest: e.year_earliest, yearLatest: e.year_latest, certainty: e.date_certainty as "exact" | "approximate" | "disputed", dateNote: e.date_note ?? undefined, description: e.description, confidence: e.confidence, label: e.label.toLowerCase().replace(/ /g, "_") as Label, refs: e.sources.map(r => ref(r.id, r.locator)) }));

// Sub-batch 2A researched DRAFTS (content/batch-2a.json): nothing here is human-reviewed or published.
const bsrc = Object.fromEntries(batch.sources.map(x => [x.id, x]));
const bref = (id: string, locator?: string | null, tier?: string): Ref => ({ title: bsrc[id].title, author: bsrc[id].author ?? undefined, url: bsrc[id].url ?? undefined, locator: locator ?? undefined, tier: tier ?? bsrc[id].tier });
const blab = (l: string) => l.toLowerCase().replace(/ /g, "_") as Label;
for (const sc of batch.scholars) {
  let s = SAMPLE.find(x => x.slug === sc.slug);
  if (!s) { s = { slug: sc.slug, names: { en: sc.name_en }, region: sc.region, period: sc.period as Period, disciplines: [], bios: {}, works: [], contributions: [], events: [], relations: [], sample: false }; SAMPLE.push(s); }
  s.names.en = sc.name_en; s.region = sc.region; s.dates = sc.dates; s.disciplines = sc.disciplines; s.kind = sc.kind as "individual" | "group"; s.sample = false; s.researchDraft = true;
  if (sc.biography) s.bios = { ...s.bios, en: sc.biography };
  s.works = batch.works.filter(w => w.scholar === sc.slug).map(w => ({ title: w.title, status: w.authorship_status as Label, refs: w.sources.map(r => bref(r.id, r.locator)), subject: w.subject ?? undefined }));
  s.contributions = batch.contributions.filter(c => c.scholar === sc.slug).map(c => ({ id: c.id, text: c.text, label: "under_review" as const, lang: "en" as const, title: c.title, kind: c.kind, confidence: c.confidence, discipline: c.discipline, periodText: c.period, priorState: c.prior, detail: c.detail, refs: c.refs.map(r => bref(r.source, r.locator, r.tier)) }));
  s.events = batch.events.filter(e => e.scholar === sc.slug).map(e => ({ id: e.id, title: e.title, type: e.type, yearEarliest: e.year_earliest, yearLatest: e.year_latest, certainty: e.date_certainty as "exact" | "approximate" | "disputed", dateNote: e.date_note ?? undefined, description: e.description, confidence: e.confidence, label: blab(e.label), refs: e.sources.map(r => bref(r.id, r.locator)) }));
}
for (const r of batch.relationships) {
  const a = SAMPLE.find(x => x.slug === r.scholar)!, b = SAMPLE.find(x => x.slug === r.related)!;
  const base = { id: r.id, type: r.type, description: r.description, confidence: r.confidence, label: blab(r.label), refs: r.sources.map(x => bref(x.id, x.locator)) };
  a.relations.push({ ...base, direction: "out", otherSlug: b.slug, otherName: b.names.en, otherNames: b.names }); b.relations.push({ ...base, direction: "in", otherSlug: a.slug, otherName: a.names.en, otherNames: a.names });
}

// Sub-batch 2B researched drafts. Bundled only in the explicitly selected demo
// mode; all claims remain under review and cite their research source records.
const b2bsrc = Object.fromEntries(batch2b.sources.map(x => [x.id, x]));
const b2bref = (id: string, locator?: string | null): Ref => {
  const x = b2bsrc[id];
  return { title: x?.title ?? id, author: x?.author ?? undefined, url: x?.url ?? undefined, locator: locator ?? undefined };
};
for (const sc of batch2b.scholars) {
  let s = SAMPLE.find(x => x.slug === sc.slug);
  if (!s) {
    s = { slug: sc.slug, names: { en: sc.name_en }, region: sc.region, period: sc.period as Period, disciplines: [], bios: {}, works: [], contributions: [], events: [], relations: [], sample: false };
    SAMPLE.push(s);
  }
  s.names = { en: sc.name_en, ar: sc.name_ar, ur: sc.name_ur };
  s.region = sc.region; s.period = sc.period as Period; s.dates = sc.dates;
  s.disciplines = sc.disciplines; s.kind = sc.kind as "individual" | "group";
  s.bios = { en: sc.biography };
  s.sample = false; s.researchDraft = true;
  s.works = sc.works.map(w => ({ title: w.title, status: "under_review" as const, refs: [b2bref(w.source, w.locator)], subject: w.subject ?? undefined }));
  s.contributions = sc.contributions.map(c => ({
    id: c.id, title: c.title, text: c.text, label: "under_review" as const, lang: "en" as const,
    refs: c.refs.map(r => b2bref(r.source, r.locator)), kind: c.kind, confidence: c.confidence,
    discipline: c.discipline, periodText: c.period, priorState: c.prior, detail: c.detail
  }));
  s.events = sc.events.map(ev => ({
    id: ev.id, title: ev.title, type: ev.type, yearEarliest: ev.year_earliest, yearLatest: ev.year_latest,
    certainty: ev.date_certainty as "exact" | "approximate" | "disputed", dateNote: ev.date_note ?? undefined,
    description: ev.description, confidence: ev.confidence,
    label: ev.label.toLowerCase().replace(/ /g, "_") as Label,
    refs: [b2bref(ev.source, ev.locator)]
  }));
}
