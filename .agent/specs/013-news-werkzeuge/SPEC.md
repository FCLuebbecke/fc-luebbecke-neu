---
modules: mcp
station: Doing
ready: true
branch: spec/013-news-werkzeuge
owner: FC Luebbecke <Git@fcluebbecke.de>
order: 1
needs_human: true
angelegt: 2026-11-01
usecase: UC-001
parent: 010-mcp-server-private-ai
---

# Eigene News-Werkzeuge im MCP-Server

## Why

Seit Spec 007 kann der MCP-Server Beiträge „Aktuelles“ verwalten – aber nur
über die allgemeinen Werkzeuge (`entwurf_anlegen` mit Sammlung `beitraege`).
Private AI hat das im Test nicht erkannt: Es fand `bild_hochladen`, aber
„kein News anlegen“. Eigene, klar benannte Werkzeuge machen den News-Bereich
für das Modell sofort auffindbar.

## What

Im Umfang:
- Neue Werkzeuge, die intern die bestehende Logik nutzen (gleiche Regeln,
  gleicher Entwurf `preview`, gleiche Vorschau, gleiches Veröffentlichen):
  - `news_auflisten` – Beiträge (neueste zuerst), optional nach Sparte/Suchtext,
    mit ID, Titel, Datum, Sparte, Titelbild ja/nein und Revision
  - `news_lesen` – ein Beitrag mit allen Feldern
  - `news_anlegen` – neuer Beitrag aus Titel, Sparte, Teaser, Text
    (Datum Standard heute, Autor optional)
  - `news_bearbeiten` – einzelne Felder ändern (Titel, Datum, Sparte, Teaser,
    Text, Autor)
  - `news_foto` – Titelbild setzen oder Galeriebild anhängen
  - `news_loeschen` – Beitrag löschen (nur mit Bestätigung)
- Anleitung des Servers: News-Aufgaben über die `news_*`-Werkzeuge.
- Tests, `MCP.md`.

Nicht im Umfang:
- Änderungen an der Webseite oder an den Regeln für Beiträge.
- Veröffentlichen/Verwerfen: bleiben `veroeffentlichen`/`entwurf_verwerfen`.

## Acceptance

- Wenn Private AI die Werkzeugliste lädt, dann gibt es Werkzeuge, deren Name
  mit `news_` beginnt und deren Beschreibung „News“/„Beitrag“ nennt.
- Wenn `news_anlegen` mit Titel, Sparte, Teaser und Text aufgerufen wird,
  dann liegt ein Beitrag im Entwurf, Datum = heute, und die Antwort nennt
  Vorschau-Link, Revision und den Hinweis, dass ein Titelbild fehlt.
- Wenn `news_foto` mit `art: "titelbild"` aufgerufen wird, dann hat der
  Beitrag ein Titelbild; mit `art: "galerie"` wird ein Bild angehängt.
- Wenn die Regeln verletzt sind (z. B. Sparte „tennis“, Teaser zu lang), dann
  lehnt `news_anlegen`/`news_bearbeiten` mit verständlicher Meldung ab.
- Wenn `news_loeschen` ohne Bestätigung aufgerufen wird, dann wird nichts
  gelöscht.

## Decisions

1. 2026-11-01 · Die News-Werkzeuge sind dünne Hüllen um die bestehenden
   Werkzeuge (`entwurf_anlegen`, `entwurf_aendern`, `bild_hochladen`,
   `entwurf_loeschen`). Keine zweite Logik, keine zweiten Regeln.
2. 2026-11-01 · Das Feld heißt in den News-Werkzeugen `text` (verständlicher
   als `inhalt`); intern wird es auf `inhalt` abgebildet.
3. 2026-11-01 · Revisionen bleiben Pflicht für Ändern/Foto/Löschen;
   `news_auflisten` liefert sie gleich mit, damit kein Extra-Schritt nötig ist.

## Tasks

- [x] News-Werkzeuge in `mcp/werkzeuge.mjs`
- [x] Anmeldung beim MCP-SDK mit Beschreibungen in `mcp/server.mjs`, Anleitung angepasst
- [x] Tests (Werkzeuge und Werkzeugliste)
- [x] `MCP.md`
- [x] (added) Fehler behoben: `entwurf_anlegen` bildete für Beiträge keine ID (suchte
      `name` statt `titel`); betraf auch das allgemeine Werkzeug seit Spec 007

## Verification

- `npm run test:mcp`: 24 Tests grün. Neu:
  - `news_anlegen` ohne Datum → Datum = heute (Europe/Berlin), ID aus dem
    Titel (`d1-gewinnt-4-2-gegen-tengern`), `text` landet in `inhalt`,
    Antwort mit Vorschau-Link und Hinweis „Titelbild fehlt“.
  - `news_foto` Titelbild und Galerie; `news_auflisten` zeigt Titelbild
    ja/Galerie 1 und Revision; `news_bearbeiten` ändert den Text;
    `news_lesen` liefert ihn als `text`.
  - Abgelehnt: Bearbeiten ohne Felder, Sparte „tennis“, `art: "logo"`,
    Löschen ohne Bestätigung, zu langer Teaser. Löschen entfernt auch das
    Titelbild.
  - Werkzeugliste über HTTP: sechs `news_*`-Werkzeuge, Beschreibungen nennen
    News/Beitrag; die Server-Anleitung verweist auf `news_anlegen`.
  - Fehler gefunden und behoben: `entwurf_anlegen` für Beiträge ohne `id`
    scheiterte („Ungültige ID“), weil die ID aus `name` statt `titel`
    gebildet wurde.
- `npm run build`: grün (Webseite unverändert).

## Review

Build: live nach dem Merge (`/api/mcp`); in Private AI vorher die Werkzeugliste neu laden
Not part of this acceptance: Vorschau neben dem Chat (Spec 012)

### R1 · News-Werkzeuge sichtbar
- Given: Private AI ist neu mit dem MCP-Server verbunden
- When: du fragst „Welche Werkzeuge hast du für News?“
- Then: Private AI nennt news_anlegen, news_foto usw.
- [ ] ok

### R2 · Beitrag anlegen mit Foto
- Given: Private AI ist verbunden
- When: du einen Spielbericht diktierst, den Vorschlag bestätigst und ein Foto schickst
- Then: Private AI legt den Beitrag an, setzt das Titelbild, nennt den Vorschau-Link; nach „veröffentlichen“ steht er unter /aktuelles
- [ ] ok

## Questions
