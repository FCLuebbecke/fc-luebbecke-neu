# CLAUDE.md – FC Lübbecke Vereinswebseite

Arbeitsanweisung und Designsystem für den Bau der Webseite. Diese Datei ist die
verbindliche Referenz für Aufbau, Farben, Schrift und Inhalte. Im Zweifel gilt:
**bodenständig, klar, Fußball führt – aber alle Sparten gehören dazu.**

---

## 1. Projektüberblick

Vereinswebseite des **FC Lübbecke e.V.** (gegründet **1925**) mit vier Sportangeboten:

- **Fußball** – größte Sparte, mehrere Unterseiten, bereits gestaltet.
- **Badminton** – eine einzelne Seite.
- **Darts** – eine einzelne Seite.
- **Laufsport** – wird **extern** betrieben, nur als Link eingebunden (nicht nachbauen).

Grundstimmung: **traditionell & bodenständig**, Vereinsgefühl, echte Fotos statt
Stockbilder. Kein Hochglanz, keine verspielten Effekte.

---

## 2. Designprinzipien

1. **Bodenständig statt verspielt** – ruhige Flächen, kräftiges Grün, klare Kanten.
2. **Fußball führt, alle gehören dazu** – Fußball darf optisch dominieren, aber
   Badminton, Darts und Laufsport sind auf der Startseite immer sichtbar.
3. **Echtheit** – echte Vereinsfotos (Platz, Halle, Vereinsfeste).
4. **Klarheit vor Fülle** – wenige, gut gepflegte Seiten; alles in max. zwei Klicks.

---

## 3. Farben

Vereinsfarben **Grün/Weiß**. Regel **60–30–10**: ~60 % Weiß/Hell, ~30 % Grün,
~10 % Akzentgrün. Grünwerte am **echten Vereinslogo** verankert (gemessen ≈ `#087010`).

| Rolle        | Name        | HEX       | Verwendung                                          |
|--------------|-------------|-----------|-----------------------------------------------------|
| Hauptfarbe   | Tiefgrün    | `#0A5012` | Header, Footer, große Flächen                       |
| Logo-Grün    | Logo-Grün   | `#0A6E12` | Überschriften, Button-Füllung, Links                |
| Akzent       | Akzentgrün  | `#16A626` | Balken, Band, aktive Unterstreichung (nicht-Text)   |
| Fläche       | Hellgrün    | `#E7F3E8` | Hintergründe von Blöcken/Karten                     |
| Grund        | Weiß        | `#FFFFFF` | Grundhintergrund, Karten, Textflächen               |
| Text         | Anthrazit   | `#1A1A1A` | Fließtext, Überschriften auf hellem Grund           |
| Nebeninfo    | Grau        | `#555555` | Bildunterschriften, Hilfetexte                      |

> ✅ **Verankert am Logo.** Wichtig (Barrierefreiheit): Buttons mit weißer Schrift
> nutzen das Logo-Grün `#0A6E12` (Kontrast ~5,4:1, WCAG-AA ✓). Das helle Akzentgrün
> `#16A626` nur für nicht-textliche Elemente (Balken, Band, Unterstreichung).

---

## 4. Schriften

- **Überschriften:** `Oswald` (sportlich, kompakt). Alt. klassisch: `Merriweather`.
- **Fließtext:** `Source Sans 3` oder `Open Sans` (neutral, gut lesbar).
- Beides kostenlose Google Fonts.

| Element            | Desktop   | Mobil     |
|--------------------|-----------|-----------|
| H1                 | 40–48 px  | 28–32 px  |
| H2                 | 28–32 px  | 22–24 px  |
| H3                 | 20–22 px  | 18–20 px  |
| Fließtext          | 16–18 px  | 16 px     |
| Hinweise / klein   | 13–14 px  | 13 px     |

Zeilenabstand Fließtext ~1,6. Zeilenlänge max. ~70 Zeichen.

> ⚠️ **Anzupassen:** Schriftart an die fertige Fußball-Seite angleichen.

---

## 5. Navigation

Schlank, alle Sparten dauerhaft sichtbar. Nur Fußball hat ein Untermenü.

**Header:** Logo links · Menü mittig/rechts · Button „Mitglied werden“ rechts.
Mobil: Burger-Menü. Header bleibt beim Scrollen oben (sticky).

| Menüpunkt     | Inhalt / Verhalten                                      | Untermenü |
|---------------|---------------------------------------------------------|-----------|
| Start         | Startseite                                              | nein      |
| Fußball       | Mannschaften, Trainingszeiten, Spielplan …              | ja ▾      |
| Badminton     | Eine einzelne Seite                                     | nein      |
| Darts         | Eine einzelne Seite                                     | nein      |
| Laufsport ↗   | Externer Link, **neues Fenster**                        | extern    |
| Verein        | Über uns, Vorstand, Geschichte, Beitritt                | optional  |
| Kontakt       | Anschrift, Ansprechpartner, Karte                       | nein      |

- **Laufsport:** immer mit ↗ kennzeichnen, in neuem Tab öffnen.
- **Aktiver Menüpunkt:** in Akzentgrün (`#4CAF50`) unterstrichen.

---

## 6. Startseite (Reihenfolge von oben nach unten)

1. **Kopfzeile** – Logo, Navigation, „Mitglied werden“ (sticky).
2. **Bühne (Hero)** – großes Fußballfoto, Vereinsname, warmer Claim
   (z. B. „Unser Verein. Unser Lübbecke.“), Hauptbutton („Komm zum Probetraining“).
3. **Unsere Sparten** *(Schlüsselbereich – steht bewusst weit oben):*
    - **Fußball:** große Karte über volle Breite, Foto + Button „Zur Fußball-Abteilung“.
    - **Badminton · Darts · Laufsport ↗:** drei gleich große Karten darunter.
      Laufsport-Karte mit ↗, führt nach außen.
4. **Aktuelles via Instagram** – statt selten gepflegter News der Live-Feed des
   Fußball-Instagram-Accounts. **DSGVO: 2-Klick-Lösung** – Instagram lädt erst nach
   aktiver Zustimmung (Einwilligung wird gemerkt). Feed-Widget extern (z. B.
   LightWidget). Zusätzlich „Auf Instagram folgen"-Button.
5. **Nächste Termine** – kompakte Liste (Datum, Gegner/Anlass, Ort, Uhrzeit).
6. **Mitglied werden** – grüner Block über volle Breite mit Button.
7. **Fußzeile (Footer):**
    - Spalte 1: Logo + kurzer Vereinssatz
    - Spalte 2: alle Sparten als Textlinks (inkl. Laufsport ↗)
    - Spalte 3: Kontakt & Anschrift
    - Spalte 4: Social Media
    - Unterste Zeile: **Impressum · Datenschutz** (Pflicht)

**Kernregel:** Fußball oben groß, die anderen drei gleichwertig in einer eigenen
Reihe darunter – so dominiert Fußball, ohne die kleineren Sparten zurückzusetzen.

---

## 7. Sparten-Seiten

### 7.1 Fußball (mehrere Unterseiten – bereits gestaltet)
- Übersicht / Mannschaften
- Herren (1. / 2. Mannschaft, je nach Bestand)
- Jugend
- Trainingszeiten
- Spielplan & Ergebnisse

### 7.2 Badminton (eine Seite)
- Kurzvorstellung · Trainingszeiten + Ort (Halle) · Ansprechpartner · Fotos ·
  Hinweis Schnuppertraining

### 7.3 Darts (eine Seite)
- Gleiche Vorlage wie Badminton: Kurzvorstellung · Zeiten + Treffpunkt ·
  Ansprechpartner · Fotos · Einladung zum Mitmachen

> Badminton und Darts dieselbe Seitenvorlage geben (einheitlich, weniger Pflege).

### 7.4 Laufsport (extern)
- Nicht nachbauen. Nur verlinken – an **drei** Stellen mit ↗:
  Navigation, Sparten-Block, Footer. Öffnet in neuem Tab.

---

## 8. Wiederkehrende Bausteine

- **Karten:** weißer Grund, dezenter Schatten, Ecken 8–12 px, Foto oben, Titel,
  kurzer Text, Button.
- **Buttons:** Primär = gefülltes Grün, weiße Schrift; Sekundär = grüner Rahmen,
  grüne Schrift. Hover: leicht abdunkeln.
- **Sparten-Etiketten:** kleine farbige Labels (abgestufte Grüntöne) zur Orientierung.
- **Abschnittstitel:** kurzer grüner Strich/Balken links neben dem Titel.
- **Bilder:** einheitliches Seitenverhältnis (16:9 oder 4:3), leicht abgerundet.
  Optional dezenter Grün-Schleier auf dem Hero für besseren Textkontrast.

---

## 9. Mobil & Zugänglichkeit

- **Mobil zuerst** – Karten stapeln untereinander, Menü wird Burger.
- **Lesbarkeit** – Fließtext nie unter 16 px, ausreichender Kontrast.
- **Tippflächen** – Buttons/Links mind. ~44 px hoch.
- **Alt-Texte** – alle Fotos mit Bildbeschreibung (Barrierefreiheit + SEO).

---

## 10. Pflichtseiten (rechtlich)

- **Impressum** – Vereinsangaben, Vertretungsberechtigte, Registereintrag.
- **Datenschutzerklärung (DSGVO)** – v. a. bei Kontaktformular, Karte, Einbindungen.
- **Cookie-/Einwilligungshinweis** – bei Tracking oder externen Einbindungen.

Impressum + Datenschutz dauerhaft in den Footer. Im Zweifel rechtlichen Rat einholen.

---

## 11. Nächste Schritte

1. ✅ Farben am echten Vereinslogo verankert (siehe Abschnitt 3). Schrift bleibt Oswald + Source Sans 3.
2. Inhalte je Sparte sammeln: Trainingszeiten, Ansprechpartner, 1–2 gute Fotos.
3. Startseite nach Abschnitt 6 bauen, besonders den Sparten-Block.
4. Badminton- und Darts-Seite mit derselben Vorlage anlegen.
5. Laufsport an drei Stellen verlinken (Navigation, Sparten-Block, Footer).
6. Impressum & Datenschutz ergänzen, dann auf dem Handy testen.

---

*FC Lübbecke – ein Verein, vier Sparten, ein gemeinsamer Auftritt.*