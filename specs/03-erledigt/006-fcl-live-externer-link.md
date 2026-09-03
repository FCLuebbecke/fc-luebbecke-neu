---
nummer: 006
titel: FCL LIVE als externer Link (fcl-live.de) statt eigener Unterseite
status: erledigt
bereich: fcl-live
prio: mittel
angelegt: 2026-09-03
gestartet: 2026-09-03
erledigt: 2026-09-03
branch: spec/006-fcl-live-externer-link
commit: eb72da8
verantwortlich:
---

# FCL LIVE als externer Link (fcl-live.de) statt eigener Unterseite

## Ziel

FCL LIVE (Livestream & Pay-per-View) läuft nicht mehr als Unterseite der
Vereinswebseite, sondern als eigenständiges Angebot unter
**https://fcl-live.de/**. Die Vereinsseite verlinkt nur noch dorthin –
prominent im Fußball-Menü, gekennzeichnet als externer Link, geöffnet in
neuem Tab (gleiches Muster wie Laufsport).

## Ausgangslage

Die Seite `/live` war ein Nachbau des WordPress-Plugins „FC Lübbecke LIVE“
als Astro-Seite mit eigener Vercel-Function (`api/live/`), PayPal- und
Cloudflare-Stream-Anbindung. Aktuell ist sie **temporär ausgeblendet**:

- `src/pages/_live.astro` – per Unterstrich aus dem Build genommen
- `src/components/Header.astro` – Menüpunkt im Fußball-Untermenü auskommentiert
- `src/components/Footer.astro` – Link unter „Verein“ auskommentiert
- `vercel.json` – Redirect `/live` → `/` (temporär, 307)
- `api/live/` – Vercel-Function, wird nicht mehr aufgerufen

Mit der Entscheidung für eine externe Domain wird aus „temporär
ausgeblendet“ ein Dauerzustand: Der interne Nachbau wird nicht mehr
gebraucht.

## Anforderungen

- [ ] Im Fußball-Untermenü (Header) gibt es den Punkt
      **„FCL LIVE ↗“** (o. ä.), der `https://fcl-live.de/` in einem
      **neuen Tab** öffnet (`target="_blank"` + `rel="noopener"`).
- [ ] Externe Kennzeichnung mit ↗ wie beim Laufsport-Link – Besucher
      erkennen, dass sie die Vereinsseite verlassen.
- [ ] Im Footer (Spalte „Verein“) wird der auskommentierte FCL-LIVE-Link
      wieder aktiviert, zeigt aber ebenfalls extern auf `https://fcl-live.de/`
      (mit ↗, neuer Tab).
- [ ] Der Redirect `/live` zeigt nicht mehr auf `/`, sondern **permanent
      (308) auf `https://fcl-live.de/`** – alte Links und Lesezeichen
      landen direkt beim neuen Angebot.
- [ ] Der interne Nachbau wird entfernt: `src/pages/_live.astro` und
      `api/live/` löschen (Code bleibt über die Git-Historie wiederherstellbar).
- [ ] Nicht mehr benötigte Env-Vars dokumentieren (PayPal, Cloudflare,
      `LIVE_ACCESS_SECRET`) – lokal wie in Vercel; erst löschen, wenn sicher
      ist, dass fcl-live.de sie nicht aus diesem Projekt bezieht.

## Nicht Teil dieser Spec

- Aufbau/Betrieb von fcl-live.de selbst (eigenes Projekt).
- Übernahme der gepflegten Live-Daten (Sanity) nach fcl-live.de.
- Datenschutzerklärung von fcl-live.de (liegt beim externen Angebot);
  nur prüfen, ob die eigene Datenschutzerklärung Abschnitte zum internen
  FCL-LIVE-Player enthält, die dann entfallen können.

## Umsetzung

1. **Header:** In `src/components/Header.astro` den auskommentierten
   Eintrag im Fußball-Untermenü ersetzen durch einen externen Link
   `{ label: "FCL LIVE", href: "https://fcl-live.de/", external: true }`.
   Prüfen, ob das `sub`-Array externe Links schon unterstützt (↗ +
   `target="_blank"`); ggf. Rendering ergänzen (Muster: Laufsport im
   Hauptmenü).
2. **Footer:** Auskommentierten Link in `src/components/Footer.astro`
   reaktivieren und auf `https://fcl-live.de/` mit `external: true` stellen.
3. **Redirect:** In `vercel.json` den Eintrag ändern zu
   `{ "source": "/live", "destination": "https://fcl-live.de/", "permanent": true }`.
4. **Aufräumen:** `src/pages/_live.astro` und `api/live/` löschen.
   Datenschutzerklärung auf FCL-LIVE-/PayPal-/Cloudflare-Abschnitte
   prüfen und anpassen.
5. **Testen:** Build lokal (`npm run build`), Menü auf Desktop + Mobil
   (Burger) prüfen, `/live`-Redirect nach Deploy mit `curl -sI` prüfen.

## Abnahme

- Fußball-Menü zeigt „FCL LIVE ↗“; Klick öffnet `https://fcl-live.de/`
  in neuem Tab (Desktop und Handy-Burger-Menü getestet).
- Footer-Link unter „Verein“ funktioniert genauso.
- `curl -sI https://fc-luebbecke.de/live` liefert 308 mit
  `location: https://fcl-live.de/`.
- Build enthält keine `/live`-Seite und keine `api/live`-Function mehr;
  Sitemap unverändert ohne `/live`.

## Notizen

- Voraussetzung: `https://fcl-live.de/` ist erreichbar und zeigt das
  Live-Angebot – vor dem Umstellen des Redirects prüfen, sonst schicken
  wir Besucher auf eine leere Domain.
- Die Sanity-Inhalte und Secrets des internen Nachbaus (Spec-Historie:
  „FCL LIVE Integration“) nicht vorschnell löschen – erst klären, ob
  fcl-live.de dieselben Quellen nutzt.
- Ersetzt die temporäre Ausblendung vom 2026-09-03 (Header/Footer
  auskommentiert, `_live.astro`, Redirect auf `/`).

## Umsetzungsnotizen (2026-09-03)

- Umgesetzt wie geplant. Das Untermenü im Header konnte externe Links
  vorher nicht darstellen – Rendering in `Header.astro` um `target`/`rel`,
  ↗-Icon und Screenreader-Hinweis ergänzt (Muster vom Hauptmenü).
  Gleiches für die „Verein“-Liste im Footer.
- `src/pages/_live.astro` und `api/live/` gelöscht (Ordner `api/` damit
  komplett weg; wiederherstellbar über Git-Historie, Stand vor diesem Commit).
- Datenschutzerklärung geprüft: enthielt **keine** Abschnitte zu
  FCL LIVE/PayPal/Cloudflare – nichts anzupassen.
- Sanity-Schemas (`src/sanity/schemaTypes/live.ts`) bewusst behalten,
  bis geklärt ist, ob fcl-live.de dasselbe Dataset nutzt. Env-Vars
  (PayPal, CF_*, `LIVE_ACCESS_SECRET`) ebenfalls noch nicht entfernt.
- `https://fcl-live.de/` vorab geprüft: erreichbar (WordPress, Titel
  „FCL-Live“).
- Verifiziert per `npm run build` (15 Seiten, kein `/live` im Output,
  Links mit `target="_blank" rel="noopener noreferrer"` im HTML).
  Redirect-Test per `curl` steht nach dem Deploy aus.
