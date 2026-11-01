/**
 * Repository im Arbeitsspeicher – gleiche Schnittstelle wie repo-github.mjs,
 * für Tests des MCP-Servers ohne Netzwerk.
 */
import { createHash } from 'node:crypto';
import { RepoFehler } from './repo-github.mjs';

const hash = (s) => createHash('sha1').update(s).digest('hex');

export function speicherRepo(startDateien = {}) {
  let n = 0;
  const commits = new Map(); // sha → { eltern, dateien: Map(pfad → Buffer), nachricht, autor }
  const branches = new Map();
  const status = new Map(); // sha → 'erfolgreich' | ...
  const neuerCommit = (eltern, dateien, nachricht, autor) => {
    const sha = hash(`c${n++}`);
    commits.set(sha, { eltern, dateien, nachricht, autor, datum: new Date().toISOString() });
    return sha;
  };
  const start = new Map(Object.entries(startDateien).map(([p, v]) => [p, Buffer.from(v)]));
  const wurzel = neuerCommit([], start, 'Start', { name: 'Test', email: 'test@example.org' });
  branches.set('main', wurzel);
  branches.set('preview', wurzel);

  const vorfahren = (sha) => {
    const s = new Set();
    const stapel = [sha];
    while (stapel.length) {
      const x = stapel.pop();
      if (s.has(x)) continue;
      s.add(x);
      stapel.push(...commits.get(x).eltern);
    }
    return s;
  };
  const dateienVon = (ref) => commits.get(branches.get(ref) ?? ref)?.dateien;
  const blobSha = (buf) => hash(buf);

  return {
    /** Nur für Tests: Build-Status eines Commits setzen. */
    _setzeStatus(sha, s) { status.set(sha, s); },
    _commit(sha) { return commits.get(sha); },
    _branches: branches,

    async kopf(branch) {
      if (!branches.has(branch)) throw new RepoFehler(`Branch "${branch}" existiert nicht`, 404);
      return branches.get(branch);
    },
    async leseDatei(ref, pfad) {
      const buf = dateienVon(ref)?.get(pfad);
      return buf ? { inhalt: buf, sha: blobSha(buf) } : null;
    },
    async listeOrdner(ref, ordner) {
      const pre = ordner.replace(/\/?$/, '/');
      return [...(dateienVon(ref)?.entries() ?? [])]
        .filter(([p]) => p.startsWith(pre) && !p.slice(pre.length).includes('/'))
        .map(([p, buf]) => ({ name: p.slice(pre.length), pfad: p, sha: blobSha(buf) }));
    },
    async commit({ branch, erwarteterKopf, aenderungen, nachricht, autor }) {
      const kopf = branches.get(branch);
      if (erwarteterKopf && kopf !== erwarteterKopf) throw new RepoFehler('Der Entwurf wurde inzwischen geändert. Bitte neu lesen.', 409);
      const dateien = new Map(commits.get(kopf).dateien);
      for (const a of aenderungen) {
        if (a.inhalt === null) dateien.delete(a.pfad);
        else dateien.set(a.pfad, Buffer.isBuffer(a.inhalt) ? a.inhalt : Buffer.from(a.inhalt));
      }
      const sha = neuerCommit([kopf], dateien, nachricht, autor);
      branches.set(branch, sha);
      return sha;
    },
    async vergleiche(basis, kopf) {
      const b = branches.get(basis) ?? basis;
      const k = branches.get(kopf) ?? kopf;
      if (b === k) return { status: 'identical', ahead_by: 0, behind_by: 0, commits: [], dateien: [] };
      const vb = vorfahren(b);
      const vk = vorfahren(k);
      const nurK = [...vk].filter((x) => !vb.has(x));
      const nurB = [...vb].filter((x) => !vk.has(x));
      const status = nurK.length && nurB.length ? 'diverged' : nurK.length ? 'ahead' : 'behind';
      // Wie GitHub (drei Punkte): Dateien seit dem gemeinsamen Vorfahren.
      const gemeinsam = [...vk].filter((x) => vb.has(x));
      const basisSha = gemeinsam.find((x) => !gemeinsam.some((y) => y !== x && vorfahren(y).has(x)));
      const db = commits.get(basisSha).dateien;
      const dk = commits.get(k).dateien;
      const pfade = new Set([...db.keys(), ...dk.keys()]);
      const dateien = [...pfade]
        .filter((p) => !db.has(p) || !dk.has(p) || !db.get(p).equals(dk.get(p)))
        .map((p) => ({ pfad: p, status: !db.has(p) ? 'added' : !dk.has(p) ? 'removed' : 'modified' }));
      return {
        status,
        ahead_by: nurK.length,
        behind_by: nurB.length,
        commits: nurK.map((sha) => {
          const c = commits.get(sha);
          return { sha, nachricht: c.nachricht, autor: c.autor?.name, email: c.autor?.email, datum: c.datum };
        }),
        dateien,
      };
    },
    async setzeBranch(branch, sha, { force = false } = {}) {
      const alt = branches.get(branch);
      if (!force && alt && !vorfahren(sha).has(alt)) throw new RepoFehler('Kein Fast-Forward', 422);
      branches.set(branch, sha);
    },
    async mergeCommit(basis, kopf, nachricht) {
      const b = branches.get(basis);
      const k = branches.get(kopf) ?? kopf;
      // Drei-Wege-Merge wie Git: Änderungen des Kopfs seit dem gemeinsamen
      // Vorfahren übernehmen, alles andere bleibt wie auf der Basis.
      const vb = vorfahren(b);
      const gemeinsam = [...vorfahren(k)].filter((x) => vb.has(x));
      const basisSha = gemeinsam.find((x) => !gemeinsam.some((y) => y !== x && vorfahren(y).has(x)));
      const alt = commits.get(basisSha).dateien;
      const kd = commits.get(k).dateien;
      const dateien = new Map(commits.get(b).dateien);
      for (const p of new Set([...alt.keys(), ...kd.keys()])) {
        const vorher = alt.get(p);
        const nachher = kd.get(p);
        const geaendert = !vorher || !nachher ? vorher !== nachher : !vorher.equals(nachher);
        if (!geaendert) continue;
        if (nachher) dateien.set(p, nachher);
        else dateien.delete(p);
      }
      const sha = neuerCommit([b, k], dateien, nachricht, { name: 'Bot', email: 'bot@example.org' });
      branches.set(basis, sha);
      return sha;
    },
    async buildStatus(sha) {
      return status.get(sha) ?? 'unbekannt';
    },
    async commitDateien(sha) {
      const c = commits.get(sha);
      if (!c) throw new RepoFehler(`Commit ${sha} nicht gefunden`, 404);
      const vorher = c.eltern[0] ? commits.get(c.eltern[0]).dateien : new Map();
      const pfade = new Set([...vorher.keys(), ...c.dateien.keys()]);
      const dateien = [...pfade]
        .filter((p) => !vorher.has(p) || !c.dateien.has(p) || !vorher.get(p).equals(c.dateien.get(p)))
        .map((p) => ({ pfad: p, status: !vorher.has(p) ? 'added' : !c.dateien.has(p) ? 'removed' : 'modified' }));
      return { eltern: c.eltern, nachricht: c.nachricht, dateien };
    },
  };
}
