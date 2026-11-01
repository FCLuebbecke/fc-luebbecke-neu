/**
 * Werkzeuge des MCP-Servers „FC-Webseite“ (Spec 010, UC-001).
 *
 * Alle Änderungen landen als Commit auf dem Branch `preview` (Entwurf).
 * Erst `veroeffentlichen` übernimmt sie nach `main` (live).
 *
 * Schutzregeln:
 * - Geschrieben werden nur Inhaltsdateien (pruefeSchreibpfad).
 * - Jeder Inhalt wird vor dem Schreiben gegen die Regeln geprüft.
 * - Ändern/Löschen nur mit passender Revision (erwartete_revision).
 * - Veröffentlichen/Verwerfen nur mit Bestätigung und passendem Stand
 *   (erwarteter_stand aus entwurf_status), Veröffentlichen nur nach
 *   erfolgreichem Vorschau-Build und nur, wenn der Entwurf ausschließlich
 *   Inhaltsdateien ändert.
 */
import {
  BILDFELDER,
  FESTE_IDS,
  InhaltsFehler,
  SAMMLUNGEN,
  beschreibeSchema,
  bildRepoPfad,
  idAusName,
  inhaltsPfad,
  pruefeDaten,
  pruefeId,
  pruefeSammlung,
  pruefeSchreibpfad,
  seitenPfad,
  wendeAenderungAn,
} from './inhalte.mjs';

export const ENTWURF = 'preview';
export const LIVE = 'main';
const MAX_BILD_BYTES = 8 * 1024 * 1024;

const json = (buf) => JSON.parse(Buffer.from(buf).toString('utf8'));
const alsDatei = (daten) => JSON.stringify(daten, null, 2) + '\n';

/**
 * @param {object} ctx
 * @param {ReturnType<import('./repo-github.mjs').githubRepo>} ctx.repo
 * @param {{name: string, email: string}} ctx.person
 * @param {string} [ctx.vorschauUrl]
 * @param {string} [ctx.liveUrl]
 * @param {(eintrag: object) => void} [ctx.protokoll]
 */
export function werkzeuge(ctx) {
  const { repo, person } = ctx;
  const protokoll = ctx.protokoll ?? ((e) => console.log(JSON.stringify({ mcp: 'fc-webseite', ...e })));
  const liveUrl = (ctx.liveUrl ?? 'https://www.fcluebbecke.de').replace(/\/$/, '');
  const vorschauUrl = ctx.vorschauUrl?.replace(/\/$/, '');

  const log = (werkzeug, details) =>
    protokoll({ zeit: new Date().toISOString(), person: person.email, werkzeug, ...details });

  /** Liegt der Entwurf hinter main (z. B. nach einem Code-Livegang), nachziehen. */
  async function entwurfAktualisieren() {
    const vgl = await repo.vergleiche(LIVE, ENTWURF);
    if (vgl.status === 'behind') {
      await repo.setzeBranch(ENTWURF, await repo.kopf(LIVE), { force: false });
    }
  }

  async function lies(sammlung, id) {
    const pfad = inhaltsPfad(sammlung, id);
    const datei = await repo.leseDatei(ENTWURF, pfad);
    if (!datei) throw new InhaltsFehler(`Kein Eintrag "${id}" in ${sammlung}. Mit inhalt_suchen nachsehen.`);
    return { pfad, daten: json(datei.inhalt), revision: datei.sha };
  }

  async function schreibe({ werkzeug, aenderungen, nachricht, kopf, details }) {
    for (const a of aenderungen) pruefeSchreibpfad(a.pfad);
    const sha = await repo.commit({
      branch: ENTWURF,
      erwarteterKopf: kopf,
      aenderungen,
      nachricht: `${nachricht}\n\nÜber: MCP-Server FC-Webseite (Private AI)`,
      autor: person,
    });
    log(werkzeug, { ...details, commit: sha, dateien: aenderungen.map((a) => a.pfad) });
    return sha;
  }

  function vorschauLink(sammlung, id, daten) {
    const pfad = seitenPfad(sammlung, id, daten);
    return vorschauUrl
      ? { vorschau: vorschauUrl + pfad, hinweis: 'Die Vorschau lädt sich selbst neu, sobald Vercel fertig gebaut hat (ca. 30–60 s).' }
      : { vorschau: null, hinweis: `VORSCHAU_URL ist nicht gesetzt. Seite: ${pfad}` };
  }

  async function bildDaten({ datei_base64, url }) {
    let buf;
    if (datei_base64) buf = Buffer.from(datei_base64.replace(/^data:[^,]*,/, ''), 'base64');
    else if (url) {
      if (!/^https:\/\//.test(url)) throw new InhaltsFehler('Bild-URL muss mit https:// beginnen');
      const res = await fetch(url);
      if (!res.ok) throw new InhaltsFehler(`Bild konnte nicht geladen werden (${res.status})`);
      buf = Buffer.from(await res.arrayBuffer());
    } else throw new InhaltsFehler('datei_base64 oder url angeben');
    if (buf.length === 0 || buf.length > MAX_BILD_BYTES) throw new InhaltsFehler('Bild ist leer oder größer als 8 MB');
    const kopfText = buf.subarray(0, 200).toString('utf8').trimStart();
    if (kopfText.startsWith('<svg') || kopfText.startsWith('<?xml')) {
      if (/<script|on\w+=/i.test(buf.toString('utf8'))) throw new InhaltsFehler('SVG mit Skripten ist nicht erlaubt');
      return { inhalt: buf, ext: 'svg' };
    }
    const { default: sharp } = await import('sharp');
    const meta = await sharp(buf).metadata().catch(() => null);
    if (!meta?.format) throw new InhaltsFehler('Datei ist kein Bild (erlaubt: JPG, PNG, WebP, SVG)');
    let pipe = sharp(buf).rotate().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true });
    const ext = meta.hasAlpha ? 'png' : 'jpg';
    pipe = ext === 'png' ? pipe.png({ compressionLevel: 9 }) : pipe.jpeg({ quality: 85, mozjpeg: true });
    return { inhalt: await pipe.toBuffer(), ext };
  }

  return {
    async inhalt_suchen({ sammlung, text } = {}) {
      const sammlungen = sammlung ? [sammlung] : SAMMLUNGEN;
      sammlungen.forEach(pruefeSammlung);
      const suche = text?.toLowerCase().trim();
      const treffer = [];
      for (const s of sammlungen) {
        const dateien = (await repo.listeOrdner(ENTWURF, `src/content/${s}`)).filter((d) => d.name.endsWith('.json'));
        const inhalte = await Promise.all(dateien.map((d) => repo.leseDatei(ENTWURF, d.pfad)));
        dateien.forEach((d, i) => {
          if (!inhalte[i]) return;
          const daten = json(inhalte[i].inhalt);
          const id = d.name.replace(/\.json$/, '');
          const roh = JSON.stringify(daten).toLowerCase();
          if (suche && !roh.includes(suche) && !id.includes(suche)) return;
          treffer.push({
            sammlung: s,
            id,
            name: daten.name ?? id,
            ...(daten.kategorie ? { kategorie: daten.kategorie } : {}),
            ...(daten.sparte ? { sparte: daten.sparte } : {}),
            ...(daten.reihenfolge !== undefined ? { reihenfolge: daten.reihenfolge } : {}),
          });
        });
      }
      treffer.sort((a, b) => a.sammlung.localeCompare(b.sammlung) || (a.reihenfolge ?? 0) - (b.reihenfolge ?? 0));
      return { anzahl: treffer.length, treffer, stand: 'Entwurf (Branch preview)' };
    },

    async inhalt_lesen({ sammlung, id }) {
      const e = await lies(sammlung, id);
      return { sammlung, id, daten: e.daten, revision: e.revision, ...vorschauLink(sammlung, id, e.daten) };
    },

    async schema_lesen({ sammlung }) {
      return beschreibeSchema(sammlung);
    },

    async entwurf_aendern({ sammlung, id, felder, erwartete_revision }) {
      await entwurfAktualisieren();
      const kopf = await repo.kopf(ENTWURF);
      const alt = await lies(sammlung, id);
      if (alt.revision !== erwartete_revision) {
        throw new InhaltsFehler(
          `Der Eintrag wurde seit dem Lesen geändert (aktuelle Revision ${alt.revision}). Bitte mit inhalt_lesen neu lesen.`,
        );
      }
      for (const f of BILDFELDER[sammlung]) {
        if (felder && f in felder && felder[f] !== null && felder[f]?.src !== alt.daten[f]?.src) {
          throw new InhaltsFehler(`Bilder nur über bild_hochladen setzen (Feld ${f}). alt und fokus dürfen geändert werden.`);
        }
      }
      const neu = pruefeDaten(sammlung, wendeAenderungAn(alt.daten, felder));
      if (JSON.stringify(neu) === JSON.stringify(alt.daten)) return { geaendert: false, hinweis: 'Keine Änderung.' };
      const aenderungen = [{ pfad: alt.pfad, inhalt: alsDatei(neu) }];
      // Entferntes Bild: Datei mit löschen.
      for (const f of BILDFELDER[sammlung]) {
        if (alt.daten[f] && !neu[f]) aenderungen.push({ pfad: bildRepoPfad(alt.daten[f].src), inhalt: null });
      }
      const geaenderteFelder = Object.keys(felder ?? {});
      const commit = await schreibe({
        werkzeug: 'entwurf_aendern',
        kopf,
        aenderungen,
        nachricht: `Inhalt: ${sammlung}/${id} geändert (${geaenderteFelder.join(', ')})`,
        details: { sammlung, id, felder: geaenderteFelder },
      });
      const nachher = await repo.leseDatei(ENTWURF, alt.pfad);
      return { geaendert: true, commit, sammlung, id, daten: neu, revision: nachher.sha, ...vorschauLink(sammlung, id, neu) };
    },

    async entwurf_anlegen({ sammlung, id, felder }) {
      pruefeSammlung(sammlung);
      if (FESTE_IDS[sammlung]) throw new InhaltsFehler(`In ${sammlung} gibt es nur die festen Einträge ${FESTE_IDS[sammlung].join(', ')}.`);
      await entwurfAktualisieren();
      const kopf = await repo.kopf(ENTWURF);
      const neueId = id ?? idAusName(felder?.name ?? '');
      pruefeId(neueId);
      const pfad = inhaltsPfad(sammlung, neueId);
      if (await repo.leseDatei(ENTWURF, pfad)) throw new InhaltsFehler(`Es gibt schon einen Eintrag "${neueId}" in ${sammlung}.`);
      for (const f of BILDFELDER[sammlung]) {
        if (felder?.[f]) throw new InhaltsFehler(`Bilder erst nach dem Anlegen mit bild_hochladen setzen (Feld ${f}).`);
      }
      const daten = pruefeDaten(sammlung, felder ?? {});
      const commit = await schreibe({
        werkzeug: 'entwurf_anlegen',
        kopf,
        aenderungen: [{ pfad, inhalt: alsDatei(daten) }],
        nachricht: `Inhalt: ${sammlung}/${neueId} angelegt`,
        details: { sammlung, id: neueId },
      });
      const nachher = await repo.leseDatei(ENTWURF, pfad);
      return { angelegt: true, commit, sammlung, id: neueId, daten, revision: nachher.sha, ...vorschauLink(sammlung, neueId, daten) };
    },

    async entwurf_loeschen({ sammlung, id, erwartete_revision, bestaetigung }) {
      if (bestaetigung !== true) throw new InhaltsFehler('Löschen nur mit bestaetigung: true, nachdem die Person im Chat zugestimmt hat.');
      pruefeSammlung(sammlung);
      if (FESTE_IDS[sammlung]) throw new InhaltsFehler(`Die festen Einträge in ${sammlung} können nicht gelöscht werden.`);
      await entwurfAktualisieren();
      const kopf = await repo.kopf(ENTWURF);
      const alt = await lies(sammlung, id);
      if (alt.revision !== erwartete_revision) throw new InhaltsFehler('Der Eintrag wurde seit dem Lesen geändert. Bitte neu lesen.');
      const aenderungen = [{ pfad: alt.pfad, inhalt: null }];
      for (const f of BILDFELDER[sammlung]) {
        if (alt.daten[f]) aenderungen.push({ pfad: bildRepoPfad(alt.daten[f].src), inhalt: null });
      }
      const commit = await schreibe({
        werkzeug: 'entwurf_loeschen',
        kopf,
        aenderungen,
        nachricht: `Inhalt: ${sammlung}/${id} gelöscht`,
        details: { sammlung, id },
      });
      return { geloescht: true, commit, sammlung, id, ...vorschauLink(sammlung, id, alt.daten) };
    },

    async bild_hochladen({ sammlung, id, feld, datei_base64, url, alt: altText, fokus, erwartete_revision }) {
      pruefeSammlung(sammlung);
      if (!BILDFELDER[sammlung].includes(feld)) {
        throw new InhaltsFehler(`Feld "${feld}" ist kein Bildfeld in ${sammlung}. Erlaubt: ${BILDFELDER[sammlung].join(', ') || 'keins'}`);
      }
      await entwurfAktualisieren();
      const kopf = await repo.kopf(ENTWURF);
      const eintrag = await lies(sammlung, id);
      if (eintrag.revision !== erwartete_revision) throw new InhaltsFehler('Der Eintrag wurde seit dem Lesen geändert. Bitte neu lesen.');
      const bild = await bildDaten({ datei_base64, url });
      const bildPfad = `src/assets/content/${sammlung}/${id}.${bild.ext}`;
      const src = `../../assets/content/${sammlung}/${id}.${bild.ext}`;
      const neu = pruefeDaten(sammlung, {
        ...eintrag.daten,
        [feld]: { src, alt: altText, ...(fokus ? { fokus } : {}) },
      });
      const aenderungen = [
        { pfad: bildPfad, inhalt: bild.inhalt },
        { pfad: eintrag.pfad, inhalt: alsDatei(neu) },
      ];
      const altesBild = eintrag.daten[feld]?.src;
      if (altesBild && bildRepoPfad(altesBild) !== bildPfad) aenderungen.push({ pfad: bildRepoPfad(altesBild), inhalt: null });
      const commit = await schreibe({
        werkzeug: 'bild_hochladen',
        kopf,
        aenderungen,
        nachricht: `Inhalt: ${sammlung}/${id} – ${feld} gesetzt`,
        details: { sammlung, id, feld, bytes: bild.inhalt.length },
      });
      const nachher = await repo.leseDatei(ENTWURF, eintrag.pfad);
      return { gesetzt: true, commit, sammlung, id, daten: neu, revision: nachher.sha, ...vorschauLink(sammlung, id, neu) };
    },

    async entwurf_status() {
      const stand = await repo.kopf(ENTWURF);
      const vgl = await repo.vergleiche(LIVE, ENTWURF);
      const build = await repo.buildStatus(stand);
      const fremd = vgl.dateien.filter((d) => {
        try {
          pruefeSchreibpfad(d.pfad);
          return false;
        } catch {
          return true;
        }
      });
      const offen = vgl.status === 'ahead' || vgl.status === 'diverged';
      return {
        erwarteter_stand: stand,
        unveroeffentlicht: offen,
        aenderungen: offen
          ? vgl.commits.map((c) => ({ commit: c.sha.slice(0, 7), nachricht: c.nachricht.split('\n')[0], von: c.autor, email: c.email, datum: c.datum }))
          : [],
        dateien: offen ? vgl.dateien : [],
        fremde_aenderungen: fremd.map((d) => d.pfad),
        vorschau_build: build,
        vorschau: vorschauUrl ?? null,
        hinweise: [
          ...(fremde_hinweis(fremd)),
          ...(offen && vgl.commits.some((c) => c.email && c.email !== person.email)
            ? ['Im Entwurf liegen Änderungen anderer Personen. Vor dem Veröffentlichen nachfragen, ob sie mit live gehen sollen.']
            : []),
        ],
      };

      function fremde_hinweis(f) {
        return f.length
          ? ['Der Entwurf enthält Änderungen außerhalb der Inhalte (Code). Veröffentlichen ist gesperrt – bitte Webmaster informieren oder verwerfen.']
          : [];
      }
    },

    async vorschau_zeigen({ sammlung, id } = {}) {
      let daten;
      if (sammlung && id) daten = (await lies(sammlung, id)).daten;
      const stand = await repo.kopf(ENTWURF);
      const build = await repo.buildStatus(stand);
      return {
        ...vorschauLink(sammlung, id, daten),
        vorschau_build: build,
        build_hinweis: {
          erfolgreich: 'Die Vorschau zeigt den aktuellen Entwurf.',
          laeuft: 'Vercel baut gerade. Die geöffnete Vorschau lädt sich gleich selbst neu.',
          fehlgeschlagen: 'Der Vorschau-Build ist fehlgeschlagen. Nicht veröffentlichen; Webmaster informieren.',
          unbekannt: 'Kein Build-Status gefunden (Vercel noch nicht gestartet?).',
        }[build],
      };
    },

    async veroeffentlichen({ bestaetigung, erwarteter_stand }) {
      if (bestaetigung !== true) throw new InhaltsFehler('Veröffentlichen nur mit bestaetigung: true, nachdem die Person im Chat ausdrücklich zugestimmt hat.');
      const stand = await repo.kopf(ENTWURF);
      if (stand !== erwarteter_stand) {
        throw new InhaltsFehler('Der Entwurf hat sich seit entwurf_status geändert. Bitte entwurf_status erneut aufrufen und der Person zeigen.');
      }
      const vgl = await repo.vergleiche(LIVE, ENTWURF);
      if (vgl.status === 'identical' || vgl.status === 'behind') {
        if (vgl.status === 'behind') await repo.setzeBranch(ENTWURF, await repo.kopf(LIVE), { force: false });
        return { veroeffentlicht: false, hinweis: 'Nichts zu veröffentlichen – der Entwurf entspricht der Live-Seite.' };
      }
      for (const d of vgl.dateien) pruefeSchreibpfad(d.pfad); // Code darf so nie live gehen
      const build = await repo.buildStatus(stand);
      if (build !== 'erfolgreich') {
        throw new InhaltsFehler(
          build === 'laeuft'
            ? 'Der Vorschau-Build läuft noch. Bitte warten, bis die Vorschau fertig ist, und erneut versuchen.'
            : build === 'fehlgeschlagen'
              ? 'Der Vorschau-Build ist fehlgeschlagen – so kann nicht veröffentlicht werden. Webmaster informieren.'
              : 'Kein erfolgreicher Vorschau-Build gefunden. Bitte warten oder Webmaster informieren.',
        );
      }
      let liveStand;
      if (vgl.status === 'ahead') {
        await repo.setzeBranch(LIVE, stand, { force: false });
        liveStand = stand;
      } else {
        liveStand = await repo.mergeCommit(
          LIVE,
          ENTWURF,
          `Inhalte veröffentlicht von ${person.name}\n\nÜber: MCP-Server FC-Webseite (Private AI)`,
        );
        await repo.setzeBranch(ENTWURF, liveStand, { force: true });
      }
      log('veroeffentlichen', { von: stand, live: liveStand, commits: vgl.commits.length, dateien: vgl.dateien.map((d) => d.pfad) });
      return {
        veroeffentlicht: true,
        live_stand: liveStand,
        aenderungen: vgl.commits.map((c) => c.nachricht.split('\n')[0]),
        live: liveUrl,
        hinweis: 'Vercel baut jetzt die Live-Seite – in 1–2 Minuten ist die Änderung live.',
      };
    },

    async entwurf_verwerfen({ bestaetigung, erwarteter_stand }) {
      if (bestaetigung !== true) throw new InhaltsFehler('Verwerfen nur mit bestaetigung: true, nachdem die Person im Chat zugestimmt hat.');
      const stand = await repo.kopf(ENTWURF);
      if (stand !== erwarteter_stand) throw new InhaltsFehler('Der Entwurf hat sich seit entwurf_status geändert. Bitte erneut prüfen.');
      const live = await repo.kopf(LIVE);
      if (live === stand) return { verworfen: false, hinweis: 'Es gibt keinen Entwurf zum Verwerfen.' };
      await repo.setzeBranch(ENTWURF, live, { force: true });
      log('entwurf_verwerfen', { verworfen: stand, jetzt: live });
      return { verworfen: true, hinweis: 'Der Entwurf entspricht wieder der Live-Seite. Die Vorschau aktualisiert sich gleich.', vorschau: vorschauUrl ?? null };
    },

    async rueckgaengig({ commit }) {
      if (!/^[0-9a-f]{7,40}$/.test(commit ?? '')) throw new InhaltsFehler('commit: SHA (mind. 7 Zeichen) angeben');
      await entwurfAktualisieren();
      const kopf = await repo.kopf(ENTWURF);
      const c = await repo.commitDateien(commit);
      if (c.eltern.length !== 1) throw new InhaltsFehler('Nur einfache Änderungen (keine Merge-Commits) können zurückgenommen werden.');
      c.dateien.forEach((d) => pruefeSchreibpfad(d.pfad));
      const aenderungen = [];
      for (const d of c.dateien) {
        const vorher = await repo.leseDatei(c.eltern[0], d.pfad);
        aenderungen.push({ pfad: d.pfad, inhalt: vorher ? vorher.inhalt : null });
      }
      for (const a of aenderungen) {
        const m = /^src\/content\/([a-z-]+)\//.exec(a.pfad);
        if (m && a.inhalt) pruefeDaten(m[1], json(a.inhalt));
      }
      const sha = await schreibe({
        werkzeug: 'rueckgaengig',
        kopf,
        aenderungen,
        nachricht: `Inhalt: Änderung ${commit.slice(0, 7)} zurückgenommen („${c.nachricht.split('\n')[0]}“)`,
        details: { zurueck: commit },
      });
      return {
        zurueckgenommen: true,
        commit: sha,
        dateien: aenderungen.map((a) => a.pfad),
        hinweis: 'Die Rücknahme liegt im Entwurf. Nach Prüfung in der Vorschau veröffentlichen.',
        vorschau: vorschauUrl ?? null,
      };
    },
  };
}
