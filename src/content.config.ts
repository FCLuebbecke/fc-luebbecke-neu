/**
 * Inhalte der Webseite als Dateien (Spec 008, ersetzt Sanity).
 *
 * Jede Sammlung ist ein Ordner unter src/content/, ein Eintrag = eine JSON-Datei.
 * Bilder liegen unter src/assets/content/<sammlung>/ und werden relativ zur
 * JSON-Datei angegeben ("../../assets/content/…"). Astro prüft alle Dateien
 * beim Bauen gegen diese Schemas: fehlt ein Pflichtfeld oder ein Alt-Text,
 * bricht der Build mit Meldung ab.
 *
 * Diese Schemas sind auch die Grundlage für den MCP-Server (Spec 010).
 * Übersicht für Pflegende: INHALTE.md
 */
import { defineCollection, z, type SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';

const jsonIn = (ordner: string) =>
  glob({ pattern: '*.json', base: `./src/content/${ordner}` });

/** Bild mit Pflicht-Alt-Text; `fokus` = CSS-object-position (z. B. "50% 30%"). */
const bild = ({ image }: SchemaContext) =>
  z.object({
    src: image(),
    alt: z.string().trim().min(1, 'Alt-Text (Bildbeschreibung) ist Pflicht'),
    fokus: z
      .string()
      .regex(/^\d{1,3}% \d{1,3}%$/, 'Format: "50% 30%"')
      .optional(),
  });

const reihenfolge = z
  .number()
  .int()
  .describe('Sortierung (kleiner = weiter oben)');

const telefon = z
  .string()
  .regex(/^[+0-9][0-9 /()-]{4,}$/, 'Telefonnummer, z. B. "0171 1234567"');

/** Fußball-Mannschaften (Herren & Jugend). */
const mannschaften = defineCollection({
  loader: jsonIn('mannschaften'),
  schema: (ctx) =>
    z.object({
      name: z.string().trim().min(1),
      kategorie: z.enum(['herren', 'jugend']),
      reihenfolge,
      liga: z.string().optional(),
      jahrgang: z.string().optional(),
      text: z.string().optional(),
      foto: bild(ctx).optional(),
      trainerteam: z
        .array(
          z.object({
            name: z.string().trim().min(1),
            rolle: z.string().optional(),
            telefon: telefon.optional(),
            email: z.string().email().optional(),
            /** Telefon/E-Mail nur anzeigen, wenn die Person zugestimmt hat. */
            veroeffentlichen: z.boolean().optional(),
          }),
        )
        .optional(),
      training: z
        .array(z.object({ zeit: z.string().trim().min(1), ort: z.string().optional() }))
        .optional(),
      /** Zeigt „Daten folgen“ auf der Karte. */
      platzhalter: z.boolean().optional(),
    }),
});

/** Mannschaften der Sparten Badminton und Darts. */
const spartenMannschaften = defineCollection({
  loader: jsonIn('sparten-mannschaften'),
  schema: (ctx) =>
    z.object({
      sparte: z.enum(['badminton', 'darts']),
      name: z.string().trim().min(1),
      reihenfolge,
      liga: z.string().optional(),
      info: z.string().optional(),
      /** Link zu Spielplan/Tabelle (öffnet in neuem Tab). */
      href: z.string().url().optional(),
      foto: bild(ctx).optional(),
      platzhalter: z.boolean().optional(),
    }),
});

/** Trainingszeiten & Ort je Sparte; Dateiname = Sparte (badminton.json, darts.json). */
const spartenInfos = defineCollection({
  loader: jsonIn('sparten-infos'),
  schema: z.object({
    training: z.array(z.object({ gruppe: z.string().trim().min(1), zeit: z.string().trim().min(1) })),
    ortName: z.string().trim().min(1),
    ortAdresse: z.string().trim().min(1),
  }),
});

/** Sponsoren & Partner (Startseite). */
const sponsoren = defineCollection({
  loader: jsonIn('sponsoren'),
  schema: (ctx) =>
    z.object({
      name: z.string().trim().min(1),
      stufe: z.enum(['premium', 'normal']),
      reihenfolge,
      website: z.string().url().optional(),
      logo: bild(ctx).optional(),
    }),
});

export const collections = {
  mannschaften,
  'sparten-mannschaften': spartenMannschaften,
  'sparten-infos': spartenInfos,
  sponsoren,
};
