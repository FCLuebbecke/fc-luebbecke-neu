/**
 * Datenschicht für die Inhalte unter src/content/ (Spec 008, ersetzt lib/sanity.ts).
 * Funktionsnamen entsprechen der früheren Sanity-Anbindung, damit die Seiten
 * kaum angepasst werden mussten. Alle Listen sind nach `reihenfolge`, dann
 * Name sortiert.
 */
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export type MannschaftDoc = CollectionEntry<'mannschaften'>['data'];
export type SparteTeamDoc = CollectionEntry<'sparten-mannschaften'>['data'];
export type SparteInfoDoc = CollectionEntry<'sparten-infos'>['data'];
export type SponsorDoc = CollectionEntry<'sponsoren'>['data'];
export type TrainerEintrag = NonNullable<MannschaftDoc['trainerteam']>[number];
export type Bild = NonNullable<MannschaftDoc['foto']>;
export type Sparte = SparteTeamDoc['sparte'];

const sortiert = <T extends { reihenfolge: number; name: string }>(liste: T[]) =>
  liste.sort((a, b) => a.reihenfolge - b.reihenfolge || a.name.localeCompare(b.name, 'de'));

/** Alle Fußball-Mannschaften (Herren & Jugend). */
export async function getMannschaften(): Promise<MannschaftDoc[]> {
  return sortiert((await getCollection('mannschaften')).map((e) => e.data));
}

/** Mannschaften einer Sparte (Badminton/Darts). */
export async function getSparteTeams(sparte: Sparte): Promise<SparteTeamDoc[]> {
  const eintraege = await getCollection('sparten-mannschaften', (e) => e.data.sparte === sparte);
  return sortiert(eintraege.map((e) => e.data));
}

/** Trainingszeiten & Ort einer Sparte (Datei src/content/sparten-infos/<sparte>.json). */
export async function getSparteInfo(sparte: Sparte): Promise<SparteInfoDoc> {
  const eintrag = await getEntry('sparten-infos', sparte);
  if (!eintrag) throw new Error(`Inhalt fehlt: src/content/sparten-infos/${sparte}.json`);
  return eintrag.data;
}

/** Alle Sponsoren. */
export async function getSponsoren(): Promise<SponsorDoc[]> {
  return sortiert((await getCollection('sponsoren')).map((e) => e.data));
}
