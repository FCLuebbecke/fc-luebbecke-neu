---
modules: inhalte, seiten, mcp
branch: spec/007-news-aktuelles
owner: FC Luebbecke <Git@fcluebbecke.de>
station: Doing
ready: true
needs_human: true
nummer: 007
titel: News-Bereich „Aktuelles“ (redaktionelle Beiträge + Instagram)
status: in-arbeit
bereich: startseite
prio: hoch
angelegt: 2026-09-03
gestartet: 2026-11-01
erledigt:
commit:
verantwortlich:
---

# News-Bereich „Aktuelles“

## Ziel

Der Verein kann eigene Nachrichten veröffentlichen (Spielberichte, Termine,
Vereinsleben, Ehrungen), die auf der Startseite, auf einer eigenen Seite
`/aktuelles` und auf den Sparten-Seiten erscheinen. Der bestehende
Instagram-Bereich bleibt erhalten und wird mit den Beiträgen zu einem
gemeinsamen „Aktuelles“ verbunden. Beiträge werden von Claude auf Zuruf
geschrieben und im Chat freigegeben (UC-001, Spec 010).

> **Änderung 2026-11-01:** Sanity entfällt (Spec 008). Beiträge sind
> Markdown-Dateien in der Content Collection `beitraege`, angelegt über den
> MCP-Server (Spec 010) mit Live-Vorschau (Spec 009). Abschnitte unten sind
> entsprechend angepasst. Abhängigkeit: Spec 008 zuerst.

## Ausgangslage

- Startseite (`src/pages/index.astro`): Hero → Sparten → `InstagramFeed`
  → Sponsoren → Mitglied werden. Es gibt keinen redaktionellen Inhalt.
- `InstagramFeed.astro` holt zur Build-Zeit die neuesten sechs Posts über
  Behold (`src/lib/instagram.ts`, Typ `InstagramPost` mit `timestamp`,
  `permalink`, `caption`, `sizes`, `mediaType`). Bilder werden selbst
  gehostet, kein Consent-Banner nötig. Handle und Profil-URL stehen noch mit
  TODO im Code.
- Nach Spec 008 liegen Inhalte als Content Collections unter `src/content/`,
  Zugriff über `src/lib/inhalte.ts`. Es gibt bisher keinen Slug- und keinen
  Rich-Text-Typ im Projekt.
- `Layout.astro` setzt Open-Graph-Metadaten, aber mit festem `og-image.jpg`;
  ein Bild pro Seite ist nicht vorgesehen.
- Die Sparten haben keine Einstiegsseite `index.astro`; Einstieg ist jeweils
  `mannschaften.astro` mit `SparteHeader`.
- Die CLAUDE.md (Abschnitt 6.4) hatte News bewusst durch Instagram ersetzt.
  Diese Spec hebt das auf: Instagram bleibt, wird aber ergänzt.

## Konzept (abgestimmt am 2026-09-03)

**Startseite – ein Block „Aktuelles“ mit zwei Ebenen**

```
┌─ Aktuelles ──────────────────────────────────────────┐
│  ┌────────────┐ ┌────────────┐ ┌────────────┐         │  Ebene 1: bis zu 3 neueste
│  │ Titelbild  │ │ Titelbild  │ │ Titelbild  │         │  Beiträge (Dateien)  
│  │ 12.09. Fußb│ │ 05.09. Vere│ │ 01.09. Dart│         │  (Bild, Datum, Sparten-Label,
│  │ Titel      │ │ Titel      │ │ Titel      │         │   Titel, Teaser, „Weiterlesen“)
│  └────────────┘ └────────────┘ └────────────┘         │
│                                    Alle Beiträge →    │
│  Frisch von Instagram                                 │  Ebene 2: bestehendes
│  ▣ ▣ ▣ ▣ ▣ ▣                                          │  Raster, unverändert
│                                 Auf Instagram folgen  │
└───────────────────────────────────────────────────────┘
```

Ohne Beiträge entfällt Ebene 1, der Block sieht aus wie heute.

**`/aktuelles` – gemeinsamer Strom.** Redaktionelle Beiträge als große
Karten, Instagram-Posts als kleinere, mit Instagram-Symbol gekennzeichnete
Kacheln (Link nach außen), zusammen chronologisch sortiert. Filter nach
Sparte (Fußball · Badminton · Darts · Verein · Instagram).

**`/aktuelles/<slug>` – Detailseite** mit Volltext, Titelbild, Galerie,
eigenem Vorschaubild für WhatsApp & Co.

**Sparten-Seiten** zeigen „Aktuelles aus der Sparte“ mit den letzten drei
Beiträgen ihrer Sparte (nur redaktionell, kein Instagram).

**Redaktion:** Claude schreibt die Beiträge auf Zuruf (Fakten im Chat),
legt sie über den MCP-Server im Entwurf an; die Vorschau neben dem Chat zeigt
den Beitrag sofort, „veröffentlichen“ im Chat macht ihn live (UC-001).

## Anforderungen

### Datenmodell (Content Collection `beitraege`, Markdown + Frontmatter)

- [x] Felder: `titel` (Pflicht), `slug` (aus Titel, Pflicht, eindeutig),
      (umgesetzt: Slug = Dateiname/ID, Decision 6)
      `datum` (Pflicht, Standard heute), `sparte` (Auswahl: fussball ·
      badminton · darts · verein; Pflicht), `teaser` (Text, max. ~200 Zeichen,
      Pflicht), `titelbild` (Bild mit Hotspot + Alt-Text, Pflicht für
      Veröffentlichung), `inhalt` (Rich Text: Absätze, Zwischenüberschrift,
      fett/kursiv, Links, Aufzählung, Bild mit Bildunterschrift),
      `galerie` (Liste von Bildern mit Alt-Text, optional),
      `autor` (Text, optional, z. B. „Jugendabteilung“).
- [x] `inhalt` ist der Markdown-Text der Datei (statt Rich Text); Bilder im
      Text als Markdown-Bild mit Alt-Text, Dateien unter
      `src/assets/content/beitraege/`. `slug` = Dateiname.
- [x] Validierung: kein Publish ohne Titelbild und Alt-Text (Barrierefreiheit,
      Vorschaubild).

### Startseite

- [x] Neuer Abschnitt `Aktuelles` zwischen Sparten und Sponsoren, ersetzt
      die Position des heutigen `InstagramFeed` und enthält ihn als Ebene 2.
- [x] Ebene 1: max. drei neueste veröffentlichte Beiträge als Karten (Bild
      16:9, Datum, Sparten-Etikett in abgestuftem Grün gemäß CLAUDE.md 8,
      Titel, Teaser, Link). Link „Alle Beiträge →“ zu `/aktuelles`.
- [x] Ebene 2: `InstagramFeed` unverändert, mit Zwischenüberschrift
      „Frisch von Instagram“.
- [x] Ohne Beiträge wird Ebene 1 samt Zwischenüberschrift nicht gerendert.

### Seite `/aktuelles`

- [x] Alle veröffentlichten Beiträge und die (bis zu 12) neuesten
      Instagram-Posts in einem Strom, sortiert nach Datum absteigend.
- [x] Beitragskarte: wie Startseite. Instagram-Kachel: quadratisches Bild,
      Instagram-Symbol, gekürzte Caption (2 Zeilen), Datum, Link mit ↗ in
      neuem Tab (`rel="noopener"`).
- [x] Filterleiste (Fußball · Badminton · Darts · Verein · Instagram · Alle)
      als Links mit URL-Parameter `?sparte=` oder als Client-Filter ohne
      Reload; ohne JavaScript werden alle angezeigt.
- [x] Keine Seitenaufteilung in dieser Spec; Grenze 60 Einträge, ältere
      erscheinen erst mit Spec „Archiv“. Hinweis am Ende der Liste, falls
      abgeschnitten.
- [x] Menüpunkt **„Aktuelles“** im Header (zwischen „Start“ und „Fußball“)
      und im Footer.

### Detailseite `/aktuelles/<slug>`

- [x] Statisch pro Beitrag gebaut (`getStaticPaths`).
- [x] Aufbau: Sparten-Etikett, Titel (H1), Datum · Autor, Titelbild mit
      Bildunterschrift (Alt), Inhalt, Galerie (Raster, Klick öffnet Bild im
      nativen `<dialog>` wie in Spec 003), Zurück-Link, Teilen-Zeile
      (WhatsApp-Link `https://wa.me/?text=…`, Link kopieren).
- [x] `Layout.astro` bekommt optionale Props `ogImage` und `ogType`
      („article“); Detailseite übergibt Titelbild 1200×630 (Astro-Bildoptimierung).
- [x] Zeilenlänge Fließtext max. ~70 Zeichen (CLAUDE.md 4), Bilder 16:9
      oder 4:3, leicht gerundet.

### Sparten-Seiten

- [x] Auf `fussball/mannschaften.astro`, `badminton/mannschaften.astro`,
      `darts/mannschaften.astro` ein Block „Aktuelles aus der Sparte“ mit bis
      zu drei Beiträgen der jeweiligen Sparte und Link „Alle Beiträge →“.
      Ohne Beiträge wird der Block nicht gerendert.

### Redaktionsablauf „Claude schreibt“

- [x] Du nennst im Chat die Fakten (Anlass, Ergebnis, Namen, Datum, ggf.
      Zitate). Claude formuliert Titel, Teaser und Text im Ton der Seite
      (bodenständig, klar, keine Superlative) und zeigt den Entwurf im Chat.
- [x] Nach deinem „ok“ legt Claude den Beitrag über den MCP-Server im
      Entwurf an (Markdown-Datei in `src/content/beitraege/`, Fotos aus dem
      Chat über `bild_hochladen`). Die Vorschau neben dem Chat zeigt ihn sofort.
- [x] Freigabe im Chat: Text/Foto per Chat nachbessern, dann
      „veröffentlichen“. Der Beitrag ist nach 1–2 Minuten live.
- [x] Rückfallweg, solange Spec 009/010 nicht stehen: Claude legt die
      (entfällt: 009/010 sind live)
      Markdown-Datei auf einem Branch an, Veröffentlichung per Merge.

## Nicht Teil dieser Spec

- Seitenaufteilung / Archiv älterer Beiträge (Folge-Spec, wenn > 60 Beiträge).
- Kommentare, Newsletter, RSS-Feed, Suche.
- Automatisches Übernehmen von Instagram-Posts als Beiträge.
- Umstellung auf serverseitiges Rendern; Beiträge sind wie alles andere
  statisch gebaut.
- Terminliste (CLAUDE.md 6.5) – bleibt separates Thema.


## Decisions

1. 2026-11-01 · Beiträge als **JSON-Dateien mit Markdown-Feld `inhalt`**
   (Sammlung `beitraege`) statt Markdown-Dateien. So schreibt der MCP-Server
   (Spec 010) Beiträge genauso wie alle anderen Inhalte – ein Schreibweg, eine
   Prüfung. Gerendert wird das Markdown beim Build; HTML im Text wird nicht
   übernommen.
2. 2026-11-01 · Titelbild ist im Schema **optional**, weil der MCP-Server
   Bilder erst nach dem Anlegen setzt (`bild_hochladen`). Stattdessen verweigert
   `veroeffentlichen` das Live-Stellen, solange ein geänderter Beitrag kein
   Titelbild hat. Die Seite zeigt ohne Titelbild eine grüne Fläche mit
   Sparten-Symbol.
3. 2026-11-01 · Galerie: `bild_hochladen` hängt mit `feld: "galerie"` ein Bild
   an; entfernen/umsortieren/Alt-Text ändern über `entwurf_aendern`.
4. 2026-11-01 · `datum` als Text `JJJJ-MM-TT` (eindeutig für MCP und Build).
5. 2026-11-01 · Filter auf `/aktuelles` als Client-Filter mit Schaltflächen;
   `?sparte=` in der Adresse wird beim Laden übernommen. Ohne JavaScript
   erscheinen alle Einträge.
6. 2026-11-01 · Kein eigenes Feld `slug`: Die Adresse ist der Dateiname
   (ID), z. B. `src/content/beitraege/saisonstart-2026.json` →
   `/aktuelles/saisonstart-2026/`. Der MCP-Server bildet ihn beim Anlegen aus
   dem Titel. Eindeutig ist er, weil zwei Dateien nicht gleich heißen können.
7. 2026-11-01 · Beim Bauen fiel auf: Seit Spec 008 erschienen Fotos zu hoch
   (fehlendes `img { height: auto }`). Behoben als eigener Hotfix-Branch
   `spec/008-fix-bildhoehe` (live unabhängig von dieser Spec), hier ebenfalls
   enthalten.
8. 2026-11-01 · Astro-Fehler gefunden: Wird der **letzte** Eintrag einer
   Sammlung gelöscht, behält Astro ihn im Inhalts-Cache
   (`node_modules/.astro/data-store.json`) und baut ihn weiter. Da Vercel den
   Build-Cache wiederverwendet, könnte ein gelöschter Beitrag live bleiben.
   Abhilfe: `npm run build` löscht diesen Cache vorher (Bild-Cache bleibt),
   `vercel.json` setzt `buildCommand: npm run build`.


## Verification

- `npm run build`: grün, ohne und mit Beiträgen. Ohne Beiträge sieht die
  Startseite aus wie vorher (nur Instagram, Titel „Aktuelles auf
  Instagram“); Astro meldet die leere Sammlung als Warnung.
- Mit zwei lokalen Testbeiträgen (nicht committet; einer mit Titelbild,
  Galerie, Markdown inkl. `<script>`, einer „Verein“ ohne Bild):
  - Startseite: Block „Aktuelles“ mit Karten, darunter „Frisch von
    Instagram“; Fußball-Mannschaften zeigt „Aktuelles aus dem Fußball“,
    Darts keinen Block (kein Darts-Beitrag).
  - `/aktuelles`: Beiträge groß, 6–7 Instagram-Kacheln (≤ 90 Tage) mit ↗.
    Filter im Browser (Chrome headless): `?sparte=verein` zeigt nur Verein,
    „Instagram“ nur Kacheln, „Darts“ den Leer-Hinweis; Adresse wird
    mitgeführt. Ohne JavaScript ist die Leiste verborgen, alles sichtbar.
  - Detailseite: `og:type=article`, eigenes `og:image` 1200×630,
    `<script>` aus dem Text erscheint als Text (escaped), externer Link mit
    `target=_blank rel=noopener`, Galerie mit 2 Bildern (Dialog).
  - Screenshots Desktop (1280 px) und Handy (390 px, Geräte-Emulation): kein
    seitliches Scrollen, Filterknöpfe umbrechen, Karten stapeln, Bilder 16:9
    bzw. 4:3.
- `npm run test:mcp`: 21 Tests grün, darunter neu: Beitrag anlegen →
  Veröffentlichen ohne Titelbild abgelehnt → Titelbild + zwei Galeriebilder →
  fremdes Bild in der Galerie abgelehnt → Galeriebild entfernen löscht die
  Datei → Veröffentlichen klappt; Regeln für Datum, Sparte, Teaser-Länge.
- Löschen: zwei Beiträge gebaut, einen gelöscht → korrekt entfernt; den
  letzten gelöscht → blieb ohne Abhilfe als Seite erhalten (Astro-Cache),
  mit dem neuen `build`-Skript entfernt (Decision 8).
- Nicht geprüft: echter Beitrag über Private AI (siehe Review), Teilen per
  WhatsApp auf dem Handy.

## Review

Build: Vercel-Vorschau des Branches `spec/007-news-aktuelles`, danach live
Not part of this acceptance: Archiv/Seitenaufteilung (> 60 Einträge)

### R1 · Beitrag per Chat anlegen
- Given: Private AI ist mit dem MCP-Server verbunden (nach dem Livegang)
- When: du Fakten für einen Beitrag nennst, den Vorschlag bestätigst und ein Foto schickst
- Then: Private AI legt den Beitrag an, setzt das Titelbild; die Vorschau zeigt ihn auf der Startseite und unter /aktuelles
- [ ] ok

### R2 · Ohne Titelbild nicht live
- Given: ein Beitrag ohne Titelbild liegt im Entwurf
- When: du „veröffentlichen“ sagst
- Then: Private AI lehnt ab und bittet um ein Titelbild
- [ ] ok

### R3 · Aktuelles-Seite und Filter
- Given: mindestens ein Beitrag ist live
- When: du /aktuelles öffnest und „Fußball“ bzw. „Instagram“ wählst
- Then: Beiträge und Instagram-Kacheln erscheinen gemischt nach Datum, der Filter zeigt nur Passendes
- [ ] ok

### R4 · Teilen und Handy
- Given: eine Detailseite mit Titelbild
- When: du den Link per WhatsApp an dich selbst schickst und die Seite auf dem Handy öffnest
- Then: die Vorschau zeigt Titel und Titelbild; Karten stapeln, die Galerie öffnet und schließt
- [ ] ok

---

## ⚠️ Manuelle Schritte – müssen von dir gemacht werden

### M1 · Instagram-Handle bestätigen

In `src/components/InstagramFeed.astro` stehen Handle `@fcluebbecke` und
Profil-URL mit TODO. Bitte bestätigen oder korrigieren (Antwort im Chat
reicht: „Handle stimmt“ oder der richtige Handle).

### M2 · ~~Sanity-Schreibtoken~~ — entfällt (2026-11-01, Sanity wird in Spec 008 abgelöst)

### M3 · Reihenfolge — neu: Spec 008 zuerst

Beiträge setzen die Content Collections aus Spec 008 voraus. Für das Anlegen
per Chat mit Vorschau zusätzlich Spec 009 und 010.

### M4 · Abnahme (nach Umsetzung, 10 Minuten)

1. Testbeitrag per Chat anlegen (oder Claude auf einem Branch), mit Titelbild.
2. In der Vorschau prüfen, dann veröffentlichen.
3. Startseite: Beitrag in Ebene 1 sichtbar, Instagram darunter unverändert.
4. `/aktuelles`: Beitrag und Instagram-Kacheln gemischt, Filter „Fußball“
   zeigt nur passende Einträge.
5. Detailseite öffnen, Link per WhatsApp an dich selbst schicken: Vorschau
   zeigt Titel und Titelbild.
6. Auf dem Handy: Karten stapeln, Galerie-Overlay öffnet und schließt.
7. Testbeitrag per Chat löschen und veröffentlichen.

---

## Umsetzung (Claude)

1. **Schema** Collection `beitraege` in `src/content.config.ts` (Zod, `image()`
   für Titelbild/Galerie mit Pflicht-Alt-Text).
2. **Abfragen** in `src/lib/inhalte.ts`: `getBeitraege({ sparte?, limit })`,
   `getBeitrag(slug)`; Rendern mit `render()` aus `astro:content`.
3. **Komponenten:** `BeitragKarte.astro` (Startseite, Liste, Sparten-Block),
   `InstagramKachel.astro` (Strom), `Aktuelles.astro` (Startseiten-Block mit
   beiden Ebenen, nutzt `InstagramFeed`), `SparteAktuelles.astro`.
4. **Seiten:** `src/pages/aktuelles/index.astro` (Strom + Filter),
   `src/pages/aktuelles/[slug].astro` (Detail, `getStaticPaths`).
5. **Layout:** Props `ogImage`, `ogType` in `Layout.astro`, Fallback bleibt
   `og-image.jpg`.
6. **Navigation:** Header (Desktop + Burger) und Footer um „Aktuelles“
   ergänzen; aktiver Zustand für `/aktuelles*`.
7. **Startseite:** `InstagramFeed` durch `Aktuelles` ersetzen.
8. **Sparten:** `SparteAktuelles` in die drei `mannschaften.astro` einbauen.
9. **Redaktion:** kein eigenes Skript; Beiträge entstehen über den
   MCP-Server (Spec 010, `entwurf_anlegen` für `beitraege`). Bis Spec 010
   steht, legt Claude die Markdown-Datei auf einem Branch an.
   Dokumentation in `INHALTE.md` (Abschnitt „Beiträge“).
10. **CLAUDE.md** Abschnitt 6.4 anpassen: „Aktuelles = Beiträge (Dateien) +
    Instagram“, Navigation um „Aktuelles“ ergänzen.
11. **Test:** Build, Screenshots Startseite/Strom/Detail (Desktop + 390 px),
    OG-Tags im Quelltext, Lighthouse-Kontrast der Sparten-Etiketten.

## Abnahme

- Startseite ohne Beiträge = heutiger Zustand; mit Beiträgen zwei Ebenen.
- `/aktuelles` mischt beide Quellen chronologisch, Instagram klar erkennbar,
  Filter funktioniert mit und ohne JavaScript (ohne JS: alle Einträge).
- Detailseite hat eigenes OG-Bild, Galerie-Overlay funktioniert per Tastatur.
- Ein Beitrag lässt sich per Chat anlegen, erscheint sofort in der Vorschau
  und nach „veröffentlichen“ live (sobald Spec 009/010 umgesetzt sind).
- Menüpunkt „Aktuelles“ in Header, Burger-Menü und Footer.
- Mobil ohne horizontales Scrollen; Tippflächen ≥ 44 px.

## Notizen

- Ton der Beiträge: bodenständig, wir-Form („Unsere Erste …“), kurze Sätze,
  Namen nur mit Einverständnis (bei Jugend: Vornamen oder gar keine Namen,
  Fotos von Kindern nur mit Einwilligung der Eltern – siehe Spec 002-Notiz).
- Sparten-Etiketten: Fußball Logo-Grün, Badminton Akzentgrün, Darts Tiefgrün,
  Verein Hellgrün mit dunkler Schrift; exakte Werte bei Umsetzung prüfen
  (Kontrast ≥ 4,5:1).
- Instagram im Strom: nur Posts der letzten 90 Tage, damit alte Posts nicht
  zwischen aktuellen Beiträgen auftauchen.
