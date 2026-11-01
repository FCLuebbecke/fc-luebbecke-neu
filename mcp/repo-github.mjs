/**
 * Zugriff auf das Repository über die GitHub-REST-API (Spec 010).
 * Kein lokaler Checkout: Lesen über Contents-API, Schreiben als ein Commit
 * mit mehreren Dateien über die Git-Data-API.
 *
 * Schnittstelle (gleich wie repo-speicher.mjs für Tests):
 *   kopf(branch) · leseDatei(ref, pfad) · listeOrdner(ref, ordner) ·
 *   commit({...}) · vergleiche(basis, kopf) · setzeBranch(branch, sha, {force}) ·
 *   mergeCommit(basis, kopf, nachricht) · buildStatus(sha) · commitDateien(sha)
 */

export class RepoFehler extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export function githubRepo({ token, repo, fetch: f = globalThis.fetch, api = 'https://api.github.com' }) {
  if (!token || !repo) throw new Error('GITHUB_TOKEN und GITHUB_REPO müssen gesetzt sein');

  async function rufe(methode, pfad, body) {
    const res = await f(`${api}/repos/${repo}${pfad}`, {
      method: methode,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'fc-luebbecke-mcp',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 404) return null;
    const text = await res.text();
    const daten = text ? JSON.parse(text) : {};
    if (!res.ok) {
      throw new RepoFehler(`GitHub ${methode} ${pfad}: ${res.status} ${daten.message ?? ''}`.trim(), res.status);
    }
    return daten;
  }

  const enc = encodeURIComponent;

  return {
    async kopf(branch) {
      const ref = await rufe('GET', `/git/ref/heads/${enc(branch)}`);
      if (!ref) throw new RepoFehler(`Branch "${branch}" existiert nicht`, 404);
      return ref.object.sha;
    },

    async leseDatei(ref, pfad) {
      const d = await rufe('GET', `/contents/${pfad.split('/').map(enc).join('/')}?ref=${enc(ref)}`);
      if (!d || Array.isArray(d)) return null;
      let inhalt;
      if (d.content) inhalt = Buffer.from(d.content, 'base64');
      else {
        // Dateien > 1 MB liefert die Contents-API ohne Inhalt → Blob-API.
        const blob = await rufe('GET', `/git/blobs/${d.sha}`);
        inhalt = Buffer.from(blob.content, 'base64');
      }
      return { inhalt, sha: d.sha };
    },

    async listeOrdner(ref, ordner) {
      const d = await rufe('GET', `/contents/${ordner.split('/').map(enc).join('/')}?ref=${enc(ref)}`);
      if (!d || !Array.isArray(d)) return [];
      return d.filter((e) => e.type === 'file').map((e) => ({ name: e.name, pfad: e.path, sha: e.sha }));
    },

    /**
     * Ein Commit mit allen Änderungen. `inhalt: null` löscht eine Datei.
     * Schlägt fehl, wenn der Branch seit `erwarteterKopf` weitergewandert ist.
     */
    async commit({ branch, erwarteterKopf, aenderungen, nachricht, autor }) {
      const kopf = await this.kopf(branch);
      if (erwarteterKopf && kopf !== erwarteterKopf) {
        throw new RepoFehler(`Der Entwurf wurde inzwischen geändert (${branch} steht auf ${kopf.slice(0, 7)}). Bitte neu lesen.`, 409);
      }
      const basis = await rufe('GET', `/git/commits/${kopf}`);
      const baum = [];
      for (const a of aenderungen) {
        if (a.inhalt === null) {
          baum.push({ path: a.pfad, mode: '100644', type: 'blob', sha: null });
        } else {
          const buf = Buffer.isBuffer(a.inhalt) ? a.inhalt : Buffer.from(a.inhalt, 'utf8');
          const blob = await rufe('POST', '/git/blobs', { content: buf.toString('base64'), encoding: 'base64' });
          baum.push({ path: a.pfad, mode: '100644', type: 'blob', sha: blob.sha });
        }
      }
      const tree = await rufe('POST', '/git/trees', { base_tree: basis.tree.sha, tree: baum });
      const neu = await rufe('POST', '/git/commits', {
        message: nachricht,
        tree: tree.sha,
        parents: [kopf],
        author: autor ? { name: autor.name, email: autor.email, date: new Date().toISOString() } : undefined,
      });
      // force: false → GitHub lehnt ab, wenn jemand dazwischen geschrieben hat.
      await rufe('PATCH', `/git/refs/heads/${enc(branch)}`, { sha: neu.sha, force: false });
      return neu.sha;
    },

    async vergleiche(basis, kopf) {
      const d = await rufe('GET', `/compare/${enc(basis)}...${enc(kopf)}`);
      return {
        status: d.status, // identical | ahead | behind | diverged
        ahead_by: d.ahead_by,
        behind_by: d.behind_by,
        commits: d.commits.map((c) => ({
          sha: c.sha,
          nachricht: c.commit.message,
          autor: c.commit.author?.name,
          email: c.commit.author?.email,
          datum: c.commit.author?.date,
        })),
        dateien: (d.files ?? []).map((x) => ({ pfad: x.filename, status: x.status })),
      };
    },

    async setzeBranch(branch, sha, { force = false } = {}) {
      await rufe('PATCH', `/git/refs/heads/${enc(branch)}`, { sha, force });
    },

    async mergeCommit(basis, kopf, nachricht) {
      const d = await rufe('POST', '/merges', { base: basis, head: kopf, commit_message: nachricht });
      if (!d) throw new RepoFehler('Merge nicht möglich', 404);
      return d.sha;
    },

    /** Status des Vercel-Builds eines Commits (GitHub-Commit-Status bzw. Check-Runs). */
    async buildStatus(sha) {
      const st = await rufe('GET', `/commits/${sha}/status`);
      const runs = await rufe('GET', `/commits/${sha}/check-runs`).catch(() => null);
      const zustaende = [
        ...(st?.statuses ?? []).map((s) => s.state),
        ...(runs?.check_runs ?? []).map((r) =>
          r.status !== 'completed' ? 'pending' : r.conclusion === 'success' || r.conclusion === 'skipped' || r.conclusion === 'neutral' ? 'success' : 'failure',
        ),
      ];
      if (zustaende.length === 0) return 'unbekannt';
      if (zustaende.some((z) => z === 'failure' || z === 'error')) return 'fehlgeschlagen';
      if (zustaende.some((z) => z === 'pending')) return 'laeuft';
      return 'erfolgreich';
    },

    async commitDateien(sha) {
      const d = await rufe('GET', `/commits/${sha}`);
      if (!d) throw new RepoFehler(`Commit ${sha} nicht gefunden`, 404);
      return {
        eltern: d.parents.map((p) => p.sha),
        nachricht: d.commit.message,
        dateien: d.files.map((x) => ({ pfad: x.filename, status: x.status, vorher: x.previous_filename })),
      };
    },
  };
}
