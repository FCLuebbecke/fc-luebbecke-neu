/**
 * Inhalts-Logik des MCP-Servers (Spec 010): Sammlungen, erlaubte Pfade,
 * Prüfung gegen die gemeinsamen Regeln aus src/content/schemas.mjs.
 */
import { z } from 'zod';
import { SAMMLUNGEN, bildFelder, bildPfadSchema, inhaltsSchemas } from '../src/content/schemas.mjs';

export { SAMMLUNGEN };

/** Regeln, wie der MCP-Server sie prüft (Bild = Pfad statt Datei). */
export const REGELN = inhaltsSchemas(z.object({ src: bildPfadSchema, ...bildFelder }));

/** Bildfelder je Sammlung (für bild_hochladen). */
export const BILDFELDER = {
  mannschaften: ['foto'],
  'sparten-mannschaften': ['foto'],
  'sparten-infos': [],
  sponsoren: ['logo'],
  beitraege: ['titelbild', 'galerie'],
};

/** Bildfelder, die eine Liste von Bildern sind (bild_hochladen hängt an). */
export const BILDLISTEN = { beitraege: ['galerie'] };

/** Alle Bilder eines Eintrags als Liste von src-Pfaden. */
export function bildPfadeVon(sammlung, daten) {
  const pfade = [];
  for (const f of BILDFELDER[sammlung] ?? []) {
    const wert = daten?.[f];
    if (Array.isArray(wert)) pfade.push(...wert.map((b) => b?.src).filter(Boolean));
    else if (wert?.src) pfade.push(wert.src);
  }
  return pfade;
}

/** Feste Einträge: Hier dürfen keine Dateien angelegt oder gelöscht werden. */
export const FESTE_IDS = { 'sparten-infos': ['badminton', 'darts'] };

const ID_MUSTER = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export class InhaltsFehler extends Error {}

export function pruefeSammlung(sammlung) {
  if (!SAMMLUNGEN.includes(sammlung)) {
    throw new InhaltsFehler(`Unbekannte Sammlung "${sammlung}". Erlaubt: ${SAMMLUNGEN.join(', ')}`);
  }
}

export function pruefeId(id) {
  if (typeof id !== 'string' || !ID_MUSTER.test(id) || id.length > 80) {
    throw new InhaltsFehler(`Ungültige ID "${id}": nur Kleinbuchstaben, Ziffern und Bindestriche`);
  }
}

/** Pfad der JSON-Datei eines Eintrags. */
export function inhaltsPfad(sammlung, id) {
  pruefeSammlung(sammlung);
  pruefeId(id);
  return `src/content/${sammlung}/${id}.json`;
}

/** Repo-Pfad einer Bilddatei aus dem relativen `src` einer JSON-Datei. */
export function bildRepoPfad(src) {
  return 'src/' + src.replace(/^\.\.\/\.\.\//, '');
}

/**
 * Pfad-Sperre: Der MCP-Server schreibt ausschließlich Inhaltsdateien.
 * Jeder Schreibzugriff läuft hierüber.
 */
export function pruefeSchreibpfad(pfad) {
  const json = /^src\/content\/([a-z-]+)\/[a-z0-9]+(-[a-z0-9]+)*\.json$/.exec(pfad);
  const bild = /^src\/assets\/content\/([a-z-]+)\/[a-z0-9]+(-[a-z0-9]+)*\.(jpg|png|webp|svg)$/.exec(pfad);
  const treffer = json ?? bild;
  if (!treffer || !SAMMLUNGEN.includes(treffer[1]) || pfad.includes('..')) {
    throw new InhaltsFehler(
      `Schreiben nicht erlaubt: ${pfad}. Der MCP-Server ändert nur Inhalte unter ` +
        'src/content/<sammlung>/ und src/assets/content/<sammlung>/. ' +
        'Code, Layout, Impressum und Datenschutz sind Code-Änderungen (Spec, Branch).',
    );
  }
}

/** ID aus einem Namen ableiten ("Bäckerei Meyer" → "baeckerei-meyer"). */
export function idAusName(name) {
  return String(name)
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/&/g, ' und ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Leerzeichen am Rand entfernen, rekursiv. */
function trimme(wert) {
  if (typeof wert === 'string') return wert.trim();
  if (Array.isArray(wert)) return wert.map(trimme);
  if (wert && typeof wert === 'object') {
    return Object.fromEntries(Object.entries(wert).map(([k, v]) => [k, trimme(v)]));
  }
  return wert;
}

/**
 * Prüft Daten gegen die Regeln der Sammlung. Liefert die bereinigten Daten
 * (Reihenfolge der Felder wie im Eingang) oder wirft mit lesbarer Meldung.
 */
export function pruefeDaten(sammlung, daten) {
  pruefeSammlung(sammlung);
  const sauber = trimme(daten);
  const erg = REGELN[sammlung].strict().safeParse(sauber);
  if (!erg.success) {
    const zeilen = erg.error.issues.map(
      (i) => `- ${i.path.join('.') || '(Eintrag)'}: ${i.message}`,
    );
    throw new InhaltsFehler(`Inhalt entspricht nicht den Regeln (${sammlung}):\n${zeilen.join('\n')}`);
  }
  return sauber;
}

/**
 * Felder ändern: Schlüssel aus `felder` ersetzen die bisherigen Werte,
 * `null` entfernt ein Feld. Listen (z. B. training) werden komplett ersetzt.
 */
export function wendeAenderungAn(alt, felder) {
  const neu = { ...alt };
  for (const [k, v] of Object.entries(felder ?? {})) {
    if (v === null) delete neu[k];
    else neu[k] = v;
  }
  return neu;
}

/** Lesbare Beschreibung der Felder einer Sammlung (für schema_lesen). */
export function beschreibeSchema(sammlung) {
  pruefeSammlung(sammlung);
  const beschreibe = (schema) => {
    let s = schema;
    let pflicht = true;
    let text = s.description;
    while (s instanceof z.ZodOptional || s instanceof z.ZodEffects || s instanceof z.ZodDefault) {
      if (s instanceof z.ZodOptional) pflicht = false;
      s = s instanceof z.ZodEffects ? s.innerType() : s._def.innerType;
      text ??= s.description;
    }
    const info = { pflicht };
    if (text) info.hinweis = text;
    if (s instanceof z.ZodEnum) info.werte = s.options;
    if (s instanceof z.ZodString) info.typ = 'Text';
    if (s instanceof z.ZodNumber) info.typ = 'Zahl';
    if (s instanceof z.ZodBoolean) info.typ = 'ja/nein';
    if (s instanceof z.ZodArray) {
      info.typ = 'Liste';
      info.eintrag = beschreibe(s.element).felder;
    }
    if (s instanceof z.ZodObject) {
      info.typ = info.typ ?? 'Objekt';
      info.felder = Object.fromEntries(
        Object.entries(s.shape).map(([k, v]) => [k, beschreibe(v)]),
      );
    }
    return info;
  };
  return {
    sammlung,
    ordner: `src/content/${sammlung}/`,
    felder: beschreibe(REGELN[sammlung]).felder,
    bildfelder: BILDFELDER[sammlung],
    hinweise: [
      'reihenfolge: kleiner = weiter oben; Zehnerschritte, dazwischen einfügen erlaubt (z. B. 15).',
      'Bilder nur über bild_hochladen setzen; alt (Bildbeschreibung) ist Pflicht.',
      ...(sammlung === 'beitraege'
        ? [
            'Ton: bodenständig, wir-Form, kurze Sätze, keine Superlative. Bei Jugend nur Vornamen oder keine Namen.',
            'inhalt ist Markdown. Titelbild nach dem Anlegen mit bild_hochladen setzen – ohne Titelbild wird nicht veröffentlicht.',
            'galerie: weitere Fotos mit bild_hochladen (feld "galerie") anhängen; entfernen/umsortieren über entwurf_aendern.',
          ]
        : []),
      ...(sammlung === 'mannschaften'
        ? ['Trainer: telefon/email erscheinen nur mit veroeffentlichen: true und nur mit Zustimmung der Person.']
        : []),
    ],
  };
}

/** Seite der Webseite, auf der ein Eintrag erscheint (für vorschau_zeigen). */
export function seitenPfad(sammlung, id, daten) {
  switch (sammlung) {
    case 'mannschaften':
      return '/fussball/mannschaften/';
    case 'sparten-mannschaften':
      return `/${daten?.sparte ?? (id?.startsWith('darts') ? 'darts' : 'badminton')}/mannschaften/`;
    case 'sparten-infos':
      return `/${id ?? 'badminton'}/trainingszeiten/`;
    case 'sponsoren':
      return '/#sponsoren-title';
    case 'beitraege':
      return id ? `/aktuelles/${id}/` : '/aktuelles/';
    default:
      return '/';
  }
}
