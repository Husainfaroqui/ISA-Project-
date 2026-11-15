/** Editorial vocabulary (English only until human-reviewed translations exist). Keys match the SQL enums in migration 0006. */
export const KINDS: Record<string, [string, string]> = {
  original_invention: ["ORIGINAL INVENTION", "A new device or method for which evidence shows no earlier equivalent. Requires high confidence and primary or academic evidence."],
  original_discovery: ["ORIGINAL DISCOVERY", "A new finding with no earlier equivalent in the evidence. Requires high confidence and primary or academic evidence."],
  mathematical_development: ["MATHEMATICAL DEVELOPMENT", "A new or extended mathematical method, result or table."],
  experimental_contribution: ["EXPERIMENTAL CONTRIBUTION", "A documented experiment or experimental method."],
  theoretical_contribution: ["THEORETICAL CONTRIBUTION", "A new explanation, model or argument."],
  technical_improvement: ["TECHNICAL IMPROVEMENT", "An improvement to an existing device, instrument or technique."],
  observational_contribution: ["OBSERVATIONAL CONTRIBUTION", "Recorded observations, measurements or surveys."],
  translation_or_preservation: ["TRANSLATION OR PRESERVATION", "Translating, copying or preserving earlier knowledge."],
  commentary_or_synthesis: ["COMMENTARY OR SYNTHESIS", "Commenting on, organizing or combining earlier work."],
  disputed_attribution: ["DISPUTED ATTRIBUTION", "Credit for this contribution is contested. Confidence must be low or uncertain."],
};
export const TIERS: Record<string, [string, string]> = {
  primary: ["Primary source", "Original manuscripts, early printed editions, treatises, contemporary records, archival catalogues, historical tables and diagrams."],
  contemporary_account: ["Contemporary or near-contemporary account", "Written close in time to the events by people who could know them."],
  academic_research: ["Academic historical research", "Peer-reviewed articles, university-press books, critical editions, library and museum catalogues."],
  later_traditional: ["Later traditional account", "Reports written long afterwards and transmitted by tradition."],
  community_devotional: ["Community or devotional narrative", "Accounts kept within a community. Recorded as such; never sufficient alone for a historical claim."],
  disputed_uncertain: ["Disputed or uncertain", "Evidence whose attribution or reliability is contested."],
  modern_assessment: ["Modern scientific assessment", "Evaluation against current scientific knowledge. Kept separate from the historical argument."],
};
export const LABELS = ["VERIFIED", "PRIMARY SOURCE", "ACADEMICALLY SUPPORTED", "UNDER REVIEW", "DISPUTED", "UNVERIFIED", "MODERN SCIENTIFIC ASSESSMENT", "ATTRIBUTION UNCERTAIN"] as const;
export const CONFIDENCE = ["high", "medium", "low", "uncertain"] as const;
export const kindLabel = (k?: string) => (k && KINDS[k] ? KINDS[k][0] : "");
export const tierLabel = (t?: string) => (t && TIERS[t] ? TIERS[t][0] : "");
export const EVENT_TYPES: Record<string, string> = { birth: "Birth", death: "Death", work_composed: "Work composed", publication: "Publication", contribution: "Contribution", manuscript: "Manuscript", institution: "Institution", historical_event: "Historical event", translation: "Translation" };
export const CERTAINTIES = ["exact", "approximate", "disputed"] as const;
/** [label when the profile owner is the subject, label when the profile owner is the object] */
export const RELATIONS: Record<string, [string, string]> = { teacher_of: ["Teacher of", "Student of"], collaborator: ["Collaborator with", "Collaborator with"], influenced: ["Influenced", "Influenced by"], translated: ["Translated the works of", "Works translated by"], patron_of: ["Patron of", "Supported by"], member_of: ["Member of", "Members include"], sibling_of: ["Brother of", "Brother of"], institutional: ["Shared institution with", "Shared institution with"] };
