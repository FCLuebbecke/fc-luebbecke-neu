---
nummer: 005
titel: News-Bereich „Aktuelles“ (redaktionelle Beiträge + Instagram)
status: geplant
bereich: startseite
prio: hoch
angelegt: 2026-09-03
gestartet:
erledigt:
branch:
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
geschrieben und im Studio nur noch freigegeben.

## Ausgangslage

- Startseite (`src/pages/index.astro`): Hero → Sparten → `InstagramFeed`
  → Sponsoren → Mitglied werden. Es gibt keinen redaktionellen Inhalt.
- `InstagramFeed.astro` holt zur Build-Zeit die neuesten sechs Posts über
  Behold (`src/lib/instagram.ts`, Typ `InstagramPost` mit `timestamp`,
  `permalink`, `caption`, `sizes`, `mediaType`). Bilder werden selbst
  gehostet, kein Consent-Banner nötig. Handle und Profil-URL stehen noch mit
  TODO im Code.
- Sanity-Schemas liegen in `src/sanity/schemaTypes/`, Abfragen in
  `src/lib/sanity.ts`. Es gibt bisher keinen Slug- und keinen
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
│  │ Titelbild  │ │ Titelbild  │ │ Titelbild  │         │  Beiträge aus Sanity
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
legt sie als **Entwurf** in Sanity an; Freigabe und Foto im Studio, Publish
macht sie live (mit Spec 004 automatisch).

## Anforderungen

### Datenmodell (Sanity, Dokumenttyp `beitrag`)

- [ ] Felder: `titel` (Pflicht), `slug` (aus Titel, Pflicht, eindeutig),
      `datum` (Pflicht, Standard heute), `sparte` (Auswahl: fussball ·
      badminton · darts · verein; Pflicht), `teaser` (Text, max. ~200 Zeichen,
      Pflicht), `titelbild` (Bild mit Hotspot + Alt-Text, Pflicht für
      Veröffentlichung), `inhalt` (Rich Text: Absätze, Zwischenüberschrift,
      fett/kursiv, Links, Aufzählung, Bild mit Bildunterschrift),
      `galerie` (Liste von Bildern mit Alt-Text, optional),
      `autor` (Text, optional, z. B. „Jugendabteilung“).
- [ ] Studio-Vorschau: Titel + Datum + Sparte; Sortierung nach Datum
      absteigend als Standard.
- [ ] Validierung: kein Publish ohne Titelbild und Alt-Text (Barrierefreiheit,
      Vorschaubild).

### Startseite

- [ ] Neuer Abschnitt `Aktuelles` zwischen Sparten und Sponsoren, ersetzt
      die Position des heutigen `InstagramFeed` und enthält ihn als Ebene 2.
- [ ] Ebene 1: max. drei neueste veröffentlichte Beiträge als Karten (Bild
      16:9, Datum, Sparten-Etikett in abgestuftem Grün gemäß CLAUDE.md 8,
      Titel, Teaser, Link). Link „Alle Beiträge →“ zu `/aktuelles`.
- [ ] Ebene 2: `InstagramFeed` unverändert, mit Zwischenüberschrift
      „Frisch von Instagram“.
- [ ] Ohne Beiträge wird Ebene 1 samt Zwischenüberschrift nicht gerendert.

### Seite `/aktuelles`

- [ ] Alle veröffentlichten Beiträge und die (bis zu 12) neuesten
      Instagram-Posts in einem Strom, sortiert nach Datum absteigend.
- [ ] Beitragskarte: wie Startseite. Instagram-Kachel: quadratisches Bild,
      Instagram-Symbol, gekürzte Caption (2 Zeilen), Datum, Link mit ↗ in
      neuem Tab (`rel="noopener"`).
- [ ] Filterleiste (Fußball · Badminton · Darts · Verein · Instagram · Alle)
      als Links mit URL-Parameter `?sparte=` oder als Client-Filter ohne
      Reload; ohne JavaScript werden alle angezeigt.
- [ ] Keine Seitenaufteilung in dieser Spec; Grenze 60 Einträge, ältere
      erscheinen erst mit Spec „Archiv“. Hinweis am Ende der Liste, falls
      abgeschnitten.
- [ ] Menüpunkt **„Aktuelles“** im Header (zwischen „Start“ und „Fußball“)
      und im Footer.

### Detailseite `/aktuelles/<slug>`

- [ ] Statisch pro Beitrag gebaut (`getStaticPaths`).
- [ ] Aufbau: Sparten-Etikett, Titel (H1), Datum · Autor, Titelbild mit
      Bildunterschrift (Alt), Inhalt, Galerie (Raster, Klick öffnet Bild im
      nativen `<dialog>` wie in Spec 003), Zurück-Link, Teilen-Zeile
      (WhatsApp-Link `https://wa.me/?text=…`, Link kopieren).
- [ ] `Layout.astro` bekommt optionale Props `ogImage` und `ogType`
      („article“); Detailseite übergibt Titelbild 1200×630 aus Sanity.
- [ ] Zeilenlänge Fließtext max. ~70 Zeichen (CLAUDE.md 4), Bilder 16:9
      oder 4:3, leicht gerundet.

### Sparten-Seiten

- [ ] Auf `fussball/mannschaften.astro`, `badminton/mannschaften.astro`,
      `darts/mannschaften.astro` ein Block „Aktuelles aus der Sparte“ mit bis
      zu drei Beiträgen der jeweiligen Sparte und Link „Alle Beiträge →“.
      Ohne Beiträge wird der Block nicht gerendert.

### Redaktionsablauf „Claude schreibt“

- [ ] Du nennst im Chat die Fakten (Anlass, Ergebnis, Namen, Datum, ggf.
      Zitate). Claude formuliert Titel, Teaser und Text im Ton der Seite
      (bodenständig, klar, keine Superlative) und zeigt den Entwurf im Chat.
- [ ] Nach deinem „ok“ legt Claude den Beitrag als **Sanity-Entwurf** an
      (kein Publish). Werkzeug: kleines Skript `scripts/beitrag-anlegen.ts`,
      das über `@sanity/client` mit `SANITY_WRITE_TOKEN` aus `.env` ein
      `drafts.`-Dokument schreibt; Bilder aus einem lokalen Pfad werden mit
      hochgeladen, wenn du sie im Chat oder im Ordner `assets-src/news/`
      bereitstellst.
- [ ] Freigabe im Studio: Foto prüfen/ergänzen, Text ggf. anpassen,
      **Publish**. Mit Spec 004 ist der Beitrag nach 1–2 Minuten live.
- [ ] Rückfallweg ohne Token: Claude liefert den Beitrag als fertigen Text
      im Chat, du kopierst ihn ins Studio. (Token ist vorhanden, siehe M2.)

## Nicht Teil dieser Spec

- Seitenaufteilung / Archiv älterer Beiträge (Folge-Spec, wenn > 60 Beiträge).
- Kommentare, Newsletter, RSS-Feed, Suche.
- Automatisches Übernehmen von Instagram-Posts als Sanity-Beiträge.
- Umstellung auf serverseitiges Rendern; Beiträge sind wie alles andere
  statisch gebaut.
- Terminliste (CLAUDE.md 6.5) – bleibt separates Thema.

---

## ⚠️ Manuelle Schritte – müssen von dir gemacht werden

### M1 · Instagram-Handle bestätigen

In `src/components/InstagramFeed.astro` stehen Handle `@fcluebbecke` und
Profil-URL mit TODO. Bitte bestätigen oder korrigieren (Antwort im Chat
reicht: „Handle stimmt“ oder der richtige Handle).

### M2 · Sanity-Schreibtoken für Claude — ✅ erledigt (2026-09-03)

`SANITY_WRITE_TOKEN` ist lokal in `.env` gesetzt und funktioniert (Lese-Test
gegen die Sanity-API erfolgreich). Claude kann damit Entwürfe anlegen.
Kein weiterer Schritt nötig.

### M3 · Reihenfolge: Spec 004 zuerst? — ✅ erledigt

Spec 004 (Auto-Rebuild) ist eingerichtet. Neue Beiträge sind nach Publish
in 1–2 Minuten live.

### M4 · Abnahme (nach Umsetzung, 10 Minuten)

1. Claude legt einen Testbeitrag als Entwurf an (oder du im Studio).
2. Im Studio Titelbild setzen, Publish.
3. Startseite: Beitrag in Ebene 1 sichtbar, Instagram darunter unverändert.
4. `/aktuelles`: Beitrag und Instagram-Kacheln gemischt, Filter „Fußball“
   zeigt nur passende Einträge.
5. Detailseite öffnen, Link per WhatsApp an dich selbst schicken: Vorschau
   zeigt Titel und Titelbild.
6. Auf dem Handy: Karten stapeln, Galerie-Overlay öffnet und schließt.
7. Testbeitrag im Studio löschen (Unpublish + Delete).

---

## Umsetzung (Claude)

1. **Schema** `src/sanity/schemaTypes/beitrag.ts` anlegen und in `index.ts`
   registrieren; Rich Text als `array` of `block` + `image`.
2. **Abfragen** in `src/lib/sanity.ts`: `getBeitraege({ sparte?, limit })`,
   `getBeitrag(slug)`, `getBeitragSlugs()`; Typ `BeitragDoc`. Portable Text
   rendern mit `astro-portabletext` (klein, keine React-Abhängigkeit).
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
9. **Redaktionsskript** `scripts/beitrag-anlegen.ts` (Node, `@sanity/client`):
   Eingabe JSON/Markdown → Entwurf mit Slug, Bild-Upload optional.
   Dokumentation in `SANITY.md` (Abschnitt „Beiträge“).
10. **CLAUDE.md** Abschnitt 6.4 anpassen: „Aktuelles = Beiträge (Sanity) +
    Instagram“, Navigation um „Aktuelles“ ergänzen.
11. **Test:** Build, Screenshots Startseite/Strom/Detail (Desktop + 390 px),
    OG-Tags im Quelltext, Lighthouse-Kontrast der Sparten-Etiketten.

## Abnahme

- Startseite ohne Beiträge = heutiger Zustand; mit Beiträgen zwei Ebenen.
- `/aktuelles` mischt beide Quellen chronologisch, Instagram klar erkennbar,
  Filter funktioniert mit und ohne JavaScript (ohne JS: alle Einträge).
- Detailseite hat eigenes OG-Bild, Galerie-Overlay funktioniert per Tastatur.
- Claude kann aus Chat-Fakten einen Entwurf in Sanity anlegen; Publish im
  Studio genügt.
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
