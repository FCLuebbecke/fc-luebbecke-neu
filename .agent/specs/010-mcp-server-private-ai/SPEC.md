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
- MCP-Server (TypeScript, offizielles MCP-SDK, Transport Streamable HTTP,
  zustandslos) als **Vercel-Function** im selben Projekt (`api/mcp.ts`).
  Er hat keine Git-Arbeitskopie, sondern liest und schreibt über die
  **GitHub-API** auf dem Branch `preview` (Decision 4). Zugang über ein
  Fine-grained Token nur für dieses Repo (Contents: Read and write) als
  Vercel-Umgebungsvariable.
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
  - `vorschau_zeigen(sammlung?, id?)` – URL der betroffenen Seite in der
    Vercel-Vorschau des Branches `preview` (Spec 009) und Build-Status
    („wird gebaut“ / „fertig“)
  - `veroeffentlichen(bestaetigung)` – nur wenn der Vercel-Build des
    aktuellen `preview`-Commits erfolgreich war (Commit-Status auf GitHub);
    dann `preview` nach `main` mergen (GitHub-Merge-API), danach `preview` =
    `main`
  - `entwurf_verwerfen(bestaetigung)` – `preview` auf den Stand von `main`
    zurücksetzen
  - `rueckgaengig(commit)` – Gegen-Commit im Entwurf
- Schutz:
  - Schreibzugriff nur auf `src/content/**` und `src/assets/content/**`;
    alle anderen Pfade werden abgelehnt.
  - Validierung mit denselben Zod-Schemas wie Astro, vor jedem Schreiben.
    Dafür werden die Schemas aus `src/content.config.ts` in eine Datei ohne
    `astro:content`-Abhängigkeit ausgelagert (`src/content/schemas.ts`), die
    Astro und der MCP-Server gemeinsam nutzen.
  - Mehrere Dateien (z. B. Bild + JSON) werden als **ein** Commit geschrieben
    (Git-Data-API), damit die Vorschau nie einen halben Stand baut.
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
  die Datei im Branch `preview` geändert (ein Commit) und die Vorschau zeigt
  sie, sobald der Vercel-Build fertig ist (Ziel unter 90 Sekunden).
- Wenn ein Werkzeug einen Pfad außerhalb von `src/content/` bzw.
  `src/assets/content/` ändern soll, dann lehnt der Server ab und schreibt
  nichts.
- Wenn die Daten das Schema verletzen (fehlendes Pflichtfeld, Bild ohne
  Alt-Text), dann lehnt der Server mit einer verständlichen Meldung ab.
- Wenn sich die Datei seit `inhalt_lesen` geändert hat, dann lehnt
  `entwurf_aendern` ab und nennt die neue Revision.
- Wenn `veroeffentlichen` aufgerufen wird, dann steht danach ein Commit mit
  der Person als Autor in `main`, Vercel baut, und `preview` ist gleich `main`.
- Wenn der Vercel-Build des Entwurfs fehlgeschlagen ist oder der Merge nach
  `main` einen Konflikt hat, dann wird nichts nach `main` übernommen.
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
   Code-Arbeit lief damals über `dev` (CLAUDE.md Abschnitt 12, inzwischen
   geändert, siehe Decision 5). Damit beide nicht
   auseinanderlaufen, übernimmt `dev` nach jeder Inhalts-Veröffentlichung den
   Stand von `main`. Der MCP-Server ändert nur Inhaltsordner, daher sind
   Konflikte selten; bei einem Konflikt wird nicht automatisch aufgelöst.
4. 2026-11-01 · Folge aus Spec 009 Decision 1 (alles auf Vercel): Der
   MCP-Server läuft als Vercel-Function und arbeitet über die GitHub-API statt
   in einer lokalen Arbeitskopie. Der Build-Test vor dem Veröffentlichen ist
   der Vercel-Preview-Build des `preview`-Commits; schlägt er fehl, wird nicht
   veröffentlicht. Die Vorschau erscheint 30–60 s nach einer Änderung.
5. 2026-11-01 · Der Sammel-Branch `dev` entfällt (Wunsch im Chat):
   Spec-Branches gehen direkt nach `main`. Decision 3 (dev nach jeder
   Inhalts-Veröffentlichung nachziehen) ist damit hinfällig; Spec-Branches
   holen sich bei Bedarf `main`, bevor sie gemergt werden.

## Tasks

- [ ] Feature-Branch `spec/010-mcp-server-private-ai` anlegen
- [ ] Vercel-Function `api/mcp.ts` mit MCP-SDK (Streamable HTTP, zustandslos), Code unter `mcp/`
- [ ] GitHub-Zugriff (Token als Vercel-Variable, nur dieses Repo): Lesen, Commit mehrerer Dateien, Ref-Update, Merge
- [ ] Zod-Schemas nach `src/content/schemas.ts` auslagern, von Astro und MCP gemeinsam genutzt
- [ ] Lese-Werkzeuge und `schema_lesen`
- [ ] Schreib-Werkzeuge mit Pfad-Sperre, Zod-Validierung, Revisionsprüfung
- [ ] `bild_hochladen` mit Verkleinerung (sharp)
- [ ] `entwurf_status`, `vorschau_zeigen`
- [ ] `veroeffentlichen` (Vercel-Build-Status prüfen, Merge nach `main`), `entwurf_verwerfen`, `rueckgaengig`
- [ ] Anmeldung und Freischaltung (Q1)
- [ ] Protokoll
- [ ] Tests: Pfad-Sperre, Validierung, Revision, Konflikt beim Veröffentlichen
- [ ] (added) Vor Inbetriebnahme sicherstellen, dass `preview` = `main` ist.
      Am 2026-11-01 wurde `preview` zum Testen der Vorschau auf den Stand von
      `dev` gesetzt; sonst ginge beim ersten „veröffentlichen“ Code aus `dev`
      mit live.
- [ ] Einbindung in Private AI und Durchlauf der UC-001-Akzeptanzkriterien
- [ ] `MCP.md` schreiben
- [x] ~~(added) Nach `veroeffentlichen` `main` in `dev` mergen~~ – entfällt
      (Decision 5, kein `dev` mehr)

## Verification

## Review

## Questions

### Q1 · open · 2026-11-01T14:00:00Z
Wie meldet Private AI die Person beim MCP-Server an (OAuth, API-Schlüssel pro
Person, durchgereichte Identität)? Und wer wird freigeschaltet?
