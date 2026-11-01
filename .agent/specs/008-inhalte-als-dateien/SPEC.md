---
modules: inhalte, seiten, infra
station: Doing
ready: true
branch: spec/008-inhalte-als-dateien
owner: FC Luebbecke <Git@fcluebbecke.de>
order: 1
needs_human: true
angelegt: 2026-11-01
usecase: UC-001
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
  - `sparten-mannschaften` (Badminton/Darts, Feld `sparte`; siehe Decision 3)
  - `sparten-infos` (Badminton/Darts-Info: Trainingszeiten, Ort, Adresse)
  - `sponsoren`
- Eine Datei je Eintrag (JSON), Bilder unter `src/assets/content/<sammlung>/`
  und über `image()` im Schema eingebunden (Astro optimiert sie).
- Einmaliges Export-Skript `scripts/sanity-export.mjs`: liest alle Dokumente
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
- Löschen des Sanity-Projekts selbst (manueller Schritt, siehe Decision 7).
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
3. 2026-11-01 · Badminton- und Darts-Mannschaften in **einer** Sammlung
   `sparten-mannschaften` mit Pflichtfeld `sparte` statt zwei Sammlungen:
   gleiche Felder, ein Schema, einfacher für den MCP-Server.
4. 2026-11-01 · `reihenfolge` ist Pflicht und wurde aus der bisherigen
   Anzeige-Reihenfolge in Zehnerschritten vergeben (10, 20 …). So bleibt die
   Sortierung exakt gleich, und man kann dazwischen einfügen.
5. 2026-11-01 · Alt-Text ist Pflicht. In Sanity hatten 8 von 9 Bildern keinen;
   übernommen wurde der bisherige Seiten-Fallback („Mannschaftsfoto <Name>“,
   für Logos neu „Logo <Name>“ statt nur „<Name>“). Bessere Beschreibungen
   kann der Verein später ergänzen.
6. 2026-11-01 · Bildausschnitt: Sanity-`crop` wurde beim Export fest
   angewendet; Sanity-`hotspot` wird zum Feld `fokus` („x% y%“) und per CSS
   `object-position` umgesetzt (alle betroffenen Bilder nutzen schon
   `object-fit: cover`). Astro/sharp akzeptiert beim Zuschneiden nur
   Stichwörter, keine Prozentwerte. Ein als PNG hochgeladenes Foto (6 MB) wurde
   als JPG gespeichert; alle Inhaltsbilder zusammen 2,5 MB.
7. 2026-11-01 · Aus A1: fcl-live.de nutzt das Sanity-Projekt nicht. Das
   Sanity-Projekt `u7v527gk` darf gelöscht werden. Das geschieht manuell in
   sanity.io/manage (siehe Review); bis dahin schadet es nicht.
8. 2026-11-01 · Alte Einzeilen-Felder (`trainer`, `trainingszeiten`) wurden
   beim Export in `trainerteam`/`training` übernommen; das Schema kennt nur
   noch die neue Struktur.
9. 2026-11-01 · `FCL-LIVE.md` entfernt: beschrieb die eingebaute
   Livestream-Seite, die seit Spec 006 durch einen externen Link ersetzt ist.
   React (`@astrojs/react`) und `@vercel/edge` entfernt, da nur für Studio
   bzw. `/admin`-Middleware genutzt.

## Tasks

- [x] Feature-Branch `spec/008-inhalte-als-dateien` von `dev` anlegen
- [x] `src/content.config.ts` mit Collections und Zod-Schemas anlegen
- [x] Export-Skript schreiben und gegen `production` laufen lassen
      22 Fußball-Mannschaften, 3 Sparten-Mannschaften, 2 Sparten-Infos,
      16 Sponsoren, 9 Bilder; öffentliche API, kein Token nötig
- [x] Exportierte Dateien und Bilder prüfen und committen
- [x] `src/lib/inhalte.ts` anlegen, Nutzer von `src/lib/sanity.ts` umstellen
- [x] Fallback-Daten bereinigen
      Fallbacks in `fussball/mannschaften.astro`, `Sponsoren.astro` und die
      Felder `teams`/`training`/`ortName`/`ortAdresse` in `data/sparten.ts`
      entfernt. `data/fussball-teams.ts` bleibt (Spielplan-Links, kein
      Sanity-Ersatz).
- [x] Sanity-Pakete, Studio, Konfiguration, Middleware entfernen
- [x] Vorher/Nachher-Vergleich der betroffenen Seiten
      Textvergleich der gebauten Seiten, siehe Verification. Screenshots im
      Browser sind Teil des Reviews.
- [x] Doku: `INHALTE.md` neu, `SANITY.md` entfernen, `DEPLOY.md`, `CLAUDE.md`
      `CLAUDE.md` enthielt keine Sanity-Verweise. `.env.example` bereinigt.
- [x] Export-Skript wieder entfernen
      Im ersten Commit enthalten (nachvollziehbar), im zweiten entfernt.
- [x] (added) Leerzeichen am Anfang/Ende aller übernommenen Textwerte entfernt

## Verification

- `npm run build` (sauber, `.astro` gelöscht): 14 Seiten, keine Fehler oder
  Warnungen, keine Sanity-Pakete mehr in `package.json`; im Build-Ergebnis
  kein Treffer für „sanity“, kein `/admin`.
- Vorher/Nachher: Stand vor dem Umbau gebaut, sichtbaren Text und Alt-Texte
  der Seiten Start, Fußball/Mannschaften, Badminton/Darts Mannschaften und
  Trainingszeiten verglichen. Badminton/Darts: identisch. Fußball: nur
  doppelte Leerzeichen vor „· Ort“ entfallen (4 Zeilen). Start: Alt-Text
  „FIT FINANCE“ → „Logo FIT FINANCE“, „Westermann und Partner“ → „Logo
  Westermann und Partner“ (Decision 5). Reihenfolge überall gleich.
- Bilder: kommen als WebP aus dem eigenen Build statt vom Sanity-CDN,
  Komponenten-Styles greifen (`data-astro-cid` vorhanden), Fokus beim
  Badminton-Foto 2 als `object-position: 50% 53%`.
- Prüfregeln: `logo.alt` leer in `sponsoren/homedeluxe.json` → Build bricht
  ab mit „logo.alt: Alt-Text (Bildbeschreibung) ist Pflicht“ und Dateipfad.
  `ortName` gelöscht in `sparten-infos/darts.json` → Build bricht ab mit
  „ortName: Required“. Beide Dateien danach wiederhergestellt.
- Dev-Server: `ortName` in `darts.json` geändert, die Seite
  `/darts/trainingszeiten/` lieferte den neuen Wert nach 1,1 s. Hinweis für
  Spec 009: Bei zwei Änderungen innerhalb einer Sekunde meldet Astro einmal
  `ENOENT … data-store.json.tmp`; die Seite lieferte danach trotzdem korrekt
  aus (200). Das Neuladen im Browser (HMR) selbst ist Teil des Reviews.

## Review

Build: Branch `spec/008-inhalte-als-dateien` · lokal mit `npm run dev`
(Speccify-Aktion „Webseite starten“) oder Vercel-Vorschau des Branches
Not part of this acceptance: Löschen des Sanity-Projekts, Vorschau-Server (009)

### R1 · Seiten sehen aus wie vorher
- Given: die Seite läuft lokal oder als Vercel-Vorschau des Branches
- When: du Startseite (Sponsoren), Fußball → Mannschaften, Badminton und Darts (Mannschaften, Trainingszeiten) mit www.fcluebbecke.de vergleichst
- Then: gleiche Mannschaften, Trainer, Zeiten, Sponsoren und Fotos in gleicher Reihenfolge; Fotos ohne abgeschnittene Köpfe
- [ ] ok

### R2 · Änderung erscheint sofort
- Given: `npm run dev` läuft, `/badminton/trainingszeiten` ist im Browser offen
- When: du in `src/content/sparten-infos/badminton.json` eine Zeit änderst und speicherst
- Then: der Browser zeigt die neue Zeit nach 1–2 Sekunden, ohne dass du neu lädst
- [ ] ok

### R3 · Studio ist weg
- Given: die Vercel-Vorschau des Branches
- When: du `/admin` aufrufst
- Then: es erscheint die 404-Seite
- [ ] ok

Nach der Abnahme, manuell: Sanity-Projekt `u7v527gk` in sanity.io/manage
löschen (Decision 7) und in `.env` die nicht mehr genutzten Einträge
`PUBLIC_SANITY_*` und `SANITY_WRITE_TOKEN` entfernen.

## Questions

### Q1 · open · 2026-11-01T14:00:00Z
Nutzt fcl-live.de das bisherige Sanity-Projekt noch (z. B. für Ticketkäufe
`liveKauf`)? Davon hängt ab, ob das Sanity-Projekt nach dem Umzug gelöscht
werden darf. Die Webseite selbst nutzt es danach nicht mehr.

### A1 · bo · 2026-11-01T14:06:37Z
Nein
