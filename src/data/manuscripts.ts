import rows from "../../content/manuscripts.json";
import type { ManuscriptRecord } from "../lib/types";

const records = rows as ManuscriptRecord[];
const secureHttpUrl = (value?: string) => !!value && /^https:\/\//i.test(value);

// Keep this catalogue local-first and only publish records with a traceable source.
export function manuscriptsForScholar(slug: string): ManuscriptRecord[] {
  return records.filter(record => record.scholarSlug === slug && secureHttpUrl(record.sourceUrl));
}

export function verifiedManuscripts(): ManuscriptRecord[] {
  return records.filter(record => secureHttpUrl(record.sourceUrl) && !!record.imageUrl && secureHttpUrl(record.imageUrl));
}

export function validateManuscripts(): string[] {
  const issues: string[] = [], ids = new Set<string>();
  for (const record of records) {
    if (!record.id || ids.has(record.id)) issues.push(`duplicate or empty manuscript id: ${record.id}`);
    ids.add(record.id);
    if (!record.scholarSlug || !record.title || !record.workTitle || !record.repository || !record.description || !record.connection) issues.push(`incomplete manuscript metadata: ${record.id}`);
    if (!secureHttpUrl(record.sourceUrl) || (record.imageUrl && !secureHttpUrl(record.imageUrl)) || (record.iiifManifestUrl && !secureHttpUrl(record.iiifManifestUrl))) issues.push(`unsafe URL: ${record.id}`);
  }
  return issues;
}
