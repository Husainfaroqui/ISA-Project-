# ISA universal scientist research audit

Audit date: 14 November 2026. Scope: existing local-first content in `content/ala-hazrat.json`, `content/batch-2a.json`, `content/batch-2b.json`, and the mapper in `src/data/sample.ts`. “Draft” means a research starting point, not complete, independently verified or publication-ready. Presence of a short sourced bio or contribution is not a completed dossier.

## Existing scholar inventory and gaps

ISA currently maps **18 distinct scholar profiles**. The current three content files contain 32 claims / 9 sources / 8 works / 2 contributions / 13 events for Ala Hazrat; 53 claims / 12 sources / 20 works / 14 contributions / 11 events / 3 relationships in Batch 2A; and 11 biographies / 20 sources / 23 works / 11 contributions / 11 events in Batch 2B. Counts describe records, not research completeness. Primary source passage records, original text transcriptions, passage translations, page locators and complete work catalogues are generally absent.

| Existing profile | What the current records contain | High-priority missing research |
| --- | --- | --- |
| Imam Ahmad Raza Khan (Ala Hazrat) | A 32-claim draft, eight mapped works, two astronomy-related contributions, thirteen events, nine source records; the research dossier additionally tracks twenty reported manuscript-inventory titles as provisional leads; it includes a sourced life outline, two major non-astronomy work records, and one reported *Fauz-i-Mubin* passage investigation. | Collate Urdu first editions and cited biographical passages; resolve the 1919/1920 dates; verify the 1919 newspaper lead; complete the mathematical/timekeeping bibliography and obtain independent review. The draft does not validate the historical stationary-Earth argument as modern science. |
| Muhammad ibn Musa al-Khwārizmī | Seven work records, four contribution records, claims and research leads in Batch 2A; linked commentary manuscript is documented separately. | Full sourced biography, original algebra passages and edition/page locators, methods reconstructed from primary text, bibliography and astronomy/geography evidence. |
| Banu Musa (group) | Three works, four contributions, group relationship links; public draft biography and research dossier draw on Pingree and Casulleras; one mediated fountain investigation. | Read underlying Arabic biographical notices; collate specific device passages and diagrams against the Arabic edition and manuscripts; separate collective from individual work attributions. |
| Muḥammad ibn Mūsā ibn Shākir | Three reported works and one contribution; a new dossier tracks the unresolved overlap between a celestial-sphere title, a geodetic expedition passage, and a Qusṭā-attributed text. | Direct manuscript collation, title/work identity, the Ptolemaic critique's primary text, and individual biography. |
| Aḥmad ibn Mūsā ibn Shākir | Two reported works and a low-confidence ninth-sphere contribution; a new dossier reviews his ḥiyal association against collective catalogue attribution. | Individual biography, direct collation of the early notices and Kitāb al-ḥiyal manuscripts, and source-level review of other reported works. |
| al-Ḥasan ibn Mūsā ibn Shākir | No work or contribution mapped in current Batch 2A records. | Begin from catalogue and specialist research; do not transfer the other brothers’ attributions to him. |
| Abū Yūsuf Yaʿqūb ibn Isḥāq al-Kindī | Five works, four contributions, claims and source leads in Batch 2A. | Complete biography and bibliography; primary passages and edition locators; subject-level review of each attributed work. |
| Aḥmad al-Farghānī | One short draft biography, two works, one contribution, one event. | Expanded sourced biography, primary-text evidence and passage locators, methods, manuscript/edition evidence, influence. |
| Thābit ibn Qurra | One short draft biography, three works, one contribution, one event. | Expanded sourced biography, primary-text evidence, translation work, mathematical methods, manuscript and influence evidence. |
| al-Battānī | One short draft biography, one work, one contribution, one event. | Expanded biography, *Zīj* evidence, observations/calculations, editions and later transmission. |
| Abū al-Wafāʾ al-Būzjānī | One short draft biography, two works, one contribution, one event. | Expanded biography, trigonometric/mathematical work evidence, primary passages and disputed dating where applicable. |
| Ibn Sīnā | One short draft biography, two works, one contribution, one event. | Expanded biography, distinct medical/philosophical/astronomical investigations, *Canon* structure and primary passages, verified manuscript pages. |
| al-Bīrūnī | One short draft biography, three works, one contribution, one event. | Measurement methods, *Kitāb al-Hind*, *al-Qānūn al-Masʿūdī*, passage/page evidence, manuscript witnesses and influence. |
| Ibn al-Haytham | One short draft biography, two works, one contribution, one event. | *Kitāb al-Manāẓir* passage-level investigation, optical methods and diagrams, witness/image verification, influence with careful wording. |
| al-Zahrāwī | One short draft biography, one work, one contribution, one event. | Expanded biography, *al-Taṣrīf* structure, instrument passages and authentic illustrations, medical-historical context. |
| Ibn al-Nafīs | One short draft biography, two works, one contribution, one event. | Primary-text evidence for pulmonary transit, context and attribution, editions/translations, biography and influence. |
| Ḥunayn ibn Isḥāq | One short draft biography, two works, one contribution, one event. | Translation methodology, original translation prefaces/letters, language and attribution detail, biography and transmission. |
| Abū Bakr Muḥammad ibn Zakariyyā al-Rāzī | A draft biography and five mapped works; dossier includes a symptom-comparison passage and a second study of patient records and qualified medical certainty. | Full medical/philosophical dossier, Arabic passage and manuscript collation, expanded biography, clinical-method comparisons, editions, alchemy/authorship distinctions and influence. |

## Missing from the current catalogue but required by the brief

**Jābir ibn Ḥayyān** has no profile in the 18 existing scholars. Add as a separate new research subject only after recording the biography and Jabirian-corpus dating/authorship debates. Do not merge him into al-Rāzī or treat all Jabirian texts as one author’s work.

## Architecture added in this audit

- `content/schemas/scientist-dossier.schema.json` establishes a reusable dossier format for biography sections, source hierarchy, original works, passages/translations, investigations, evidence-backed claims, recognition labels and open questions.
- `src/lib/types.ts` exposes matching typed structures for use by future local-first dossier loaders and pages.
- The dossier integrity checker now validates section-to-claim, work-to-passage, and source-to-claim links, including duplicate IDs, before structured research is displayed.
- The current app still uses the existing content files. No existing claim was promoted to “verified”, no quotation or page locator was invented, and no broad database migration was added before an actual dossier loader/editor requires it.

### Dossier coverage checkpoint (14 November 2026)

The shared research loader contains 19 dossiers for the 18 existing profiles plus the separately tracked Jābir ibn Ḥayyān research subject. Thus every existing profile has a dossier entry (18/18), but these entries are research drafts, not completed biographies or independently verified accounts. Each remains incomplete until its individual source, passage, authorship, and open-question requirements are reviewed.

## Batches and honest completion criteria

1. **Batch 0 — Audit and common schema (in progress):** inventory, gaps, schema, tests. This does not complete historical research.
2. **Batch 1 — Ala Hazrat/Qibla primary-source investigation:** establish which scan/edition the community-site lead represents; inspect the original pages and record transliteration, translation and exact locators. Current research lead is not independently verified; no method or formula is attributed yet.
3. **Batch 2 — al-Rāzī medical dossier:** original *al-Judarī wa-al-ḥaṣbah* and other accessible primary texts, with distinctions between historical observation, later reputation and modern assessment.
4. **Batch 3 — Jābir ibn Ḥayyān:** establish manuscript/corpus evidence, authorship and dating debate before describing particular procedures as his own.
5. **Batches 4–5 — al-Khwārizmī, Ibn al-Haytham, al-Bīrūnī and Banu Musa:** same evidence requirements; then remaining existing profiles in bounded, recorded batches.
6. **Batch 6 — dossier UI and museum features:** render structured materials only after they have reviewable source records; keep draft/review state internal and preserve public local-first reading.

A dossier may be marked complete only when required sections have evidence, source locators have been checked, authorship uncertainties are explicit, original text passages are present where accessible, and a second review is recorded. Word count, number of sources, or a short biography alone never marks completion.

## 14 November update: Batch 0 and al-Razi investigations

The audit and common dossier format are complete for this pass. The project now has a typed local dossier loader and profile rendering for structured investigations, works, passages, evidence links and open questions. This capability is available to future scholar dossiers; it does not make all dossiers complete.

A first al-Razi research entry is integrated in `content/research/al-razi.json`. It examines a symptom comparison in *al-Judarī wa-al-ḥasbah*. The earlier draft's Greenhill locator (p. 36) was corrected to pp. 34–35, chapter III, based on the University of Iowa library record and specialist citations. A scanned 1766 Arabic-Latin edition by John Channing was also located: the extracted text contains the Arabic at printed p. 38 and parallel Latin at p. 39. The editor's preface says the Arabic was printed from a Leiden Library manuscript apograph; this is an early printed witness, not an autograph or modern critical edition. The passage now has linked records for the 1766 text, Greenhill translation, and library/research references, but both relevant scan images and the Leiden manuscript still require collation, so the investigation remains a draft. It does not claim al-Rāzī discovered either disease and is not medical advice.

The 2019 Rebecca Flemming chapter says the Arabic text remains unedited and unpublished and relies on Greenhill. That wording conflicts with the Arabic-Latin print published in 1766. The dossier records the discrepancy and does not repeat the claim as settled; it may mean no modern critical edition, but this interpretation is unverified.

**Batch status:** Batch 0 audit/schema is complete for the current pass. al-Rāzi remains in progress: the symptom passage has a corrected Greenhill locator (pp. 34–35), and a second draft investigation now records Pormann's 2013 analysis of case records, group outcomes and qualified certainty in passages from *al-Ḥāwī* and *Doubts about Galen*. The second study is explicitly mediated through Pormann's translations; the 1993 Arabic edition and manuscripts remain uncollated. Batch 1 Ala Hazrat's primary Urdu pages remain pending. Jābir ibn Ḥayyān is separately tracked because the 18-profile catalogue does not include him; attribution and corpus dating remain unresolved.

Sources consulted:
- Wellcome Collection, Greenhill translation record: https://wellcomecollection.org/works/g87eufac
- University of Iowa Libraries, Heirs of Hippocrates, record 62 (Greenhill source manuscript and pp. 34–35 locator): https://heirs.lib.uiowa.edu/record.php?id=62
- John Channing, ed., *Rhazes de variolis et morbillis: Arabice et Latine* (London, 1766), digitized text: https://upload.wikimedia.org/wikipedia/commons/0/09/Rhazes_de_variolis_et_morbillis_-_Arabice_et_Latine_%3B_cum_aliis_nonnullis_eiusdem_argumenti_%28IA_1911274.med.yale.edu%29.pdf
- American University of Beirut Libraries, Historical Collection, listing its digitized 1872 Arabic edition: https://www.aub.edu.lb/Libraries/sml/resources/Pages/DigitizedHistorical.aspx
- Peter E. Pormann, “Qualifying and quantifying medical uncertainty in 10th-century Baghdad: Abu Bakr al-Razi,” *Journal of the Royal Society of Medicine* 106(9) (2013), pp. 370–372: https://doi.org/10.1177/0141076813496515
- Rebecca Flemming, “Galen and the Plague,” in *Galen’s Περὶ Ἀλυπίας and the History of the Roman Empire* (2019), pp. 237–240: https://brill.com/display/book/edcoll/9789004383302/BP000018.pdf
- Stanford Encyclopedia of Philosophy, al-Razi (revised 14 May 2025): https://plato.stanford.edu/entries/abu-bakr-al-razi/
- Cited Greenhill transcription used to locate, not authenticate, the passage: https://classicslaunch.org/works/al-razi-treatise-on-smallpox-and-measles/read/
- National Library of Medicine, Jābir corpus research note: https://www.nlm.nih.gov/hmd/arabic/alchemy10.html

## 14 November update: Batch 1 Qibla source identification

Searches found a scan lead for a work titled **Kashf al-ʿIllah ʿan Samt al-Qiblah / Qibla Numa** (كشف العلة عن سمت القبلة قبلہ نما). A Sidque/Dar-us-Sidque page identifies its author as Ahmad Raza Barelwi, language as Urdu, publisher as Idara Tehqeeqat Imam Ahmad Raza International, and publication date as 1 January 2005. It links an 8.3 MB scan and a 59.42 MB scan. This is a useful edition lead, not an independent library catalogue record: the hosting page supplies the bibliographic description, and the PDF could not be fetched through the current research interface.

Alahazrat Network separately lists a 59 MB file under the shorter title *Kashf al-Illah ʿan Samt al-Qiblah*, but its page's claims about spherical trigonometry, calculus, advanced formulas and correcting other calculations are promotional descriptions without page citations. They are **not adopted as findings**. The two hosts may offer the same scan, but identity, title-page details, edition statement, pagination and text remain unverified.

**Batch 1 result:** bibliographic leads identified; original pages not yet inspected; no formula, method, result, date of composition, or scientific priority claim is approved for the profile. Next work is to obtain the scan, check its title and publication pages, record page numbering, then transcribe and translate passages with page locators and an independent check. Until then, the existing Qibla-related work record stays a research lead only.

Sources consulted:
- Sidque/Dar-us-Sidque, “Kashaf-ul-Ala An Simat-ul-Qibla Qibla Numa”: https://sidque.com/shf-alal-an-smt-alqbl-qbl-nma/ (hosting-page bibliographic lead; PDF links point to `https://s595909773.online-home.ca/KB/Qibla%20Numa/WQB.pdf` and a high-quality counterpart).
- Alahazrat Network, “Kashf al-Illah ʿan Samt al-Qiblah Download”: https://www.alahazratnetwork.org/download/%DA%A9%D8%B4%D9%81-%D8%A7%D9%84%D8%B9%D9%84%DB%81-%D8%B9%D9%86-%D8%B3%D9%85%D8%AA-%D8%A7%D9%84%D9%82%D8%A8%D9%84%DB%81-download/ (download listing; promotional subject description not treated as evidence).

## 14 November update: Kanz al-Iman publication-date conflict

A targeted catalogue search did not locate an inspected first-edition record. Sanyal’s monograph gives 1911 (p. 77), while two non-catalogue community/archive leads found in this pass state 1910 and 1912. These leads have not been treated as equivalent to title-page evidence, so the profile retains Sanyal’s date with an explicit uncertainty note. No edition title form, imprint, collaborators, or commentary arrangement has been verified from the first edition.

Sources consulted for the discrepancy:
- Usha Sanyal, *Ahmad Riza Khan Barelwi: In the Path of the Prophet* (2005), p. 77: https://data.nur.nu/Kutub/English/Ahmad-Riza-Khan-bio-by-Usha-Sanyal.pdf (secondary account).
- Islamic Internet Archives, author page (states 1910): https://islamicarchives.org/authors/ahmed-raza-khan-barelvi/ (lead only; not an edition catalogue).
- Ridawi, “Kanz al-Iyman” (states completion in 1912): https://www.ridawi.org/kanz/ (community source; not an edition catalogue).

## 14 November update: Qibla treatise manuscript and edition leads

An Arabic biographical study by Muhammad Masud Ahmad includes a “Manuscripts” list that says the author held images of about 100 manuscripts and lists *Kashf al-ʿIllah ʿan Samt al-Qiblah* as item 7, dated 1324 AH / 1906 CE. The online forum repost has no shelfmark or image for this witness, so the date is recorded only as a secondary inventory lead. A separate Sidque download page describes a 2005 Urdu edition and links two PDFs; retrieval failed, so neither its title page nor its text was inspected. The work is now listed in the profile as under review, with no claims about its formulas, method, accuracy, originality, or priority.

Sources:
- Muhammad Masud Ahmad, Arabic study “al-Shaykh Ahmad Riza Khan al-Barelwi wa-shayʾ min hayatihi wa-afkarahi,” manuscript list, item 7: https://www.islamimehfil.com/topic/16065-%D8%A7%D9%84%D8%B4%D9%8A%D8%AE-%D8%A3%D8%AD%D9%85%D8%AF-%D8%B1%D8%B6%D8%A7%D8%AE%D8%A7%D9%86-%D8%A7%D9%84%D8%A8%D8%B1%D9%8A%D9%84%D9%88%D9%89-%D9%88%D8%B4%D9%89%D8%A1-%D9%85%D9%86-%D8%AD%D9%8A%D8%A7%D8%AA%D9%87-%D9%88%D8%A3%D9%81%D9%83%D8%A7%D8%B1%D9%87/ (community-hosted secondary lead; inventory list reviewed, underlying images not accessed).
- Sidque / Dar-us-Sidque, “Kashaf-ul-Ala An Simat-ul-Qibla Qibla Numa”: https://sidque.com/shf-alal-an-smt-alqbl-qbl-nma/ (edition metadata and scan links only; scan retrieval failed).

## 14 November update: twenty reported manuscript-inventory titles

The same Arabic biographical study includes a list of twenty manuscripts said to concern rational sciences. The dossier now records the nineteen inventory entries beyond the Qibla treatise as provisional title leads, with reported dates, original-script strings, and editorially provisional transliterations. The source says the author held images of about 100 manuscripts, but the forum repost does not expose shelfmarks or the cited images. These are not treated as verified authorship, dates, contents, complete bibliography, or scientific contribution.

A source-quality check found an internal date conflict for *Aṭāʾib al-Iksīr*: the inventory gives 1296 AH / 1878 CE, while a later sample caption in the same article gives 1296 AH / 1828 CE. The dossier preserves this as an error in the consulted article and leaves the actual date unresolved.

## 14 November update: manuscript-sample descriptions

The Arabic biographical study’s separate sample section names eighteen manuscript items and supplies selected printed-page, language, topic, or handwriting descriptions. Fifteen additional lead records were added to the dossier; where the article’s list overlaps the twenty-title inventory, they are linked to the existing record rather than counted twice. The sample descriptions also expose a language conflict for *al-Burhān al-Qawīm*: the biography labels a manuscript Arabic, while Alahazrat Network calls the work Persian. These descriptions remain secondary reports; the forum text does not provide the underlying images or shelfmarks.

## 14 November update: cross-listing for *al-Burhān al-Qawīm*

Alahazrat Network has a separate community work page for *al-Burhān al-Qawīm ʿalā al-ʿArḍ wa-l-Taqwīm*. It reports 1327 AH and calls the work Persian; its descriptive text discusses ephemerides. This is a community metadata lead, not independent scholarly evidence. The Arabic biography separately cites Maʿārif Raza (Karachi, 1983), pp. 163–223, reports a handwritten copy in the author’s Karachi library, and says a complete print appeared in Bareilly; the cited issue, manuscript, and Bareilly edition remain uninspected. The Arabic biography’s manuscript sample calls the witness Arabic, while Alahazrat Network calls the work Persian. The dossier records the disagreement and does not use promotional technical description as a finding.

Source: Alahazrat Network, “al-Burhān al-Qawīm ʿalā al-ʿArḍ wa-l-Taqwīm”: https://www.alahazratnetwork.org/%D8%A7%D9%84%D8%A8%D8%B1%DA%BE%D8%A7%D9%86-%D8%A7%D9%84%D9%82%D9%88%DB%8C%D9%85-%D8%B9%D9%84%DB%8C-%D8%A7%D9%84%D8%B9%D8%B1%D8%B6-%D9%88-%D8%A7%D9%84%D8%AA%D9%82%D9%88%DB%8C%D9%85/

## Research workflow integrity update

The runtime validator and its tests now catch broken section claim IDs, duplicate dossier/source/work/claim IDs, passages attached to the wrong work, claims with no source, and unknown source references. This checks link integrity; it does not independently establish whether a historical claim is true. Current verification: `npm test` passed (107 tests, 9 files) and `npm run build` passed after this update.

## 14 November update: al-Khwārizmī equation research batch

Added `content/research/al-khwarizmi.json` and connected it to the shared local dossier loader. The case study follows the problem “one square and ten roots ... thirty-nine dirhems” in Rosen's 1831 edition: the translation gives root 3 and square 9 at p. 8, then geometric completion at pp. 13–16. New page-level review of Wikisource's scan-linked transcription distinguishes two separate diagrams for the same problem: the first uses four rectangles of breadth 2.5 and four corner gaps totaling 25; the second uses two rectangles of breadth 5 and a single 5×5 gap. Both complete area 39 to 64 and produce side 3 after removing the total added half-root length 5. This corrects the previous dossier wording, which had compressed both layouts into one corner-square description. Wikisource labels these transcriptions proofread but not validated; the scan checked is Rosen's English-edition page, not the medieval Arabic manuscript. The dossier explains (x²+10x=39) as modern notation only, records the preface's practical-use scope, and avoids saying al-Khwārizmī invented all algebra.

Page-level sources checked: [printed p. 8](https://en.wikisource.org/wiki/Page:The_Algebra_of_Mohammed_Ben_Musa_(1831).djvu/24), [printed p. 14](https://en.wikisource.org/wiki/Page:The_Algebra_of_Mohammed_Ben_Musa_(1831).djvu/30), [printed p. 15](https://en.wikisource.org/wiki/Page:The_Algebra_of_Mohammed_Ben_Musa_(1831).djvu/31), and [printed p. 16](https://en.wikisource.org/wiki/Page:The_Algebra_of_Mohammed_Ben_Musa_(1831).djvu/32).

A second investigation now records the other worked case *square + twenty-one = ten roots* (modern notation *x²+21=10x*). Rosen's translated p. 11 explicitly gives two positive root magnitudes, 3 and 7, and squares 9 and 49; p. 12 says both addition and subtraction apply for this case and describes a below-zero remainder as impossible. These arithmetic checks hold (9+21=30=10×3; 49+21=70=10×7). The dossier does not reinterpret the historical wording through modern signed-root or discriminant terminology, and marks Wikisource's transcription as proofread but not validated. See [printed p. 11](https://en.wikisource.org/wiki/Page:The_Algebra_of_Mohammed_Ben_Musa_(1831).djvu/27) and [printed p. 12](https://en.wikisource.org/wiki/Page:The_Algebra_of_Mohammed_Ben_Musa_(1831).djvu/28).

Source criticism is part of the entry: Rosen's translation relies on the Bodleian Huntington 214 witness, while ISMI currently records a second Medina witness; Heeffer describes questions about the Rosen text's manuscript/editorial history. The calculation is demonstrable from the transcription, but scan diagrams, Arabic readings, and manuscript variants have not yet been collated, so this remains a draft. The biographical section uses Sonja Brentjes's Biographical Encyclopedia of Astronomers entry and keeps approximate dates and contested origins qualified.

Research sources:
- Rosen, *The Algebra of Mohammed Ben Musa* (1831), proofread page 8: https://en.wikisource.org/wiki/Page:The_Algebra_of_Mohammed_Ben_Musa_(1831).djvu/24
- Rosen edition scan record and Internet Archive source object: https://commons.wikimedia.org/wiki/File:Algebra_of_Mohammed_ben_Musa_(IA_dli.ministry.00169).pdf
- Sonja Brentjes, *Biographical Encyclopedia of Astronomers* (2007): https://ismi.mpiwg-berlin.mpg.de/biography/Khwarizmi_BEA.htm
- Albrecht Heeffer, “A Conceptual Analysis of Early Arabic Algebra” (2008): https://www.clps.ugent.be/sites/default/files/publications/ArabAlgebra.pdf
- ISMI work and manuscript-witness record: https://ismi.mpiwg-berlin.mpg.de/node/3940643
- Jacques Sesiano, “An Arabic Algebraic Compendium of 1000 CE” (2024), consulted for later comparative context only: https://www.sciamvs.org/files/SCIAMVS_24_041-157_Sesiano.pdf

The existing 18-profile catalogue audit is unchanged in scope: this adds one detailed work investigation, not completion of the full al-Khwārizmī dossier or of the other 17 profiles.

Verification after adding the al-Khwārizmī dossier: `npm test` passed (108 tests, 9 files); `npm run build` passed.

## 14 November update: Batch 3 Jābirian corpus authorship and dating

Added a draft research dossier at `content/research/jabir-ibn-hayyan.json` and registered it in the shared local dossier loader. This is a research subject, not a new public scholar profile: the existing catalogue remains 18 profiles, and no dates or biography have been added to that roster. The dossier records Ibn al-Nadīm's *Fihrist* notice through Haq's account, the competing Kraus and Sezgin positions, Haq's critique, Roberts's 2022 assessment that the authorship question remains unresolved, and the National Library of Medicine's tentative internal-evidence date clusters.

The only work entry is the Jābirian alchemical corpus ascribed writings, marked `under_review`; it contains no fabricated quotation or page locator and no attributed experiment. The open questions require direct collation of the *Fihrist*, original Kraus/Sezgin arguments, and dated manuscript witnesses before text-level scientific analysis. This avoids treating the corpus tradition as proof of one author or importing the Latin Geber identity into the Arabic dossier.

Sources consulted:
- U.S. National Library of Medicine, “Islamic Medical Manuscripts: Alchemy 10”: https://www.nlm.nih.gov/hmd/arabic/alchemy10.html
- Alexandre M. Roberts, “Byzantine Engagement with Islamicate Alchemy,” *Isis* 113(3), 2022: https://doi.org/10.1086/721264
- Syed Nomanul Haq, *A Critical Study of Jabir ibn Hayyan’s Kitab al-Ahjar ‘ala Ra’y Balinas* (PhD thesis, University of London, 1990): https://discovery.ucl.ac.uk/id/eprint/10125139/1/Haq_10125139_thesis.pdf
- Samantha Pellegrino, “Historiography and New Directions in Jābirian Studies”: https://www.islamicoccult.org/pellegrino
- Ibn al-Nadīm, *The Fihrist*, Bayard Dodge edition record (1970): https://wellcomecollection.org/works/ss46u33r. Bibliographic record consulted; passage itself still awaits direct collation.

**Batch status:** Batch 3 is now in progress with a source-linked authorship/dating dossier. It is not a completed Jābir scientific investigation. The Jābirian passage and manuscripts have not been directly examined. Batch 0 audit/schema and al-Khwārizmī's starter case remain drafts as described above; the full 18-profile research and Qibla primary scan investigation remain unfinished.

## 14 November update: Jābir batch — primary bibliography and Genizah witness

The Jābir dossier now includes an additional primary-text case anchored in Gabriele Ferrario's peer-reviewed edition of Cambridge University Library fragment T-S Ar.35.104. The article presents the Judaeo-Arabic text, Arabic-character transcription, English translation, and manuscript evidence. At article p. 21 (section 3.3, P2 1 recto, lines 1–14), the fragment describes an index for a collection of books. Ferrario argues that this list is independent from but related to Ibn al-Nadīm's *Fihrist* list and cautiously proposes that it may witness one of Jābir's otherwise lost catalogues. The dossier records this as a scholarly hypothesis; it does not claim Jābir personally wrote the surviving fragment or prove a historical single-author corpus.

The *Fihrist* passage has a sharper locator: Ferrario gives the Jābir section as Flügel vol. 1, pp. 354–358 and Dodge's 1970 English translation as pp. 853–862; Haq cites Flügel p. 355, lines 11–21 for Ibn al-Nadīm's affirmation. The Flügel scan is now linked as a primary source, but its page image and the Dodge passage are still pending direct collation. This distinction is kept in the dossier rather than implying that a scan was read when it was not.

Additional source:
- Gabriele Ferrario, “Alchemy in the Cairo Genizah: the Nachlass of an Untidy Jewish Alchemist,” *Asiatische Studien* 75(2), 2021, pp. 513–544: https://doi.org/10.1515/asia-2021-0007
- Gustav Flügel (ed.), Ibn al-Nadīm, *Kitāb al-Fihrist*, vol. 1 (Leipzig, 1871), digitized scan: https://archive.org/details/kitabalfihrist00ibna

**Batch status:** Jābir dossier has a passage-level Judaeo-Arabic bibliographic witness with an article/page/shelfmark locator; the *Fihrist* primary passage remains to be collated from the edition images. No chemistry procedure has yet been attributed to Jābir. Full catalogue audit and all other research batches remain in progress.

## 14 November update: Batch 4 Ibn al-Haytham chamber experiment

Added `content/research/ibn-al-haytham.json` and registered it in the shared dossier loader. This first Ibn al-Haytham case is limited to *Kitāb al-Manāẓir*, Book I, chapter 3, paragraphs [29]–[37]. A. I. Sabra's 1989 translation describes two nested dark chambers, aligned apertures, marked straight paths, dawn light spots, and tests using screens and an opaque obstruction. Paragraph [37] states the author's inference that light from illuminated air radiates along straight lines. The dossier records the setup, reported observations, and conclusion separately; it makes no claim that the text contains all of modern optics or that Ibn al-Haytham invented experimental science.

The Warburg Institute's scanned 1989 translation was read at printed pp. 23–26 and its introduction checked for editorial provenance. Sabra states that the translation is based on the 1983 Arabic edition; the Arabic page and manuscript witnesses have not yet been directly collated. The edition identifies the text as a seven-book work and describes its transmission history, but specific later influence remains a separate research task. The dossier remains a draft.

Sources consulted:
- Ibn al-Haytham, *The Optics*, Books I–III, trans. A. I. Sabra (Warburg Institute, 1989), scan: https://resources.warburg.sas.ac.uk/pdf/ffh360b2205460.pdf
- Sabra, 1983 Arabic edition record/work and manuscript links, ISMI: https://ismi.mpiwg-berlin.mpg.de/text/127841
- Warburg Institute catalogue record: https://commons.warburg.sas.ac.uk/concern/published_works/r494vk17h?locale=en
- A. I. Sabra, “Ibn al-Haytham,” *Dictionary of Scientific Biography* (1972), digital copy: https://mathshistory.st-andrews.ac.uk/DSB/Al-Haytham.pdf

**Batch status:** Ibn al-Haytham now has a source-linked primary-text investigation with printed page and paragraph locators; Arabic/manuscript collation remains outstanding. Tests and build pass after adding this dossier. This advances one of the audited catalogue's documented gaps; the remaining scholar profiles still need individual research batches.

## 14 November update: Batch 5 al-Bīrūnī Nandana geodesy passage

Added `content/research/al-biruni.json` and registered it in the shared dossier loader. The case is the first-person Nandana account in *Kitāb taḥdīd nihāyāt al-amākin*. Nabi Bakhsh Khan Baloch's 1987 *Erdem* article reproduces the Arabic from the 1962 printed edition in an appendix and provides a close English translation. Its passage reports the horizon dip as 0°34′ and describes a separate vertical-height measurement and geometrical calculation. The dossier cites article pages 708–710 and explicitly labels Baloch as the intermediary; the Arabic printed page and manuscript images still require direct collation.

The mountain-height digits are not treated as settled. Baloch's own note discusses Arabic numeral ambiguity and a likely printing error, offering alternative readings; another intermediate sexagesimal value is also flagged. The dossier therefore records the observation and method while withholding the numerical Earth-radius result pending manuscript/edition collation and reproducible calculation. It distinguishes the Taḥdīd square-plate/alidade height procedure from a different two-position altitude description in *al-Qānūn*, avoids a priority claim (the article notes al-Bīrūnī's account of Sanad ibn ʿAlī), and does not assign an exact event date from the book's completion date.

Sources consulted:
- Nabi Bakhsh Khan Baloch, “Berûnî and His Experiment at Nandana,” *Erdem* 3(9), 1987, pp. 673–731: https://doi.org/10.32704/erdem.1987.9.673
- ISMI work and witness record for the Arabic *Taḥdīd*: https://ismi.mpiwg-berlin.mpg.de/text/59366
- American University of Beirut Press record for Jamil Ali's 1967 translation and its edition basis: https://www.aub.edu.lb/aubpress/pages/thedeterminationofcoordinates.aspx
- F. Jamil Ragep et al., *History of Cartography*, vol. 2, book 1, chapter 8: https://press.uchicago.edu/books/hoc/HOC_V2_B1/HOC_VOLUME2_Book1_chapter8.pdf
- F. Jamil Ragep, “Biruni,” *Biographical Encyclopedia of Astronomers*: https://islamsci.mcgill.ca/RASI/BEA/Biruni_BEA.htm

**Batch status:** al-Bīrūnī now has a source-linked primary-text-derived investigation and exact intermediary page/appendix locators; the manuscript and arithmetic collation remains open. Tests and production build pass after integration. The 18-profile catalogue audit and remaining research gaps are still active.

## 14 November update: Banū Mūsā fountain excerpt and numbering

Added `content/research/banu-musa.json` and registered it in the shared dossier loader. The focused case examines a fountain described in an excerpt of Donald R. Hill's 1979 translation reproduced in the Center for the Study of Islam and Democracy's educational PDF, where the selection is headed “Model 1.” This is not yet assumed to be Hill's own model number: Salim al-Hassani's separate account says Hill's seven fountains are numbered 88–94 (Hill pp. 218–231). The excerpt describes two jet forms and wind/water operation; the dossier treats this as mediated evidence, not proof of construction, performance, priority, or individual authorship. The numbering relation is left open pending direct inspection of Hill's relevant pages and figures and the Arabic edition.

The passage was accessed indirectly, so it is marked as a mediated translation excerpt. Hill's full book, the Arabic edition, manuscript folio, diagram, pipe routing, and textual variants remain to be checked. ISMI's catalogue supplies the collective attribution and six-witness list; ZKM identifies a digitized manuscript copy dated 1209, which is not used as the composition date. No new scholar profile or recognition tag is added.

Sources consulted:
- Banū Mūsā / Donald R. Hill, Model 1 excerpt in *A Sampler of Literature from Muslim Civilization*, Center for the Study of Islam and Democracy: https://cie.org/__static/d12c036aeb01dbdb4df46a61c09a9d54/cie_beyond-1001-nights.pdf
- Salim T. S. Al-Hassani, “The Self Changing Fountain of Banu Musa bin Shakir,” *Muslim Heritage* (10 March 2008), especially note 1: https://muslimheritage.com/the-self-changing-fountain-of-banu-musa-bin-shakir/
- ISMI, *Kitāb al-ḥiyal* work record and manuscript witnesses: https://ismi.mpiwg-berlin.mpg.de/node/3939373
- Wellcome Collection, Hill translation bibliographic record: https://wellcomecollection.org/works/x67rqd9z
- ZKM, digitized 1209 witness exhibition record: https://zkm.de/en/artwork/kitab-al-hiyal-the-book-of-ingenious-devices

**Batch status:** Banū Mūsā now has one source-linked device investigation with mediated text access, a primary/secondary numbering issue recorded, and explicit collation gaps. The dossier remains a draft; this does not complete the Banū Mūsā profile or the 18-profile research programme.

## 14 November update: Banū Mūsā collective biography

Expanded the group biography in `content/research/banu-musa.json` using David Pingree's *Encyclopaedia Iranica* entry and Josep Casulleras's *Biographical Encyclopedia of Astronomers* entry. Both identify the three sons—Muḥammad, Aḥmad, and Ḥasan—and place their activity in ninth-century Baghdad. Pingree describes their guardianship after their father's death and training under Yaḥyā ibn Abī Manṣūr; Casulleras explicitly cautions that separate biographies cannot be written from the surviving evidence. The dossier distinguishes Muḥammad's reported death in January 873 from the unknown exact dates of Aḥmad and Ḥasan, and records translation patronage without assigning every commission or work to an individual brother.

The modern entries synthesize medieval reports (including Ibn al-Nadīm, al-Bīrūnī, al-Ṭabarī, and Ibn Yūnus); those underlying passages were not collated in this batch. The collective biography remains a research draft.

Sources consulted:
- David Pingree, “Banū Mūsā,” *Encyclopaedia Iranica*, vol. III, fasc. 7 (1988; updated 2016), pp. 716–717: https://www.iranicaonline.org/articles/banu-musa-the-name-applied-to-three-brothers-abbasid-astronomers-whose-father-was-musa-b/
- Josep Casulleras, “Banū Mūsā,” *The Biographical Encyclopedia of Astronomers* (Springer, 2007), pp. 92–94, hosted by ISMI: https://ismi.mpiwg-berlin.mpg.de/biography/Banu_Musa_BEA.htm

**Batch status:** the Banū Mūsā dossier now has a source-linked shared biography and a separate device investigation. The public profile mapper now exposes a cautious group biography and a new collective patronage contribution linked to Pingree and Casulleras; this does not change the single-source status of earlier Batch 2A claims. Primary biographical notices, Arabic edition and manuscript collation, individual attributions, and the complete catalogue audit remain in progress.

## 14 November update: al-Zahrāwī surgical preface and illustration witnesses

Added `content/research/al-zahrawi.json` and registered it in the shared dossier loader. This batch uses Sami Hamarneh's full 1962 Smithsonian study, especially his report at printed p. 87 of the surgical preface's account of four tragic cases linked to inadequate anatomical and practical preparation. That passage remains mediated evidence: the Arabic and Spink–Lewis translation have not yet been collated. The BnF-derived Biblissima record adds important codicological context: Arabe 2953 is described as a sixteenth-century, 112-folio paper manuscript, and its final quire and treatise-specific preface are said to be in a more modern hand. This is catalogue metadata, not direct manuscript inspection; it cautions against treating that extant preface as contemporaneous with the main text without collation. Gallica blocked retrieval of the IIIF manifest in this pass, so no page images, folios, or instrument drawings are claimed as inspected. The catalogue's death-date wording (500 AH/1106–07 CE) differs from its authority-file estimates; chronology remains unresolved.

The image history is recorded separately. Hamarneh compares Arabic manuscript illustrations with later Latin/vernacular reproductions and warns that many later drawings were modified. The BnF IIIF record for Arabe 2953 describes instrument figures and links a Gallica digital object, while the British Library catalogue documents coloured instrument drawings and a translation colophon in Add MS 36617; the BL record currently says its images are unavailable. The new catalogue claim records BnF's manuscript date, extent, support, and note about the preface's later hand; it does not infer the hand's absolute date or textual authenticity. A second Arabic witness, Penn LJS 435, is catalogued as copied in AH 869/1464, comprising 108 leaves, portions of chapter two and all of chapter three, two naskh hands, marginal corrections, and numerous instrument illustrations. It gives the research a distinct, digitized comparison target and a colophon locator (f. 107v), but no images have yet been inspected. No particular instrument is assigned to an exact folio, no image is presented as an authorial original, and no priority claim or medical guidance is added.

Sources consulted:
- Sami Hamarneh, “Drawings and Pharmacy in al-Zahrāwī’s 10th-Century Surgical Treatise,” *Smithsonian Contributions to History and Technology* 228, Paper 22 (1962): https://www.gutenberg.org/files/26038/26038-h/26038-h.htm
- BnF Arabe 2953, Biblissima IIIF catalogue and Gallica link: https://iiif.biblissima.fr/collections/manifest/c02ca84ba85c8151f51ecff51d001bd44e37434b
- University of Pennsylvania, Kislak Center / Digital Walters, *Maqālah fī al-ʿamal bi-al-yad*, LJS 435 catalogue: https://bibliophilly.library.upenn.edu/viewer.php?id=LJS+435
- British Library, Add MS 36617 catalogue: https://searcharchives.bl.uk/catalog/032-002055067
- BnF bibliographic record for Spink and Lewis's 1973 definitive Arabic-English edition: https://catalogue.bnf.fr/ark:/12148/cb353753649

**Batch status:** al-Zahrāwī now has a source-linked draft about surgical education and manuscript illustration transmission. The direct Arabic/critical-edition collation and image comparison remain open; the profile and full research programme are not complete.

## 14 November update: Ibn al-Nafīs pulmonary-transit passages

Added `content/research/ibn-al-nafis.json` and registered it in the shared dossier loader. John B. West's 2008 article reproduces Max Meyerhof's English translations of two passages, with locators to Berlin manuscript fol. 46r and fol. 65r–v: the first denies visible or invisible passages through the septum; the second gives the route through the lung to the left ventricle. A separate sentence concerns passages between the pulmonary artery and pulmonary vein. The dossier treats these as reported translated claims, not a fresh translation or direct manuscript transcription.

The primary witness trail is now linked: Qatar Digital Library provides the British Library's Or 14154, a 1439 copy in an online 175-image sequence, and Wellcome catalogues another witness, WMS Or. 51, with a digitized image. QDL viewer page 270r is explicitly kept distinct from the Berlin manuscript's fol. 46r locator; its text has not yet been confirmed as the same passage. The historical theory retains concepts of blood refinement, air, and pneuma; the dossier does not equate it with all of modern physiology or claim that Ibn al-Nafīs observed microscopic capillaries. West says the sources do not establish a transmission route to Servetus or later European anatomists.

Sources consulted:
- John B. West, “Ibn al-Nafis, the pulmonary circulation, and the Islamic Golden Age,” *Journal of Applied Physiology* 105(6), 2008, pp. 1877–1880: https://pmc.ncbi.nlm.nih.gov/articles/PMC2612469/
- British Library Or 14154 manuscript record, digitized by Qatar Digital Library: https://www.qdl.qa/en/archive/81055/vdc_100066152341.0x000003
- QDL viewer item for Or 14154 f. 270r (viewer sequence 46/175): https://www.qdl.qa/en/archive/81055/vdc_100069648793.0x000099
- Wellcome Collection, WMS Or. 51 catalogue and digital image: https://wellcomecollection.org/works/sc3nmcx8
- Wellcome bibliographic record for Chéhadé's 1955 facsimile study, which lists Arabic facsimiles and French translations: https://wellcomecollection.org/works/efx5a2sw
- Wellcome bibliographic record for the 1988 Arabic edition by Salmān Qaṭāyah: https://wellcomecollection.org/works/hdsrcsz9

**Batch status:** Ibn al-Nafīs now has a passage-linked research draft with a dated manuscript witness and explicit translation/transmission limits. The Arabic folios, manuscript variants, and 1988 edition remain to be collated; this does not complete the Ibn al-Nafīs profile or the full catalogue audit.

## 14 November update: Ḥunayn ibn Isḥāq on revising Galen's Book on Sects

Added `content/research/hunayn-ibn-ishaq.json` and registered it in the local research dossier loader. The focused case follows the Arabic text of Ḥunayn's letter to ʿAlī ibn Yaḥyā, section (ج), *Kitāb fī al-firaq* (Book on Sects), digital corpus paragraphs 32–33. In this self-reported account, an earlier Syriac version came from a Greek copy with many omissions; Ḥunayn says his pupil Ḥubaysh gathered multiple Greek copies, which Ḥunayn compared before correcting the Syriac against the resulting Greek text. The entry then reports a later Arabic translation for Muḥammad ibn Mūsā.

This is not presented as independent verification, a universal description of Ḥunayn's practice, or a modernized systematic method. The dossier now records the Arabic transcription and an ISA working English translation, explicitly unreviewed by a specialist. The online text is based on Bergsträsser's 1925 edition; no manuscript image, printed page, or 2016 critical-edition passage was directly checked in this batch. Druart's full review describes the 2016 volume as a critical edition with a facing English translation and apparatus, and says the letter's manuscript versions reflect stages in a developing list. BnF and WorldCat catalogue records independently confirm publication metadata; WorldCat identifies Ayasofya 3590, folios 1v–34r as associated with the edition. These reviews and catalogue records are leads, not substitutes for reading the edition or manuscript. The dossier remains a draft and adds no new public catalogue profile.

Sources consulted:
- Digital Corpus for Graeco-Arabic Studies, Arabic text of Ḥunayn's letter: https://www.graeco-arabic-studies.org/view/hunayn.risalah-orig-ar1
- Wellcome Collection record for Bergsträsser's 1925 edition (catalogue metadata only): https://wellcomecollection.org/works/j357bdwz
- Wellcome Collection record for Lamoreaux and Kessel's 2016 parallel text (catalogue metadata only): https://content.www.wellcomecollection.org/works/bfx8kyea
- Thérèse-Anne Druart, review of Lamoreaux and Kessel, *The Medieval Review* 17.01.25 (2017), full review read: https://scholarworks.iu.edu/journals/index.php/tmr/article/view/23312
- Bibliothèque nationale de France, catalogue record for the 2016 edition (metadata only): https://catalogue.bnf.fr/ark:/12148/cb452735618
- OCLC WorldCat, catalogue record identifying Ayasofya 3590, folios 1v–34r (metadata only): https://search.worldcat.org/title/unayn-ibn-Isaq-on-his-Galen-translations-%3A-a-parallel-English-Arabic-text/oclc/973280727

**Batch status:** Ḥunayn now has one source-linked translation-history case with a transcribed Arabic passage, clearly labeled working translation, exact digital-text locator, and independent review/catalogue context. The 2016 edition and manuscript witnesses still need direct collation; the full scholar dossier and catalogue research programme remain in progress.

## 14 November update: al-Kindī cryptanalysis method audit

Added `content/research/al-kindi.json` and registered it in the local dossier loader. This batch addresses an existing weak point in the catalogue: al-Kindī's scientific claims previously relied mainly on one SEP entry, and the task list explicitly called for an independent source. The focused case uses İsmail Durmuş's TDV encyclopedia entry *MUAMMA*, which describes the attributed *Risāla fī istiḫrāj al-muʿammā* as distinguishing substitution and transposition, their combination, letter-frequency rankings, letter-combination constraints, and formulaic openings. Peter Adamson's SEP entry supplies separate biographical context and is not used as evidence for the procedure.

TDV identifies the treatise as the earliest surviving work in the field it discusses but also reports an earlier book attributed to al-Khalīl ibn Aḥmad. The dossier therefore records a limited surviving-text priority claim, not absolute invention or proof that no earlier practice existed. TDV's bibliography points to the text in the 1987 edition, vol. I, pp. 213–259. A full Islam Museum exhibit, which cites the 1987 edition at pp. 216–219, adds the same-language sample requirement and an explicit warning about short messages, followed by qualitative checks against letter combinations and context. This is a second, more detailed but still mediated summary: the 1987 pages and their Arabic apparatus have not yet been directly read here. The edition's exact wording, manuscript shelfmark, textual variants, and historical date remain open. This is a draft and does not add a new scholar profile.

Sources consulted:
- İsmail Durmuş, “MUAMMA,” *TDV İslâm Ansiklopedisi*, vol. 30, pp. 319–320: https://islamansiklopedisi.org.tr/muamma#1
- Peter Adamson, “Al-Kindi,” *Stanford Encyclopedia of Philosophy*: https://plato.stanford.edu/entries/al-kindi/
- Muhammad Marayati, Yahya Mir Alam, and Hassan al-Tayyan (eds.), *Al-Kindi's Treatise on Cryptanalysis*, volume 1, 2003 catalogue record: https://books.google.com/books/about/Al_Kindi_s_Treatise_on_Cryptanalysis.html?hl=en&id=IhoVAQAAIAAJ&output=html_text
- Islam Museum, “Al-Kindi's letter-frequency cryptanalysis,” full exhibit read; procedural paraphrase cites the 1987 edition, pp. 216–219: https://www.islam.museum/en/invention/frequency-analysis-al-kindi/
- Islam Museum source record for the Damascus 1987 edition (bibliographic page; not the edition itself): https://www.islam.museum/en/source/kindi-cryptanalysis-1987/

**Batch status:** al-Kindī now has two independently authored modern summaries for a bounded method description, including the short-message limitation and specific edition page leads. Neither replaces direct Arabic collation. Direct edition access, exact Arabic passage transcription, manuscript witness review, and a complete audit of his existing catalogue claims remain outstanding; the 18-profile research programme is still in progress.

## 14 November update: al-Farghānī chapter 8 Earth-size calculation

Added `content/research/al-farghani.json` and registered it in the shared dossier loader. This batch examines chapter 8 of *Jawāmiʿ ʿilm al-nujūm*, which ISMI identifies as treating sizes of the Earth and planets. Paget Toynbee's scanned study transcribes the Latin in Jacob Golius's 1669 edition: 56⅔ historical miles per degree, multiplied by 360 to yield a circumference of 20,400 miles, followed by a rounded diameter of 6,500 miles. The multiplication is reproducible. A 22/7 circumference-to-diameter approximation yields about 6,491, and Toynbee notes variant readings among Latin editions. Sally Ragep independently cites chapter 8 and characterizes the figures as Maʾmūnī values, distinct from a different Ptolemaic parameter.

This is not reported as al-Farghānī's personal survey, an original invention, or a modern-unit measurement. A second scholarly source now supplies precise access points: Dijksterhuis locates the 1669 Latin chapter 8 at pp. 30–34, the Arabic in the following part at pp. 30–34 counted backwards, and Golius's notes at pp. 71–75. He also reports the same values in a Leiden manuscript and points to differences with a Bodleian witness (Dijksterhuis 2012, p. 90 n. 44). The actual page images and Arabic text remain uncollated; the numerical passage is still accessed through Toynbee's Latin transcription. The medieval mile, its cubit basis, manuscript variants, and Columbus narrative require further research. The dossier remains a draft and adds no new catalogue profile.

Sources consulted:
- Paget Toynbee, *Dante Studies and Researches*, scanned text, especially pp. 66–67 and 74–75: https://resources.warburg.sas.ac.uk/pdf/enb1600b2447548.pdf
- Sally P. Ragep, “Al-Jaghmīnī’s Short Tract on the Volumes of the Planetary and Stellar Bodies,” *Nazariyat* 9(2), 2023, p. 122 n. 37: https://www.nazariyat.org/content/5-sayilar/19-cilt-9-sayi-2/4-sally-p-ragep/4_sally_p_ragep_en.pdf
- Gregg DeYoung, “Farghānī,” *Biographical Encyclopedia of Astronomers*, hosted by ISMI: https://ismi.mpiwg-berlin.mpg.de/biography/Farghani_BEA.htm
- ISMI manuscript and work record for *Jawāmiʿ ʿilm al-nujūm*: https://ismi.mpiwg-berlin.mpg.de/text/136041
- ETH-Bibliothek Zürich catalogue and digitized 1669 edition, Rar 4155: https://doi.org/10.3931/e-rara-1298
- Fokko Jan Dijksterhuis, “The Mutual Making of Sciences and Humanities: Willebrord Snellius, Jacob Golius, and the Early Modern Entanglement of Mathematics and Philology,” in *The Making of the Humanities*, vol. II (Amsterdam University Press, 2012), pp. 73–92, especially p. 90 n. 44: https://uplopen.com/books/531/files/9bf27f1a-7da5-4fdf-8a71-f5d1a68b654c.pdf

**Batch status:** al-Farghānī's dossier now includes independent scholarly corroboration for chapter 8's Latin/Arabic edition locators and the Leiden/Bodleian manuscript comparison lead. Direct page-image/Arabic collation and unit history remain open; the full dossier and 18-profile research audit remain in progress.

## 14 November update: Thābit ibn Qurra's amicable-number rule

Added `content/research/thabit-ibn-qurra.json` and registered it in the shared dossier loader. The case follows proposition 10 of Thābit's *Treatise on the Derivation of the Amicable Numbers in an Easy Way*, as analyzed from the Arabic text by Sonja Brentjes and Jan Hogendijk. In normalized modern notation, their article gives a prime-conditioned construction; at n=2 it produces 220 and 284, whose proper-divisor sums were independently checked. ISMI records two manuscript witnesses, Ayasofya 4830 (ff. 110a–121b) and BnF Arabe 2457, and Saʿīdān's 1977 Arabic edition.

The dossier separates the earlier attestation of 220/284 in Iamblichus from Thābit's attributed general rule and proof. It does not present the Pythagorean origin story as established, claim the rule generates all amicable pairs, or turn the 1989 authors' proposed discovery path into a fact; they explicitly offer that path as conjecture. The 1977 edition and manuscript folios have not yet been read directly, so the formula is attributed to the modern study's analysis of the Arabic text and remains a draft.

Sources consulted:
- Sonja Brentjes and Jan P. Hogendijk, “Notes on Thabit ibn Qurra and his rule for amicable numbers,” *Historia Mathematica* 16(4), 1989, pp. 373–378: https://doi.org/10.1016/0315-0860(89)90084-0
- ISMI, *Thābit ibn Qurrah fī al-aʿdād al-mutaḥābbah* and witness records: https://ismi.mpiwg-berlin.mpg.de/text/54215
- J. J. O'Connor and E. F. Robertson, “Thabit,” MacTutor History of Mathematics: https://mathshistory.st-andrews.ac.uk/Biographies/Thabit/
- Aḥmad Saʿīdān (ed.), *Kitāb al-aʿdād al-mutaḥābba li-Thābit ibn Qurra* (Amman, 1977), catalogued in the ISMI work record; edition not directly consulted.

**Batch status:** Thābit now has a source-linked number-theory draft with a verified n=2 example and explicit attribution, proof, and transmission limits. Direct Arabic edition/manuscript collation and the rest of the Thābit catalogue audit remain open; the full research programme remains active.

## 14 November update: al-Battānī solar-model parameters

Added `content/research/al-battani.json`, registered al-Battānī's dossier in the shared loader, and added a focused schema test. The investigation examines the Ptolemaic solar eccentricity and tropical-year values reported from the *al-Zīj al-Ṣābiʾ*. Mozaffari's 2013 article identifies the observation period as Yazdigird year 251 (15 April 882–14 April 883) and reports e=2;4,45 parts for a radius of 60, qmax=1;59,10, and a year length of 365;14,26 days. The sexagesimal year conversion to 365 days, 5 hours, 46 minutes, 24 seconds was independently checked. Converting e through qmax=arcsin(e/60) yields about 1°59′9.1″, close to the study's rounded 1°59′10″; that small difference is retained rather than silently reconciled.

The historical e value is explicitly identified as a parameter in the geocentric eccentric-circle model, not the modern Keplerian eccentricity of Earth's orbit. Nothaft's 2024 study traces the same qmax value in the Toledan Tables back to al-Battānī and supplies Latin locators (Pars I, chapter 28, pp. 43–48; Pars II, pp. 78–83). Van Dalen's 2021 scholarly commentary independently locates the Arabic Chapter 28 at Pars III, pp. 64–73, and its Latin translation/commentary at Pars I, pp. 43–48 and 212–221. He reports the chapter derives e=2;4,45 and that accurate calculation gives qmax=1;59,10°. The dossier's arcsin(e/60) check gives 1;59,9.08°, leaving a sub-arcsecond discrepancy unresolved pending direct collation and a check of the historical derivation. Nallino's separately digitized Pars III title page was checked, but its solar passage and apparatus have not yet been collated. No quotation or fresh translation is presented.

Sources consulted:
- S. Mohammad Mozaffari, “Limitations of Methods: The Accuracy of the Values Measured for the Earth's/Sun's Orbital Elements in the Middle East, A.D. 800–1500, Part 1,” *Journal for the History of Astronomy* 44 (2013), especially pp. 323 and 329: https://www.shpltd.co.uk/Mozaffari%20Limitations%20Of%20Methods%20Part%201.pdf
- Benno van Dalen, “Battānī,” *Biographical Encyclopedia of Astronomers* (Springer, 2007), hosted by ISMI: https://ismi.mpiwg-berlin.mpg.de/biography/Battani_BEA.htm
- C. Philipp E. Nothaft, “On Some Early Latin European Measurements of the Eccentricity of the Solar Orbit (1308–1314),” *Journal for the History of Astronomy* 55(2) (2024), pp. 143–155: https://doi.org/10.1177/00218286241228260
- Benno van Dalen, *Ptolemaic Tradition and Islamic Innovation: The Astronomical Tables of Kūshyār ibn Labbān*, Ptolemaeus Arabus et Latinus, Texts 2 (Brepols, 2021), especially p. 398 n. 81: https://ptolemaeus.badw.de/files/PAL-Texts_2.pdf?export=
- Carlo Alfonso Nallino (ed.), *Al-Battānī sive Albatenii Opus astronomicum*, Parts I–III (Milan, 1899–1907); Nallino's 1903 chapter edition and indicated pages catalogued but not directly consulted: https://books.google.com/books?id=VIjM-bcciP8C
- Carlo Alfonso Nallino (ed.), *Al-Battānī sive Albatenii Opus astronomicum*, Pars III, Arabic text (Milan, 1899), Internet Archive scan; title page checked, solar chapters pending collation: https://archive.org/details/albattanisivealb00batt
- Islam Museum, *al-Zīj al-Ṣābiʾ* work record: https://www.islam.museum/en/work/al-zij-al-sabi/

**Batch status:** al-Battānī now has a source-linked, calculation-checked draft for one astronomical parameter set and one specific Latin-table transmission claim, with the Arabic Chapter 28 page range (Pars III, pp. 64–73) supplied by a scholarly source. The sub-arcsecond disagreement in qmax is explicitly unresolved. Direct collation of the Arabic and Latin solar passages and the Escorial witness, plus research on his other contributions, remain open. The 18-profile audit remains active.

## 14 November update: al-Ḥasan ibn Mūsā and the lost ellipse attribution

Added `content/research/al-hasan-ibn-musa.json`, registered the draft in the shared dossier loader, and added an attribution-focused schema test. This batch addresses a gap noted in the inventory: al-Ḥasan's existing profile has no work record, while specialist references report a lost work on the ellipse. Encyclopaedia Iranica attributes *Kitāb al-shakl al-mudawwar al-mustaṭīl* to the third brother, Ḥasan. The ISMI-hosted *Biographical Encyclopedia of Astronomers* says that separate biographies are quite impossible to write from the surviving evidence; it lists a Book on an Oblong Round Figure under the Banū Mūsā collectively and describes it as concerning the ellipse and a string-and-pegs construction. Clagett reports an ellipse treatise attributed to al-Ḥasan while also emphasizing the scarcity of evidence distinguishing the brothers.

The differently rendered titles are not asserted to be identical, and the string-and-pegs construction is not attributed to al-Ḥasan individually. Following Iranica's bibliography led to the 1903 Lippert edition of Ibn al-Qifṭī's *Taʾrīkh al-ḥukamāʾ* (pp. 441–443). The U.S. National Library of Medicine notes that the extant text is a 1249 extract by al-Zawzanī from Ibn al-Qifṭī's now-lost longer work, and that no translation has been published. The Internet Archive scan and OCR are online, but OCR search did not permit reliable collation of the specific entry; the Arabic title and text remain unchecked against the printed page images. This makes explicit that the reported attribution travels through both a medieval epitome and modern reference works. The dossier still has no passage from the lost geometry work; no method reconstruction, invention priority, manuscript witness, or later influence claim is made. The attribution remains under review and the public profile is unchanged.

Sources consulted:
- David Pingree, “Banū Mūsā,” *Encyclopaedia Iranica*, vol. III, fasc. 7 (1988), pp. 716–717: https://www.iranicaonline.org/articles/banu-musa-the-name-applied-to-three-brothers-abbasid-astronomers-whose-father-was-musa-b/
- Josep Casulleras, “Banū Mūsā,” *Biographical Encyclopedia of Astronomers* (Springer, 2007), hosted by ISMI: https://ismi.mpiwg-berlin.mpg.de/biography/Banu_Musa_BEA.htm
- Marshall Clagett, *Archimedes in the Middle Ages*, vol. I (1964), opening discussion, printed pp. 226 and 239: https://abel.math.harvard.edu/archive/archimedes09/pdf/Banu_Musa.pdf
- U.S. National Library of Medicine, History of Medicine Division, “Taʾrīkh-i ḥukamāʾ” textual history: https://mainweb.awsprod.nlm.nih.gov/hmd/arabic/mon11.html
- Ibn al-Qifṭī, *Taʾrīkh al-ḥukamāʾ*, ed. Julius Lippert (Leipzig, 1903), scan located; specific pp. 441–443 not yet collated: https://archive.org/details/TarikhAlHukama

**Batch status:** the previously empty individual profile now has a reviewable, source-linked draft that distinguishes an individually reported lost work from the group's ellipse-related title. Direct verification of the original bibliographical notices and the Arabic title relation remains open; the full 18-profile audit and research programme remain active.

## 14 November update: Aḥmad ibn Mūsā and Kitāb al-ḥiyal attribution

Added `content/research/ahmad-ibn-musa.json`, registered it in the dossier loader, and added a schema test. This batch tests the boundary between individual expertise and collective authorship. Pingree's *Encyclopaedia Iranica* calls the *Kitāb al-ḥiyal* Aḥmad's only surviving work. Hill's publisher-hosted preview of his 1979 chapter on earlier reports describes the earliest cited *Fihrist* attribution as collective; a later account singles out Aḥmad's particular skill in *ḥiyal*; other notices again name the brothers collectively. ISMI and Springer's edition metadata identify the Banū Mūsā collectively, and ISMI lists six witnesses. The TDV entry explicitly cautions that individual authorship across the corpus generally cannot be determined with certainty.

The dossier supports Aḥmad's association with mechanical *ḥiyal* while leaving the extant compilation's authorship under review. It does not assign the public work record to him alone, claim every device as his invention, or infer authorship from expertise. Hill's preview is an intermediary digest; the original historical texts, full edition introduction, and manuscript title pages and colophons were not collated in this pass.

Sources consulted:
- David Pingree, “Banū Mūsā,” *Encyclopaedia Iranica*, vol. III, fasc. 7 (1988), pp. 716–717: https://www.iranicaonline.org/articles/banu-musa-the-name-applied-to-three-brothers-abbasid-astronomers-whose-father-was-musa-b/
- Banū Mūsā and Donald R. Hill, “Earlier Information on The Book of Ingenious Devices,” *The Book of Ingenious Devices / Kitāb al-ḥiyal* (1979), ch. 3, pp. 17–18, publisher preview: https://doi.org/10.1007/978-94-009-9786-8_3
- ISMI, *Kitāb al-ḥiyal (Banū Mūsá)* work record and witness list: https://ismi.mpiwg-berlin.mpg.de/text/125021
- Kazım Çeçen and Atilla Bir, “Benî Mûsâ,” *TDV İslâm Ansiklopedisi* (1992): https://islamansiklopedisi.org.tr/beni-musa
- Springer, *The Book of Ingenious Devices / Kitáb al-Ḥiyal*, publisher record: https://doi.org/10.1007/978-94-009-9786-8

**Batch status:** Aḥmad's expertise and the work's individual/collective attribution layers are now documented in a reviewable draft. Direct collation remains necessary before any change to the public work attribution; the full 18-profile catalogue audit remains active.

## 14 November update: Muḥammad ibn Mūsā's celestial-sphere title and expedition text

Added `content/research/muhammad-ibn-musa.json`, registered it in the dossier loader, and added a focused schema test. The batch uncovered a catalogue identity question rather than resolving it. ISMI's *Ḥarakat al-aflāk* record names Muḥammad, lists *Kitāb al-hayʾa* and *Kitāb ḥarakat al-falak al-ūlā* as aliases, and describes a Palmyra–Raqqa Earth-measurement expedition passage; it also reports that the same passage occurs in a more extensive anonymous *Hayʾat al-aflāk* attributed to Qusṭā ibn Lūqā. The record lists two witnesses: Damascus Asad Ẓāhiriyya 4489 and Oxford Bodleian Selden A.11. ISMI cites Saliba (1994), p. 119, for Qusṭā's attribution, but Saliba's article was not directly read. Separately, the BEA and Iranica describe a similarly titled work attributed to Muḥammad as a critique of Ptolemaic cosmology.

The dossier keeps the catalogue's geodetic passage record separate from the cosmology-work report and explicitly leaves their identity unresolved. The witnesses could not be opened, and neither Saliba nor Ragep's cited 1993 edition/translation was directly consulted. No claim is made that the texts are one composition, that the passage proves authorship, or that a cosmological argument has been read.

Sources consulted:
- ISMI, *Ḥarakat al-aflāk*, work record, aliases, note, and two witness listings: https://ismi.mpiwg-berlin.mpg.de/text/78592
- Josep Casulleras, “Banū Mūsā,” *Biographical Encyclopedia of Astronomers* (Springer, 2007), hosted by ISMI: https://ismi.mpiwg-berlin.mpg.de/biography/Banu_Musa_BEA.htm
- David Pingree, “Banū Mūsā,” *Encyclopaedia Iranica*, vol. III, fasc. 7 (1988), pp. 716–717: https://www.iranicaonline.org/articles/banu-musa-the-name-applied-to-three-brothers-abbasid-astronomers-whose-father-was-musa-b/
- George Saliba, “Early Arabic Critique of Ptolemaic Cosmology” (1994), cited by ISMI but not directly consulted: https://doi.org/10.1177/002182869402500205
- F. Jamil Ragep, *Naṣīr al-Dīn al-Ṭūsī's Memoir on Astronomy*, vol. 2, pp. 502–510, cited by ISMI for the expedition passage edition/translation but not directly consulted: https://link.springer.com/book/9781461393281

## 14 November update: Ibn Sīnā's Canon opening and the scope of medicine

Added `content/research/ibn-sina.json`, registered it in the shared dossier loader, and added a focused schema test. This bounded batch records the Canon's opening definition of medicine and its stated boundary with natural philosophy, plus the five-book outline reported by Musallam. It treats the Canon as a major Galenic synthesis in dialogue with Aristotelian philosophy and explicitly avoids a first-invention claim; Iranica notes that earlier systematic Arabic medical works existed.

The passage record is a paraphrase of O. Cameron Gruner's 1930 English Book I translation as presented in an OCR transcription, with Iranica as the independent scholarly account. It is not presented as a direct Arabic quotation: Iranica cautions that the Canon lacks a critical edition and that Gruner's Latin-based version departs from Arabic. Shah's 1966 translation is listed but not consulted. Page images and Arabic wording remain to be collated. Historical medical frameworks are not presented as current advice.

Sources consulted:
- Basim Musallam, “Avicenna x. Medicine and Biology,” *Encyclopaedia Iranica*, vol. III, fasc. 1 (1987; updated 2017), pp. 94–99: https://www.iranicaonline.org/articles/avicenna-x/
- O. Cameron Gruner, *A Treatise on the Canon of Medicine of Avicenna, Incorporating a Translation of the First Book* (London: Luzac, 1930), digitized record: https://archive.org/details/bwb_KU-555-886
- Classics Library, OCR transcription of Gruner's Book I translation: https://classicslaunch.org/works/avicenna-canon-of-medicine-book-i/read/
- Mazhar H. Shah, *The General Principles of Avicenna's Canon of Medicine* (1966), bibliographic record only; translation not consulted: https://wellcomecollection.org/works/es2zhzr3

**Batch status:** Ibn Sīnā now has a reviewable, source-linked starter dossier; direct Arabic collation, translation comparison, chronology verification, and separate investigations remain open. At the time of this update dossier coverage reached 16/18 existing profiles plus the separate Jābir subject; the complete catalogue research objective remains active.

## 14 November update: Abū al-Wafāʾ's spherical tangent rule and Qibla calculations

Added `content/research/abu-al-wafa.json`, registered it in the shared dossier loader, and added an integrity test. The bounded investigation follows Ali Moussa's 2011 study of the *al-Majisṭī* and Qibla determinations. The article abstract reports plane and spherical trigonometry, including a spherical tangent rule, while Pingree's *Encyclopaedia Iranica* summarizes Abū al-Wafāʾ's sine-table and spherical-trigonometry contributions. ISMI's BEA record reports the incomplete Paris manuscript and repeats a stronger tangent-priority claim; this batch deliberately preserves that historiographic question rather than asserting invention priority.

The full Moussa article and Arabic extracts, 2010 edition, and Paris manuscript images were not collated for this batch. The dossier records only the abstract's summary, adds no equation or invented page locator, and leaves a worked Qibla calculation and manuscript verification as explicit next steps. It also keeps the lost *Zīj al-wāḍiḥ* distinct from the *al-Majisṭī* and does not revive the rejected lunar-variation attribution.

Sources consulted:
- David Pingree, “Būzjānī, Abu’l-Wafāʾ,” *Encyclopaedia Iranica*, vol. I, fasc. 4 (1983; updated 2018), pp. 392–394: https://www.iranicaonline.org/articles/abul-wafa-buzjani/
- Behnaz Hashemipour, “Būzjānī: Abū al-Wafāʾ Muḥammad ibn Muḥammad ibn Yaḥyā al-Būzjānī,” *Biographical Encyclopedia of Astronomers* (Springer, 2007), hosted by ISMI: https://ismi.mpiwg-berlin.mpg.de/biography/Buzjani_BEA.htm
- Ali Moussa, “Mathematical Methods in Abū al-Wafāʾ's Almagest and the Qibla Determinations,” *Arabic Sciences and Philosophy* 21, no. 1 (2011), pp. 1–56: https://doi.org/10.1017/S095742391000007X
- Ali Moussa, article scan hosted by ISAMVERI; abstract checked, full body not collated: https://isamveri.org/pdfdkm/11/DKM110956.pdf

**Batch status:** Abū al-Wafāʾ now has a reviewable, source-linked starter dossier. All but Ala Hazrat of the 18 current profiles now have dossier entries (17/18); Jābir remains separately tracked. This is dossier-entry coverage, not completion of the full research audit.

## 14 November update: Ala Hazrat's *Fauz-i-Mubin* argument structure

Added `content/research/ala-hazrat.json`, registered it in the shared dossier loader, and added an integrity test. The bounded study records how Naseeb Ahmed Siddiqui's 2023 article reports the work's preface as stating 105 arguments in groups of 12, 50, and 43, and reproduces a geometric argument through a 2005 English rendering. The arithmetic sum is internally consistent, but the claim count, translation, diagram, and physical inference have not been independently verified.

The evidence chain is explicit: the 2023 article is one sympathetic introductory study and says detailed analysis is outside its primary focus; its quoted text is mediated through a 2005 community-produced English translation. Rekhta identifies an Urdu copy as 197 pages contributed by Rampur Raza Library, but the reader required registration after its free pages, so the Urdu image pages were not available for collation. A conflict between 1919 and 1920 publication dates remains unresolved. No historical argument is presented as a current scientific result.

Sources consulted:
- Naseeb Ahmed Siddiqui, “Imam Ahmed Raza Khan and the Revival of the Islamic Astronomy in India,” *IIUM Journal of Religion and Civilisational Studies* 6, no. 1 (2023), pp. 57–83: https://journals.iium.edu.my/irkh/index.php/ijrcs/article/view/293
- Ahmad Raza Khan, *Fauz-e-Mubeen Dar Radd-e-Harkat-e-Zameen*, English rendering by Abdul Hamid Maiskar (2005), digital copy; examined for edition/translation metadata and page locators only: https://sunnijamaat.net/pdf/Fauz-e-mubeen.pdf
- Rekhta catalogue entry for the Urdu edition (197 pages; publisher listed as Sunni Duniya; contributor Rampur Raza Library); image reader not accessible in this pass: https://www.rekhta.org/ebooks/detail/fauz-e-mubeen-dar-radd-e-harkat-e-zameen-ahamd-raza-khan-raza-ebooks

**Primary chronology follow-up (14 November):** The prefatory text to volume 1A of *Fatawa-e Rizwiyya* includes an authorial first-person account that his father assigned him fatwa work before he had completed fourteen years of age. The PDF searchable text prints 1282 but spells the year as 86; a separate online Arabic/Urdu transcription gives 1286. This suggests a numeral/text transcription conflict, but the scanned page image still needs visual collation. The scanned page image has not been visually checked, so the profile adds the passage with an explicit unresolved-date note and does not convert it into a confirmed timeline date.

**Kanz al-Iman bibliography follow-up (14 November):** Usha Sanyal’s *Encyclopaedia of the Qur’an* entry “Ahmad Rida Khan” reports publication in Muradabad in 1911 and its bibliography lists a Muradabad 1911 edition (pp. 203–204). This is useful bibliographic support, but it is by the same author as the 2005 monograph and is not independent confirmation or an inspected first-edition imprint. The dossier now links this reference to the 1911 claim and keeps the edition inspection open.

**Batch status:** Ala Hazrat has a source-linked draft dossier (18/18 profiles covered; Jābir tracked separately). The public profile now has an expanded academic-source-led biography, thirteen sourced timeline events, seven mapped works—including *Kanz al-Iman* and the later *Fatawa-e Rizwiyya* collection—and the four astronomy titles. Usha Sanyal’s relevant monograph sections and 1998 article now support the life outline; the new material distinguishes source-reported events and movement honorifics from independent validation. The profile remains a draft pending complete bibliography work, primary Urdu collation, edition/date verification, and mathematical reconstruction. The complete research audit remains active.

**Batch status:** the profile now has a reviewable, evidence-linked draft identifying a possible title/content conflation and the exact manuscript targets needed to test it. Primary collation remains open; the full 18-profile audit remains active.
