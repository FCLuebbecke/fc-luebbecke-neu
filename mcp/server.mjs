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
    'sparten-infos = Trainingszeiten & Ort Badminton/Darts (IDs badminton, darts); sponsoren = Sponsoren',
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
      feld: z.string().describe('foto (Mannschaften) oder logo (Sponsoren)'),
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

  return server;
}
