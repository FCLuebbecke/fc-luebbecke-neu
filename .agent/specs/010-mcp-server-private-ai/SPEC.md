---
modules: mcp, inhalte
station: Doing
ready: true
branch: spec/010-mcp-server
owner: FC Luebbecke <Git@fcluebbecke.de>
order: 3
needs_human: true
angelegt: 2026-11-01
usecase: UC-001
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
6. 2026-11-01 · Aus A1: **Ein gemeinsamer Schlüssel für Private AI**
   (`Authorization: Bearer …`). Private AI reicht Name und E-Mail der
   angemeldeten Person in Kopfzeilen mit (`X-FC-Person-Email`,
   `X-FC-Person-Name`); der Server lässt nur E-Mails aus der Freigabeliste zu
   (Vercel-Variable, nicht im Repo) und trägt die Person als Commit-Autor ein.
   Die Werkzeuge selbst bekommen keine Identität als Parameter, damit das
   Modell sie nicht verändern kann. Zum Start ist nur Peter freigeschaltet.
7. 2026-11-01 · Server in plain JavaScript (`.mjs`) statt TypeScript: läuft
   ohne Build-Schritt identisch auf Vercel und in den lokalen Tests (Node).
   Die gemeinsamen Regeln liegen deshalb in `src/content/schemas.mjs`.
8. 2026-11-01 · Statt „veroeffentlichen nur nach entwurf_status in derselben
   Sitzung“ (Decision 2) – der Server ist zustandslos – verlangt
   `veroeffentlichen`/`entwurf_verwerfen` den `erwarteter_stand` aus
   `entwurf_status`. Ändert sich der Entwurf dazwischen, wird abgelehnt.
9. 2026-11-01 · Zusätzliche Sperre: Veröffentlichen wird verweigert, wenn der
   Entwurf Dateien außerhalb der Inhalte ändert. So kann über `preview` nie
   Code live gehen (Anlass: `preview` stand zum Testen auf `dev`).
10. 2026-11-01 · Vercel-Variablen nur für Production setzen; in Vorschau-Builds
    antwortet `/api/mcp` dann mit 503 (zum Testen gezielt für den Spec-Branch
    freischalten).

## Tasks

- [x] Feature-Branch `spec/010-mcp-server` von `main` anlegen
- [x] Vercel-Function mit MCP-SDK (Streamable HTTP, zustandslos), Code unter `mcp/`
      `api/mcp.mjs` (plain JS statt TS, Decision 7)
- [x] GitHub-Zugriff: Lesen, Commit mehrerer Dateien, Ref-Update, Merge (`mcp/repo-github.mjs`)
- [x] Zod-Schemas auslagern, von Astro und MCP gemeinsam genutzt (`src/content/schemas.mjs`)
- [x] Lese-Werkzeuge und `schema_lesen`
- [x] Schreib-Werkzeuge mit Pfad-Sperre, Zod-Validierung, Revisionsprüfung
- [x] `bild_hochladen` mit Verkleinerung (sharp)
- [x] `entwurf_status`, `vorschau_zeigen`
- [x] `veroeffentlichen` (Vercel-Build-Status prüfen, Merge nach `main`), `entwurf_verwerfen`, `rueckgaengig`
- [x] Anmeldung und Freischaltung (Decision 6)
- [x] Protokoll
      JSON-Zeile je Schreibaktion im Vercel-Log; dauerhaft über Git (Autor = Person)
- [x] Tests: Pfad-Sperre, Validierung, Revision, Konflikt beim Veröffentlichen
      `npm run test:mcp`, 19 Tests
- [x] `MCP.md` schreiben
- [x] (added) Veröffentlichen sperren, wenn der Entwurf Nicht-Inhalts-Dateien ändert
- [x] ~~(added) Nach `veroeffentlichen` `main` in `dev` mergen~~ – entfällt
      (Decision 5, kein `dev` mehr)
- [ ] (added) Vor Inbetriebnahme sicherstellen, dass `preview` = `main` ist
      (manuell: Push von `preview`, siehe Chat/VORSCHAU.md)
- [ ] Einrichtung (manuell): GitHub-Token, Vercel-Variablen, Private AI (MCP.md)
- [ ] Einbindung in Private AI und Durchlauf der UC-001-Akzeptanzkriterien

## Verification

- `npm run test:mcp`: 19 Tests grün, ohne Netzwerk.
  - Werkzeuge gegen ein Repository im Arbeitsspeicher mit den echten
    Inhaltsdateien: suchen/lesen; ändern schreibt genau einen Commit auf
    `preview` mit der Person als Autor, `main` bleibt unverändert; falsche
    Revision abgelehnt; Pflichtfeld/unbekanntes Feld/leerer Alt-Text
    abgelehnt; anlegen → Bild hochladen (PNG ohne Transparenz → JPG) →
    löschen ohne/mit Bestätigung; feste Einträge geschützt.
  - Veröffentlichen: ohne Bestätigung, mit falschem Stand, ohne
    erfolgreichen Build abgelehnt; danach `main` = Entwurf. Code-Datei im
    Entwurf blockiert das Veröffentlichen, `main` bleibt unverändert. Nach
    einem Code-Livegang (diverged) wird zusammengeführt, ohne die neue
    Code-Änderung zu überschreiben, danach `preview` = `main`.
  - Verwerfen, Rückgängig, Nachziehen von `preview`, wenn `main` weiter ist.
  - Endpunkt `api/mcp.mjs` über echte HTTP-Requests (Web-API): falscher/
    fehlender Schlüssel 401, nicht freigeschaltete Person 403; initialize
    (Server-Name, Anleitung), tools/list (12 Werkzeuge), tools/call lesen und
    ändern; unbekannte Sammlung als Fehler.
  - GitHub-Anbindung mit aufgezeichnetem fetch: Blobs → Tree (mit
    Löschung) → Commit (Eltern, Autor) → Ref-Update mit `force: false`;
    Abbruch bei weitergewandertem Branch; Lesen, Build-Status.
- `npm run build`: unverändert grün; gemeinsame Regeln greifen weiterhin
  (leerer Alt-Text bricht den Build ab).
- Nicht geprüft: Aufruf gegen das echte GitHub und Vercel (braucht Token und
  Variablen, siehe Review).

## Review

Build: Branch `spec/010-mcp-server` · Vercel-Vorschau des Branches
Not part of this acceptance: weitere Personen freischalten, Einbettung der Vorschau (Spec 009 Q2)

Vorher einrichten (MCP.md): GitHub-Token, Vercel-Variablen als Preview für
den Branch `spec/010-mcp-server`, `preview` = `main`, MCP-Server in Private AI
mit der Vorschau-Adresse des Spec-Branches.

### R1 · Änderung im Chat landet in der Vorschau
- Given: Private AI ist mit dem MCP-Server verbunden, die Vorschau ist offen
- When: du im Chat eine Trainingszeit änderst
- Then: Private AI zeigt vorher → nachher, die Vorschau zeigt die neue Zeit nach dem Vercel-Build, die Live-Seite nicht
- [ ] ok

### R2 · Veröffentlichen
- Given: eine Änderung liegt im Entwurf, Vorschau-Build ist fertig
- When: du „veröffentlichen“ sagst
- Then: Private AI zeigt vorher die offenen Änderungen; nach 1–2 Minuten ist die Änderung live, auf GitHub steht ein Commit mit dir als Autor
- [ ] ok

### R3 · Verwerfen
- Given: eine Änderung liegt im Entwurf
- When: du „verwerfen“ sagst
- Then: die Vorschau zeigt wieder den Live-Stand
- [ ] ok

### R4 · Grenzen
- Given: Private AI ist verbunden
- When: du bittest, das Impressum oder Layout zu ändern, oder ein Foto ohne Beschreibung zu setzen
- Then: Private AI erklärt, dass das nicht geht bzw. fragt nach der Beschreibung
- [ ] ok

## Questions

### Q1 · open · 2026-11-01T14:00:00Z
Wie meldet Private AI die Person beim MCP-Server an (OAuth, API-Schlüssel pro
Person, durchgereichte Identität)? Und wer wird freigeschaltet?

### A1 · bo · 2026-11-01T15:00:00Z
(im Chat) Ein Schlüssel für Private AI, Private AI reicht Name/E-Mail mit.
Zu Beginn nur Peter freigeschaltet.
