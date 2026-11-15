import { describe, expect, it } from "vitest";
import schema from "../content/schemas/scientist-dossier.schema.json";
import { SAMPLE } from "../src/data/sample";
import { dossierForScholar, validateResearchDossiers } from "../src/data/research-dossiers";

describe("universal research dossier foundation", () => {
  it("covers every current local scholar exactly once in the audit roster", () => {
    const audited = new Set([
      "ahmad-raza-khan", "al-khwarizmi", "banu-musa", "muhammad-ibn-musa-ibn-shakir", "ahmad-ibn-musa-ibn-shakir", "al-hasan-ibn-musa-ibn-shakir", "al-kindi",
      "al-farghani", "thabit-ibn-qurra", "al-battani", "abu-al-wafa-al-buzjani", "ibn-sina", "al-biruni", "ibn-al-haytham", "al-zahrawi", "ibn-al-nafis", "hunayn-ibn-ishaq", "al-razi"
    ]);
    expect(SAMPLE).toHaveLength(18);
    expect(new Set(SAMPLE.map(s => s.slug))).toEqual(audited);
    expect(SAMPLE.some(s => s.slug === "al-razi")).toBe(true);
    expect(SAMPLE.some(s => s.slug === "jabir-ibn-hayyan")).toBe(false);
  });
  it("defines evidence-linked sources, original passages, investigations and recognition", () => {
    expect(schema.required).toEqual(expect.arrayContaining(["scholarSlug", "sources", "works", "investigations", "recognition", "openQuestions"]));
    expect(schema.$defs).toHaveProperty("source");
    expect(schema.$defs).toHaveProperty("passage");
    expect(schema.$defs).toHaveProperty("claim");
    expect(schema.$defs).toHaveProperty("investigation");
  });
  it("connects the al-Razi research batch claims and passages to consulted sources", () => {
    expect(validateResearchDossiers()).toEqual([]);
    const razi = dossierForScholar("al-razi");
    expect(razi?.dossierState).toBe("draft");
    expect(razi?.investigations[0].claims.length).toBeGreaterThan(0);
    expect(razi?.works.find(w => w.id === "razi-jadari-hasbah")?.passages[0]).toMatchObject({ printedPage: "34–35", sourceId: "RZ-PRIMARY-1848" });
    expect(razi?.works.find(w => w.id === "razi-jadari-hasbah")?.passages[1]).toMatchObject({ printedPage: "Arabic p. 38; Latin p. 39", sourceId: "RZ-PRIMARY-1766" });
    expect(razi?.investigations).toHaveLength(2);
    expect(razi?.investigations[0].observationsOrCalculations).toContain("pp. 34–35");
    expect(razi?.investigations[1].claims.find(c => c.id === "razi-pormann-uncertainty")?.sourceIds).toContain("RZ-PORMANN-2013");
    expect(razi?.works.find(w => w.id === "razi-shukuk-galen")?.sourceIds).toContain("RZ-PORMANN-2013");
    expect(dossierForScholar("jabir-ibn-hayyan")?.dossierState).toBe("draft");
  });
  it("connects the al-Khwarizmi equation study to primary and scholarly sources", () => {
    expect(validateResearchDossiers()).toEqual([]);
    const dossier = dossierForScholar("al-khwarizmi");
    expect(dossier?.dossierState).toBe("draft");
    expect(dossier?.works[0].passages.map(p => p.printedPage)).toEqual(["8", "13–16", "11–12"]);
    expect(dossier?.investigations[0].claims.find(c => c.id === "khw-equation-example")?.sourceIds).toContain("KHW-ROSEN-1831");
    expect(dossier?.investigations[0].claims.find(c => c.id === "khw-geometric-proof")?.text).toContain("two geometric diagrams");
    expect(dossier?.sources.find(s => s.id === "KHW-ROSEN-1831")?.notes).toContain("proofread but not validated");
    expect(dossier?.investigations[1].claims.find(c => c.id === "khw-two-positive-roots")?.text).toContain("3 and 7");
    expect(dossier?.works[0].passages[2].printedPage).toBe("11–12");
  });
  it("records the Jābirian authorship dispute without presenting it as settled science", () => {
    expect(validateResearchDossiers()).toEqual([]);
    const dossier = dossierForScholar("jabir-ibn-hayyan");
    expect(dossier?.dossierState).toBe("draft");
    expect(dossier?.works).toHaveLength(2);
    expect(dossier?.works[0]).toMatchObject({ authorship: "under_review", passages: [] });
    expect(dossier?.works.find(w => w.id === "jabir-genizah-catalogue-ts-ar-35-104")?.passages[0]).toMatchObject({ sourceId: "JAB-FERRARIO-2021", printedPage: "21 (article pagination)" });
    expect(dossier?.investigations[0].claims.map(c => c.id)).toContain("jabir-current-dispute");
    expect(dossier?.investigations[0].claims.find(c => c.id === "jabir-current-dispute")?.sourceIds).toContain("JAB-ROBERTS-2022");
    expect(dossier?.recognition).toEqual([]);
    expect(dossier?.investigations[0].limitations).toContain("No Jābirian manuscript image");
  });
  it("links Ibn al-Haytham's chamber argument to Sabra's translated primary text", () => {
    expect(validateResearchDossiers()).toEqual([]);
    const dossier = dossierForScholar("ibn-al-haytham");
    expect(dossier?.dossierState).toBe("draft");
    expect(dossier?.works[0].passages[0]).toMatchObject({ sourceId: "HAY-SABRA-1989", printedPage: "26" });
    expect(dossier?.investigations[0].claims.find(c => c.id === "hay-chamber-observation")?.sourceType).toBe("primary_source");
    expect(dossier?.investigations[0].limitations).toContain("Arabic manuscript image");
  });
  it("records al-Biruni's Nandana observation while keeping disputed digits unresolved", () => {
    expect(validateResearchDossiers()).toEqual([]);
    const dossier = dossierForScholar("al-biruni");
    expect(dossier?.dossierState).toBe("draft");
    expect(dossier?.works[0].passages[0]).toMatchObject({ sourceId: "BIR-BALOCH-1987" });
    expect(dossier?.investigations[0].claims.find(c => c.id === "bir-dip-observation")?.text).toContain("0°34′");
    expect(dossier?.investigations[0].claims.find(c => c.id === "bir-height-text-uncertainty")?.confidence).toBe("high");
    expect(dossier?.investigations[0].reportedResult).toContain("withholds a final numerical radius");
  });
  it("records the Banū Mūsā fountain from a mediated Hill translation excerpt", () => {
    expect(validateResearchDossiers()).toEqual([]);
    const dossier = dossierForScholar("banu-musa");
    expect(dossier?.dossierState).toBe("draft");
    expect(dossier?.works[0].authorship).toBe("under_review");
    expect(dossier?.works[0].passages[0]).toMatchObject({ sourceId: "BMU-HILL-EXCERPT", printedPage: "Hill pp. 50–51; additional excerpted technical discussion pp. 222–223, 236–237" });
    expect(dossier?.investigations[0].claims.find(c => c.id === "bmu-model1-description")?.confidence).toBe("medium");
    expect(dossier?.investigations[0].claims.find(c => c.id === "bmu-numbering-scope")?.text).toContain("CIE educational selection");
    expect(dossier?.sources.find(s => s.id === "BMU-FSTC-ALHASSANI-2008")?.consulted).toBe(true);
    expect(dossier?.investigations[0].limitations).toContain("mediated excerpt");
    expect(dossier?.sections.biography.claimIds).toContain("bmu-biographical-limits");
    expect(dossier?.investigations[1].claims.find(c => c.id === "bmu-collective-life")?.sourceIds).toContain("BMU-PINGREE-1988");
    expect(dossier?.sources.find(s => s.id === "BMU-CASULLERAS-2007")?.consulted).toBe(true);
  });
  it("records al-Zahrāwī's preface and manuscript illustration evidence with intermediary limits", () => {
    expect(validateResearchDossiers()).toEqual([]);
    const dossier = dossierForScholar("al-zahrawi");
    expect(dossier?.dossierState).toBe("draft");
    expect(dossier?.works[0].passages[0]).toMatchObject({ sourceId: "ZAH-HAMARNEH-1962", printedPage: "Hamarneh p. 87" });
    expect(dossier?.investigations[0].claims.find(c => c.id === "zah-preface-training")?.confidence).toBe("medium");
    expect(dossier?.investigations[0].limitations).toContain("Arabic passage");
    expect(dossier?.investigations[0].claims.find(c => c.id === "zah-manuscript-witness")?.text).toContain("images are currently unavailable");
    expect(dossier?.investigations[0].claims.find(c => c.id === "zah-bnf-2953-codicology")?.text).toContain("more modern hand");
    expect(dossier?.sources.find(s => s.id === "ZAH-BNF-ARABE2953")?.notes).toContain("sixteenth century");
    expect(dossier?.investigations[0].claims.find(c => c.id === "zah-penn-ljs435-witness")?.text).toContain("AH 869/1464");
    expect(dossier?.sources.find(s => s.id === "ZAH-UPENN-LJS435")?.notes).toContain("images were not inspected");
  });
  it("records Ibn al-Nafis's pulmonary passages with manuscript and translation locators kept distinct", () => {
    expect(validateResearchDossiers()).toEqual([]);
    const dossier = dossierForScholar("ibn-al-nafis");
    expect(dossier?.dossierState).toBe("draft");
    expect(dossier?.works[0].passages.map(p => p.printedPage)).toEqual([
      "West pp. 1878–1879; Berlin manuscript locators reported as fol. 46r and fol. 65r–v",
      "West p. 1879; Berlin manuscript fol. 46r"
    ]);
    expect(dossier?.investigations[0].claims.find(c => c.id === "naf-pulmonary-route")?.text).toContain("through the lung");
    expect(dossier?.investigations[0].limitations).toContain("folio numbering differs from the Berlin witness");
    expect(dossier?.investigations[0].claims.find(c => c.id === "naf-transmission-limit")?.text).toContain("do not establish");
  });
  it("records Hunayn's self-reported revision of Galen's Book on Sects with explicit evidence limits", () => {
    expect(validateResearchDossiers()).toEqual([]);
    const dossier = dossierForScholar("hunayn-ibn-ishaq");
    expect(dossier?.dossierState).toBe("draft");
    expect(dossier?.works[0].passages[0]).toMatchObject({
      sourceId: "HUN-CORPUS-AR",
      chapterOrSection: "Section (ج), Kitāb fī al-firaq (Book on Sects), digital corpus paragraphs 32–33"
    });
    expect(dossier?.investigations[0].claims.map(c => c.id)).toContain("hun-sects-collation");
    expect(dossier?.investigations[0].claims.map(c => c.id)).toContain("hun-sects-usual-practice-self-report");
    expect(dossier?.works[0].passages[0].originalPassage).toContain("فقابلت تلك بعضها ببعض");
    expect(dossier?.works[0].passages[0].translation).toContain("Working translation by ISA, not reviewed by a specialist");
    expect(dossier?.sources.find(s => s.id === "HUN-TMR-REVIEW-2017")?.notes).toContain("not a substitute for reading the edition");
    expect(dossier?.investigations[0].limitations).toContain("does not independently verify");
    expect(dossier?.sources.find(s => s.id === "HUN-CORPUS-AR")?.notes).toContain("not as a manuscript image");
  });
  it("records al-Kindī's cryptanalysis through a secondary summary without claiming direct primary collation", () => {
    expect(validateResearchDossiers()).toEqual([]);
    const dossier = dossierForScholar("al-kindi");
    expect(dossier?.dossierState).toBe("draft");
    expect(dossier?.works[0].passages[0]).toMatchObject({
      sourceId: "KND-TDV-MUAMMA",
      printedPage: "TDV vol. 30, pp. 319–320; online paragraphs 121–124. Primary edition cited by TDV: vol. I, text pp. 213–259."
    });
    expect(dossier?.works[0].passages[1]).toMatchObject({
      sourceId: "KND-ISLAM-MUSEUM-EXHIBIT",
      printedPage: "Islam Museum online exhibit, sections ‘Summary’ and ‘How it works’; exhibit cites 1987 edition pp. 216–219"
    });
    expect(dossier?.investigations[0].claims.find(c => c.id === "kind-method-components")?.text).toContain("frequency ranking");
    expect(dossier?.investigations[0].claims.find(c => c.id === "kind-method-short-text-limit")?.uncertainty).toContain("not been directly checked");
    expect(dossier?.sources.find(s => s.id === "KND-MARAYATI-1987")?.consulted).toBe(false);
    expect(dossier?.investigations[0].limitations).toContain("curated secondary interpretation");
  });
  it("records al-Farghānī's Earth-size figures with the intermediary text and arithmetic variant disclosed", () => {
    expect(validateResearchDossiers()).toEqual([]);
    const dossier = dossierForScholar("al-farghani");
    expect(dossier?.dossierState).toBe("draft");
    expect(dossier?.works[0].passages[0]).toMatchObject({
      sourceId: "FAR-TOYNBEE-1895",
      chapterOrSection: "Jawāmiʿ, chapter 8, Earth dimensions; ISMI chapter heading: sizes of the Earth and planets"
    });
    expect(dossier?.investigations[0].claims.find(c => c.id === "far-circumference-calculation")?.text).toContain("20,400");
    expect(dossier?.investigations[0].limitations).toContain("Dijksterhuis's scholarly locator/transmission summary");
    expect(dossier?.investigations[0].claims.find(c => c.id === "far-chapter-witness-locators")?.locator).toContain("p. 90 n. 44");
    expect(dossier?.sources.find(s => s.id === "FAR-DIJKSTERHUIS-2012")?.consulted).toBe(true);
    expect(dossier?.sources.find(s => s.id === "FAR-GOLIUS-1669")?.consulted).toBe(false);
  });
  it("records Thābit's conditional amicable-number rule and separates conjecture from the theorem", () => {
    expect(validateResearchDossiers()).toEqual([]);
    const dossier = dossierForScholar("thabit-ibn-qurra");
    expect(dossier?.dossierState).toBe("draft");
    expect(dossier?.works[0].passages[0]).toMatchObject({
      sourceId: "THA-BRENTJES-HOGENDIJK-1989",
      printedPage: "Brentjes–Hogendijk pp. 374–375; they cite Saʿīdān 1977, pp. 50–53 for proposition 10 and the proof, and pp. 33, 50 for the introduction and proposition context."
    });
    expect(dossier?.investigations[0].claims.find(c => c.id === "tha-rule")?.text).toContain("3·2ⁿ−1");
    expect(dossier?.investigations[0].limitations).toContain("explicitly inferential hypothesis");
    expect(dossier?.sources.find(s => s.id === "THA-SAIDAN-1977")?.consulted).toBe(false);
  });
  it("records al-Battānī's solar parameters with their historical model and edition limits", () => {
    expect(validateResearchDossiers()).toEqual([]);
    const dossier = dossierForScholar("al-battani");
    expect(dossier?.dossierState).toBe("draft");
    expect(dossier?.works[0].passages[0]).toMatchObject({
      sourceId: "BAT-MOZAFFARI-2013",
      chapterOrSection: "Zīj, chapters 27–28 (length of the year and mean solar motion; solar anomaly and apogee), as identified in the secondary literature"
    });
    expect(dossier?.investigations[0].claims.find(c => c.id === "bat-eccentricity")?.text).toContain("2;4,45");
    expect(dossier?.investigations[0].claims.find(c => c.id === "bat-tropical-year")?.text).toContain("5 hours, 46 minutes, 24 seconds");
    expect(dossier?.investigations[0].limitations).toContain("Nallino's apparatus were not yet collated directly");
    expect(dossier?.investigations[0].claims.find(c => c.id === "bat-arabic-edition-identification")?.text).toContain("Pars III");
    expect(dossier?.investigations[0].claims.find(c => c.id === "bat-qmax-secondary-discrepancy")?.confidence).toBe("unresolved");
    expect(dossier?.sources.find(s => s.id === "BAT-NALLINO-1899-ARABIC")?.notes).toContain("target solar chapters");
    expect(dossier?.sources.find(s => s.id === "BAT-VAN-DALEN-KUSHYAR-2021")?.notes).toContain("pp. 64–73");
    expect(dossier?.sources.find(s => s.id === "BAT-NALLINO-1903")?.consulted).toBe(false);
  });
  it("records al-Ḥasan ibn Mūsā's ellipse attribution as lost and unresolved against the group-level title", () => {
    expect(validateResearchDossiers()).toEqual([]);
    const dossier = dossierForScholar("al-hasan-ibn-musa-ibn-shakir");
    expect(dossier?.dossierState).toBe("draft");
    expect(dossier?.works[0]).toMatchObject({
      authorship: "under_review",
      transliteration: "Kitāb al-shakl al-mudawwar al-mustaṭīl (title as reported by Iranica)",
      passages: []
    });
    expect(dossier?.investigations[0].claims.find(c => c.id === "hasan-title-equivalence-unresolved")?.confidence).toBe("unresolved");
    expect(dossier?.investigations[0].claims.find(c => c.id === "hasan-qifti-transmission")?.text).toContain("1249/647");
    expect(dossier?.sources.find(s => s.id === "HAS-QIFTI-LIPPERT-1903")?.consulted).toBe(false);
    expect(dossier?.investigations[0].limitations).toContain("reported lost");
    expect(dossier?.sources.find(s => s.id === "HAS-ISMI-BEA-BANU-MUSA")?.notes).toContain("does not explicitly identify this title");
  });
  it("keeps Aḥmad ibn Mūsā's individual ḥiyal association distinct from collective Kitāb al-ḥiyal authorship", () => {
    expect(validateResearchDossiers()).toEqual([]);
    const dossier = dossierForScholar("ahmad-ibn-musa-ibn-shakir");
    expect(dossier?.dossierState).toBe("draft");
    expect(dossier?.works[0]).toMatchObject({
      transliteration: "Kitāb al-ḥiyal",
      authorship: "under_review",
      passages: [{ sourceId: "AHM-HILL-1979", printedPage: "Hill pp. 17–18" }]
    });
    expect(dossier?.investigations[0].claims.find(c => c.id === "ahm-authorship-unresolved")?.confidence).toBe("unresolved");
    expect(dossier?.investigations[0].claims.find(c => c.id === "ahm-collective-catalogue")?.text).toContain("collectively");
    expect(dossier?.sources.find(s => s.id === "AHM-HILL-1979")?.notes).toContain("not direct collation");
  });
  it("flags the unresolved overlap between Muḥammad ibn Mūsā's celestial-sphere title and the expedition passage record", () => {
    expect(validateResearchDossiers()).toEqual([]);
    const dossier = dossierForScholar("muhammad-ibn-musa-ibn-shakir");
    expect(dossier?.dossierState).toBe("draft");
    expect(dossier?.works).toHaveLength(2);
    expect(dossier?.works[0]).toMatchObject({
      transliteration: expect.stringContaining("Ḥarakat al-aflāk"),
      authorship: "under_review",
      passages: [{ sourceId: "MUH-ISMI-HARAKAT", printedPage: expect.stringContaining("502–510") }]
    });
    expect(dossier?.investigations[0].claims.find(c => c.id === "muh-title-identity-caution")?.confidence).toBe("unresolved");
    expect(dossier?.sources.find(s => s.id === "MUH-SALIBA-1994")?.consulted).toBe(false);
    expect(dossier?.sources.find(s => s.id === "MUH-ISMI-HARAKAT")?.notes).toContain("witness pages could not be opened");
  });
  it("records Ibn Sīnā's Canon scope through a mediated translation with explicit collation limits", () => {
    expect(validateResearchDossiers()).toEqual([]);
    const dossier = dossierForScholar("ibn-sina");
    expect(dossier?.dossierState).toBe("draft");
    expect(dossier?.works[0].passages[0]).toMatchObject({ sourceId: "SINA-GRUNER-READ", printedPage: "1930 ed., pp. 25–27 (opening definition and scope discussion; verify against page images)" });
    expect(dossier?.sources.find(s => s.id === "SINA-GRUNER-1930")?.notes).toContain("mediated historical translation");
    expect(dossier?.sources.find(s => s.id === "SINA-SHAH-1966")?.consulted).toBe(false);
    expect(dossier?.investigations[0].claims.map(c => c.id)).toContain("sina-domain-boundary");
    expect(dossier?.investigations[0].limitations).toContain("no fresh translation from Arabic was made");
  });
  it("records Abū al-Wafāʾ's reported tangent rule with primary-text limits and disputed priority", () => {
    expect(validateResearchDossiers()).toEqual([]);
    const dossier = dossierForScholar("abu-al-wafa-al-buzjani");
    expect(dossier?.dossierState).toBe("draft");
    expect(dossier?.works[0].passages[0]).toMatchObject({ sourceId: "WAF-MOUSSA-2011", printedPage: "Moussa 2011, pp. 1–56; abstract on p. 1" });
    expect(dossier?.sources.find(s => s.id === "WAF-PARIS-MAJISTI")?.consulted).toBe(false);
    expect(dossier?.investigations[0].claims.find(c => c.id === "wafa-tangent-rule")?.confidence).toBe("medium");
    expect(dossier?.investigations[0].observationsOrCalculations).toContain("No numeric worked example or accuracy calculation is claimed");
    expect(dossier?.openQuestions).toContain("Resolve the historical priority and terminology for tangent and other trigonometric functions using the sources cited in Iranica and BEA; retain disputed attributions where evidence conflicts.");
  });
  it("records Ala Hazrat's Fauz-i-Mubin argument structure through cited, mediated sources", () => {
    expect(validateResearchDossiers()).toEqual([]);
    const dossier = dossierForScholar("ahmad-raza-khan");
    expect(dossier?.dossierState).toBe("draft");
    expect(dossier?.works[0].passages[0]).toMatchObject({ sourceId: "ALA-SIDDIQUI-2023", printedPage: "Siddiqui pp. 67–68 (journal pagination), quoting Raza 2005, pp. 8–9" });
    expect(dossier?.sources.find(s => s.id === "ALA-REKHTA-FAUZ")?.consulted).toBe(true);
    expect(dossier?.sources.find(s => s.id === "ALA-PORTA-NEWSPAPERS")?.consulted).toBe(false);
    expect(dossier?.investigations[0].claims.find(c => c.id === "ala-fauz-date")?.uncertainty).toContain("publication dates may differ");
    expect(dossier?.investigations[0].limitations).toContain("no direct Urdu collation was possible");
    expect(dossier?.sources.find(s => s.id === "ALA-SANYAL-BOOK-2005")?.consulted).toBe(true);
    expect(dossier?.works.find(w => w.id === "ala-fatawa-rizwiyya")?.passages[0]).toMatchObject({ sourceId: "ALA-FATAWA-V1A-PRIMARY", printedPage: "Viewer text marks p. 94 of 590; printed folio/page number not verified" });
    expect(dossier?.investigations[1].claims.find(c => c.id === "ala-life-first-fatwa-self-report")?.uncertainty).toContain("page image has not been checked");
    expect(dossier?.investigations[1].claims.map(c => c.id)).toContain("ala-life-manzar-1904");
    expect(dossier?.works.map(w => w.id)).toContain("ala-kanz-al-iman");
    expect(dossier?.investigations[1].claims.find(c => c.id === "ala-life-kanz-1911")?.sourceIds).toContain("ALA-SANYAL-EQ-2001");
    expect(dossier?.investigations[1].claims.find(c => c.id === "ala-life-kanz-1911")?.uncertainty).toContain("not independent corroboration");
    expect(dossier?.sources.find(s => s.id === "ALA-SANYAL-EQ-2001")?.sourceType).toBe("reference_work");
    expect(dossier?.openQuestions.find(q => q.includes("earliest Kanz al-Iman edition"))).toContain("share an author");
    expect(dossier?.works.find(w => w.id === "ala-fatawa-rizwiyya")?.notes).toContain("not a claim that Khan authored or issued a complete twelve-volume set");
    expect(dossier?.works.find(w => w.id === "ala-kashf-illah-qibla")?.notes).toContain("no shelfmark or image");
    expect(dossier?.sources.find(s => s.id === "ALA-MASUD-AHMAD-AR")?.sourceType).toBe("community_lead");
    expect(dossier?.works.filter(w => w.id.startsWith("ala-ms-") && !w.id.startsWith("ala-ms-sample-")).length).toBe(19);
    expect(dossier?.investigations.find(i => i.id === "ala-masud-manuscript-inventory")?.claims.find(c => c.id === "ala-manuscript-date-conflict")?.confidence).toBe("high");
    expect(dossier?.works.find(w => w.id === "ala-ms-burhan-qawim")?.sourceIds).toContain("ALA-AH-NET-BURHAN");
    expect(dossier?.works.filter(w => w.id.startsWith("ala-ms-sample-")).length).toBe(15);
    expect(dossier?.works.find(w => w.id === "ala-ms-sample-taj-tauqit")?.notes).toContain("p. 111");
    expect(dossier?.investigations.find(i => i.id === "ala-masud-manuscript-inventory")?.claims.map(c => c.id)).toContain("ala-manuscript-samples-eighteen");
    expect(dossier?.investigations.find(i => i.id === "ala-masud-manuscript-inventory")?.claims.find(c => c.id === "ala-burhan-language-conflict")?.sourceIds).toEqual(expect.arrayContaining(["ALA-MASUD-AHMAD-AR", "ALA-AH-NET-BURHAN"]));
    expect(dossier?.sections.timeline.claimIds).toContain("ala-life-hajj-1905");
    expect(dossier?.recognition).toEqual([]);
  });
  it("flags broken internal evidence links before a dossier is rendered", () => {
    const razi = structuredClone(dossierForScholar("al-razi")!);
    razi.sections.timeline.claimIds.push("missing-claim");
    razi.works[0].passages[0].workId = "missing-work";
    razi.investigations[0].claims[0].sourceIds = ["missing-source"];
    const errors = validateResearchDossiers([razi]);
    expect(errors).toContain("unknown section claim missing-claim: al-razi");
    expect(errors).toContain("passage attached to wrong work missing-work: razi-jadari-hasbah");
    expect(errors).toContain(`unknown claim source missing-source: ${razi.investigations[0].claims[0].id}`);
  });
});

