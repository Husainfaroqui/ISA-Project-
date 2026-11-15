import alRazi from "../../content/research/al-razi.json";
import alKhwarizmi from "../../content/research/al-khwarizmi.json";
import jabir from "../../content/research/jabir-ibn-hayyan.json";
import ibnAlHaytham from "../../content/research/ibn-al-haytham.json";
import alBiruni from "../../content/research/al-biruni.json";
import banuMusa from "../../content/research/banu-musa.json";
import alZahrawi from "../../content/research/al-zahrawi.json";
import ibnAlNafis from "../../content/research/ibn-al-nafis.json";
import hunayn from "../../content/research/hunayn-ibn-ishaq.json";
import alKindi from "../../content/research/al-kindi.json";
import alFarghani from "../../content/research/al-farghani.json";
import thabit from "../../content/research/thabit-ibn-qurra.json";
import alBattani from "../../content/research/al-battani.json";
import alHasan from "../../content/research/al-hasan-ibn-musa.json";
import ahmad from "../../content/research/ahmad-ibn-musa.json";
import muhammadBanuMusa from "../../content/research/muhammad-ibn-musa.json";
import ibnSina from "../../content/research/ibn-sina.json";
import abuAlWafa from "../../content/research/abu-al-wafa.json";
import alaHazrat from "../../content/research/ala-hazrat.json";
import type { ScientistDossier } from "../lib/types";

const dossiers = [alRazi as unknown as ScientistDossier, alKhwarizmi as unknown as ScientistDossier, jabir as unknown as ScientistDossier, ibnAlHaytham as unknown as ScientistDossier, alBiruni as unknown as ScientistDossier, banuMusa as unknown as ScientistDossier, alZahrawi as unknown as ScientistDossier, ibnAlNafis as unknown as ScientistDossier, hunayn as unknown as ScientistDossier, alKindi as unknown as ScientistDossier, alFarghani as unknown as ScientistDossier, thabit as unknown as ScientistDossier, alBattani as unknown as ScientistDossier, alHasan as unknown as ScientistDossier, ahmad as unknown as ScientistDossier, muhammadBanuMusa as unknown as ScientistDossier, ibnSina as unknown as ScientistDossier, abuAlWafa as unknown as ScientistDossier, alaHazrat as unknown as ScientistDossier];
const isHttps = (value?: string) => !value || /^https:\/\//i.test(value);

export function dossierForScholar(slug: string): ScientistDossier | undefined {
  return dossiers.find(dossier => dossier.scholarSlug === slug);
}

export function validateResearchDossiers(items: ScientistDossier[] = dossiers): string[] {
  const errors: string[] = [], slugs = new Set<string>();
  for (const dossier of items) {
    if (slugs.has(dossier.scholarSlug)) errors.push(`duplicate dossier: ${dossier.scholarSlug}`);
    slugs.add(dossier.scholarSlug);
    const sourceIds = new Set(dossier.sources.map(source => source.id));
    const workIds = new Set(dossier.works.map(work => work.id));
    const claims = dossier.investigations.flatMap(investigation => investigation.claims);
    const claimIds = new Set(claims.map(claim => claim.id));
    if (sourceIds.size !== dossier.sources.length) errors.push(`duplicate source id: ${dossier.scholarSlug}`);
    if (workIds.size !== dossier.works.length) errors.push(`duplicate work id: ${dossier.scholarSlug}`);
    if (claimIds.size !== claims.length) errors.push(`duplicate claim id: ${dossier.scholarSlug}`);
    for (const section of Object.values(dossier.sections)) {
      for (const claimId of section.claimIds) if (!claimIds.has(claimId)) errors.push(`unknown section claim ${claimId}: ${dossier.scholarSlug}`);
    }
    for (const source of dossier.sources) {
      if (!source.title || !source.authorOrInstitution || !source.sourceType) errors.push(`incomplete source: ${source.id}`);
      if (!isHttps(source.stableUrl)) errors.push(`unsafe source URL: ${source.id}`);
    }
    for (const work of dossier.works) {
      if (work.scholarSlug !== dossier.scholarSlug) errors.push(`work attached to wrong scholar: ${work.id}`);
      for (const sourceId of work.sourceIds) if (!sourceIds.has(sourceId)) errors.push(`unknown work source ${sourceId}: ${work.id}`);
      for (const passage of work.passages) {
        if (!sourceIds.has(passage.sourceId)) errors.push(`unknown passage source ${passage.sourceId}: ${work.id}`);
        if (passage.workId !== work.id) errors.push(`passage attached to wrong work ${passage.workId}: ${work.id}`);
      }
      if (!isHttps(work.digitizedUrl)) errors.push(`unsafe work URL: ${work.id}`);
    }
    for (const investigation of dossier.investigations) {
      if (investigation.scholarSlug !== dossier.scholarSlug) errors.push(`investigation attached to wrong scholar: ${investigation.id}`);
      for (const claim of investigation.claims) {
        if (!claim.sourceIds.length) errors.push(`claim without evidence source: ${claim.id}`);
        for (const sourceId of claim.sourceIds) if (!sourceIds.has(sourceId)) errors.push(`unknown claim source ${sourceId}: ${claim.id}`);
      }
    }
  }
  return errors;
}
