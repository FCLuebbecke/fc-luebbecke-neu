---
modules: mcp, inhalte
station: Backlog
order: 3
needs_human: true
angelegt: 2026-11-01
usecase: UC-001
open_question: Q1
depends_on: 008-inhalte-als-dateien, 009-vorschau-server
---

# MCP-Server „FC-Webseite“ für Private AI

## Why

UC-001: Pflegende ändern Inhalte im Chat mit Private AI. Der MCP-Server ist
die einzige Stelle, die Inhalte liest, in den Entwurf schreibt, veröffentlicht
und verwirft. Er sorgt dafür, dass nur Inhaltsdateien geändert werden, alles
gegen das Schema geprüft ist und nichts ohne Bestätigung live geht.

## What

Im Umfang:
- MCP-Server (TypeScript, offizielles MCP-SDK, Transport Streamable HTTP),
  läuft neben dem Vorschau-Server (Spec 009) und arbeitet in dessen
  Arbeitskopie auf Branch `entwurf`.
- Werkzeuge:
  - `inhalt_suchen(sammlung?, text)` – findet Einträge
  - `inhalt_lesen(sammlung, id)` – liefert Eintrag + Revision (Git-Blob-Hash)
  - `schema_lesen(sammlung)` – Felder, Pflichtfelder, Formate
  - `entwurf_aendern(sammlung, id, felder, erwartete_revision)` – Teiländerung
  - `entwurf_anlegen(sammlung, felder)` / `entwurf_loeschen(sammlung, id, erwartete_revision)`
  - `bild_hochladen(sammlung, id, feld, datei, alt)` – verkleinert, speichert
    unter `src/assets/content/`
  - `entwurf_status()` – unveröffentlichte Änderungen gegenüber `main` (Diff,
    wer, wann)
  - `vorschau_zeigen(sammlung?, id?)` – URL der betroffenen Vorschau-Seite
  - `veroeffentlichen(bestaetigung)` – `astro check` + Build-Test, dann
    rebase auf `main`, Commit(s) nach `main` pushen, `entwurf` = `main`
  - `entwurf_verwerfen(bestaetigung)` – `entwurf` auf `main` zurücksetzen
  - `rueckgaengig(commit)` – Gegen-Commit im Entwurf
- Schutz:
  - Schreibzugriff nur auf `src/content/**` und `src/assets/content/**`;
    alle anderen Pfade werden abgelehnt.
  - Validierung mit denselben Zod-Schemas wie Astro (aus Spec 008
    importiert), vor jedem Schreiben.
  - Revisionsprüfung: Schreiben nur, wenn `erwartete_revision` passt.
  - `veroeffentlichen`/`entwurf_verwerfen`/`entwurf_loeschen` nur mit
    ausdrücklicher Bestätigung als Parameter; das Werkzeug beschreibt, dass
    der Mensch vorher im Chat zugestimmt haben muss.
  - Commit-Autor = angemeldete Person (Name/E-Mail aus Private AI),
    Committer = Bot-Identität.
- Anmeldung: nur freigeschaltete Personen (Mechanismus siehe Q1).
- Protokoll: jede Schreibaktion mit Person, Zeit, Werkzeug, Pfad.
- Doku `MCP.md`: Einbindung in Private AI, Werkzeuge, Betrieb.

Nicht im Umfang:
- Panel/iframe-Einbettung der Vorschau in Private AI (hängt von Spec 009 Q2 ab).
- Getrennte Entwürfe pro Person.
- Änderungen an Code, Layout, Impressum, Datenschutz.

## Acceptance

- Wenn Private AI `entwurf_aendern` für eine Trainingszeit aufruft, dann ist
  die Datei im Branch `entwurf` geändert und die Vorschau zeigt sie nach
  spätestens 2 Sekunden.
- Wenn ein Werkzeug einen Pfad außerhalb von `src/content/` bzw.
  `src/assets/content/` ändern soll, dann lehnt der Server ab und schreibt
  nichts.
- Wenn die Daten das Schema verletzen (fehlendes Pflichtfeld, Bild ohne
  Alt-Text), dann lehnt der Server mit einer verständlichen Meldung ab.
- Wenn sich die Datei seit `inhalt_lesen` geändert hat, dann lehnt
  `entwurf_aendern` ab und nennt die neue Revision.
- Wenn `veroeffentlichen` aufgerufen wird, dann steht danach ein Commit mit
  der Person als Autor in `main`, Vercel baut, und `entwurf` ist gleich `main`.
- Wenn der Build-Test vor dem Veröffentlichen fehlschlägt oder der Rebase
  einen Konflikt hat, dann wird nichts nach `main` gepusht.
- Wenn `entwurf_status` beim Start fremde Änderungen zeigt, dann sind Person
  und Diff erkennbar.
- Wenn eine nicht freigeschaltete Person den Server nutzt, dann wird nichts
  gelesen oder geschrieben.

## Decisions

1. 2026-11-01 · Ein gemeinsamer Entwurfs-Branch in Version 1; Schutz vor
   versehentlichem Mitveröffentlichen über `entwurf_status` (UC-001 F1).
2. 2026-11-01 · Bestätigungen werden als Parameter übergeben und vom Modell
   nur nach Zustimmung im Chat gesetzt; der Server erzwingt zusätzlich, dass
   `veroeffentlichen` nicht ohne vorherigen `entwurf_status` in derselben
   Sitzung läuft.
3. 2026-11-01 · Inhalts-Veröffentlichungen gehen direkt nach `main` (= live),
   Code-Arbeit läuft über `dev` (CLAUDE.md Abschnitt 12). Damit beide nicht
   auseinanderlaufen, übernimmt `dev` nach jeder Inhalts-Veröffentlichung den
   Stand von `main`. Der MCP-Server ändert nur Inhaltsordner, daher sind
   Konflikte selten; bei einem Konflikt wird nicht automatisch aufgelöst.

## Tasks

- [ ] Feature-Branch `spec/010-mcp-server-private-ai` anlegen
- [ ] Projektstruktur `mcp/` (eigenes `package.json`), MCP-SDK, HTTP-Transport
- [ ] Lese-Werkzeuge und `schema_lesen`
- [ ] Schreib-Werkzeuge mit Pfad-Sperre, Zod-Validierung, Revisionsprüfung
- [ ] `bild_hochladen` mit Verkleinerung (sharp)
- [ ] `entwurf_status`, `vorschau_zeigen`
- [ ] `veroeffentlichen` (check, Build-Test, rebase, push), `entwurf_verwerfen`, `rueckgaengig`
- [ ] Anmeldung und Freischaltung (Q1)
- [ ] Protokoll
- [ ] Tests: Pfad-Sperre, Validierung, Revision, Konflikt beim Veröffentlichen
- [ ] Einbindung in Private AI und Durchlauf der UC-001-Akzeptanzkriterien
- [ ] `MCP.md` schreiben
- [ ] (added) Nach `veroeffentlichen` `main` in `dev` mergen (fast-forward oder
      Merge-Commit, nie force); bei Konflikt abbrechen und melden

## Verification

## Review

## Questions

### Q1 · open · 2026-11-01T14:00:00Z
Wie meldet Private AI die Person beim MCP-Server an (OAuth, API-Schlüssel pro
Person, durchgereichte Identität)? Und wer wird freigeschaltet?
