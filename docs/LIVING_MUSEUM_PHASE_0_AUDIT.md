# Living Museum brief: Phase 0 audit and delivery boundary

Audit date: 2026-11-13. Scope: the latest extracted Vite + TypeScript project in this workspace. This complements `PROJECT_AUDIT.md`; it is not a claim that all roadmap phases are finished.

## What is present and working in the codebase

- Vite + TypeScript, local JSON-backed public archive, and optional Supabase repository. The existing application does not require Supabase to show public local content.
- Local content dossiers for Ala Hazrat, Batch 2A (al-Khwarizmi, the Banu Musa group and members, al-Kindi) and Batch 2B. Records include cited works, contributions, events and some sourced relationships; biography coverage varies considerably.
- Routes for home, scholar directory, scholar profiles, contribution detail, timeline, library catalogue and admin. The library is assembled from existing source-linked work records; it is not a standalone manuscript database.
- Existing green/gold identity, geometric hero illustration, reduced-motion CSS, responsive layouts, profile section navigation, library artwork lightbox, and the Dargah dome photo with attribution/fallback.
- Supabase migrations `0001`–`0009`, including sourced relationships (0008) and role-gated admin, audit and media metadata (0009). This review did not connect to a hosted database or assert which migrations are deployed.
- Automated tests cover routing, search/filtering, local mapping, citations, timeline, dossier integration, RBAC contracts and the current visual identity.

## Gaps found against the new brief

- No authentic portraits were verified for the four featured medieval scholars. The previous generated face assets were generic and have been removed from active use; field diagrams are used instead. They are explicitly labeled as diagrams, not portraits.
- There is no structured manuscript entity, no internal page-by-page IIIF viewer, and sparse edition/language/repository metadata in the current work schema. The existing book illustrations are original ISA diagrams, not scans.
- There is no dedicated scientific instrument database, interactive historical map, graph visualization, or institution/location catalogue. Relationship lists are sourced but not an interactive network.
- Scholar biographies and early-life/education histories are incomplete; several dossier records do not have a narrative biography. The daily feature therefore uses existing cited contribution and work records and does not synthesize missing biographies.
- Ala Hazrat's dossier says that identified manuscripts are “none identified”; the research and publication catalogue remains incomplete. His Dargah image is preserved as supplied in this project revision.
- About, contact and disciplines are homepage sections/filters rather than separate maintained catalogues or pages. The actual UI language review remains incomplete.

## First deliverable implemented from Phases 1–2

- Replaced the generic hero illustration label/copy with an accessible “Living Astrolabe” explanation panel and restrained, slow CSS motion over the existing original SVG. The image is identified as an ISA educational illustration, not a historical object; motion stops under `prefers-reduced-motion`.
- Added a deterministic Scholar of the Day chosen by UTC date from local/repository records that have both a cited contribution and cited work. It displays those existing records, not generated facts.
- Added an actual digitized manuscript catalogue spotlight: the Qatar Digital Library record for a 1627 copy of al-Khuzāʿī's commentary on al-Khwārizmī's algebra (the commentary was completed in 1211). The display explicitly says it is later commentary, not al-Khwārizmī's own surviving manuscript, and links to the QDL folios/IIIF record. Metadata shown: British Library Oriental Manuscripts, Delhi Arabic 1897, ff. 1r–124v, Arabic. QDL's record states unrestricted access and public-domain usage.
- Updated primary navigation to link to existing archive sections and routes; added English/Urdu/Arabic strings for new controls.
- Kept the original green/gold palette and the Dargah photograph/credit. Replaced the recent generic face-style assets on non-Ala profiles/cards with the existing field-specific original science diagrams. No portrait is presented as historical fact.

## Source checks for new historical references

- The Met's essay describes historical astrolabe uses and the broader instrument context: <https://www.metmuseum.org/fr/essays/astronomy-and-astrology-in-the-medieval-islamic-world>.
- The British Museum catalogues a 13th-century brass astrolabe, museum no. 1855,0709.1, and discusses the instrument's transmission and uses: <https://islamicworld.britishmuseum.org/collection/RRM9662>.
- Qatar Digital Library's catalogue provides the manuscript description, completion date, extent, holding institution, IIIF manifest and usage terms: <https://qdl.qa/en/archive/81055/vdc_100083376667.0x000003>.
- No external portrait image or manuscript scan was copied into the project in this phase. The authenticated Dargah photo remains the only featured photographic asset.

## Verification and remaining acceptance step

- Build and unit tests are run after these changes; results are recorded in the completion report and project changelog.
- An actual browser review is required before treating this as visually accepted. The in-app browser could not reach the local Vite server at `127.0.0.1:5187` in this environment, and the shell also denied loopback socket access. Browser desktop/mobile screenshots and interactive visual checks are therefore not claimed here.
- Do not advance to additional research/catalogue, map/network, or admin phases until the first deliverable has been reviewed in a working browser and the audit gaps above are addressed deliberately.
