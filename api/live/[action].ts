/**
 * FCL LIVE – Server-API (Nachbau des WordPress-Plugins "FC Lübbecke LIVE" 3.0.73).
 *
 * Eine einzige Vercel-Function für alle Aktionen unter /api/live/<action>:
 *
 *   GET  /api/live/data           → Konfiguration + Mediathek + nächste Spiele
 *   POST /api/live/video-create   → PayPal-Order für ein Video anlegen
 *   POST /api/live/video-capture  → Zahlung einlösen, Zugang + Wiederherstellungscode
 *   GET  /api/live/video-stream   → signierte Abspiel-URL für ein Video
 *   POST /api/live/live-create    → PayPal-Order für den Livestream anlegen
 *   POST /api/live/live-capture   → Zahlung einlösen, 6-Stunden-Livestream-Zugang
 *   GET  /api/live/live-stream    → signierte Abspiel-URL für den Livestream
 *   POST /api/live/restore        → Kauf per Wiederherstellungscode / PayPal-Order-ID
 *   GET  /api/live/purchases      → Käufe eines Geräts (deviceId) wiederherstellen
 *
 * Inhalte (Videos, Preise) kommen aus Sanity, Käufe werden dort als
 * liveKauf-Dokumente gespeichert – Codes/Order-IDs nur als HMAC-Hash, weil
 * Sanity-Datasets öffentlich lesbar sind. Zugangsschlüssel sind zustandslose,
 * HMAC-signierte Tokens (kein Session-Speicher nötig).
 *
 * Benötigte Environment-Variablen (Vercel → Settings → Environment Variables):
 *   PUBLIC_SANITY_PROJECT_ID / PUBLIC_SANITY_DATASET  (vorhanden)
 *   SANITY_WRITE_TOKEN   – Sanity-Token mit Schreibrecht (für Kauf-Dokumente)
 *   LIVE_ACCESS_SECRET   – langer Zufallswert, signiert Zugangsschlüssel/Hashes
 *   PAYPAL_MODE          – "sandbox" | "live"
 *   PAYPAL_CLIENT_ID     – PayPal REST Client-ID
 *   PAYPAL_SECRET        – PayPal REST Secret
 *   CF_ACCOUNT_ID        – Cloudflare Account-ID
 *   CF_API_TOKEN         – Cloudflare API-Token (Stream: Lesen)
 *   CF_CUSTOMER_CODE     – Cloudflare-Stream-Kundencode (customer-….cloudflarestream.com)
 *   CF_LIVE_UID          – UID des Cloudflare-Live-Inputs
 *   CF_SIGNED            – "1" (Standard) = signierte Wiedergabe-Tokens verwenden
 */
import { createHmac, randomUUID, randomBytes } from 'node:crypto';
import { createClient } from '@sanity/client';

// ---------------------------------------------------------------- Umgebung

const env = (name: string): string => process.env[name] ?? '';

const SANITY_PROJECT = env('PUBLIC_SANITY_PROJECT_ID');
const SANITY_DATASET = env('PUBLIC_SANITY_DATASET') || 'production';
const SECRET = env('LIVE_ACCESS_SECRET');

const PAYPAL_BASE =
  env('PAYPAL_MODE') === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

const CF_BASE = `https://api.cloudflare.com/client/v4/accounts/${env('CF_ACCOUNT_ID')}`;
const CF_SIGNED = env('CF_SIGNED') !== '0';

const sanity = createClient({
  projectId: SANITY_PROJECT,
  dataset: SANITY_DATASET,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: env('SANITY_WRITE_TOKEN') || undefined,
});

// ---------------------------------------------------------------- Hilfen

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

const fail = (message: string, status = 400) => json({ error: message }, status);

/** Keyed Hash – im öffentlichen Dataset nicht offline knackbar. */
const keyedHash = (value: string) =>
  createHmac('sha256', `${SECRET}:store`).update(value.trim()).digest('hex');

/** E-Mail für die Ablage maskieren (Datenschutz). */
function maskEmail(email: string): string {
  const [local = '', domain = ''] = email.split('@');
  const m = (s: string) => (s.length <= 2 ? `${s[0] ?? '*'}*` : `${s.slice(0, 2)}***`);
  return domain ? `${m(local)}@${m(domain)}${domain.includes('.') ? domain.slice(domain.lastIndexOf('.')) : ''}` : '***';
}

/** Wiederherstellungscode im Plugin-Format: FCL-XXXXXXXX (ohne 0/O/1/I). */
function newRecoveryCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(8);
  let code = '';
  for (let i = 0; i < 8; i++) code += alphabet[bytes[i] % alphabet.length];
  return `FCL-${code}`;
}

// --- Zustandslose Zugangsschlüssel: base64url(payload).base64url(signatur) ---

type AccessScope = 'video' | 'live';
interface AccessPayload {
  s: AccessScope;
  i: string; // Video-ID bzw. "LIVE"
  e: number; // Ablauf (Unix-Sekunden), 0 = ohne Ablauf
}

const b64u = (buf: Buffer) => buf.toString('base64url');

function signAccess(payload: AccessPayload): string {
  const body = b64u(Buffer.from(JSON.stringify(payload)));
  const sig = b64u(createHmac('sha256', `${SECRET}:access`).update(body).digest());
  return `${body}.${sig}`;
}

function verifyAccess(key: string | null, scope: AccessScope, id?: string): boolean {
  if (!key || !SECRET) return false;
  const [body, sig] = key.split('.');
  if (!body || !sig) return false;
  const expected = b64u(createHmac('sha256', `${SECRET}:access`).update(body).digest());
  if (sig !== expected) return false;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as AccessPayload;
    if (payload.s !== scope) return false;
    if (id && payload.i !== id) return false;
    if (payload.e && payload.e < Date.now() / 1000) return false;
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------- Sanity-Daten

interface Einstellungen {
  livePreis: number;
  spielPreis: number;
  clipPreis: number;
  zugriffsModus: 'unlimited' | 'hours';
  zugriffsStunden: number;
  livestreamAktiv: boolean;
  liveKostenlos: boolean;
}

const DEFAULTS: Einstellungen = {
  livePreis: 3.99,
  spielPreis: 0.99,
  clipPreis: 0.99,
  zugriffsModus: 'unlimited',
  zugriffsStunden: 24,
  livestreamAktiv: true,
  liveKostenlos: false,
};

let settingsCache: { value: Einstellungen; until: number } | null = null;

async function getSettings(): Promise<Einstellungen> {
  if (settingsCache && settingsCache.until > Date.now()) return settingsCache.value;
  let value = DEFAULTS;
  try {
    const doc = await sanity.fetch<Partial<Einstellungen> | null>(
      `*[_type == "liveEinstellungen"][0]{livePreis, spielPreis, clipPreis, zugriffsModus, zugriffsStunden, livestreamAktiv, liveKostenlos}`,
    );
    if (doc) {
      value = {
        ...DEFAULTS,
        ...Object.fromEntries(Object.entries(doc).filter(([, v]) => v !== null && v !== undefined)),
      } as Einstellungen;
    }
  } catch (err) {
    console.warn('[fcl-live] Einstellungen nicht geladen, Defaults aktiv', err);
  }
  settingsCache = { value, until: Date.now() + 60_000 };
  return value;
}

interface VideoDoc {
  _id: string;
  titel: string;
  kategorie: 'spiel' | 'highlights' | 'tore';
  datum?: string;
  gegner?: string;
  cfUid: string;
  preis?: number;
  kostenlos?: boolean;
  beschreibung?: string;
  bildRef?: string;
  reihenfolge?: number;
}

async function getVideos(): Promise<VideoDoc[]> {
  return sanity.fetch<VideoDoc[]>(
    `*[_type == "liveVideo" && freigegeben == true && defined(cfUid)]
      | order(coalesce(reihenfolge, 9999) asc, datum desc){
        _id, titel, kategorie, datum, gegner, cfUid, preis, kostenlos, beschreibung,
        "bildRef": vorschaubild.asset._ref
      }`,
  );
}

async function getVideo(id: string): Promise<VideoDoc | null> {
  if (!id) return null;
  return sanity.fetch<VideoDoc | null>(
    `*[_type == "liveVideo" && _id == $id && freigegeben == true][0]{
      _id, titel, kategorie, datum, gegner, cfUid, preis, kostenlos
    }`,
    { id },
  );
}

const videoPreis = (v: VideoDoc, s: Einstellungen): number =>
  v.kostenlos ? 0 : (v.preis ?? (v.kategorie === 'spiel' ? s.spielPreis : s.clipPreis));

/** Sanity-Bild-Asset-Ref → CDN-URL (ohne Builder, Ref-Format: image-<id>-<WxH>-<fmt>). */
function sanityImageUrl(ref: string, w = 640): string | null {
  const m = ref.match(/^image-([a-zA-Z0-9]+)-(\d+x\d+)-(\w+)$/);
  if (!m) return null;
  return `https://cdn.sanity.io/images/${SANITY_PROJECT}/${SANITY_DATASET}/${m[1]}-${m[2]}.${m[3]}?w=${w}&fit=max&auto=format`;
}

// ---------------------------------------------------------------- Cloudflare Stream

const cfTokenCache = new Map<string, { token: string; until: number }>();

/** Signiertes Wiedergabe-Token für eine Video-/Live-UID (Cache ~2h). */
async function cfPlaybackToken(uid: string): Promise<string | null> {
  if (!CF_SIGNED) return null;
  const cached = cfTokenCache.get(uid);
  if (cached && cached.until > Date.now()) return cached.token;
  if (!env('CF_API_TOKEN') || !env('CF_ACCOUNT_ID')) return null;

  const res = await fetch(`${CF_BASE}/stream/${uid}/token`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env('CF_API_TOKEN')}`,
      'Content-Type': 'application/json',
    },
    // 6 Stunden gültig – deckt Spiel + Nachspielzeit locker ab.
    body: JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 6 * 3600 }),
  });
  const data = (await res.json().catch(() => null)) as
    | { success?: boolean; result?: { token?: string } }
    | null;
  const token = data?.result?.token ?? null;
  if (token) cfTokenCache.set(uid, { token, until: Date.now() + 2 * 3600_000 });
  return token;
}

async function cfIframeUrl(uid: string): Promise<string | null> {
  const code = env('CF_CUSTOMER_CODE');
  if (!code || !uid) return null;
  const token = await cfPlaybackToken(uid);
  return `https://customer-${code}.cloudflarestream.com/${token ?? uid}/iframe`;
}

async function cfThumbUrl(uid: string): Promise<string | null> {
  const code = env('CF_CUSTOMER_CODE');
  if (!code || !uid) return null;
  const token = await cfPlaybackToken(uid);
  return `https://customer-${code}.cloudflarestream.com/${token ?? uid}/thumbnails/thumbnail.jpg?time=10s&height=480`;
}

// ---------------------------------------------------------------- PayPal

let paypalTokenCache: { token: string; until: number } | null = null;

async function paypalAccessToken(): Promise<string> {
  if (paypalTokenCache && paypalTokenCache.until > Date.now()) return paypalTokenCache.token;
  const id = env('PAYPAL_CLIENT_ID');
  const secret = env('PAYPAL_SECRET');
  if (!id || !secret) throw new Error('PayPal ist nicht konfiguriert (PAYPAL_CLIENT_ID / PAYPAL_SECRET).');

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!res.ok || !data.access_token) throw new Error('PayPal-Anmeldung fehlgeschlagen.');
  paypalTokenCache = {
    token: data.access_token,
    until: Date.now() + Math.max(60, (data.expires_in ?? 300) - 60) * 1000,
  };
  return data.access_token;
}

async function paypalCreateOrder(referenceId: string, description: string, value: number): Promise<string> {
  const token = await paypalAccessToken();
  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': randomUUID(),
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: referenceId,
          description,
          amount: { currency_code: 'EUR', value: value.toFixed(2) },
        },
      ],
    }),
  });
  const data = (await res.json()) as { id?: string };
  if (!res.ok || !data.id) throw new Error('PayPal-Bestellung konnte nicht angelegt werden.');
  return data.id;
}

interface CaptureResult {
  captureId: string;
  payerEmail: string;
}

/** Order einlösen und Status/Währung/Betrag prüfen. */
async function paypalCapture(orderId: string, expectedValue: number): Promise<CaptureResult> {
  const token = await paypalAccessToken();
  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': randomUUID(),
    },
  });
  const data = (await res.json().catch(() => ({}))) as {
    status?: string;
    payer?: { email_address?: string };
    purchase_units?: Array<{
      payments?: { captures?: Array<{ id?: string; status?: string; amount?: { currency_code?: string; value?: string } }> };
    }>;
  };

  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
  const ok =
    res.ok &&
    data.status === 'COMPLETED' &&
    capture?.status === 'COMPLETED' &&
    capture.amount?.currency_code === 'EUR' &&
    Math.abs(parseFloat(capture.amount?.value ?? '0') - expectedValue) < 0.005;

  if (!ok) throw new Error('Die Zahlung konnte nicht bestätigt werden.');
  return { captureId: capture?.id ?? orderId, payerEmail: data.payer?.email_address ?? '' };
}

// ---------------------------------------------------------------- Käufe (Sanity)

interface KaufDoc {
  _id: string;
  videoId: string;
  videoTitel?: string;
  ablaufAm?: string | null;
}

async function findKaufByOrderHash(orderHash: string): Promise<KaufDoc | null> {
  return sanity.fetch<KaufDoc | null>(
    `*[_type == "liveKauf" && orderHash == $h][0]{_id, videoId, videoTitel, ablaufAm}`,
    { h: orderHash },
  );
}

async function createKauf(fields: Record<string, unknown>): Promise<void> {
  await sanity.create({ _type: 'liveKauf', ...fields });
}

const kaufAbgelaufen = (k: KaufDoc): boolean =>
  Boolean(k.ablaufAm && new Date(k.ablaufAm).getTime() < Date.now());

/** Zugangsschlüssel für einen Kauf – Ablauf aus dem Kauf, sonst 30 Tage rollierend. */
function accessKeyForKauf(k: KaufDoc): string {
  const exp = k.ablaufAm
    ? Math.floor(new Date(k.ablaufAm).getTime() / 1000)
    : Math.floor(Date.now() / 1000) + 30 * 24 * 3600;
  return signAccess({ s: 'video', i: k.videoId, e: exp });
}

// ---------------------------------------------------------------- Spielplan
// Kopie der Parse-Logik aus src/lib/fussball.ts: Vercel-Functions im
// api/-Ordner werden einzeln kompiliert und können zur Laufzeit keine
// Module aus src/ auflösen – die Function muss selbständig sein.

interface FussballMatch {
  datum: string;
  zeit: string;
  heim: string;
  gast: string;
  heimLogo: string | null;
  gastLogo: string | null;
  istHeimspiel: boolean;
  wettbewerb: string;
}

const FUSSBALLDE_TEAM_ID = '011MIFCCRK000000VTVG0001VTR8C1K7';

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&uuml;/g, 'ü')
    .replace(/&ouml;/g, 'ö')
    .replace(/&auml;/g, 'ä')
    .replace(/&Uuml;/g, 'Ü')
    .replace(/&Ouml;/g, 'Ö')
    .replace(/&Auml;/g, 'Ä')
    .replace(/&szlig;/g, 'ß')
    .replace(/&nbsp;/g, ' ');
}

function extractText(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function parseMatchesFromHtml(html: string): FussballMatch[] {
  const matches: FussballMatch[] = [];
  const rows = html.split(/<tr[\s>]/i).slice(1);

  let currentDate = '';
  let currentTime = '';
  let currentWettbewerb = 'Landesliga';

  for (const row of rows) {
    if (row.includes('row-headline visible-small')) {
      const tdMatch = row.match(/<td[^>]*>([\s\S]*?)<\/td>/i);
      if (tdMatch) {
        const text = extractText(tdMatch[1]);
        currentDate = text.match(/(\d{2}\.\d{2}\.\d{4})/)?.[1] ?? '';
        currentTime = text.match(/(\d{2}:\d{2})/)?.[1] ?? '';
        currentWettbewerb = text.match(/\|\s*(.+)$/)?.[1]?.trim() ?? 'Landesliga';
      }
      continue;
    }
    if (row.includes('row-competition') || row.includes('thead') || row.includes('<th')) continue;
    if (!row.includes('club-name') || !currentDate) continue;

    const clubNames = [...row.matchAll(/<div class="club-name">\s*([\s\S]*?)\s*<\/div>/gi)];
    if (clubNames.length < 2) continue;

    const heim = decodeEntities(clubNames[0][1].trim());
    const gast = decodeEntities(clubNames[1][1].trim());
    if (!heim || !gast) continue;

    // Wappen: je Verein ein data-responsive-image im club-logo-Block
    // (protokoll-relativ, z. B. //www.fussball.de/export.media/…/getLogo/…)
    const logos = [...row.matchAll(/data-responsive-image="([^"]+)"/gi)].map((m) =>
      m[1].startsWith('//') ? `https:${m[1]}` : m[1],
    );

    matches.push({
      datum: currentDate,
      zeit: currentTime,
      heim,
      gast,
      heimLogo: logos[0] ?? null,
      gastLogo: logos[1] ?? null,
      istHeimspiel: heim.toLowerCase().includes('lübbecke'),
      wettbewerb: currentWettbewerb,
    });
    currentDate = '';
    currentTime = '';
    currentWettbewerb = 'Landesliga';
  }
  return matches;
}

async function getNextMatches(): Promise<FussballMatch[]> {
  const url = `https://www.fussball.de/ajax.team.next.games/-/mode/PAGE/team-id/${FUSSBALLDE_TEAM_ID}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
      Referer: 'https://www.fussball.de/',
    },
  });
  if (!res.ok) return [];
  return parseMatchesFromHtml(await res.text());
}

let spieleCache: { value: FussballMatch[]; until: number } | null = null;

async function getSpiele(): Promise<FussballMatch[]> {
  if (spieleCache && spieleCache.until > Date.now()) return spieleCache.value;
  let spiele: FussballMatch[] = [];
  try {
    spiele = await getNextMatches();
  } catch (err) {
    console.warn('[fcl-live] Spielplan nicht geladen', err);
  }
  spieleCache = { value: spiele, until: Date.now() + 5 * 60_000 };
  return spiele;
}

// ---------------------------------------------------------------- Aktionen

async function actionData(): Promise<Response> {
  const [settings, videos, spiele] = await Promise.all([getSettings(), getVideos(), getSpiele()]);

  const items = await Promise.all(
    videos.map(async (v) => ({
      id: v._id,
      titel: v.titel,
      kategorie: v.kategorie,
      datum: v.datum ?? null,
      gegner: v.gegner ?? null,
      beschreibung: v.beschreibung ?? null,
      preis: videoPreis(v, settings),
      kostenlos: Boolean(v.kostenlos),
      thumb: v.bildRef ? sanityImageUrl(v.bildRef) : await cfThumbUrl(v.cfUid).catch(() => null),
    })),
  );

  return json({
    config: {
      paypalClientId: env('PAYPAL_CLIENT_ID'),
      paypalMode: env('PAYPAL_MODE') === 'live' ? 'live' : 'sandbox',
      livePreis: settings.livePreis,
      zugriffsModus: settings.zugriffsModus,
      zugriffsStunden: settings.zugriffsStunden,
      livestreamAktiv: settings.livestreamAktiv && Boolean(env('CF_LIVE_UID')),
      liveKostenlos: settings.liveKostenlos,
      bereit: Boolean(SECRET && env('PAYPAL_CLIENT_ID') && env('CF_CUSTOMER_CODE')),
    },
    videos: items,
    spiele,
  });
}

async function actionVideoCreate(body: Record<string, unknown>): Promise<Response> {
  const settings = await getSettings();
  const video = await getVideo(String(body.videoId ?? ''));
  if (!video) return fail('Video nicht gefunden.', 404);

  const preis = videoPreis(video, settings);
  if (preis <= 0) return json({ free: true });

  const orderId = await paypalCreateOrder(
    `FCL-VIDEO-${video._id}`,
    `FC Lübbecke LIVE – ${video.titel}`.slice(0, 127),
    preis,
  );
  return json({ orderId });
}

async function actionVideoCapture(body: Record<string, unknown>): Promise<Response> {
  const settings = await getSettings();
  const orderId = String(body.orderId ?? '');
  const deviceId = String(body.deviceId ?? '');
  const video = await getVideo(String(body.videoId ?? ''));
  if (!video || !orderId) return fail('Ungültige Anfrage.');

  // Idempotent: dieselbe Order gibt denselben Zugang zurück (kein Doppelkauf).
  const vorhanden = await findKaufByOrderHash(keyedHash(orderId));
  if (vorhanden) {
    if (kaufAbgelaufen(vorhanden)) return fail('Der Zugriff für diesen Kauf ist abgelaufen.', 410);
    return json({ accessKey: accessKeyForKauf(vorhanden), recoveryCode: null, mailSent: false });
  }

  const preis = videoPreis(video, settings);
  const { captureId, payerEmail } = await paypalCapture(orderId, preis);

  const recoveryCode = newRecoveryCode();
  const ablauf =
    settings.zugriffsModus === 'hours'
      ? new Date(Date.now() + settings.zugriffsStunden * 3600_000).toISOString()
      : null;

  await createKauf({
    videoId: video._id,
    videoTitel: video.titel,
    orderHash: keyedHash(orderId),
    recoveryHash: keyedHash(recoveryCode),
    deviceHash: deviceId ? keyedHash(deviceId) : null,
    emailMasked: payerEmail ? maskEmail(payerEmail) : null,
    betrag: preis,
    gekauftAm: new Date().toISOString(),
    ablaufAm: ablauf,
    captureIdSuffix: captureId.slice(-6),
  });

  const exp = ablauf
    ? Math.floor(new Date(ablauf).getTime() / 1000)
    : Math.floor(Date.now() / 1000) + 30 * 24 * 3600;

  return json({
    accessKey: signAccess({ s: 'video', i: video._id, e: exp }),
    recoveryCode,
    mailSent: false,
    receiptEmail: payerEmail ? maskEmail(payerEmail) : null,
  });
}

async function actionVideoStream(url: URL): Promise<Response> {
  const videoId = url.searchParams.get('videoId') ?? '';
  const video = await getVideo(videoId);
  if (!video) return fail('Video nicht gefunden.', 404);

  const settings = await getSettings();
  const frei = videoPreis(video, settings) <= 0;
  if (!frei && !verifyAccess(url.searchParams.get('accessKey'), 'video', video._id)) {
    return fail('Kein gültiger Zugang zu diesem Video.', 403);
  }

  const iframeUrl = await cfIframeUrl(video.cfUid);
  if (!iframeUrl) return fail('Streaming ist nicht konfiguriert.', 500);
  return json({ iframeUrl });
}

async function actionLiveCreate(): Promise<Response> {
  const settings = await getSettings();
  if (!settings.livestreamAktiv) return fail('Der Livestream ist zurzeit nicht verfügbar.', 404);
  if (settings.liveKostenlos) return json({ free: true });

  const orderId = await paypalCreateOrder(
    'FCL-LIVE',
    'FC Lübbecke LIVE – Livestream',
    settings.livePreis,
  );
  return json({ orderId });
}

async function actionLiveCapture(body: Record<string, unknown>): Promise<Response> {
  const settings = await getSettings();
  const orderId = String(body.orderId ?? '');
  if (!orderId) return fail('Ungültige Anfrage.');

  const vorhanden = await findKaufByOrderHash(keyedHash(orderId));
  const exp = Math.floor(Date.now() / 1000) + 6 * 3600; // 6 Stunden wie im Plugin
  if (vorhanden) return json({ accessKey: signAccess({ s: 'live', i: 'LIVE', e: exp }) });

  const { payerEmail } = await paypalCapture(orderId, settings.livePreis);

  await createKauf({
    videoId: 'LIVE',
    videoTitel: 'Livestream',
    orderHash: keyedHash(orderId),
    emailMasked: payerEmail ? maskEmail(payerEmail) : null,
    betrag: settings.livePreis,
    gekauftAm: new Date().toISOString(),
    ablaufAm: new Date(exp * 1000).toISOString(),
  });

  return json({ accessKey: signAccess({ s: 'live', i: 'LIVE', e: exp }) });
}

async function actionLiveStream(url: URL): Promise<Response> {
  const settings = await getSettings();
  if (!settings.livestreamAktiv) return fail('Der Livestream ist zurzeit nicht verfügbar.', 404);
  if (!settings.liveKostenlos && !verifyAccess(url.searchParams.get('accessKey'), 'live')) {
    return fail('Kein gültiger Zugang zum Livestream.', 403);
  }
  const iframeUrl = await cfIframeUrl(env('CF_LIVE_UID'));
  if (!iframeUrl) return fail('Der Livestream ist nicht konfiguriert.', 500);
  return json({ iframeUrl });
}

async function actionRestore(body: Record<string, unknown>): Promise<Response> {
  const eingabe = String(body.code ?? '').trim();
  if (!eingabe) return fail('Bitte einen Wiederherstellungscode eingeben.');

  const h = keyedHash(eingabe);
  const kauf = await sanity.fetch<KaufDoc | null>(
    `*[_type == "liveKauf" && (recoveryHash == $h || orderHash == $h)][0]{_id, videoId, videoTitel, ablaufAm}`,
    { h },
  );
  if (!kauf || kauf.videoId === 'LIVE') return fail('Kein Kauf mit diesem Code gefunden.', 404);
  if (kaufAbgelaufen(kauf)) return fail('Der Zugriff für diesen Kauf ist abgelaufen.', 410);

  // Kauf zusätzlich an dieses Gerät binden, damit „Meine Käufe“ ihn künftig findet.
  const deviceId = String(body.deviceId ?? '');
  if (deviceId) {
    await sanity.patch(kauf._id).set({ deviceHash: keyedHash(deviceId) }).commit().catch(() => {});
  }

  return json({
    videoId: kauf.videoId,
    titel: kauf.videoTitel ?? null,
    accessKey: accessKeyForKauf(kauf),
  });
}

async function actionPurchases(url: URL): Promise<Response> {
  const deviceId = url.searchParams.get('deviceId') ?? '';
  if (!deviceId) return json({ items: [] });

  const kaeufe = await sanity.fetch<KaufDoc[]>(
    `*[_type == "liveKauf" && deviceHash == $h && videoId != "LIVE"]{_id, videoId, videoTitel, ablaufAm}`,
    { h: keyedHash(deviceId) },
  );

  return json({
    items: kaeufe
      .filter((k) => !kaufAbgelaufen(k))
      .map((k) => ({ videoId: k.videoId, titel: k.videoTitel ?? null, accessKey: accessKeyForKauf(k) })),
  });
}

// ---------------------------------------------------------------- Router

async function handle(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const action = url.pathname.split('/').filter(Boolean).pop() ?? '';

  let body: Record<string, unknown> = {};
  if (request.method === 'POST') {
    body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  }

  try {
    switch (`${request.method} ${action}`) {
      case 'GET data':
        return await actionData();
      case 'POST video-create':
        return await actionVideoCreate(body);
      case 'POST video-capture':
        return await actionVideoCapture(body);
      case 'GET video-stream':
        return await actionVideoStream(url);
      case 'POST live-create':
        return await actionLiveCreate();
      case 'POST live-capture':
        return await actionLiveCapture(body);
      case 'GET live-stream':
        return await actionLiveStream(url);
      case 'POST restore':
        return await actionRestore(body);
      case 'GET purchases':
        return await actionPurchases(url);
      default:
        return fail('Unbekannte Aktion.', 404);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unerwarteter Fehler.';
    console.error(`[fcl-live] ${action}:`, err);
    return fail(message, 500);
  }
}

export const GET = handle;
export const POST = handle;
