import type { Scholar, Period } from "../lib/types";
// SAMPLE DATA: layout/testing only. No biographies; dates only where given in the project brief; all UNDER REVIEW.
const mk = (slug: string, en: string, ar: string, region: string, period: Period, disciplines: string[], works: string[] = [], extra: Partial<Scholar> = {}): Scholar =>
  ({ slug, names: { en, ar }, region, period, disciplines, bios: {}, works: works.map(title => ({ title, status: "under_review" as const, refs: [] })), contributions: [], sample: true, ...extra });
export const SAMPLE: Scholar[] = [
  mk("al-khwarizmi", "Muhammad ibn Musa al-Khwarizmi", "محمد بن موسى الخوارزمي", "Central Asia & Iraq", "early", ["Mathematics", "Algebra", "Astronomy", "Geography"], ["al-Kitab al-mukhtasar fi hisab al-jabr wa-l-muqabala"]),
  mk("al-razi", "Abu Bakr al-Razi", "أبو بكر الرازي", "Persia", "early", ["Medicine", "Chemistry", "Philosophy"]),
  mk("al-biruni", "Abu Rayhan al-Biruni", "أبو الريحان البيروني", "Central Asia", "classical", ["Astronomy", "Geography", "Mathematics", "Pharmacology"], ["al-Athar al-baqiya", "Kitab al-Saydana"]),
  mk("ibn-al-haytham", "Ibn al-Haytham", "ابن الهيثم", "Iraq & Egypt", "classical", ["Optics", "Physics", "Mathematics", "Astronomy"], ["Kitab al-Manazir"]),
  mk("ibn-sina", "Ibn Sina", "ابن سينا", "Persia", "classical", ["Medicine", "Philosophy"], ["al-Qanun fi al-tibb", "al-Shifa"]),
  mk("omar-khayyam", "Omar Khayyam", "عمر الخيام", "Persia", "classical", ["Mathematics", "Algebra", "Astronomy", "Philosophy"]),
  mk("ibn-rushd", "Ibn Rushd", "ابن رشد", "Andalusia", "classical", ["Philosophy", "Medicine"]),
  mk("ahmad-raza-khan", "Imam Ahmad Raza Khan (Ala Hazrat)", "امام احمد رضا خان", "South Asia", "modern", ["Mathematics", "Astronomy", "Philosophy"], ["Fauz-e-Mubeen Dar Radd-e-Harkat-e-Zameen"], { dates: "1856–1921 CE", names: { en: "Imam Ahmad Raza Khan (Ala Hazrat)", ar: "امام احمد رضا خان", ur: "امام احمد رضا خان" } }),
];
const UR: Record<string, string> = {"al-khwarizmi": "محمد بن موسیٰ الخوارزمی", "al-razi": "ابوبکر الرازی", "al-biruni": "ابو ریحان البیرونی", "ibn-al-haytham": "ابن الہیثم", "ibn-sina": "ابن سینا", "omar-khayyam": "عمر خیام", "ibn-rushd": "ابن رشد"};
SAMPLE.forEach(s => { if (UR[s.slug]) s.names.ur = UR[s.slug]; });
export const DISCIPLINES = ["Mathematics","Algebra","Geometry","Trigonometry","Astronomy","Physics","Optics","Chemistry","Medicine","Anatomy","Pharmacology","Engineering","Mechanical inventions","Geography","Geology","Botany","Zoology","Agriculture","Philosophy","Linguistics"];
