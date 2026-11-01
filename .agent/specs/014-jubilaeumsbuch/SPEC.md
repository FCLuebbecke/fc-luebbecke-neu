---
modules: seiten, inhalte
station: Doing
ready: true
branch: spec/014-jubilaeumsbuch
owner: FC Luebbecke <Git@fcluebbecke.de>
order: 1
needs_human: true
open_question: Q1
angelegt: 2026-11-01
usecase: UC-002
---

# Jubiläumsbuch „100 Jahre FC Lübbecke“ auf der Webseite

## Why

Zum 100-jährigen Bestehen (1925–2025) gibt es ein gedrucktes Jubiläumsbuch
(116 Seiten, 21 × 21 cm). Es soll auf der Webseite vorgestellt werden, mit
Leseprobe und einer einfachen Bestellmöglichkeit (UC-002).

## What

- Neue Seite `/100-jahre`: Bühne mit Cover und Preis, Kapitelübersicht,
  Leseprobe (10 Seiten als Galerie mit Großansicht), Bestellblock, Fragen-Block.
- Bestellformular (Name, Anzahl, Lieferart Abholung/Versand, Adresse bei
  Versand, Telefon optional) füllt eine E-Mail an `kontakt@fcluebbecke.de`
  vor, Betreff „Bestellung Jubiläumsbuch“. Kein Server, kein Maildienst.
- Verlinkung: Fußball-Untermenü, Footer (Spalte Verein), Teaser auf der
  Startseite nach „Aktuelles“.
- Buchdaten zentral in `src/data/jubilaeumsbuch.ts` (Preis, lieferbar,
  Leseprobe-Seiten); `lieferbar: false` zeigt „Leider vergriffen“.

Nicht enthalten: Online-Zahlung, E-Book, Bestätigungsmail, Pflege des
Preises/Bestands per Private AI (MCP), Rechtstexte für Versandhandel.

## Acceptance

- Wenn ich auf der Startseite bin, dann sehe ich einen Teaser zum
  Jubiläumsbuch, der zu `/100-jahre` führt.
- Wenn ich das Fußball-Untermenü oder den Footer öffne, dann finde ich
  „100 Jahre FCL – Jubiläumsbuch“.
- Wenn ich auf eine Leseprobe-Seite tippe, dann öffnet sich die Großansicht;
  ich kann blättern (Pfeile, Tastatur, Wischen) und schließen.
- Wenn ich das Formular vollständig ausfülle und absende, dann öffnet sich
  mein Mailprogramm mit einer fertigen Bestellung an `kontakt@fcluebbecke.de`.
- Wenn ich ein Pflichtfeld leer lasse, dann wird es markiert und keine Mail
  geöffnet; die Lieferadresse ist nur bei „Versand“ sichtbar und Pflicht.
- Wenn `lieferbar` auf `false` steht, dann steht statt Bestellbutton und
  Formular „Leider vergriffen“.
- Der Build dauert höchstens wenige Sekunden länger als vorher; im
  Repository liegt kein PDF des Buchs.

## Decisions

1. 2026-11-01 · Preis **19,25 €** (Vorgabe Peter, Anspielung aufs Gründungsjahr).
2. 2026-11-01 · Navigation: Menüpunkt „Verein“ existiert nicht mehr →
   Eintrag im Fußball-Untermenü + Footer + Startseiten-Teaser. URL `/100-jahre`.
3. 2026-11-01 · Bestellweg Version 1: Formular füllt eine Mail vor (mailto) –
   kein Maildienst, kein Schlüssel, keine Datenverarbeitung auf der Seite.
   Abweichung von UC-002: keine automatische Bestätigungsmail (Fehlerfall F2
   entfällt, Ausweg „Schreib uns direkt“ bleibt).
4. 2026-11-01 · Leseprobe als Bilder-Galerie statt PDF (UC-002 sieht PDF
   extern vor): keine externe Ablage nötig, schneller auf dem Handy.
   Seiten 1, 2, 3, 10, 30, 40, 62, 94, 102, 108 – Seiten mit aktuellen
   Jugendfotos (80–88) bewusst ausgelassen.
5. 2026-11-01 · Build-Zeit-Vorgabe: Bilder einmalig mit `pdftoppm` + `sharp`
   als WebP (1200 px / 480 px, zusammen 1,5 MB) unter
   `public/jubilaeumsbuch/` – keine Bildverarbeitung beim Build.
6. 2026-11-01 · Buchdaten in `src/data/` (nicht `src/content/`), daher noch
   nicht per Private AI pflegbar. Bei Bedarf eigene Spec.

## Tasks

- [x] Leseprobe-Seiten auswählen und als WebP erzeugen (`public/jubilaeumsbuch/`)
- [x] Buchdaten `src/data/jubilaeumsbuch.ts`
- [x] Seite `src/pages/100-jahre.astro` (Bühne, Kapitel, Leseprobe, Bestellen, Fragen)
- [x] Großansicht mit Blättern (Pfeile, Tastatur, Wischen), ohne Abhängigkeit
- [x] Bestellformular → vorausgefüllte Mail, Pflichtfeldprüfung
- [x] Fußball-Untermenü, Footer, Startseiten-Teaser (`JubilaeumTeaser.astro`)
- [x] Build und Build-Zeit vorher/nachher messen
- [x] Screenshots Desktop prüfen
- [x] (added) Lieferadresse war trotz `hidden` sichtbar (`display:grid` überschrieb `hidden`) → `.jb-feld[hidden]{display:none}`

## Verification

- `npm run build` vorher (main 14ca19c): 15 Seiten, 5,2 s gesamt.
  Nachher ohne Cache (`node_modules/.astro` gelöscht): 16 Seiten, 4,8 s
  gesamt → keine Verlängerung. Warnung „collection beitraege … empty“
  bestand schon vorher (leerer Ordner im Checkout), nicht Teil dieser Spec.
- `dist/100-jahre/index.html` erzeugt, in `sitemap-0.xml` enthalten;
  Startseite enthält Teaser und Footer-Link.
- Headless-Chrome-Screenshot Desktop 1280 px: Bühne, Kapitel, Galerie
  (5 Spalten), Formular, Fragen-Block korrekt; dabei Adressfeld-Fehler
  gefunden und behoben (Regel im Build-CSS geprüft).
- Mobil-Screenshot nicht aussagekräftig: Headless Chrome rendert breiter als
  390 px – bestehende Seite „Mitglied werden“ zeigt denselben Effekt.
  → Prüfung auf dem echten Handy im Review.
- Kein PDF im Repository: `public/jubilaeumsbuch/` enthält nur 20 WebP-Dateien.
- Nicht automatisch getestet: Großansicht und Mail-Erzeugung (kein
  Browser-Testwerkzeug im Projekt) → Review.

## Review

Build: Vercel-Vorschau des Branches spec/014-jubilaeumsbuch
Not part of this acceptance: Rechtstexte (Widerruf/AGB) für Versand – siehe Questions

### R1 · Seite und Verlinkung
- Given: Vercel-Vorschau ist geöffnet
- When: du die Startseite ansiehst, das Fußball-Untermenü und den Footer öffnest
- Then: Teaser, Menüeintrag und Footer-Link führen zu `/100-jahre`; Preis 19,25 €, Texte stimmen
- [ ] ok

### R2 · Leseprobe
- Given: Seite `/100-jahre` auf dem Handy
- When: du auf eine Seite der Leseprobe tippst, wischst und schließt
- Then: Großansicht ist lesbar, Blättern und Schließen funktionieren; die Auswahl der 10 Seiten ist in Ordnung (Bildrechte)
- [ ] ok

### R3 · Bestellung
- Given: Seite `/100-jahre`, Abschnitt „Buch bestellen“
- When: du einmal leer absendest, dann „Versand“ wählst, alles ausfüllst und absendest
- Then: erst Fehlermeldung mit markierten Feldern; dann öffnet sich dein Mailprogramm mit Betreff „Bestellung Jubiläumsbuch“ an kontakt@fcluebbecke.de, Summe und Adresse stehen drin
- [ ] ok

### R4 · Handy-Darstellung
- Given: Seite `/100-jahre` auf dem Handy
- When: du von oben nach unten scrollst
- Then: nichts ist abgeschnitten, kein seitliches Scrollen, Knöpfe gut antippbar
- [ ] ok

## Questions

### Q1 · open · 2026-11-01T18:10:00Z
Bei Versand an Privatpersonen gelten für den Verein ggf. Fernabsatzregeln
(Widerrufsbelehrung, Angaben zu Versandkosten). Soll Versand in Version 1
angeboten bleiben (dann Rechtstext klären) oder erst nur Abholung?
