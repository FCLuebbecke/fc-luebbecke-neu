---
nummer: 005
titel: Sitemap überarbeiten und Domain-Duplikat auflösen
status: geplant
bereich: infra
prio: mittel
angelegt: 2026-09-03
gestartet:
erledigt:
branch:
commit:
verantwortlich:
---

# Sitemap überarbeiten und Domain-Duplikat auflösen

## Ziel

Suchmaschinen bekommen eine saubere, vollständige Sitemap mit Änderungsdaten
– und es gibt nur **eine** kanonische Domain (`fc-luebbecke.de`), auf die
alle anderen Varianten weiterleiten. Kein Duplicate Content mehr durch die
alte Domain `fcluebbecke.de`.

## Ausgangslage

Die Sitemap wird beim Build von `@astrojs/sitemap` erzeugt
(`sitemap-index.xml` → `sitemap-0.xml`, aktuell 14 URLs) und ist in
`robots.txt` sowie im `<head>` (`Layout.astro`) verlinkt. `/admin` ist
gefiltert, die ausgeblendete `/live`-Seite taucht nicht auf. Grundsätzlich
funktioniert das – aber es gibt drei Schwächen:

1. **Keine `lastmod`-Angaben:** Die Sitemap enthält nur nackte URLs.
   Suchmaschinen können nicht erkennen, was sich geändert hat – bei
   täglichem Rebuild (Spielplan!) verschenktes Signal.
2. **Domain-Duplikat:** Die alte Domain liefert die Seite parallel aus,
   statt umzuleiten (Stand 2026-09-03):

   | Domain                 | Verhalten                                |
   |------------------------|------------------------------------------|
   | `fc-luebbecke.de`      | 200 – Hauptdomain ✓                      |
   | `www.fc-luebbecke.de`  | 301 → `fc-luebbecke.de` ✓                |
   | `fcluebbecke.de`       | 308 → `www.fcluebbecke.de` ⚠️            |
   | `www.fcluebbecke.de`   | **200 – liefert Seite direkt aus** ⚠️    |

   Google sieht damit zwei identische Seiten. Die Canonical-Tags zeigen
   zwar auf `fc-luebbecke.de`, sauber ist es trotzdem nicht.
3. **Nicht bei Google angemeldet:** Es gibt (Stand heute) keine Google
   Search Console fürs Projekt – Indexierung und Sitemap-Status sind
   nicht überprüfbar.

Betroffene Stellen:

- `astro.config.mjs` – Sitemap-Integration (Filter, Optionen)
- Vercel-Dashboard – Domain-Einstellungen (Projekt `fc-luebbecke-neu`, Team `fcl3`)
- Google Search Console – extern, einmalig einrichten

## Anforderungen

- [ ] Sitemap-Einträge enthalten ein sinnvolles `lastmod`
      (z. B. Build-Datum über die `serialize`-Option der Integration).
- [ ] `www.fcluebbecke.de` und `fcluebbecke.de` leiten per 301/308 auf
      `https://fc-luebbecke.de` weiter – kein 200 mehr auf der alten Domain.
- [ ] `www.fc-luebbecke.de` leitet weiterhin korrekt um (nicht verschlechtern).
- [ ] Die Sitemap enthält alle öffentlichen Seiten und **keine**
      ausgeblendeten (`/admin`, `/live`) – nach jedem Strukturwechsel prüfen.
- [ ] Property in der Google Search Console angelegt (Domain-Property
      `fc-luebbecke.de`), Sitemap eingereicht, keine Indexierungsfehler.
- [ ] `robots.txt` und `<link rel="sitemap">` zeigen weiterhin auf die
      richtige URL (Kontrolle, keine Änderung erwartet).

## Nicht Teil dieser Spec

- Sichtbare HTML-Sitemap-Seite für Besucher (bei 14 Seiten unnötig,
  Footer deckt das ab).
- Strukturierte Daten / JSON-LD (eigene Spec, siehe SEO-Analyse).
- `llms.txt` für KI-Suchmaschinen (eigene Spec, falls gewünscht).
- Bing Webmaster Tools (kann später mit wenigen Klicks aus der
  Search Console importiert werden).

## Umsetzung

1. **`lastmod`:** In `astro.config.mjs` der Sitemap-Integration eine
   `serialize`-Funktion geben, die jedem Eintrag `lastmod` (Build-Zeitpunkt)
   mitgibt. Alternativ `changefreq`/`priority` bewusst weglassen –
   Google ignoriert beide, `lastmod` zählt.
2. **Domains:** Im Vercel-Dashboard unter *Project → Settings → Domains*
   bei `www.fcluebbecke.de` und `fcluebbecke.de` „Redirect to
   `fc-luebbecke.de`“ (Status 308) einstellen statt „Serve“.
   Danach alle vier Varianten mit `curl -sI` gegenprüfen.
3. **Search Console:** Domain-Property `fc-luebbecke.de` anlegen
   (DNS-TXT-Verifizierung beim Domain-Anbieter), Sitemap
   `https://fc-luebbecke.de/sitemap-index.xml` einreichen.
   Zugang für den Verein dokumentieren (welches Google-Konto).
4. **Kontrolle:** Nach dem nächsten Build `sitemap-0.xml` live prüfen:
   14 URLs, `lastmod` vorhanden, keine `/live`- oder `/admin`-Einträge.

## Abnahme

- `curl -sI https://www.fcluebbecke.de/` liefert 301/308 mit
  `location: https://fc-luebbecke.de/` (ebenso `fcluebbecke.de`).
- `https://fc-luebbecke.de/sitemap-0.xml` zeigt alle öffentlichen Seiten
  mit `lastmod`-Datum des letzten Builds.
- Search Console meldet die Sitemap als „Erfolgreich“ und beginnt zu
  indexieren (kann einige Tage dauern – Abnahme = eingereicht ohne Fehler).

## Notizen

- Die Weiterleitung der alten Domain ist auch für Besucher wichtig:
  Alte Links (Vereinsflyer, Google-Einträge, Verlinkungen anderer Vereine)
  landen dann sauber auf der Hauptdomain statt auf einem Duplikat.
- Nach der Umstellung prüfen, ob irgendwo noch Links auf
  `fcluebbecke.de` im eigenen Bestand existieren (Instagram-Bio,
  FUSSBALL.DE-Vereinsprofil, Google Business Profile) und dort die
  neue Domain eintragen.
- `/live` ist nur temporär aus der Sitemap (Spec-übergreifend beachten,
  wenn FCL LIVE wieder aktiviert wird).
