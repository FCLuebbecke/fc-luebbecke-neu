/**
 * Live-Spielplan der 1. Mannschaft von FUSSBALL.DE.
 * Portiert aus dem Next.js-Prototyp (src/lib/fussball.ts).
 * Unterschied zu dort: kein `next: { revalidate }` – in diesem statischen
 * Astro-Projekt läuft der Fetch zur BUILD-ZEIT. Für aktuelle Daten neu bauen.
 */
export type FussballMatch = {
  datum: string;
  zeit: string;
  heim: string;
  gast: string;
  istHeimspiel: boolean;
  wettbewerb: string;
  /** Link zur fußball.de-Spielseite (dort steht der – verschlüsselte – Spielstand). */
  spielUrl?: string;
};

const TEAM_ID = "011MIFCCRK000000VTVG0001VTR8C1K7";

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&uuml;/g, "ü")
    .replace(/&ouml;/g, "ö")
    .replace(/&auml;/g, "ä")
    .replace(/&Uuml;/g, "Ü")
    .replace(/&Ouml;/g, "Ö")
    .replace(/&Auml;/g, "Ä")
    .replace(/&szlig;/g, "ß")
    .replace(/&nbsp;/g, " ");
}

function extractText(html: string): string {
  return decodeEntities(
    html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  );
}

function parseMatchesFromHtml(html: string): FussballMatch[] {
  const matches: FussballMatch[] = [];

  const rows = html.split(/<tr[\s>]/i).slice(1);

  let currentDate = "";
  let currentTime = "";
  let currentWettbewerb = "Landesliga";

  for (const row of rows) {
    // Headline-Zeile enthält Datum + Zeit + Wettbewerb
    // Format: "Sonntag, 19.04.2026 - 15:00 Uhr | Landesliga"
    if (row.includes("row-headline visible-small")) {
      const tdMatch = row.match(/<td[^>]*>([\s\S]*?)<\/td>/i);
      if (tdMatch) {
        const text = extractText(tdMatch[1]);
        const dateMatch = text.match(/(\d{2}\.\d{2}\.\d{4})/);
        const timeMatch = text.match(/(\d{2}:\d{2})/);
        const wettbewerbMatch = text.match(/\|\s*(.+)$/);
        currentDate = dateMatch ? dateMatch[1] : "";
        currentTime = timeMatch ? timeMatch[1] : "";
        currentWettbewerb = wettbewerbMatch ? wettbewerbMatch[1].trim() : "Landesliga";
      }
      continue;
    }

    // Wettbewerb-Zeilen und Header überspringen
    if (
      row.includes("row-competition") ||
      row.includes("thead") ||
      row.includes("<th")
    )
      continue;

    // Spielzeilen erkennen: enthalten club-name divs
    if (!row.includes("club-name") || !currentDate) continue;

    const clubNames = [
      ...row.matchAll(/<div class="club-name">\s*([\s\S]*?)\s*<\/div>/gi),
    ];
    if (clubNames.length < 2) continue;

    const heim = decodeEntities(clubNames[0][1].trim());
    const gast = decodeEntities(clubNames[1][1].trim());
    if (!heim || !gast) continue;

    const urlMatch = row.match(/href="(https:\/\/www\.fussball\.de\/spiel\/[^"]+)"/i);

    matches.push({
      datum: currentDate,
      zeit: currentTime,
      heim,
      gast,
      istHeimspiel: heim.toLowerCase().includes("lübbecke"),
      wettbewerb: currentWettbewerb,
      spielUrl: urlMatch ? urlMatch[1] : undefined,
    });

    currentDate = "";
    currentTime = "";
    currentWettbewerb = "Landesliga";
  }

  return matches;
}

async function fetchHtml(endpoint: string): Promise<string> {
  const url = `https://www.fussball.de/ajax.${endpoint}/-/mode/PAGE/team-id/${TEAM_ID}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        Referer: "https://www.fussball.de/",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });
    if (!res.ok) {
      console.error(`[fussball] ${endpoint}: HTTP ${res.status}`);
      return "";
    }
    const html = await res.text();
    console.log(`[fussball] ${endpoint}: ${html.length} bytes, ${(html.match(/club-name/g) || []).length} club-name hits`);
    return html;
  } catch (e) {
    console.error(`[fussball] ${endpoint}: fetch failed`, e);
    return "";
  }
}

export async function getNextMatches(): Promise<FussballMatch[]> {
  const html = await fetchHtml("team.next.games");
  return parseMatchesFromHtml(html);
}

export async function getPrevMatches(): Promise<FussballMatch[]> {
  const html = await fetchHtml("team.prev.games");
  return parseMatchesFromHtml(html);
}
