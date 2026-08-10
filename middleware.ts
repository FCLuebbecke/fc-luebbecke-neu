/**
 * Vercel Edge Middleware – schützt das eingebettete Sanity-Studio (/admin)
 * mit HTTP Basic Auth, damit die Pflege-Oberfläche im öffentlichen Prototyp
 * nicht frei erreichbar ist.
 *
 * Hinweis: Die Sanity-Inhalte selbst sind ohnehin nur für eingeladene
 * Projektmitglieder lesbar/änderbar. Diese Middleware sperrt zusätzlich den
 * Studio-Login + das große JS-Bundle vor neugierigen Besuchern weg.
 *
 * Läuft direkt auf Vercel (framework-unabhängig), NICHT im lokalen
 * `astro dev` – dort bleibt /admin zum Entwickeln offen.
 *
 * Zugangsdaten kommen aus den Environment-Variablen ADMIN_USER / ADMIN_PASSWORD
 * (in Vercel → Settings → Environment Variables hinterlegen). Sind sie nicht
 * gesetzt, bleibt /admin gesperrt (fail closed).
 */
import { next } from '@vercel/edge';

export const config = {
  // Nur das Studio absichern – der Rest der Seite bleibt öffentlich.
  matcher: ['/admin', '/admin/:path*'],
};

// Nur ASCII verwenden: Sonderzeichen (ü, –) sind in HTTP-Headern ungültig,
// die Edge-Runtime verwirft den WWW-Authenticate-Header dann komplett und
// der Browser zeigt kein Login-Popup.
const REALM = 'FC Luebbecke - Inhaltspflege';

function unauthorized() {
  return new Response('Zugang nur für die Vereins-Inhaltspflege.', {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
    },
  });
}

export default function middleware(request: Request) {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;

  // Ohne hinterlegte Zugangsdaten bleibt das Studio gesperrt.
  if (!user || !pass) return unauthorized();

  const header = request.headers.get('authorization') ?? '';
  if (!header.startsWith('Basic ')) return unauthorized();

  let decoded = '';
  try {
    decoded = atob(header.slice('Basic '.length));
  } catch {
    return unauthorized();
  }

  const sep = decoded.indexOf(':');
  const providedUser = sep === -1 ? decoded : decoded.slice(0, sep);
  const providedPass = sep === -1 ? '' : decoded.slice(sep + 1);

  if (providedUser === user && providedPass === pass) {
    return next();
  }

  return unauthorized();
}
