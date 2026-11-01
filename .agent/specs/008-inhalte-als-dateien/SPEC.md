---
modules: inhalte, seiten, infra
station: Backlog
order: 1
needs_human: true
angelegt: 2026-11-01
usecase: UC-001
open_question: Q1
---

# Inhalte von Sanity in Dateien umziehen (Astro Content Collections)

## Why

Die Inhalte sollen künftig per Chat (Private AI + MCP) gepflegt werden, mit
sofortiger Vorschau neben dem Chat (UC-001). Mit Inhalten als Dateien im
Repo gibt es die Vorschau praktisch geschenkt (Astro-Dev-Server lädt bei
Dateiänderung neu), die Git-Historie liefert Protokoll und Rückgängig, und
Sanity-Konto, Tokens, CORS, Webhook und Studio entfallen. Diese Spec ist die
Grundlage für 009 (Vorschau-Server) und 010 (MCP-Server).

## What

Im Umfang:
- Astro Content Collections unter `src/content/` mit Zod-Schemas, die die
  heutigen Sanity-Schemas abbilden (Pflichtfelder, Formate, Alt-Text bei
  Bildern):
  - `mannschaften` (Fußball, Kategorie herren/jugend, Trainerteam, Foto, Liga …)
  - `badminton-mannschaften`, `darts-mannschaften`
  - `sparten` (Badminton/Darts-Info: Trainingszeiten, Ort, Adresse)
  - `sponsoren`
- Eine Datei je Eintrag (JSON), Bilder unter `src/assets/content/<sammlung>/`
  und über `image()` im Schema eingebunden (Astro optimiert sie).
- Einmaliges Export-Skript `scripts/sanity-export.ts`: liest alle Dokumente
  der genannten Typen aus dem Dataset `production`, lädt Bilder herunter und
  schreibt die Dateien. Wird nach erfolgreichem Umzug wieder entfernt.
- `src/lib/sanity.ts` wird durch `src/lib/inhalte.ts` mit gleichen
  Funktionsnamen/Rückgabetypen ersetzt (`getMannschaften`, `getSparteTeams`,
  `getSparteInfo`, `getSponsoren`), damit die 8 nutzenden Seiten/Komponenten
  kaum angefasst werden müssen.
- Die bisherigen Fallback-Platzhalter (`src/data/fussball-teams.ts` u. a.)
  entfallen, soweit sie nur Sanity-Ersatz waren; echte Inhalte liegen dann in
  den Collections.
- Entfernen: `@sanity/*`, `sanity`, `styled-components` (nur fürs Studio),
  Integration und Studio unter `/admin`, `sanity.config.ts`,
  `sanity.cli.ts`, `src/sanity/`, die `/admin`-Middleware, Sanity-Variablen
  aus `.env.example`/Doku. `SANITY.md` wird durch `INHALTE.md` ersetzt
  (wo welche Datei liegt, Schema-Felder).
- Doku: `DEPLOY.md` (Webhook aus Spec 004 entfällt, täglicher Rebuild bleibt),
  `CLAUDE.md` wo Sanity erwähnt ist.

Nicht im Umfang:
- Vorschau-Server (Spec 009), MCP-Server (Spec 010), News-Beiträge (Spec 007).
- Löschen des Sanity-Projekts selbst (siehe Questions Q1).
- Änderungen am Aussehen der Seiten.

## Acceptance

- Wenn `npm run build` läuft, dann baut die Seite ohne Sanity-Pakete und ohne
  Netzwerkzugriff auf sanity.io.
- Wenn man die Seiten Fußball/Mannschaften, Badminton (Mannschaften,
  Trainingszeiten), Darts (Mannschaften, Trainingszeiten) und die Sponsoren
  vor und nach dem Umzug vergleicht, dann sind Inhalte, Reihenfolge und Fotos
  gleich.
- Wenn eine Inhaltsdatei ein Pflichtfeld nicht hat oder ein Bild ohne Alt-Text
  eingebunden ist, dann bricht `npm run build` mit verständlicher Meldung ab.
- Wenn man mit laufendem `npm run dev` eine Inhaltsdatei ändert, dann zeigt der
  Browser die Änderung ohne manuelles Neuladen.
- Wenn man `/admin` aufruft, dann gibt es 404 (Studio entfernt).
- Im Repo gibt es keine Referenzen mehr auf `sanity` außer in der
  Spec-Historie.

## Decisions

1. 2026-11-01 · Inhalte als JSON statt Markdown für strukturierte Daten
   (Mannschaften, Sponsoren, Sparten): eindeutig maschinell schreibbar für den
   MCP-Server. Markdown nur für Fließtext-Inhalte (News, Spec 007).
2. 2026-11-01 · Funktionsnamen der Datenschicht bleiben gleich, um den Umbau
   der Seiten klein zu halten.

## Tasks

- [ ] Feature-Branch `spec/008-inhalte-als-dateien` von `main` anlegen
- [ ] `src/content.config.ts` mit Collections und Zod-Schemas anlegen
- [ ] Export-Skript schreiben und gegen `production` laufen lassen
- [ ] Exportierte Dateien und Bilder prüfen und committen
- [ ] `src/lib/inhalte.ts` anlegen, Nutzer von `src/lib/sanity.ts` umstellen
- [ ] Fallback-Daten bereinigen
- [ ] Sanity-Pakete, Studio, Konfiguration, Middleware entfernen
- [ ] Vorher/Nachher-Vergleich der betroffenen Seiten (Screenshots)
- [ ] Doku: `INHALTE.md` neu, `SANITY.md` entfernen, `DEPLOY.md`, `CLAUDE.md`
- [ ] Export-Skript wieder entfernen

## Verification

## Review

## Questions

### Q1 · open · 2026-11-01T14:00:00Z
Nutzt fcl-live.de das bisherige Sanity-Projekt noch (z. B. für Ticketkäufe
`liveKauf`)? Davon hängt ab, ob das Sanity-Projekt nach dem Umzug gelöscht
werden darf. Die Webseite selbst nutzt es danach nicht mehr.
