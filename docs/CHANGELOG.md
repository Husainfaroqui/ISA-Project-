# Change log

## 2026-11-13 — Green and gold identity refinement

- Restored the exact original ISA core colours from `src/styles/main.css`: deep green `#0f3d2e`, emerald `#1b7a5a`, antique gold `#a8812c`, and ivory `#faf6ec`; removed blue/navy presentation colours from the redesigned public pages.
- Added a slow green ambient hero glow, muted gold geometric drift and sparse gold light specks in lightweight CSS/SVG, with reduced-motion support.
- Added a real Dargah-e-Ala Hazrat dome photo to the featured scholar and profile views, credited to Wp masifnoor / Wikimedia Commons under CC0 1.0. A clearly labeled architectural illustration is the offline image fallback.
- Kept other historical scholar visuals as field diagrams labeled as illustrations, not authenticated portraits.
- Compared against the original palette in the checked-in base stylesheet; this project copy includes no Git history. No migration or backend change.
- Verified with `npm run build` and `npm test` (98 tests passed). Browser preview remains unavailable from the isolated checker; use the project’s documented local port 5187.

## 2026-11-13 — Museum-inspired archive experience

- Replaced the plain landing page with a responsive, editorial homepage and source-backed featured scholars, search/filter controls, collection highlights, disciplines, sourced contributions, timeline and relationship sections.
- Added `/en/library`, `/ur/library`, and `/ar/library` with title/scholar search, discipline filtering, source-backed work records and detail views.
- Added original vector diagrams for the hero and fields of study. Every diagram is labeled as illustrative; none is represented as a manuscript scan or authenticated portrait.
- Improved scholar profile headers and retained the existing profile records, citations, and language routing.
- Extended the work mapper to preserve subject, language, and publication note fields where the existing schema provides them. No database migration added.
- Added a separately labeled Qatar Digital Library link to a later commentary manuscript related to al-Khwarizmi’s algebra; it is explicitly distinguished from an authorial manuscript.
- Verified at the time with `npm run build` and `npm test` (96 tests). Database integration suites were not run. The project uses port 5187 by default.

## 2026-11-13 — Content-first public archive

- Made bundled source-linked research records the public fallback when Supabase is not configured or network access fails.
- Added archive-wide local search across scholar metadata and linked research records; removed generic placeholder-only scholars.
- Removed public review/confidence/evidence labels and the public `/method` page while retaining source links and locators.
- Integrated Batch 2B profile records into the local archive and updated documentation and tests.
- Verified with `npm run build` and `npm test` (96 tests passed). Database suites were not available in this environment.

## 2026-11-13 — Living Museum first deliverable (Phases 1–2 visual batch)

- Added a restrained, slow, accessible astrolabe overlay and explainer to the green-and-gold hero; it links to The Met's use guide, a British Museum object record, and the archive's al-Biruni profile. Reduced-motion preferences disable the animation.
- Added deterministic daily scholar selection from existing records that have both a cited contribution and a cited work; it displays those record fields without generating biography text.
- Added a digitized manuscript spotlight linked to QDL's IIIF-enabled record for Delhi Arabic 1897. The card distinguishes al-Khuzāʿī's later commentary and its 1627 copy from al-Khwārizmī's own surviving manuscripts.
- Replaced non-Ala Hazrat face-style placeholder artwork on scholar cards/profiles with discipline diagrams. The original Dargah photograph and image treatment were not replaced.
- Refined archive navigation and localized new controls. Added `docs/LIVING_MUSEUM_PHASE_0_AUDIT.md` with working features, content gaps, provenance checks and the remaining browser review requirement.
- Verified `npm run build` and `npm test` (100 tests passed). The in-app browser timed out connecting to the local server; visual screenshots have not been accepted/reviewed.


## 2026-11-14 — Universal research foundation and al-Razi batch

- Audited all 18 current scholar profiles and documented their current record counts and missing evidence areas; recorded Jabir ibn Hayyan as a requested expansion scholar not yet in the catalogue.
- Added a reusable dossier JSON Schema and matching TypeScript models for source-ranked evidence, original works/passages, investigations, confidence, recognition and unresolved questions.
- Added a local-first dossier loader with source-link integrity checks and profile rendering for detailed investigations, editions, translated passages and open questions.
- Started al-Razi's medical dossier with one source-located symptom-comparison investigation based on Greenhill's 1848 translation. It remains explicitly a draft pending page-image and Arabic-text collation; no medical advice or disease-discovery claim is presented.
- Added audit/progress documentation and tests for all 18 roster entries and dossier source linkage.
- `npm run build` passed; `npm test` passed (106 tests). Supabase migrations unchanged.
