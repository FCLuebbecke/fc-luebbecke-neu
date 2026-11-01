/**
 * Regeln für die Inhalte der Webseite – gemeinsam genutzt von Astro
 * (src/content.config.ts) und vom MCP-Server (mcp/, Spec 010).
 *
 * Bewusst plain JavaScript ohne `astro:content`, damit der MCP-Server auf
 * Vercel dieselben Regeln prüfen kann wie der Build. Bildfelder werden von
 * außen hereingereicht: Astro prüft die Bilddatei mit `image()`, der
 * MCP-Server den Pfad (siehe `bildPfadSchema`).
 *
 * Übersicht für Pflegende: INHALTE.md
 */
import { z } from 'zod';

/** Felder eines Bildes außer der Datei selbst. */
export const bildFelder = {
  alt: z.string().trim().min(1, 'Alt-Text (Bildbeschreibung) ist Pflicht'),
  fokus: z
    .string()
    .regex(/^\d{1,3}% \d{1,3}%$/, 'Format: "50% 30%"')
    .optional()
    .describe('Bildpunkt, der beim Zuschneiden sichtbar bleibt (x% y%)'),
};

/** Bildpfad relativ zur JSON-Datei, wie er in den Inhalten steht. */
export const bildPfadSchema = z
  .string()
  .regex(
    /^\.\.\/\.\.\/assets\/content\/[a-z0-9-]+\/[a-z0-9-]+\.(jpg|png|webp|svg)$/,
    'Pfad der Form "../../assets/content/<sammlung>/<name>.jpg"',
  );

const reihenfolge = z.number().int().describe('Sortierung (kleiner = weiter oben)');

const telefon = z
  .string()
  .regex(/^[+0-9][0-9 /()-]{4,}$/, 'Telefonnummer, z. B. "0171 1234567"');

/**
 * Schemas aller Sammlungen.
 * @param {import('zod').ZodTypeAny} bild Schema eines Bildes (src + bildFelder)
 */
export function inhaltsSchemas(bild) {
  return {
    /** Fußball-Mannschaften (Herren & Jugend). */
    mannschaften: z.object({
      name: z.string().trim().min(1),
      kategorie: z.enum(['herren', 'jugend']),
      reihenfolge,
      liga: z.string().optional().describe('nur Herren'),
      jahrgang: z.string().optional().describe('nur Jugend, z. B. "11-12 Jahre"'),
      text: z.string().optional().describe('Beschreibung, nur Herren'),
      foto: bild.optional().describe('nur Herren'),
      trainerteam: z
        .array(
          z.object({
            name: z.string().trim().min(1),
            rolle: z.string().optional(),
            telefon: telefon.optional(),
            email: z.string().email().optional(),
            veroeffentlichen: z
              .boolean()
              .optional()
              .describe('Telefon/E-Mail nur anzeigen, wenn die Person zugestimmt hat'),
          }),
        )
        .optional(),
      training: z
        .array(z.object({ zeit: z.string().trim().min(1), ort: z.string().optional() }))
        .optional(),
      platzhalter: z.boolean().optional().describe('zeigt „Daten folgen“'),
    }),

    /** Mannschaften der Sparten Badminton und Darts. */
    'sparten-mannschaften': z.object({
      sparte: z.enum(['badminton', 'darts']),
      name: z.string().trim().min(1),
      reihenfolge,
      liga: z.string().optional(),
      info: z.string().optional().describe('Beschreibung'),
      href: z.string().url().optional().describe('Link zu Spielplan/Tabelle'),
      foto: bild.optional(),
      platzhalter: z.boolean().optional().describe('zeigt „Daten folgen“'),
    }),

    /** Trainingszeiten & Ort je Sparte; Dateiname = Sparte. */
    'sparten-infos': z.object({
      training: z.array(
        z.object({ gruppe: z.string().trim().min(1), zeit: z.string().trim().min(1) }),
      ),
      ortName: z.string().trim().min(1),
      ortAdresse: z.string().trim().min(1),
    }),

    /** Beiträge „Aktuelles“ (Spec 007); Datei-Name = Adresse /aktuelles/<id>/. */
    beitraege: z.object({
      titel: z.string().trim().min(1).max(120),
      datum: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum im Format JJJJ-MM-TT')
        .describe('Datum des Beitrags, z. B. "2026-11-01"'),
      sparte: z.enum(['fussball', 'badminton', 'darts', 'verein']),
      teaser: z.string().trim().min(1).max(220).describe('Kurztext für Karten, höchstens ~200 Zeichen'),
      inhalt: z
        .string()
        .trim()
        .min(1)
        .describe('Text in Markdown: Absätze, ## Zwischenüberschrift, **fett**, *kursiv*, [Link](https://…), - Aufzählung'),
      titelbild: bild.optional().describe('Pflicht zum Veröffentlichen; über bild_hochladen setzen'),
      galerie: z.array(bild).max(30).optional().describe('weitere Fotos; über bild_hochladen (feld "galerie") anhängen'),
      autor: z.string().optional().describe('z. B. "Jugendabteilung"'),
    }),

    /** Sponsoren & Partner (Startseite). */
    sponsoren: z.object({
      name: z.string().trim().min(1),
      stufe: z.enum(['premium', 'normal']),
      reihenfolge,
      website: z.string().url().optional(),
      logo: bild.optional().describe('ohne Logo erscheint der Name als Text'),
    }),
  };
}

export const SAMMLUNGEN = ['mannschaften', 'sparten-mannschaften', 'sparten-infos', 'sponsoren', 'beitraege'];
