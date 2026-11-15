import { describe, it, expect } from "vitest";
import { SAMPLE, DISCIPLINES } from "../src/data/sample";
import { filterScholars, paginate, norm, displayName } from "../src/lib/search";
import { parse, swapLang } from "../src/lib/router";
import { mapRow } from "../src/lib/repo";
import { L, T, dir, dName, rName, cName } from "../src/lib/i18n";
import { numberRefs, contributionsFor, bioFor } from "../src/lib/cite";
import { esc, safeUrl } from "../src/lib/dom";
import { readFileSync } from "node:fs";
describe("search", () => {
  it("finds English, Arabic and Urdu names", () => {
    expect(filterScholars(SAMPLE, { q: "biruni" })[0].slug).toBe("al-biruni");
    expect(filterScholars(SAMPLE, { q: "ابن" }).length).toBe(3);
    expect(filterScholars(SAMPLE, { q: "احمد رضا" })[0].slug).toBe("ahmad-raza-khan");
  });
  it("filters and sorts", () => {
    expect(filterScholars(SAMPLE, { d: "Optics" }).map(s => s.slug)).toEqual(["al-kindi", "ibn-al-haytham"]);
    expect(filterScholars(SAMPLE, { r: "Iran & Iraq", p: "early" }).map(s => s.slug)).toEqual(["al-razi"]);
    expect(filterScholars(SAMPLE, { s: "period" })[0].period).toBe("early");
    expect(filterScholars(SAMPLE, { s: "period" }).at(-1)!.period).toBe("modern");
  });
  it("paginates and clamps", () => {
    expect(paginate(SAMPLE, 1).items.length).toBe(6); const pages = Math.ceil(SAMPLE.length / 6);
    expect(paginate(SAMPLE, pages).items.length).toBe(SAMPLE.length - 6 * (pages - 1));
    expect(paginate(SAMPLE, 99).page).toBe(pages);
  });
  it("normalises Arabic variants", () => expect(norm("أحمد")).toBe(norm("احمد")));
});
describe("router", () => {
  it("parses clean URLs", () => {
    expect(parse("/en/scholars/al-biruni")).toEqual({ lang: "en", name: "profile", slug: "al-biruni" });
    expect(parse("/ur/scholars")).toEqual({ lang: "ur", name: "directory" });
    expect(parse("/ar/")).toEqual({ lang: "ar", name: "home" });
    expect(parse("/en/admin")).toEqual({ lang: "en", name: "admin"});
    expect(parse("/en/library")).toEqual({ lang: "en", name: "library"});
    expect(parse("/ar/nope")?.name).toBe("notfound");
    expect(parse("/fr/")).toBeNull();
    expect(swapLang("/en/scholars/x", "ur")).toBe("/ur/scholars/x");
  });
});
describe("data mapping", () => {
  const row = { slug: "x", region: "R", period_group: "early", birth_year: 1, death_year: 2,
    scholar_translations: [{ lang: "en", name: "X", biography: "b" }, { lang: "ur", name: "ایکس", biography: null }],
    scholar_disciplines: [{ disciplines: { name_en: "Optics" } }],
    works: [{ original_title: "W", authorship_status: "verified", subject:"Optics", original_language:"Arabic", publication_note:"approximate period", claim_sources: [{ locator: "p.1", sources: { title: "S", author: "A", url: "https://e.org" } }] }],
    contributions: [{ description: "C", label: "disputed", lang: "en", claim_sources: [{ locator: "f.2r", sources: { title: "S2", author: null, url: null } }, { locator: "z", sources: null }] }] };
  it("maps works AND contributions with their own sources and locators", () => {
    const s = mapRow(row);
    expect(s.works[0].refs).toEqual([{ title: "S", author: "A", url: "https://e.org", locator: "p.1" }]);
    expect(s.works[0]).toMatchObject({subject:"Optics",language:"Arabic",dateNote:"approximate period"});
    expect(s.contributions[0].refs).toEqual([{ title: "S2", author: undefined, url: undefined, locator: "f.2r" }]);
    expect(s.contributions[0].label).toBe("disputed");
    expect(s.names.ur).toBe("ایکس"); expect(s.bios).toEqual({ en: "b" }); expect(s.dates).toBe("1–2 CE"); expect(s.sample).toBe(false);
  });
  it("tolerates missing nested data", () => { const s = mapRow({ slug: "y", region: "R", period_group: "modern" }); expect(s.works).toEqual([]); expect(s.contributions).toEqual([]); expect(s.names.en).toBe("y"); });
  it("contains no placeholder-only scholar records", () => SAMPLE.forEach(s => { expect(s.researchDraft).toBe(true); expect(s.sample).toBe(false); expect([...s.works,...s.contributions,...s.events,...s.relations].some(x => x.refs.length)).toBe(true); }));
  it("dates appear only on research-backed profiles", () => expect(SAMPLE.filter(s => s.dates).every(s => s.researchDraft)).toBe(true));
});
describe("citations", () => {
  it("numbers unique sources and keeps per-claim locators", () => {
    const { list, cite } = numberRefs();
    const a = cite([{ title: "S", locator: "p.1" }, { title: "T", locator: "p.9" }]), b = cite([{ title: "S", locator: "p.7" }]);
    expect(a.map(x => x.n)).toEqual([1, 2]); expect(b).toEqual([{ n: 1, locator: "p.7" }]); expect(list.length).toBe(2);
  });
  it("falls back to English contributions/bio and flags it", () => {
    const s = mapRow({ slug: "z", region: "R", period_group: "early", scholar_translations: [{ lang: "en", name: "Z", biography: "bio" }], contributions: [{ description: "c", label: "verified", lang: "en" }] });
    expect(contributionsFor(s, "ar")).toMatchObject({ fallback: true }); expect(contributionsFor(s, "en").fallback).toBe(false);
    expect(bioFor(s, "ur")).toEqual({ text: "bio", fallback: true }); expect(bioFor(mapRow({ slug: "q", region: "R", period_group: "early" }), "en")).toBeNull();
  });
  it("escapes HTML and rejects non-http URLs", () => { expect(esc('<a href="x">&')).toBe("&lt;a href=&quot;x&quot;&gt;&amp;"); expect(safeUrl("javascript:alert(1)")).toBeUndefined(); expect(safeUrl("https://a.org")).toBe("https://a.org"); });
});
describe("translations", () => {
  const root = (f: string) => readFileSync(new URL("../src/pages/" + f, import.meta.url), "utf8");
  const keys = ["home.html", "header.html", "footer.html"].flatMap(f => [...root(f).matchAll(/data-i18n="(\w+)"/g)].map(m => m[1]));
  it("every data-i18n key used in templates exists in Urdu and Arabic", () => keys.forEach(k => { expect(T.ur[k], "ur " + k).toBeTruthy(); expect(T.ar[k], "ar " + k).toBeTruthy(); }));
  it("every sample discipline, region and chip label has Urdu and Arabic", () => {
    [...DISCIPLINES, ...SAMPLE.flatMap(s => s.disciplines)].forEach(d => { expect(dName("ur", d)).not.toBe(d); expect(dName("ar", d)).not.toBe(d); });
    SAMPLE.forEach(s => { expect(rName("ur", s.region)).not.toBe(s.region); expect(rName("ar", s.region)).not.toBe(s.region); });
    ["VERIFIED", "UNDER REVIEW", "DISPUTED", "UNVERIFIED", "PRIMARY SOURCE", "MODERN ASSESSMENT"].forEach(c => { expect(cName("ur", c)).not.toBe(c); expect(cName("ar", c)).not.toBe(c); });
  });
  it("English passes through unchanged; unknown terms fall back to English", () => { expect(dName("en", "Optics")).toBe("Optics"); expect(rName("ar", "Atlantis")).toBe("Atlantis"); });
  it("every sample scholar has Arabic and Urdu names", () => SAMPLE.forEach(s => { if (s.researchDraft && !s.names.ar) { expect(displayName(s, "ar")).toBe(s.names.en); return; } expect(s.names.ar, s.slug).toBeTruthy(); expect(s.names.ur, s.slug).toBeTruthy(); expect(displayName(s, "ur")).toBe(s.names.ur); }));
  it("ur/ar define every directory/profile key", () => Object.keys(L.en).forEach(k => { expect(L.ur[k], "ur " + k).toBeTruthy(); expect(L.ar[k], "ar " + k).toBeTruthy(); }));
  it("RTL languages report rtl", () => { expect([dir("en"), dir("ur"), dir("ar")]).toEqual(["ltr", "rtl", "rtl"]); });
});
describe("visual identity", () => {
  const redesign = readFileSync(new URL("../src/styles/redesign.css", import.meta.url), "utf8");
  const mainStyles = readFileSync(new URL("../src/styles/main.css", import.meta.url), "utf8");
  const home = readFileSync(new URL("../src/pages/home.ts", import.meta.url), "utf8");
  const homeTemplate = readFileSync(new URL("../src/pages/home.html", import.meta.url), "utf8");
  const profile = readFileSync(new URL("../src/pages/profile.ts", import.meta.url), "utf8");
  it("retains ISA's original green, emerald, gold and ivory tokens with reduced-motion support", () => {
    ["--green:#0f3d2e", "--emerald:#1b7a5a", "--gold:#a8812c", "--bg:#faf6ec"].forEach(x => expect(mainStyles).toContain(x));
    expect(redesign).toContain("prefers-reduced-motion");
    expect(redesign).not.toMatch(/#111d2b|#1a2a38|#15232c|#17232c|navy|cyan/i);
  });
  it("credits the authentic Dargah dome photo and provides an explicitly labeled illustration fallback", () => {
    expect(home).toContain("Gumbad_Of_Dargah_Aala_Hazrat_4.jpg"); expect(home).toContain("CC0 1.0");
    expect(profile).toContain("Wp masifnoor"); expect(profile).toContain("dargah-arch.svg");
  });
  it("adds a source-linked historical astrolabe, daily scholar, and catalogued digitized manuscripts", () => {
    expect(homeTemplate).toContain("rasulid-astrolabe-1291.jpg"); expect(homeTemplate).toContain("museum-viewer"); expect(homeTemplate).toContain("scholarSpotlight");
    expect(homeTemplate).toContain("blue-quran-folio.jpg"); expect(homeTemplate).toContain("2021667278");
    expect(homeTemplate).toContain("vdc_100083376667.0x000003"); expect(homeTemplate).toContain("Delhi Arabic 1897");
    expect(redesign).toContain("astrolabeOrbit"); expect(redesign).toContain("astrolabeNeedle");
    expect(home).toContain("contributions.some(c=>c.refs.length)"); expect(home).toContain("works.some(w=>w.refs.length)");
  });
  it("uses discipline artwork instead of fabricated scholar faces", () => {
    expect(home).not.toContain("portrait-al-khwarizmi.svg"); expect(home).not.toContain("portrait-scholar.svg");
    expect(home).toContain("ill-algebra.svg"); expect(profile).toContain("not a portrait");
  });
});
describe("edge cases", () => {
  it("Urdu-script search, no-match and empty queries", () => {
    expect(filterScholars(SAMPLE, { q: "البیرونی" })[0].slug).toBe("al-biruni");
    expect(filterScholars(SAMPLE, { q: "zzzz" })).toEqual([]); expect(filterScholars(SAMPLE, { q: "  " }).length).toBe(SAMPLE.length);
  });
  it("combined filters intersect; paginate handles empty and bad pages", () => {
    expect(filterScholars(SAMPLE, { d: "Astronomy", p: "classical" }).map(s => s.slug)).toEqual(["abu-al-wafa-al-buzjani", "al-biruni", "ibn-al-haytham", "ibn-sina"]);
    expect(paginate([], 1)).toEqual({ items: [], page: 1, pages: 1 }); expect(paginate(SAMPLE, NaN).page).toBe(1); expect(paginate(SAMPLE, -4).page).toBe(1);
  });
  it("router rejects bad slugs and keeps lang when swapping", () => {
    expect(parse("/en/scholars/Al_Biruni")?.name).toBe("notfound"); expect(parse("/en/scholars/al-biruni/")).toEqual({ lang: "en", name: "profile", slug: "al-biruni" });
    expect(swapLang("/ar/", "en")).toBe("/en/"); expect(swapLang("/ar", "ur")).toBe("/ur");
  });
});
