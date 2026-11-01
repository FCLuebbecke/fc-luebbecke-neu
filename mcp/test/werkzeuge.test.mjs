/**
 * Tests der MCP-Werkzeuge gegen ein Repository im Arbeitsspeicher,
 * gefüllt mit den echten Inhaltsdateien. Aufruf: npm run test:mcp
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { speicherRepo } from '../repo-speicher.mjs';
import { werkzeuge } from '../werkzeuge.mjs';
import { pruefeSchreibpfad } from '../inhalte.mjs';

const WURZEL = new URL('../../', import.meta.url).pathname;

function echteDateien() {
  const dateien = {};
  const lauf = (rel) => {
    for (const n of readdirSync(join(WURZEL, rel))) {
      const p = `${rel}/${n}`;
      if (statSync(join(WURZEL, p)).isDirectory()) lauf(p);
      else dateien[p] = readFileSync(join(WURZEL, p));
    }
  };
  lauf('src/content');
  lauf('src/assets/content');
  dateien['src/pages/index.astro'] = '<h1>Code</h1>';
  return dateien;
}

const PETER = { name: 'Peter Test', email: 'peter@example.org' };

function aufbau(person = PETER) {
  const repo = speicherRepo(echteDateien());
  const log = [];
  const w = werkzeuge({ repo, person, vorschauUrl: 'https://vorschau.example.org', protokoll: (e) => log.push(e) });
  return { repo, w, log };
}

const fehlerText = async (p) => {
  try {
    await p;
  } catch (e) {
    return e.message;
  }
  assert.fail('Fehler erwartet');
};

test('Pfad-Sperre: nur Inhaltsdateien', () => {
  pruefeSchreibpfad('src/content/sponsoren/neu.json');
  pruefeSchreibpfad('src/assets/content/mannschaften/d1.jpg');
  for (const p of [
    'src/pages/index.astro',
    'src/content/schemas.mjs',
    'src/content/../pages/x.json',
    'src/content/unbekannt/x.json',
    'package.json',
    'api/mcp.mjs',
    'src/assets/content/sponsoren/x.exe',
  ]) {
    assert.throws(() => pruefeSchreibpfad(p), /nicht erlaubt/, p);
  }
});

test('suchen und lesen', async () => {
  const { w } = aufbau();
  const alle = await w.inhalt_suchen({});
  assert.ok(alle.anzahl >= 40);
  const d1 = await w.inhalt_suchen({ text: 'D1' });
  assert.ok(d1.treffer.some((t) => t.id === 'd-jugend-d1'));
  const e = await w.inhalt_lesen({ sammlung: 'sparten-infos', id: 'badminton' });
  assert.equal(e.daten.ortName, 'Kreissporthalle');
  assert.match(e.vorschau, /\/badminton\/trainingszeiten\/$/);
});

test('ändern: schreibt einen Commit auf preview, main bleibt unverändert', async () => {
  const { repo, w, log } = aufbau();
  const mainVorher = await repo.kopf('main');
  const e = await w.inhalt_lesen({ sammlung: 'sparten-infos', id: 'darts' });
  const erg = await w.entwurf_aendern({
    sammlung: 'sparten-infos',
    id: 'darts',
    felder: { training: [{ gruppe: 'Alle', zeit: 'Dienstag 19-21 Uhr' }] },
    erwartete_revision: e.revision,
  });
  assert.equal(erg.geaendert, true);
  assert.equal(await repo.kopf('main'), mainVorher);
  const neu = await w.inhalt_lesen({ sammlung: 'sparten-infos', id: 'darts' });
  assert.equal(neu.daten.training[0].zeit, 'Dienstag 19-21 Uhr');
  assert.equal(repo._commit(await repo.kopf('preview')).autor.email, PETER.email);
  assert.equal(log.at(-1).werkzeug, 'entwurf_aendern');
});

test('ändern: falsche Revision wird abgelehnt', async () => {
  const { w } = aufbau();
  const msg = await fehlerText(
    w.entwurf_aendern({ sammlung: 'sponsoren', id: 'homedeluxe', felder: { name: 'X' }, erwartete_revision: 'alt' }),
  );
  assert.match(msg, /seit dem Lesen geändert/);
});

test('Regeln: Pflichtfeld, unbekanntes Feld, Bild ohne Alt-Text', async () => {
  const { w } = aufbau();
  const e = await w.inhalt_lesen({ sammlung: 'sponsoren', id: 'homedeluxe' });
  assert.match(
    await fehlerText(w.entwurf_aendern({ sammlung: 'sponsoren', id: 'homedeluxe', felder: { stufe: null }, erwartete_revision: e.revision })),
    /stufe/,
  );
  assert.match(
    await fehlerText(w.entwurf_aendern({ sammlung: 'sponsoren', id: 'homedeluxe', felder: { farbe: 'rot' }, erwartete_revision: e.revision })),
    /farbe|Unrecognized/,
  );
  assert.match(
    await fehlerText(
      w.entwurf_aendern({
        sammlung: 'sponsoren',
        id: 'homedeluxe',
        felder: { logo: { ...e.daten.logo, alt: '' } },
        erwartete_revision: e.revision,
      }),
    ),
    /Alt-Text/,
  );
});

test('anlegen, Bild hochladen, löschen', async () => {
  const { repo, w } = aufbau();
  const neu = await w.entwurf_anlegen({
    sammlung: 'sponsoren',
    felder: { name: 'Bäckerei Meyer', stufe: 'normal', reihenfolge: 165 },
  });
  assert.equal(neu.id, 'baeckerei-meyer');
  const png = await sharp({ create: { width: 400, height: 200, channels: 3, background: '#0a6e12' } }).png().toBuffer();
  const b = await w.bild_hochladen({
    sammlung: 'sponsoren',
    id: 'baeckerei-meyer',
    feld: 'logo',
    datei_base64: png.toString('base64'),
    alt: 'Logo Bäckerei Meyer',
    erwartete_revision: neu.revision,
  });
  assert.equal(b.daten.logo.src, '../../assets/content/sponsoren/baeckerei-meyer.jpg');
  assert.ok(await repo.leseDatei('preview', 'src/assets/content/sponsoren/baeckerei-meyer.jpg'));
  assert.match(await fehlerText(w.entwurf_loeschen({ sammlung: 'sponsoren', id: 'baeckerei-meyer', erwartete_revision: b.revision })), /bestaetigung/);
  await w.entwurf_loeschen({ sammlung: 'sponsoren', id: 'baeckerei-meyer', erwartete_revision: b.revision, bestaetigung: true });
  assert.equal(await repo.leseDatei('preview', 'src/content/sponsoren/baeckerei-meyer.json'), null);
  assert.equal(await repo.leseDatei('preview', 'src/assets/content/sponsoren/baeckerei-meyer.jpg'), null);
});

test('feste Einträge: sparten-infos weder anlegen noch löschen', async () => {
  const { w } = aufbau();
  assert.match(await fehlerText(w.entwurf_anlegen({ sammlung: 'sparten-infos', id: 'laufen', felder: {} })), /festen/);
});

test('veröffentlichen: nur mit Bestätigung, passendem Stand und erfolgreichem Build', async () => {
  const { repo, w } = aufbau();
  const e = await w.inhalt_lesen({ sammlung: 'sparten-infos', id: 'darts' });
  await w.entwurf_aendern({ sammlung: 'sparten-infos', id: 'darts', felder: { ortAdresse: '32312 Lübbecke (Test)' }, erwartete_revision: e.revision });
  const st = await w.entwurf_status();
  assert.equal(st.unveroeffentlicht, true);
  assert.equal(st.aenderungen.length, 1);
  assert.match(await fehlerText(w.veroeffentlichen({ bestaetigung: false, erwarteter_stand: st.erwarteter_stand })), /bestaetigung/);
  assert.match(await fehlerText(w.veroeffentlichen({ bestaetigung: true, erwarteter_stand: 'falsch' })), /geändert/);
  assert.match(await fehlerText(w.veroeffentlichen({ bestaetigung: true, erwarteter_stand: st.erwarteter_stand })), /Build/);
  repo._setzeStatus(st.erwarteter_stand, 'erfolgreich');
  const erg = await w.veroeffentlichen({ bestaetigung: true, erwarteter_stand: st.erwarteter_stand });
  assert.equal(erg.veroeffentlicht, true);
  assert.equal(await repo.kopf('main'), st.erwarteter_stand);
  const live = await repo.leseDatei('main', 'src/content/sparten-infos/darts.json');
  assert.match(live.inhalt.toString(), /\(Test\)/);
});

test('veröffentlichen: Code im Entwurf blockiert', async () => {
  const { repo, w } = aufbau();
  await repo.commit({ branch: 'preview', aenderungen: [{ pfad: 'src/pages/index.astro', inhalt: '<h1>gehackt</h1>' }], nachricht: 'Code' });
  const st = await w.entwurf_status();
  assert.deepEqual(st.fremde_aenderungen, ['src/pages/index.astro']);
  repo._setzeStatus(st.erwarteter_stand, 'erfolgreich');
  assert.match(await fehlerText(w.veroeffentlichen({ bestaetigung: true, erwarteter_stand: st.erwarteter_stand })), /nicht erlaubt/);
  assert.equal((await repo.leseDatei('main', 'src/pages/index.astro')).inhalt.toString(), '<h1>Code</h1>');
});

test('veröffentlichen nach Code-Livegang (diverged): Merge, danach preview = main', async () => {
  const { repo, w } = aufbau();
  const e = await w.inhalt_lesen({ sammlung: 'sponsoren', id: 'kopp-gmbh' });
  await w.entwurf_aendern({ sammlung: 'sponsoren', id: 'kopp-gmbh', felder: { stufe: 'premium' }, erwartete_revision: e.revision });
  await repo.commit({ branch: 'main', aenderungen: [{ pfad: 'src/pages/index.astro', inhalt: '<h1>Neu</h1>' }], nachricht: 'Code live' });
  const st = await w.entwurf_status();
  repo._setzeStatus(st.erwarteter_stand, 'erfolgreich');
  const erg = await w.veroeffentlichen({ bestaetigung: true, erwarteter_stand: st.erwarteter_stand });
  assert.equal(erg.veroeffentlicht, true);
  assert.equal(await repo.kopf('preview'), await repo.kopf('main'));
  assert.equal((await repo.leseDatei('main', 'src/pages/index.astro')).inhalt.toString(), '<h1>Neu</h1>');
  assert.match((await repo.leseDatei('main', 'src/content/sponsoren/kopp-gmbh.json')).inhalt.toString(), /premium/);
});

test('verwerfen setzt preview auf main zurück', async () => {
  const { repo, w } = aufbau();
  const e = await w.inhalt_lesen({ sammlung: 'sponsoren', id: 'kopp-gmbh' });
  await w.entwurf_aendern({ sammlung: 'sponsoren', id: 'kopp-gmbh', felder: { stufe: 'premium' }, erwartete_revision: e.revision });
  const st = await w.entwurf_status();
  await w.entwurf_verwerfen({ bestaetigung: true, erwarteter_stand: st.erwarteter_stand });
  assert.equal(await repo.kopf('preview'), await repo.kopf('main'));
});

test('rückgängig: Gegenänderung im Entwurf', async () => {
  const { w } = aufbau();
  const e = await w.inhalt_lesen({ sammlung: 'sponsoren', id: 'kopp-gmbh' });
  const a = await w.entwurf_aendern({ sammlung: 'sponsoren', id: 'kopp-gmbh', felder: { stufe: 'premium' }, erwartete_revision: e.revision });
  await w.rueckgaengig({ commit: a.commit });
  const nachher = await w.inhalt_lesen({ sammlung: 'sponsoren', id: 'kopp-gmbh' });
  assert.equal(nachher.daten.stufe, e.daten.stufe);
});

test('Entwurf zieht main nach, wenn main weiter ist (behind)', async () => {
  const { repo, w } = aufbau();
  await repo.commit({ branch: 'main', aenderungen: [{ pfad: 'src/pages/index.astro', inhalt: '<h1>Neu</h1>' }], nachricht: 'Code live' });
  const e = await w.inhalt_lesen({ sammlung: 'sponsoren', id: 'kopp-gmbh' });
  await w.entwurf_aendern({ sammlung: 'sponsoren', id: 'kopp-gmbh', felder: { stufe: 'premium' }, erwartete_revision: e.revision });
  const vgl = await repo.vergleiche('main', 'preview');
  assert.equal(vgl.status, 'ahead');
});

test('Beiträge: anlegen, ohne Titelbild nicht veröffentlichen, Galerie anhängen und entfernen', async () => {
  const { repo, w } = aufbau();
  const jpg = (farbe) => sharp({ create: { width: 320, height: 200, channels: 3, background: farbe } }).jpeg().toBuffer();
  const neu = await w.entwurf_anlegen({
    sammlung: 'beitraege',
    id: 'saisonstart-2026',
    felder: {
      titel: 'Saisonstart 2026',
      datum: '2026-11-01',
      sparte: 'fussball',
      teaser: 'Unsere Erste startet in die neue Saison.',
      inhalt: 'Am Sonntag geht es los.\n\n## Kader\n\n- neu dabei: drei Spieler',
    },
  });
  assert.match(neu.vorschau, /\/aktuelles\/saisonstart-2026\/$/);
  let st = await w.entwurf_status();
  repo._setzeStatus(st.erwarteter_stand, 'erfolgreich');
  assert.match(await fehlerText(w.veroeffentlichen({ bestaetigung: true, erwarteter_stand: st.erwarteter_stand })), /Titelbild/);

  const t = await w.bild_hochladen({
    sammlung: 'beitraege', id: 'saisonstart-2026', feld: 'titelbild',
    datei_base64: (await jpg('#0a5012')).toString('base64'), alt: 'Mannschaft vor dem Anpfiff', erwartete_revision: neu.revision,
  });
  const g1 = await w.bild_hochladen({
    sammlung: 'beitraege', id: 'saisonstart-2026', feld: 'galerie',
    datei_base64: (await jpg('#16a626')).toString('base64'), alt: 'Jubel', erwartete_revision: t.revision,
  });
  const g2 = await w.bild_hochladen({
    sammlung: 'beitraege', id: 'saisonstart-2026', feld: 'galerie',
    datei_base64: (await jpg('#e7f3e8')).toString('base64'), alt: 'Fans', erwartete_revision: g1.revision,
  });
  assert.deepEqual(g2.daten.galerie.map((b) => b.src), [
    '../../assets/content/beitraege/saisonstart-2026-galerie-1.jpg',
    '../../assets/content/beitraege/saisonstart-2026-galerie-2.jpg',
  ]);
  // Fremdes Bild in die Galerie schmuggeln: abgelehnt
  assert.match(
    await fehlerText(w.entwurf_aendern({
      sammlung: 'beitraege', id: 'saisonstart-2026',
      felder: { galerie: [...g2.daten.galerie, { src: '../../assets/content/sponsoren/homedeluxe.png', alt: 'x' }] },
      erwartete_revision: g2.revision,
    })),
    /bild_hochladen/,
  );
  // Erstes Galeriebild entfernen: Datei wird mit gelöscht
  await w.entwurf_aendern({
    sammlung: 'beitraege', id: 'saisonstart-2026', felder: { galerie: [g2.daten.galerie[1]] }, erwartete_revision: g2.revision,
  });
  assert.equal(await repo.leseDatei('preview', 'src/assets/content/beitraege/saisonstart-2026-galerie-1.jpg'), null);
  assert.ok(await repo.leseDatei('preview', 'src/assets/content/beitraege/saisonstart-2026-galerie-2.jpg'));

  st = await w.entwurf_status();
  repo._setzeStatus(st.erwarteter_stand, 'erfolgreich');
  const erg = await w.veroeffentlichen({ bestaetigung: true, erwarteter_stand: st.erwarteter_stand });
  assert.equal(erg.veroeffentlicht, true);
  assert.ok(await repo.leseDatei('main', 'src/content/beitraege/saisonstart-2026.json'));
});

test('Beiträge: Regeln (Datum, Sparte, Teaser-Länge)', async () => {
  const { w } = aufbau();
  const basis = { titel: 'T', datum: '2026-11-01', sparte: 'verein', teaser: 'kurz', inhalt: 'Text' };
  assert.match(await fehlerText(w.entwurf_anlegen({ sammlung: 'beitraege', id: 'a', felder: { ...basis, datum: '1.11.2026' } })), /JJJJ-MM-TT/);
  assert.match(await fehlerText(w.entwurf_anlegen({ sammlung: 'beitraege', id: 'b', felder: { ...basis, sparte: 'tennis' } })), /sparte/);
  assert.match(await fehlerText(w.entwurf_anlegen({ sammlung: 'beitraege', id: 'c', felder: { ...basis, teaser: 'x'.repeat(300) } })), /teaser/);
});

test('News-Werkzeuge: anlegen (Datum heute), Foto, bearbeiten, auflisten, löschen', async () => {
  const { repo, w } = aufbau();
  const heute = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
  const neu = await w.news_anlegen({
    titel: 'D1 gewinnt 4:2 gegen Tengern',
    sparte: 'fussball',
    teaser: 'Nach 0:2-Rückstand dreht unsere D1 das Spiel.',
    text: 'Starke zweite Hälfte.\n\n- 1:2\n- 2:2',
  });
  assert.equal(neu.id, 'd1-gewinnt-4-2-gegen-tengern');
  assert.equal(neu.daten.datum, heute);
  assert.equal(neu.daten.inhalt, 'Starke zweite Hälfte.\n\n- 1:2\n- 2:2');
  assert.match(neu.hinweis, /Titelbild/);
  assert.match(neu.vorschau, /\/aktuelles\/d1-gewinnt-4-2-gegen-tengern\/$/);

  const jpg = await sharp({ create: { width: 300, height: 200, channels: 3, background: '#0a6e12' } }).jpeg().toBuffer();
  const foto = await w.news_foto({ id: neu.id, erwartete_revision: neu.revision, datei_base64: jpg.toString('base64'), alt: 'Jubel nach dem 4:2' });
  assert.equal(foto.daten.titelbild.alt, 'Jubel nach dem 4:2');
  assert.match(foto.hinweis, /Titelbild ist gesetzt/);
  const gal = await w.news_foto({ id: neu.id, erwartete_revision: foto.revision, art: 'galerie', datei_base64: jpg.toString('base64'), alt: 'Fans' });
  assert.equal(gal.daten.galerie.length, 1);

  const liste = await w.news_auflisten({ sparte: 'fussball' });
  const eintrag = liste.beitraege.find((b) => b.id === neu.id);
  assert.deepEqual([eintrag.titelbild, eintrag.galerie], [true, 1]);

  const geaendert = await w.news_bearbeiten({ id: neu.id, erwartete_revision: eintrag.revision, text: 'Neuer Text.' });
  assert.equal(geaendert.daten.inhalt, 'Neuer Text.');
  const gelesen = await w.news_lesen({ id: neu.id });
  assert.equal(gelesen.daten.text, 'Neuer Text.');

  assert.match(await fehlerText(w.news_bearbeiten({ id: neu.id, erwartete_revision: gelesen.revision })), /Keine Änderung/);
  assert.match(await fehlerText(w.news_bearbeiten({ id: neu.id, erwartete_revision: gelesen.revision, sparte: 'tennis' })), /sparte/);
  assert.match(await fehlerText(w.news_foto({ id: neu.id, erwartete_revision: gelesen.revision, art: 'logo', url: 'https://x', alt: 'x' })), /art/);
  assert.match(await fehlerText(w.news_loeschen({ id: neu.id, erwartete_revision: gelesen.revision })), /bestaetigung/);
  await w.news_loeschen({ id: neu.id, erwartete_revision: gelesen.revision, bestaetigung: true });
  assert.equal((await w.news_auflisten()).beitraege.some((b) => b.id === neu.id), false);
  assert.equal(await repo.leseDatei('preview', 'src/assets/content/beitraege/d1-gewinnt-4-2-gegen-tengern.jpg'), null);
});

test('News-Werkzeuge: Teaser zu lang wird abgelehnt', async () => {
  const { w } = aufbau();
  assert.match(
    await fehlerText(w.news_anlegen({ titel: 'X', sparte: 'verein', teaser: 'x'.repeat(250), text: 'y' })),
    /teaser/,
  );
});

test('entwurf_anlegen für Beiträge bildet die ID aus dem Titel', async () => {
  const { w } = aufbau();
  const neu = await w.entwurf_anlegen({
    sammlung: 'beitraege',
    felder: { titel: 'Grünkohlessen 2026', datum: '2026-11-01', sparte: 'verein', teaser: 't', inhalt: 'x' },
  });
  assert.equal(neu.id, 'gruenkohlessen-2026');
});
