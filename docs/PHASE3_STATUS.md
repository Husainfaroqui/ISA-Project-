# Phase 3 status (living document)

Principle: evidence before attribution. The JSON dossiers are research records; the public local directory now renders source-linked records without editorial status badges. Supabase publication still requires its independent review gate.

## Done: Batch 0 (infrastructure)
- Migration `0006_contribution_layer.sql`: contribution classification (10 classes), attribution confidence, discipline, period, "what existed before", "what the scholar contributed"; evidence tiers (7) on claim sources; 2 new editorial labels; DB-enforced rules (invention/discovery need high confidence and primary or academic evidence before publication).
- Pages: contribution page (`/:lang/scholars/:slug/contributions/:id`) and contribution links on profiles. Editorial workflow guidance remains in project documentation and is not a public verification page.
- Tests: SQL block 6 (10 checks) and `tests/phase3.test.ts`.

## Batch 1 (Ala Hazrat): research pass 1, DRAFT
Ledger: `content/ala-hazrat.json` (single source of truth) generates `docs/ALA_HAZRAT_DOSSIER_DRAFT.md` and `supabase/content/ala_hazrat_draft.sql` (`python3 tools/build_content.py`). 24 claims (each labeled individually), 5 sources, 6 attributed works, 2 contributions.
- **Nothing is VERIFIED.** One academic source was read in full (S1, a 2023 journal article); it is single-author, sympathetic, introductory by its own account, and takes work counts from community sites. Everything else is UNVERIFIED, UNDER REVIEW, or a modern assessment drafted by ISA and awaiting an expert citation.
- Sanyal's books were found in catalogues but NOT read: no locators recorded.
- Not found: Urdu-script titles, catalogue records, manuscripts, an independently documented mathematics record, a verified teacher list, death date from an academic source.
- The load script creates a **draft** only; it cannot reach the public without sources and an independent approved review (tested).

## Batch 3 (timeline system)
- Migration `0007_timeline_events.sql`: `timeline_events` (event type, year range for uncertain dates, date certainty exact/approximate/disputed, confidence, label), claim sources can cite an event, RLS (public sees only published scholars' events), and integration with the Phase 2 safeguards: every event needs a source before its scholar can publish, the last source of an event cannot be removed from a published scholar, and any event change demotes the scholar for fresh independent review.
- Pages: `/:lang/timeline` (filters by type, scholar, century; filter state in the URL; uncertainty shown as "c." / ranges / "(disputed)"), a Timeline section on profiles, nav link.
- Ala Hazrat: 7 draft events from the ledger. The death event (1921) is unsourced and stays UNVERIFIED; the publication year of *Fauz-i-Mubin* is recorded as the disputed range 1919–1920.
- Also fixed: the TypeScript `Label` type was missing the two labels added in 0006 (caught by the new tests).

## Sub-batch 2A (al-Khwarizmi, Banu Musa, al-Kindi): research pass 1, DRAFT
Ledger: `content/batch-2a.json` (single source of truth) generates `docs/BATCH_2A_DOSSIERS_DRAFT.md` and `supabase/content/batch_2a_draft.sql` (`python3 tools/build_batch.py`). 6 records (al-Khwarizmi; the Banu Musa group and its three members; al-Kindi), 53 claims (8 VERIFIED, 31 ACADEMICALLY SUPPORTED, 7 DISPUTED, 2 ATTRIBUTION UNCERTAIN, 3 drafted modern assessments, 1 UNDER REVIEW, 1 UNVERIFIED), 20 works, 13 contributions, 11 timeline events, 3 relationships.
- **Sources read in full (4):** Toomer (DSB vol. 7, 1973) and Brentjes (Springer BEA, 2007) on al-Khwarizmi; Casulleras (Springer BEA, 2007) on the Banu Musa; Adamson (Stanford Encyclopedia of Philosophy, rev. 2024) on al-Kindi. Locators are entry/section-level because these copies have no stable page numbers.
- **VERIFIED** is used only where both al-Khwarizmi sources agree (8 claims/events). Banu Musa and al-Kindi are single-source, so nothing about them is VERIFIED.
- **Disagreements preserved as DISPUTED:** al-Khwarizmi's origin, religion, expedition reports, the sources of his algebra, observations in his zij; the authenticity of al-Kindi's *On Rays*.
- **Not claimed:** no inventions or "firsts"; no device-level Banu Musa claims (popular claims logged UNVERIFIED); no individual attribution beyond what the Banu Musa source states; no original-script titles; no human-reviewed translations. Arabic/Urdu names exist only for al-Khwarizmi (unreviewed); the others show English.
- **Next for these scholars:** read Hill 1979, al-Dabbagh's DSB entry, MacTutor, Rosen, Adamson 2007; add second sources for al-Kindi; check manuscript shelfmarks in library catalogues (the two shelfmarks cited for the Algebra are as printed in the DSB and unchecked).
- **Migration 0008** adds relationships and group scholars; relationships to Thabit ibn Qurra, Hunayn ibn Ishaq, al-Farghani and al-Biruni are logged as leads for Sub-batch 2B/2C (those scholars are not in the archive yet).

## Not done yet (honest list)
- Per-event / per-contribution independent review/publication (currently review is per scholar; any contribution change demotes the scholar for re-review).
- Knowledge-network visualisation (relationships are stored and listed on profiles only); tables and pages for institutions, locations, manuscripts, editions, attribution assessments, translation reviews. Events not tied to a scholar (institutions, wider historical events) are not supported yet.
- Timeline is a list grouped by century, not an interactive graphic. Event titles/descriptions are English; Urdu/Arabic show a pending-translation note.
- Revision history table (Phase 2 tracks `content_rev`/`last_edited_by`, not full history).
- All Batch 1-7 research content, including the Ala Hazrat dossier.
- Urdu/Arabic for editorial vocabulary (classes, tiers, methodology text): English shown with a "translation pending" note. New chip translations are unreviewed.

## Source leads found so far (Ala Hazrat; all UNVERIFIED until read)
- Academic anchor: U. Sanyal, *Devotional Islam and Politics in British India* (Oxford University Press, 1996; Delhi paperback 1999) and *Ahmad Riza Khan Barelwi: In the Path of the Prophet* (Oneworld). Catalogue descriptions concern religion and politics, not science. Edition details differ between listings.
- Open question: a journal article on his astronomy (IIUM, ijrcs) has not been read.
- Conflicts to resolve: publication year of the earth-motion treatises (1919 vs 1920 in different listings); spelling variants of *Fauz-e-Mubeen / Fauz-i-Mubin / Fauze Mubeen*.
- Community claims (e.g. a stated count of arguments in *Fauz-e-Mubeen*) are recorded as community narrative until the text is checked.
