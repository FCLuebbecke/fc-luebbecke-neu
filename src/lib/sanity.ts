/**
 * Daten-Abfragen gegen Sanity (Build-Zeit).
 * Der Client `sanity:client` wird von der @sanity/astro-Integration bereitgestellt
 * (Project-ID/Dataset aus astro.config.mjs bzw. .env).
 */
import { sanityClient } from 'sanity:client';

export interface MannschaftDoc {
  name: string;
  kategorie: 'herren' | 'jugend';
  liga?: string;
  text?: string;
  jahrgang?: string;
  trainer?: string;
  trainingszeiten?: string;
  foto?: { url?: string; alt?: string };
  platzhalter?: boolean;
}

const MANNSCHAFTEN_QUERY = `*[_type == "mannschaft"] | order(reihenfolge asc, name asc){
  name, kategorie, liga, text, jahrgang, trainer, trainingszeiten, platzhalter,
  foto{ "url": asset->url, alt }
}`;

/**
 * Alle Fußball-Mannschaften aus Sanity. Liefert `[]`, wenn kein Projekt
 * konfiguriert ist oder der Fetch fehlschlägt – die Seite fällt dann auf ihre
 * gepflegten Platzhalter-Daten zurück.
 */
export async function getMannschaften(): Promise<MannschaftDoc[]> {
  try {
    return await sanityClient.fetch<MannschaftDoc[]>(MANNSCHAFTEN_QUERY);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[sanity] Mannschaften nicht geladen – Fallback aktiv (${msg})`);
    return [];
  }
}

/** Team-Karte einer Sparte (Badminton/Darts) – Felder passend zu `Team` in data/sparten.ts. */
export interface SparteTeamDoc {
  name: string;
  liga?: string;
  info?: string;
  href?: string;
  platzhalter?: boolean;
  foto?: { url?: string; alt?: string };
}

const SPARTE_TEAMS_QUERY = `*[_type == $type] | order(reihenfolge asc, name asc){
  name, liga, info, href, platzhalter,
  foto{ "url": asset->url, alt }
}`;

/**
 * Mannschaften einer Sparte ("badminton" | "darts") aus Sanity.
 * Badminton und Darts sind getrennte Dokumenttypen (badmintonMannschaft / dartsMannschaft).
 * Liefert `[]` bei fehlender Konfiguration/Fehler → Seite nutzt ihre Fallback-Daten.
 */
export async function getSparteTeams(sparte: string): Promise<SparteTeamDoc[]> {
  try {
    return await sanityClient.fetch<SparteTeamDoc[]>(SPARTE_TEAMS_QUERY, {
      type: `${sparte}Mannschaft`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[sanity] Sparten-Teams (${sparte}) nicht geladen – Fallback aktiv (${msg})`);
    return [];
  }
}

/** Trainingszeiten + Ort einer Sparte (passend zu den Feldern in data/sparten.ts). */
export interface SparteInfoDoc {
  training?: { gruppe: string; zeit: string }[];
  ortName?: string;
  ortAdresse?: string;
}

const SPARTE_INFO_QUERY = `*[_type == $type][0]{
  training[]{ gruppe, zeit }, ortName, ortAdresse
}`;

/**
 * Trainingszeiten & Ort einer Sparte ("badminton" | "darts") aus Sanity.
 * Getrennte Dokumenttypen (badmintonInfo / dartsInfo).
 * Liefert `null` bei fehlender Konfiguration/Fehler → Seite nutzt Fallback-Daten.
 */
export async function getSparteInfo(sparte: string): Promise<SparteInfoDoc | null> {
  try {
    return await sanityClient.fetch<SparteInfoDoc | null>(SPARTE_INFO_QUERY, {
      type: `${sparte}Info`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[sanity] Sparten-Info (${sparte}) nicht geladen – Fallback aktiv (${msg})`);
    return null;
  }
}
