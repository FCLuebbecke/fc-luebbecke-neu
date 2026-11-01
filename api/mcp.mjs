/**
 * Vercel-Function: MCP-Endpunkt „FC-Webseite“ für Private AI (Spec 010).
 * Adresse: https://www.fcluebbecke.de/api/mcp (Streamable HTTP, zustandslos)
 *
 * Anmeldung (Spec 010, Decision 6):
 *   Authorization: Bearer <MCP_SCHLUESSEL>      – ein Schlüssel für Private AI
 *   X-FC-Person-Email / X-FC-Person-Name        – angemeldete Person
 * Nur E-Mails aus MCP_PERSONEN sind freigeschaltet.
 *
 * Umgebungsvariablen (Vercel, nicht im Repo): siehe MCP.md
 */
import { timingSafeEqual } from 'node:crypto';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { erstelleServer } from '../mcp/server.mjs';
import { githubRepo } from '../mcp/repo-github.mjs';

export const config = { maxDuration: 60 };

const fehler = (status, text) =>
  new Response(JSON.stringify({ jsonrpc: '2.0', error: { code: -32001, message: text }, id: null }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

function gleich(a, b) {
  const x = Buffer.from(a ?? '');
  const y = Buffer.from(b ?? '');
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * Freigabeliste aus MCP_PERSONEN lesen:
 * JSON [{"email":"…","name":"…"}] oder "email=Name; email2=Name2".
 */
export function freigegebenePersonen(wert) {
  if (!wert) return [];
  const t = wert.trim();
  if (t.startsWith('[')) return JSON.parse(t).map((p) => ({ email: p.email.toLowerCase(), name: p.name }));
  return t
    .split(/[;\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const [email, name] = s.split('=');
      return { email: email.trim().toLowerCase(), name: (name ?? email).trim() };
    });
}

/** Prüft Schlüssel und Person. Liefert die Person oder eine Fehler-Antwort. */
export function anmelden(request, env) {
  if (!env.MCP_SCHLUESSEL) return { antwort: fehler(503, 'MCP-Server ist nicht eingerichtet (MCP_SCHLUESSEL fehlt).') };
  const auth = request.headers.get('authorization') ?? '';
  if (!auth.startsWith('Bearer ') || !gleich(auth.slice(7), env.MCP_SCHLUESSEL)) {
    return { antwort: fehler(401, 'Nicht angemeldet.') };
  }
  const email = request.headers.get('x-fc-person-email')?.trim().toLowerCase();
  if (!email) return { antwort: fehler(403, 'Angemeldete Person fehlt (X-FC-Person-Email).') };
  const person = freigegebenePersonen(env.MCP_PERSONEN).find((p) => p.email === email);
  if (!person) return { antwort: fehler(403, `${email} ist für die Inhaltspflege nicht freigeschaltet.`) };
  const name = request.headers.get('x-fc-person-name')?.trim() || person.name;
  return { person: { email, name } };
}

export async function bearbeite(request, env = process.env, repoFabrik = githubRepo) {
  const { person, antwort } = anmelden(request, env);
  if (antwort) return antwort;
  const server = erstelleServer({
    repo: repoFabrik({ token: env.GITHUB_TOKEN, repo: env.GITHUB_REPO ?? 'FCLuebbecke/fc-luebbecke-neu' }),
    person,
    vorschauUrl: env.VORSCHAU_URL,
    liveUrl: env.LIVE_URL,
  });
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // zustandslos: jede Anfrage für sich
    enableJsonResponse: true,
  });
  await server.connect(transport);
  try {
    return await transport.handleRequest(request);
  } finally {
    // Antwort ist bei enableJsonResponse vollständig; Server freigeben.
    await server.close().catch(() => {});
  }
}

export async function POST(request) {
  return bearbeite(request);
}

export async function GET() {
  return fehler(405, 'Nur POST (MCP Streamable HTTP, zustandslos).');
}

export async function DELETE() {
  return fehler(405, 'Keine Sitzungen (zustandslos).');
}
