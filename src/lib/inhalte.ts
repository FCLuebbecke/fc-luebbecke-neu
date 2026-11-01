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
export type BeitragDoc = CollectionEntry<'beitraege'>['data'];
export type BeitragSparte = BeitragDoc['sparte'];
export interface Beitrag extends BeitragDoc {
  /** Datei-Name = Adresse /aktuelles/<id>/ */
  id: string;
}

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

/**
 * Beiträge „Aktuelles“, neueste zuerst (Spec 007).
 * @param sparte nur Beiträge dieser Sparte
 * @param limit höchstens so viele
 */
export async function getBeitraege({ sparte, limit }: { sparte?: BeitragSparte; limit?: number } = {}): Promise<Beitrag[]> {
  const eintraege = await getCollection('beitraege', (e) => !sparte || e.data.sparte === sparte);
  const liste = eintraege
    .map((e) => ({ id: e.id, ...e.data }))
    .sort((a, b) => b.datum.localeCompare(a.datum) || a.titel.localeCompare(b.titel, 'de'));
  return limit ? liste.slice(0, limit) : liste;
}

/** Bezeichnung einer Sparte für Etiketten. */
export const SPARTEN_NAMEN: Record<BeitragSparte, string> = {
  fussball: 'Fußball',
  badminton: 'Badminton',
  darts: 'Darts',
  verein: 'Verein',
};

/** Datum „2026-11-01“ → „1. November 2026“ bzw. kurz „01.11.2026“. */
export function datumLang(iso: string): string {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
}
export function datumKurz(iso: string): string {
  const [j, m, t] = iso.split('-');
  return `${t}.${m}.${j}`;
}
