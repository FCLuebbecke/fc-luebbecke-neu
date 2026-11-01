/**
 * Inhalte der Webseite als Dateien (Spec 008, ersetzt Sanity).
 *
 * Jede Sammlung ist ein Ordner unter src/content/, ein Eintrag = eine JSON-Datei.
 * Bilder liegen unter src/assets/content/<sammlung>/ und werden relativ zur
 * JSON-Datei angegeben ("../../assets/content/…"). Astro prüft alle Dateien
 * beim Bauen gegen die Regeln: fehlt ein Pflichtfeld oder ein Alt-Text,
 * bricht der Build mit Meldung ab.
 *
 * Die Regeln selbst stehen in src/content/schemas.mjs und werden auch vom
 * MCP-Server (Spec 010) genutzt. Übersicht für Pflegende: INHALTE.md
 */
import { defineCollection, z, type SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';
import { bildFelder, inhaltsSchemas } from './content/schemas.mjs';

const jsonIn = (ordner: string) =>
  glob({ pattern: '*.json', base: `./src/content/${ordner}` });

/** Regeln mit Astro-Bildprüfung (`image()` prüft, dass die Datei existiert). */
const regeln = ({ image }: SchemaContext) =>
  inhaltsSchemas(z.object({ src: image(), ...bildFelder }));

export const collections = {
  mannschaften: defineCollection({
    loader: jsonIn('mannschaften'),
    schema: (ctx) => regeln(ctx).mannschaften,
  }),
  'sparten-mannschaften': defineCollection({
    loader: jsonIn('sparten-mannschaften'),
    schema: (ctx) => regeln(ctx)['sparten-mannschaften'],
  }),
  'sparten-infos': defineCollection({
    loader: jsonIn('sparten-infos'),
    schema: (ctx) => regeln(ctx)['sparten-infos'],
  }),
  beitraege: defineCollection({
    loader: jsonIn('beitraege'),
    schema: (ctx) => regeln(ctx).beitraege,
  }),
  sponsoren: defineCollection({
    loader: jsonIn('sponsoren'),
    schema: (ctx) => regeln(ctx).sponsoren,
  }),
};
