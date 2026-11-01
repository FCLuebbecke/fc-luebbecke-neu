/**
 * Ende-zu-Ende-Test des Vercel-Endpunkts api/mcp.mjs: Anmeldung, MCP-Protokoll
 * (initialize, tools/list, tools/call) über Streamable HTTP, ohne Netzwerk.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { bearbeite } from '../../api/mcp.mjs';
import { speicherRepo } from '../repo-speicher.mjs';

const WURZEL = new URL('../../', import.meta.url).pathname;
const datei = (p) => readFileSync(WURZEL + p);

const repo = speicherRepo({
  'src/content/sparten-infos/badminton.json': datei('src/content/sparten-infos/badminton.json'),
  'src/content/sparten-infos/darts.json': datei('src/content/sparten-infos/darts.json'),
});
const ENV = {
  MCP_SCHLUESSEL: 'geheim-123',
  MCP_PERSON: 'private-ai@fcluebbecke.de=Private AI',
  GITHUB_TOKEN: 'x',
  VORSCHAU_URL: 'https://vorschau.example.org',
};

function anfrage(body, kopf = {}) {
  return new Request('https://example.org/api/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      'MCP-Protocol-Version': '2025-06-18',
      Authorization: 'Bearer geheim-123',
      ...kopf,
    },
    body: JSON.stringify(body),
  });
}
const rufe = (body, kopf) => bearbeite(anfrage(body, kopf), ENV, () => repo);

test('ohne oder mit falschem Schlüssel: 401', async () => {
  assert.equal((await rufe({ jsonrpc: '2.0', id: 1, method: 'tools/list' }, { Authorization: 'Bearer falsch' })).status, 401);
  assert.equal((await rufe({ jsonrpc: '2.0', id: 1, method: 'tools/list' }, { Authorization: '' })).status, 401);
});

test('kein Personen-Header nötig (Option B); fremder Header wird ignoriert', async () => {
  assert.equal((await rufe({ jsonrpc: '2.0', id: 1, method: 'tools/list' })).status, 200);
  assert.equal((await rufe({ jsonrpc: '2.0', id: 1, method: 'tools/list' }, { 'X-FC-Person-Email': 'fremd@example.org' })).status, 200);
});

test('initialize, tools/list, tools/call über HTTP', async () => {
  const init = await rufe({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } },
  });
  assert.equal(init.status, 200);
  const initJson = await init.json();
  assert.equal(initJson.result.serverInfo.name, 'fc-webseite');
  assert.match(initJson.result.instructions, /FC Lübbecke/);

  const liste = await (await rufe({ jsonrpc: '2.0', id: 2, method: 'tools/list' })).json();
  const namen = liste.result.tools.map((t) => t.name).sort();
  assert.deepEqual(namen, [
    'bild_hochladen', 'entwurf_aendern', 'entwurf_anlegen', 'entwurf_loeschen', 'entwurf_status',
    'entwurf_verwerfen', 'inhalt_lesen', 'inhalt_suchen',
    'news_anlegen', 'news_auflisten', 'news_bearbeiten', 'news_foto', 'news_lesen', 'news_loeschen',
    'rueckgaengig', 'schema_lesen', 'veroeffentlichen', 'vorschau_zeigen',
  ]);
  for (const t of liste.result.tools.filter((t) => t.name.startsWith('news_'))) {
    assert.match(t.description, /News|Beitrag/, t.name);
  }
  assert.match(initJson.result.instructions, /news_anlegen/);

  const lesen = await (
    await rufe({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'inhalt_lesen', arguments: { sammlung: 'sparten-infos', id: 'darts' } } })
  ).json();
  const daten = JSON.parse(lesen.result.content[0].text);
  assert.equal(daten.id, 'darts');

  const aendern = await (
    await rufe({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'entwurf_aendern',
        arguments: { sammlung: 'sparten-infos', id: 'darts', felder: { ortName: 'Vereinsheim' }, erwartete_revision: daten.revision },
      },
    })
  ).json();
  assert.ok(!aendern.result.isError, aendern.result.content[0].text);
  assert.equal(repo._commit(await repo.kopf('preview')).autor.name, 'Private AI');

  const verboten = await (
    await rufe({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'inhalt_lesen', arguments: { sammlung: 'pages', id: 'index' } } })
  ).json();
  assert.ok(verboten.result.isError);
});
