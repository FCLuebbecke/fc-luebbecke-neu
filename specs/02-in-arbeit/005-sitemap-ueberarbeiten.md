---
nummer: 005
titel: Sitemap & kanonische Domain korrigieren (www.fcluebbecke.de)
status: in-arbeit
bereich: infra
prio: hoch
angelegt: 2026-09-03
gestartet: 2026-09-03
erledigt:
branch: spec/005-sitemap-ueberarbeiten
commit:
verantwortlich:
---

# Sitemap & kanonische Domain korrigieren (www.fcluebbecke.de)

## Ziel

Der gesamte Auftritt verwendet durchgängig die richtige kanonische Domain
**https://www.fcluebbecke.de** – in Canonical-Tags, Sitemap, robots.txt und
Social-Media-Vorschau. Die Sitemap bekommt zusätzlich `lastmod`-Angaben,
und die Seite wird in der Google Search Console angemeldet.

## Ausgangslage

**Wichtigster Befund (2026-09-03):** Im Code steht die falsche Domain.
`astro.config.mjs` setzt `site: 'https://fc-luebbecke.de'` – aber
`fc-luebbecke.de` (mit Bindestrich) gehört **nicht** zum Projekt: Sie zeigt
auf einen Strato-Apache-Server mit der **alten Badminton-Seite**
(„FC Lübbecke Badminton“). Die echte Webseite läuft unter
**www.fcluebbecke.de** (ohne Bindestrich, Vercel-Projekt `fc-luebbecke-neu`).

Folgen der falschen `site`-Angabe (alles live nachgeprüft):

- Alle **Canonical-Tags** zeigen auf die fremde Domain → Google wird
  angewiesen, die alte Badminton-Domain als Original zu werten.
- Alle **Sitemap-URLs** und die **Sitemap-Zeile in `robots.txt`** zeigen
  auf die fremde Domain.
- Die **OG-URLs** (Social-Vorschau) zeigen auf die fremde Domain.

Die Vercel-Domain-Konfiguration selbst ist bereits richtig:

| Domain                  | Verhalten                                        |
|-------------------------|--------------------------------------------------|
| `www.fcluebbecke.de`    | 200 – Hauptdomain (Production) ✓                 |
| `fcluebbecke.de`        | 308 → `www.fcluebbecke.de` ✓                     |
| `fclübbecke.de` (xn--)  | Redirect → `www.fcluebbecke.de` ✓                |
| `fc-luebbecke.de`       | fremd: Strato/Apache, alte Badminton-Seite       |
| `www.fc-luebbecke.de`   | fremd: 301 → `fc-luebbecke.de`                   |

Außerdem: Die Sitemap-Einträge haben kein `lastmod` (bei täglichem
Spielplan-Rebuild ein verschenktes Signal), und es gibt keine Google
Search Console fürs Projekt.

Betroffene Stellen:

- `astro.config.mjs` – `site` und Sitemap-Integration (`serialize`)
- `public/robots.txt` – Sitemap-URL
- Google Search Console – extern, einmalig einrichten

## Anforderungen

- [x] `site` in `astro.config.mjs` steht auf `https://www.fcluebbecke.de` –
      damit stimmen Canonicals, Sitemap-URLs und OG-URLs automatisch.
- [x] `robots.txt` verweist auf `https://www.fcluebbecke.de/sitemap-index.xml`.
- [x] Sitemap-Einträge enthalten ein sinnvolles `lastmod`
      (Build-Zeitpunkt über die `serialize`-Option der Integration).
- [x] Kein Verweis auf `fc-luebbecke.de` (Bindestrich) mehr im Repo
      (Quellcode, robots, Doku-Hinweis in CLAUDE.md prüfen).
- [ ] Property in der Google Search Console angelegt (Domain-Property
      `fcluebbecke.de`), Sitemap eingereicht, keine Indexierungsfehler.
- [ ] Nach Deploy live geprüft: Canonical, Sitemap und robots.txt zeigen
      auf `www.fcluebbecke.de`, `lastmod` vorhanden.

## Nicht Teil dieser Spec

- Änderungen an der fremden Domain `fc-luebbecke.de` (liegt nicht in
  unserer Hand; ggf. separat klären, wem sie gehört und ob sie auf die
  neue Seite umgeleitet werden kann).
- Sichtbare HTML-Sitemap-Seite für Besucher.
- Strukturierte Daten / JSON-LD und `llms.txt` (eigene Specs).
- Bing Webmaster Tools (später aus der Search Console importierbar).

## Umsetzung

1. **Domain im Code:** `site` in `astro.config.mjs` auf
   `https://www.fcluebbecke.de` ändern; Sitemap-URL in `public/robots.txt`
   anpassen. Repo nach weiteren `fc-luebbecke.de`-Vorkommen durchsuchen.
2. **`lastmod`:** Der Sitemap-Integration eine `serialize`-Funktion geben,
   die jedem Eintrag den Build-Zeitpunkt als `lastmod` mitgibt.
   `changefreq`/`priority` bewusst weglassen (ignoriert Google).
3. **Search Console:** Domain-Property `fcluebbecke.de` anlegen
   (DNS-TXT-Verifizierung beim Domain-Anbieter), Sitemap
   `https://www.fcluebbecke.de/sitemap-index.xml` einreichen.
   Zugang dokumentieren (welches Google-Konto).
4. **Kontrolle:** Nach Deploy `curl` auf Canonical (Startseite),
   `robots.txt` und `sitemap-0.xml` – alles `www.fcluebbecke.de`,
   `lastmod` vorhanden, keine `/live`-/`/admin`-Einträge.

## Abnahme

- `curl -s https://www.fcluebbecke.de/ | grep canonical` zeigt
  `https://www.fcluebbecke.de/`.
- `https://www.fcluebbecke.de/sitemap-0.xml` listet alle öffentlichen
  Seiten unter `www.fcluebbecke.de` mit `lastmod` des letzten Builds.
- `robots.txt` verweist auf die richtige Sitemap-URL.
- Search Console: Sitemap „Erfolgreich“ eingereicht (Indexierung selbst
  dauert Tage – Abnahme = eingereicht ohne Fehler).

## Notizen

- Hintergrund: Die falsche Domain stammt aus der Anfangsphase des Projekts
  (Annahme, `fc-luebbecke.de` sei die Hauptdomain). Nutzer-Korrektur vom
  2026-09-03: Der Link der Webseite ist `https://www.fcluebbecke.de`.
- Solange die fremde `fc-luebbecke.de` online ist, konkurriert die alte
  Badminton-Seite in der Suche mit unserer – prüfen, wer die Domain
  betreibt (vermutlich der Verein selbst bei Strato?) und ob eine
  Weiterleitung auf www.fcluebbecke.de machbar ist.
- Google-Konto für die Search Console mit dem Vorstand abstimmen.

## Umsetzungsnotizen (2026-09-03)

- `site` auf `https://www.fcluebbecke.de` umgestellt, `robots.txt` angepasst,
  `lastmod` per `serialize` ergänzt. Weitere `fc-luebbecke.de`-Vorkommen im
  Repo geprüft: nur fussball.de-Vereins-Slugs (unkritisch, andere Bedeutung).
- Lokal verifiziert (`npm run build`): Canonical `www.fcluebbecke.de`,
  Sitemap 14 URLs alle auf richtiger Domain, alle mit `lastmod`.
- **Offen:** Google Search Console (Domain-Property `fcluebbecke.de`,
  DNS-TXT-Verifizierung) – braucht ein Google-Konto des Vereins.
  Live-Check von Canonical/robots/Sitemap nach dem Deploy.
