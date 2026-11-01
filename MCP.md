# MCP-Server „FC-Webseite“ (Private AI)

Über diesen Server pflegt Private AI die Inhalte der Webseite im Chat
(Use Case UC-001, Spec 010). Er läuft als Vercel-Function im selben Projekt:

```
https://www.fcluebbecke.de/api/mcp     (MCP, Streamable HTTP, zustandslos)
```

```
Chat (Private AI) ──▶ /api/mcp ──▶ GitHub-API ──▶ Commit auf preview ──▶ Vercel-Vorschau
                                                └─ veroeffentlichen ──▶ main ──▶ live
```

Der Server ändert **nur Inhalte** (`src/content/**`, `src/assets/content/**`)
und prüft sie mit denselben Regeln wie der Build (`src/content/schemas.mjs`).
Code, Layout, Impressum und Datenschutz kann er nicht ändern.

## Werkzeuge

| Werkzeug | Zweck |
|---|---|
| `inhalt_suchen` | Einträge finden (Sammlung, Suchbegriff) |
| `inhalt_lesen` | Eintrag mit allen Feldern und Revision |
| `schema_lesen` | Felder, Pflichtfelder und erlaubte Werte einer Sammlung |
| `entwurf_aendern` | Felder ändern (Revision nötig) |
| `entwurf_anlegen` | Neuen Eintrag anlegen |
| `entwurf_loeschen` | Eintrag löschen (nur mit Bestätigung) |
| `bild_hochladen` | Foto/Logo setzen (Base64 oder https-URL, Alt-Text Pflicht) |
| `entwurf_status` | Offene Änderungen, wer/wann, Build-Status, `erwarteter_stand` |
| `vorschau_zeigen` | Link zur Vorschau, Build-Status |
| `veroeffentlichen` | Entwurf live stellen (Bestätigung + `erwarteter_stand`) |
| `entwurf_verwerfen` | Entwurf verwerfen (Bestätigung + `erwarteter_stand`) |
| `rueckgaengig` | Frühere Änderung zurücknehmen (Gegenänderung im Entwurf) |

Schutzregeln:
- Ändern/Löschen nur mit passender **Revision**, sonst „neu lesen“.
- **Veröffentlichen** nur
  - mit `bestaetigung: true` und dem `erwarteter_stand` aus `entwurf_status`,
  - wenn der Vercel-Build des Entwurfs **erfolgreich** war,
  - wenn der Entwurf **ausschließlich Inhaltsdateien** ändert.
- Mehrere Dateien (Bild + JSON) werden als **ein** Commit geschrieben.
- Commit-Autor ist die angemeldete Person.

## Einrichtung

### 1. GitHub-Token

GitHub → Settings → Developer settings → **Fine-grained tokens** → neu:
- Repository access: **nur** `FCLuebbecke/fc-luebbecke-neu`
- Permissions: **Contents: Read and write**, **Commit statuses: Read**
- Ablaufdatum setzen (z. B. 1 Jahr) und vormerken

Hinweis: Ist `main` per Branch-Schutz gegen direkte Pushes gesperrt, kann der
Server nicht veröffentlichen. Dann den Token-Besitzer in der Regel ausnehmen.

### 2. Vercel-Umgebungsvariablen

Vercel → Projekt → Settings → Environment Variables, **nur Production**
(dann ist `/api/mcp` in Vorschau-Builds gesperrt):

| Variable | Wert |
|---|---|
| `MCP_SCHLUESSEL` | zufälliger Schlüssel, z. B. `openssl rand -hex 32` |
| `MCP_PERSON` | feste Person für alle Commits (Spec 011, Option B): `email=Name`, z. B. `private-ai@fcluebbecke.de=Private AI`. Ohne Angabe: „Private AI". |
| `GITHUB_TOKEN` | Token aus Schritt 1 |
| `GITHUB_REPO` | `FCLuebbecke/fc-luebbecke-neu` (Standard) |
| `VORSCHAU_URL` | feste Adresse der Vorschau des Branches `preview` (VORSCHAU.md) |
| `LIVE_URL` | optional, Standard `https://www.fcluebbecke.de` |

Zum Testen vor dem Livegang dieselben Variablen als **Preview** nur für den
Branch `spec/010-mcp-server` setzen; dann ist der Server unter der
Vercel-Vorschau-Adresse dieses Branches erreichbar.

### 3. Private AI

MCP-Server hinzufügen:
- URL: `https://www.fcluebbecke.de/api/mcp`
- Kopfzeile bei jedem Aufruf:
  - `Authorization: Bearer <MCP_SCHLUESSEL>`

Ein Personen-Header ist nicht nötig (Spec 011, Option B): Der Server schreibt
alle Änderungen der festen Person aus `MCP_PERSON` zu (Default „Private AI").
Das vereinfacht die Einrichtung; dafür steht im Log nicht mehr, welche Person
eine Änderung ausgelöst hat. Wer das braucht, nutzt wieder den personen-
bezogenen Modus (Spec 010, Decision 6).

### 4. Branch `preview`

`preview` muss vor dem ersten Einsatz dem Stand von `main` entsprechen
(VORSCHAU.md).

## Protokoll

- Jede Schreibaktion erscheint im Vercel-Log (Projekt → Logs, Suche
  `fc-webseite`) mit Zeit, Werkzeug, Dateien und Commit.
- Dauerhaft nachvollziehbar ist alles in der Git-Historie. In Option B ist der
  Autor immer die feste Person (`MCP_PERSON`, Default „Private AI") – welcher
  Mensch eine Änderung ausgelöst hat, steht nicht im Log.

## Entwickeln & testen

```
npm run test:mcp
```

Die Tests laufen ohne Netzwerk gegen ein Repository im Arbeitsspeicher
(`mcp/repo-speicher.mjs`), gefüllt mit den echten Inhaltsdateien.

| Datei | Inhalt |
|---|---|
| `api/mcp.mjs` | Vercel-Endpunkt, Anmeldung |
| `mcp/server.mjs` | Werkzeug-Beschreibungen, Anleitung fürs Modell |
| `mcp/werkzeuge.mjs` | Logik und Schutzregeln |
| `mcp/inhalte.mjs` | Sammlungen, Pfad-Sperre, Prüfung |
| `mcp/repo-github.mjs` | GitHub-API |
| `src/content/schemas.mjs` | gemeinsame Regeln (auch für den Build) |
