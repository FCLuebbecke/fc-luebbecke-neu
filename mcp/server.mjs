/**
 * MCP-Server „FC-Webseite“ (Spec 010): meldet die Werkzeuge beim MCP-SDK an.
 * Die Logik steckt in werkzeuge.mjs; hier nur Beschreibungen und Parameter.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SAMMLUNGEN } from './inhalte.mjs';
import { werkzeuge } from './werkzeuge.mjs';
import { InhaltsFehler } from './inhalte.mjs';
import { RepoFehler } from './repo-github.mjs';

const sammlung = z.enum(SAMMLUNGEN).describe(
  'mannschaften = Fußball-Mannschaften; sparten-mannschaften = Badminton/Darts-Mannschaften; ' +
    'sparten-infos = Trainingszeiten & Ort Badminton/Darts (IDs badminton, darts); sponsoren = Sponsoren; ' +
    'beitraege = News-Beiträge „Aktuelles“ (Markdown-Text, Titelbild, Galerie)',
);
const id = z.string().describe('ID des Eintrags = Dateiname ohne .json, z. B. "2-mannschaft"');
const revision = z.string().describe('Revision aus inhalt_lesen (Schutz vor gleichzeitigen Änderungen)');
const stand = z.string().describe('erwarteter_stand aus entwurf_status');

export const ANLEITUNG = `Du pflegst die Inhalte der Webseite des FC Lübbecke e.V. (www.fcluebbecke.de).
Ablauf:
1. Mit inhalt_suchen/inhalt_lesen den aktuellen Stand holen. Bei mehreren Treffern nachfragen statt raten.
2. Änderung kurz als vorher → nachher zeigen, dann mit entwurf_aendern/entwurf_anlegen/bild_hochladen in den Entwurf schreiben.
   Der Entwurf ist noch nicht live. Die Vorschau (vorschau_zeigen) aktualisiert sich nach ca. 30–60 s selbst.
3. Vor dem Veröffentlichen entwurf_status aufrufen und der Person alle offenen Änderungen zeigen – auch die anderer Personen.
4. Nur nach ausdrücklicher Zustimmung ("veröffentlichen", "passt so") veroeffentlichen mit bestaetigung: true.
   Bei "verwerfen" entwurf_verwerfen. Löschen nur nach ausdrücklicher Bestätigung.
News / Beiträge „Aktuelles“: immer die news_*-Werkzeuge nutzen (news_auflisten, news_lesen, news_anlegen,
news_bearbeiten, news_foto, news_loeschen). Fakten im Chat erfragen (Anlass, Ergebnis, Datum, Namen nur mit Einverständnis),
Titel, Teaser und Text (Markdown) vorschlagen, nach "ok" mit news_anlegen anlegen, dann das Foto mit news_foto als Titelbild setzen.
Regeln: Ton bodenständig und sachlich. Telefon/E-Mail von Trainern nur mit Zustimmung der Person (veroeffentlichen: true).
Code, Layout, Impressum und Datenschutz kann dieser Server nicht ändern – dafür den Webmaster ansprechen.
Fehlermeldungen ehrlich weitergeben; nichts gilt als veröffentlicht, bevor veroeffentlichen Erfolg meldet.`;

/** Ergebnis/Fehler in eine MCP-Antwort verpacken. */
async function antwort(fn) {
  try {
    const erg = await fn();
    return { content: [{ type: 'text', text: JSON.stringify(erg, null, 2) }] };
  } catch (e) {
    const bekannt = e instanceof InhaltsFehler || e instanceof RepoFehler;
    if (!bekannt) console.error(e);
    return {
      isError: true,
      content: [{ type: 'text', text: bekannt ? e.message : `Interner Fehler: ${e.message}` }],
    };
  }
}

/**
 * @param {Parameters<typeof werkzeuge>[0]} ctx
 */
export function erstelleServer(ctx) {
  const w = werkzeuge(ctx);
  const server = new McpServer({ name: 'fc-webseite', version: '1.0.0' }, { instructions: ANLEITUNG });
  const lesen = { readOnlyHint: true, openWorldHint: false };
  const schreiben = { readOnlyHint: false, destructiveHint: false, openWorldHint: false };
  const kritisch = { readOnlyHint: false, destructiveHint: true, openWorldHint: false };

  const tool = (name, beschreibung, parameter, hinweise, fn) =>
    server.registerTool(name, { description: beschreibung, inputSchema: parameter, annotations: hinweise }, (args) =>
      antwort(() => fn(args)),
    );

  tool('inhalt_suchen', 'Einträge im Entwurf finden (ohne text: alle). Liefert Sammlung, ID und Name.', {
    sammlung: sammlung.optional(),
    text: z.string().optional().describe('Suchbegriff, z. B. "D-Jugend", "Meyer", "Donnerstag"'),
  }, lesen, w.inhalt_suchen);

  tool('inhalt_lesen', 'Einen Eintrag mit allen Feldern und seiner Revision lesen.', { sammlung, id }, lesen, w.inhalt_lesen);

  tool('schema_lesen', 'Felder einer Sammlung: Pflichtfelder, erlaubte Werte, Hinweise.', { sammlung }, lesen, w.schema_lesen);

  tool(
    'entwurf_aendern',
    'Felder eines Eintrags im Entwurf ändern. Angegebene Felder ersetzen die bisherigen Werte (Listen komplett), null entfernt ein Feld. Wird gegen die Regeln geprüft.',
    { sammlung, id, felder: z.record(z.any()).describe('z. B. {"training":[{"zeit":"Montag 18-20 Uhr"}]}'), erwartete_revision: revision },
    schreiben,
    w.entwurf_aendern,
  );

  tool(
    'entwurf_anlegen',
    'Neuen Eintrag im Entwurf anlegen (ID wird aus dem Namen gebildet, wenn nicht angegeben). Vorher schema_lesen für die Pflichtfelder.',
    { sammlung, id: id.optional(), felder: z.record(z.any()) },
    schreiben,
    w.entwurf_anlegen,
  );

  tool(
    'entwurf_loeschen',
    'Eintrag im Entwurf löschen (inkl. Bild). Nur nach ausdrücklicher Zustimmung der Person.',
    { sammlung, id, erwartete_revision: revision, bestaetigung: z.boolean().describe('true nur nach Zustimmung im Chat') },
    kritisch,
    w.entwurf_loeschen,
  );

  tool(
    'bild_hochladen',
    'Foto/Logo eines Eintrags setzen oder ersetzen. Bild wird verkleinert. alt (Bildbeschreibung) ist Pflicht.',
    {
      sammlung,
      id,
      feld: z.string().describe('foto (Mannschaften), logo (Sponsoren), titelbild oder galerie (Beiträge; galerie hängt an)'),
      datei_base64: z.string().optional().describe('Bilddatei als Base64'),
      url: z.string().optional().describe('alternativ: https-URL des Bildes'),
      alt: z.string().describe('Bildbeschreibung, z. B. "Mannschaftsfoto D1-Jugend 2026"'),
      fokus: z.string().optional().describe('Bildpunkt, der sichtbar bleiben soll, z. B. "50% 30%"'),
      erwartete_revision: revision,
    },
    schreiben,
    w.bild_hochladen,
  );

  tool(
    'entwurf_status',
    'Unveröffentlichte Änderungen im Entwurf (wer, was, wann), Build-Status der Vorschau und erwarteter_stand fürs Veröffentlichen.',
    {},
    lesen,
    w.entwurf_status,
  );

  tool('vorschau_zeigen', 'Link zur Vorschau (optional direkt zur Seite eines Eintrags) und Build-Status.', {
    sammlung: sammlung.optional(),
    id: id.optional(),
  }, lesen, w.vorschau_zeigen);

  tool(
    'veroeffentlichen',
    'Entwurf live stellen. Nur nach entwurf_status und ausdrücklicher Zustimmung der Person. Erfordert einen erfolgreichen Vorschau-Build.',
    { bestaetigung: z.boolean(), erwarteter_stand: stand },
    kritisch,
    w.veroeffentlichen,
  );

  tool(
    'entwurf_verwerfen',
    'Alle unveröffentlichten Änderungen verwerfen (Entwurf = Live-Seite). Nur nach Zustimmung.',
    { bestaetigung: z.boolean(), erwarteter_stand: stand },
    kritisch,
    w.entwurf_verwerfen,
  );

  tool(
    'rueckgaengig',
    'Eine frühere Änderung zurücknehmen (legt eine Gegenänderung im Entwurf an, danach veröffentlichen).',
    { commit: z.string().describe('Commit-SHA der Änderung, z. B. aus entwurf_status') },
    schreiben,
    w.rueckgaengig,
  );

  // ── News (Spec 013) ─────────────────────────────────────────────────────
  const nsparte = z.enum(['fussball', 'badminton', 'darts', 'verein']).describe('Sparte des Beitrags');
  const nid = z.string().describe('ID des Beitrags (aus news_auflisten), z. B. "saisonstart-2026"');
  const nrev = z.string().describe('Revision aus news_auflisten/news_lesen/news_anlegen');
  const ntext = z.string().describe('Text in Markdown: Absätze, ## Zwischenüberschrift, **fett**, *kursiv*, [Link](https://…), - Aufzählung');

  tool('news_auflisten', 'News / Beiträge „Aktuelles“ auflisten (neueste zuerst), mit ID, Datum, Sparte, Titelbild ja/nein und Revision.', {
    sparte: nsparte.optional(),
    text: z.string().optional().describe('Suchbegriff'),
  }, lesen, w.news_auflisten);

  tool('news_lesen', 'Einen News-Beitrag mit Titel, Teaser, Text, Bildern und Revision lesen.', { id: nid }, lesen, w.news_lesen);

  tool(
    'news_anlegen',
    'Neuen News-Beitrag für „Aktuelles“ anlegen (Spielbericht, Termin, Vereinsleben). Landet im Entwurf; danach mit news_foto ein Titelbild setzen.',
    {
      titel: z.string().describe('Überschrift, höchstens 120 Zeichen'),
      sparte: nsparte,
      teaser: z.string().describe('Kurztext für die Karten, höchstens ~200 Zeichen'),
      text: ntext,
      datum: z.string().optional().describe('JJJJ-MM-TT, Standard: heute'),
      autor: z.string().optional().describe('z. B. "Jugendabteilung"'),
      id: z.string().optional().describe('Adresse /aktuelles/<id>/; Standard: aus dem Titel gebildet'),
    },
    schreiben,
    w.news_anlegen,
  );

  tool(
    'news_bearbeiten',
    'Einen News-Beitrag ändern: nur die angegebenen Felder (titel, datum, sparte, teaser, text, autor) werden ersetzt.',
    {
      id: nid,
      erwartete_revision: nrev,
      titel: z.string().optional(),
      datum: z.string().optional().describe('JJJJ-MM-TT'),
      sparte: nsparte.optional(),
      teaser: z.string().optional(),
      text: ntext.optional(),
      autor: z.string().optional(),
    },
    schreiben,
    w.news_bearbeiten,
  );

  tool(
    'news_foto',
    'Foto zu einem News-Beitrag: als Titelbild setzen (art "titelbild") oder an die Galerie anhängen (art "galerie"). Bildbeschreibung (alt) ist Pflicht.',
    {
      id: nid,
      erwartete_revision: nrev,
      art: z.enum(['titelbild', 'galerie']).optional().describe('Standard: titelbild'),
      datei_base64: z.string().optional().describe('Bilddatei als Base64'),
      url: z.string().optional().describe('alternativ: https-URL des Bildes'),
      alt: z.string().describe('Bildbeschreibung, z. B. "Jubel nach dem 4:2"'),
      fokus: z.string().optional().describe('Bildpunkt, der sichtbar bleiben soll, z. B. "50% 30%"'),
    },
    schreiben,
    w.news_foto,
  );

  tool(
    'news_loeschen',
    'Einen News-Beitrag löschen (inkl. Fotos). Nur nach ausdrücklicher Zustimmung der Person.',
    { id: nid, erwartete_revision: nrev, bestaetigung: z.boolean().describe('true nur nach Zustimmung im Chat') },
    kritisch,
    w.news_loeschen,
  );

  return server;
}
