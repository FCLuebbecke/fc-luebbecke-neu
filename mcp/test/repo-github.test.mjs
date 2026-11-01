/**
 * Prüft die GitHub-Anbindung mit einem aufgezeichneten fetch: richtige
 * Adressen, ein Commit mit mehreren Dateien, kein Force beim Schreiben.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { githubRepo } from '../repo-github.mjs';

function fakeFetch(antworten) {
  const aufrufe = [];
  const f = async (url, opt) => {
    const pfad = url.replace('https://api.github.com/repos/o/r', '');
    const body = opt.body ? JSON.parse(opt.body) : undefined;
    aufrufe.push({ methode: opt.method, pfad, body, auth: opt.headers.Authorization });
    const key = `${opt.method} ${pfad}`;
    const treffer = Object.entries(antworten).find(([k]) => key.startsWith(k));
    if (!treffer) return new Response('{"message":"Not Found"}', { status: 404 });
    return new Response(JSON.stringify(typeof treffer[1] === 'function' ? treffer[1](body) : treffer[1]), { status: 200 });
  };
  return { f, aufrufe };
}

test('commit: Blobs, Tree, Commit, Ref ohne Force', async () => {
  const { f, aufrufe } = fakeFetch({
    'GET /git/ref/heads/preview': { object: { sha: 'kopf1' } },
    'GET /git/commits/kopf1': { tree: { sha: 'baum1' } },
    'POST /git/blobs': { sha: 'blob1' },
    'POST /git/trees': { sha: 'baum2' },
    'POST /git/commits': { sha: 'neu1' },
    'PATCH /git/refs/heads/preview': { object: { sha: 'neu1' } },
  });
  const repo = githubRepo({ token: 't', repo: 'o/r', fetch: f });
  const sha = await repo.commit({
    branch: 'preview',
    erwarteterKopf: 'kopf1',
    aenderungen: [
      { pfad: 'src/content/sponsoren/a.json', inhalt: '{}' },
      { pfad: 'src/assets/content/sponsoren/a.jpg', inhalt: null },
    ],
    nachricht: 'Test',
    autor: { name: 'Peter', email: 'p@example.org' },
  });
  assert.equal(sha, 'neu1');
  assert.ok(aufrufe.every((a) => a.auth === 'Bearer t'));
  const tree = aufrufe.find((a) => a.pfad === '/git/trees').body;
  assert.equal(tree.base_tree, 'baum1');
  assert.deepEqual(tree.tree.map((t) => [t.path, t.sha]), [
    ['src/content/sponsoren/a.json', 'blob1'],
    ['src/assets/content/sponsoren/a.jpg', null],
  ]);
  const c = aufrufe.find((a) => a.pfad === '/git/commits' && a.methode === 'POST').body;
  assert.deepEqual(c.parents, ['kopf1']);
  assert.equal(c.author.email, 'p@example.org');
  assert.equal(aufrufe.at(-1).body.force, false);
});

test('commit: bricht ab, wenn der Branch weitergewandert ist', async () => {
  const { f } = fakeFetch({ 'GET /git/ref/heads/preview': { object: { sha: 'anders' } } });
  const repo = githubRepo({ token: 't', repo: 'o/r', fetch: f });
  await assert.rejects(repo.commit({ branch: 'preview', erwarteterKopf: 'kopf1', aenderungen: [], nachricht: 'x' }), /inzwischen geändert/);
});

test('leseDatei und buildStatus', async () => {
  const { f } = fakeFetch({
    'GET /contents/src/content/sparten-infos/darts.json?ref=preview': {
      sha: 'b1',
      content: Buffer.from('{"ortName":"X"}').toString('base64'),
    },
    'GET /commits/s1/status': { statuses: [{ state: 'success' }] },
    'GET /commits/s1/check-runs': { check_runs: [{ status: 'in_progress' }] },
  });
  const repo = githubRepo({ token: 't', repo: 'o/r', fetch: f });
  const d = await repo.leseDatei('preview', 'src/content/sparten-infos/darts.json');
  assert.equal(d.sha, 'b1');
  assert.equal(JSON.parse(d.inhalt).ortName, 'X');
  assert.equal(await repo.leseDatei('preview', 'src/content/fehlt.json'), null);
  assert.equal(await repo.buildStatus('s1'), 'laeuft');
});
