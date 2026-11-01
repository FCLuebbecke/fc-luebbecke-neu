/**
 * Einmaliger Umzug Sanity → Dateien (Spec 008).
 *
 * Liest die veröffentlichten Inhalte aus dem öffentlichen Sanity-Dataset und
 * schreibt sie als JSON-Dateien nach src/content/<sammlung>/ und die Bilder
 * nach src/assets/content/<sammlung>/.
 *
 * - Reihenfolge: wird aus der heutigen Anzeige-Reihenfolge übernommen
 *   (10, 20, 30 …), damit die Seiten exakt gleich sortiert bleiben.
 * - Bilder: Sanity-Ausschnitt (crop) wird angewendet, Hotspot wird zu `fokus`
 *   (CSS-object-position, z. B. "50% 39%"); Rasterbilder auf max. 2400 px.
 * - Alt-Texte: fehlen sie in Sanity, wird der bisherige Seiten-Fallback
 *   eingetragen („Mannschaftsfoto <Name>“ / „Logo <Name>“).
 * - Alte Einzeilen-Felder (trainer, trainingszeiten) werden in die neue
 *   Struktur (trainerteam, training) übernommen.
 *
 * Aufruf: node scripts/sanity-export.mjs   (wird nach dem Umzug gelöscht)
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const env = await readFile(path.join(ROOT, '.env'), 'utf8').catch(() => '');
const envVal = (k) => env.match(new RegExp(`^${k}=["']?([^"'\\n]*)`, 'm'))?.[1];
const PROJECT = envVal('PUBLIC_SANITY_PROJECT_ID');
const DATASET = envVal('PUBLIC_SANITY_DATASET') || 'production';
if (!PROJECT) throw new Error('PUBLIC_SANITY_PROJECT_ID fehlt in .env');

async function query(q) {
  const url = `https://${PROJECT}.api.sanity.io/v2024-01-01/data/query/${DATASET}?query=${encodeURIComponent(q)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sanity ${res.status}: ${await res.text()}`);
  return (await res.json()).result;
}

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/&/g, ' und ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function eindeutig() {
  const used = new Set();
  return (base) => {
    let s = base, i = 2;
    while (used.has(s)) s = `${base}-${i++}`;
    used.add(s);
    return s;
  };
}

const clean = (o) =>
  Object.fromEntries(
    Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0)),
  );

const BILD = `{ "url": asset->url, "ext": asset->extension, crop, hotspot, alt }`;

/** Lädt ein Sanity-Bild, wendet crop an, speichert es und liefert das JSON-Feld. */
async function bild(img, sammlung, name, altFallback) {
  if (!img?.url) return undefined;
  const dir = path.join(ROOT, 'src/assets/content', sammlung);
  await mkdir(dir, { recursive: true });
  const buf = Buffer.from(await (await fetch(img.url)).arrayBuffer());
  let ext = img.ext === 'jpeg' ? 'jpg' : img.ext;
  // Fotos als PNG ohne Transparenz (z. B. 6-MB-Mannschaftsfoto) → JPG.
  if (ext === 'png' && !(await sharp(buf).metadata()).hasAlpha) ext = 'jpg';
  const datei = `${name}.${ext}`;

  let fokus;
  if (ext === 'svg') {
    await writeFile(path.join(dir, datei), buf);
  } else {
    let pipe = sharp(buf).rotate();
    const meta = await sharp(buf).metadata();
    const c = img.crop;
    let [l, t, r, b] = [0, 0, 0, 0];
    if (c && (c.left || c.top || c.right || c.bottom)) {
      [l, t, r, b] = [c.left || 0, c.top || 0, c.right || 0, c.bottom || 0];
      pipe = pipe.extract({
        left: Math.round(meta.width * l),
        top: Math.round(meta.height * t),
        width: Math.round(meta.width * (1 - l - r)),
        height: Math.round(meta.height * (1 - t - b)),
      });
    }
    pipe = pipe.resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true });
    if (ext === 'jpg') pipe = pipe.jpeg({ quality: 85, mozjpeg: true });
    if (ext === 'png') pipe = pipe.png({ compressionLevel: 9, palette: false });
    await pipe.toFile(path.join(dir, datei));

    const h = img.hotspot;
    if (h && !(Math.abs(h.x - 0.5) < 0.005 && Math.abs(h.y - 0.5) < 0.005)) {
      // Hotspot ist relativ zum Originalbild → auf den Ausschnitt umrechnen.
      const fx = Math.min(1, Math.max(0, (h.x - l) / (1 - l - r)));
      const fy = Math.min(1, Math.max(0, (h.y - t) / (1 - t - b)));
      fokus = `${Math.round(fx * 100)}% ${Math.round(fy * 100)}%`;
    }
  }
  return clean({
    src: `../../assets/content/${sammlung}/${datei}`,
    alt: img.alt?.trim() || altFallback,
    fokus,
  });
}

async function schreibe(sammlung, datei, daten) {
  const dir = path.join(ROOT, 'src/content', sammlung);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${datei}.json`), JSON.stringify(daten, null, 2) + '\n');
}

// Vorherigen Lauf entfernen, damit das Ergebnis reproduzierbar ist.
for (const s of ['mannschaften', 'sparten-mannschaften', 'sparten-infos', 'sponsoren']) {
  await rm(path.join(ROOT, 'src/content', s), { recursive: true, force: true });
  await rm(path.join(ROOT, 'src/assets/content', s), { recursive: true, force: true });
}

// ── Fußball-Mannschaften ────────────────────────────────────────────────
{
  const docs = await query(`*[_type == "mannschaft"] | order(reihenfolge asc, name asc){
    name, kategorie, liga, text, jahrgang, trainer, trainingszeiten, platzhalter,
    trainerteam[]{ name, rolle, telefon, email, veroeffentlichen },
    training[]{ zeit, ort },
    "foto": foto${BILD}
  }`);
  const id = eindeutig();
  for (const [i, d] of docs.entries()) {
    const name = id(slug(d.name));
    const trainerteam = d.trainerteam?.length
      ? d.trainerteam.map((p) => clean({ ...p, veroeffentlichen: p.veroeffentlichen || undefined }))
      : d.trainer?.trim() ? [{ name: d.trainer.trim() }] : undefined;
    const training = d.training?.length
      ? d.training.map(clean)
      : d.trainingszeiten?.trim() ? [{ zeit: d.trainingszeiten.trim() }] : undefined;
    await schreibe('mannschaften', name, clean({
      name: d.name.trim(),
      kategorie: d.kategorie,
      reihenfolge: (i + 1) * 10,
      liga: d.liga,
      jahrgang: d.jahrgang,
      text: d.text,
      foto: await bild(d.foto, 'mannschaften', name, `Mannschaftsfoto ${d.name.trim()}`),
      trainerteam,
      training,
      platzhalter: d.platzhalter || undefined,
    }));
  }
  console.log(`mannschaften: ${docs.length}`);
}

// ── Badminton/Darts-Mannschaften ────────────────────────────────────────
for (const sparte of ['badminton', 'darts']) {
  const docs = await query(`*[_type == "${sparte}Mannschaft"] | order(reihenfolge asc, name asc){
    name, liga, info, href, platzhalter, "foto": foto${BILD}
  }`);
  const id = eindeutig();
  for (const [i, d] of docs.entries()) {
    const name = id(`${sparte}-${slug(d.name)}`);
    await schreibe('sparten-mannschaften', name, clean({
      sparte,
      name: d.name.trim(),
      reihenfolge: (i + 1) * 10,
      liga: d.liga,
      info: d.info,
      href: d.href,
      foto: await bild(d.foto, 'sparten-mannschaften', name, `Mannschaftsfoto ${d.name.trim()}`),
      platzhalter: d.platzhalter || undefined,
    }));
  }
  console.log(`sparten-mannschaften (${sparte}): ${docs.length}`);
}

// ── Badminton/Darts: Trainingszeiten & Ort ──────────────────────────────
for (const sparte of ['badminton', 'darts']) {
  const d = await query(`*[_type == "${sparte}Info"][0]{ training[]{ gruppe, zeit }, ortName, ortAdresse }`);
  if (!d) continue;
  await schreibe('sparten-infos', sparte, clean({
    training: d.training?.map(clean),
    ortName: d.ortName,
    ortAdresse: d.ortAdresse,
  }));
  console.log(`sparten-infos: ${sparte}`);
}

// ── Sponsoren ───────────────────────────────────────────────────────────
{
  const docs = await query(`*[_type == "sponsor"] | order(reihenfolge asc, name asc){
    name, stufe, website, "logo": logo${BILD}
  }`);
  const id = eindeutig();
  for (const [i, d] of docs.entries()) {
    const name = id(slug(d.name));
    await schreibe('sponsoren', name, clean({
      name: d.name.trim(),
      stufe: d.stufe || 'normal',
      reihenfolge: (i + 1) * 10,
      website: d.website,
      logo: await bild(d.logo, 'sponsoren', name, `Logo ${d.name.trim()}`),
    }));
  }
  console.log(`sponsoren: ${docs.length}`);
}
