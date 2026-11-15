import type { Lang } from "./i18n";
export type Period = "early" | "classical" | "modern";
export type Label = "verified" | "under_review" | "disputed" | "unverified" | "primary_source" | "modern_assessment" | "academically_supported" | "attribution_uncertain";
export interface Ref { title: string; author?: string; url?: string; locator?: string; tier?: string }
export interface Contribution { id: string; text: string; label: Label; lang: Lang; refs: Ref[]; title?: string; kind?: string; confidence?: string; discipline?: string; periodText?: string; priorState?: string; detail?: string }
export interface Scholar {
  slug: string; names: Partial<Record<Lang, string>> & { en: string };
  region: string; period: Period; dates?: string; disciplines: string[];
  bios: Partial<Record<Lang, string>>;
  works: { title: string; status: Label; refs: Ref[]; subject?: string; language?: string; dateNote?: string }[];
  contributions: Contribution[]; events: TimelineEvent[]; relations: Relation[]; kind?: "individual" | "group";
  sample: boolean; researchDraft?: boolean;
}
export interface TimelineEvent { id: string; title: string; type: string; yearEarliest: number; yearLatest: number; certainty: "exact" | "approximate" | "disputed"; dateNote?: string; description?: string; confidence: string; label: Label; refs: Ref[] }
export interface Relation { id: string; type: string; direction: "out" | "in"; otherSlug: string; otherName: string; otherNames?: Partial<Record<Lang, string>>; description?: string; confidence: string; label: Label; refs: Ref[] }
export interface ManuscriptRecord { id: string; scholarSlug: string; workTitle: string; title: string; originalTitle?: string; language: string; date?: string; materialType: "autograph" | "historical_copy" | "later_commentary_copy" | "historical_translation" | "printed_edition" | "reconstruction"; repository: string; catalogueReference?: string; sourceUrl: string; catalogueUrl?: string; iiifManifestUrl?: string; imageUrl?: string; attribution?: string; licence?: string; classification: string; description: string; connection: string }
export type EvidenceTier = "primary_source" | "academic_research" | "institutional_catalogue" | "reference_work" | "community_lead";
export type ResearchState = "not_started" | "in_progress" | "draft" | "reviewed" | "published" | "blocked";
export interface ResearchSource { id: string; title: string; authorOrInstitution: string; sourceType: EvidenceTier; publicationDate?: string; stableUrl?: string; consulted: boolean; notes?: string }
export interface SourcePassage { workId: string; sourceId: string; editionOrShelfmark: string; language: string; originalPassage: string; translation?: string; printedPage?: string; pdfPage?: string; chapterOrSection?: string; explanation?: string }
export interface EvidenceClaim { id: string; text: string; sourceIds: string[]; locator?: string; sourceType: EvidenceTier; confidence: "high" | "medium" | "low" | "unresolved"; uncertainty?: string; modernAssessment?: string }
export interface OriginalWork { id: string; scholarSlug: string; originalTitle?: string; transliteration: string; translation?: string; language?: string; subject: string; purpose?: string; authorship: ResearchState; date?: string; sourceIds: string[]; digitizedUrl?: string; passages: SourcePassage[]; notes?: string }
export interface ScientificInvestigation { id: string; scholarSlug: string; title: string; field: string; historicalProblem: string; historicalContext: string; method?: string; observationsOrCalculations?: string; reportedResult?: string; whatWasNew?: string; limitations?: string; laterInfluence?: string; claims: EvidenceClaim[]; state: ResearchState }
export interface RecognitionTag { label: string; rationale: string; sourceIds: string[]; confidence: "high" | "medium" | "low"; state: ResearchState }
export interface ResearchSection { state: ResearchState; text: string; claimIds: string[]; gaps?: string[] }
export interface ScientistDossier { scholarSlug: string; dossierState: ResearchState; sections: { biography: ResearchSection; timeline: ResearchSection; fields: ResearchSection; education?: ResearchSection; legacy: ResearchSection }; investigations: ScientificInvestigation[]; sources: ResearchSource[]; works: OriginalWork[]; recognition: RecognitionTag[]; openQuestions: string[]; lastResearched?: string }
export interface Query { q?: string; d?: string; r?: string; p?: string; s?: "az" | "period"; page?: number }
