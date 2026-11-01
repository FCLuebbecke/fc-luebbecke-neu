---
modules: mcp
station: Done
angelegt: 2026-11-01
usecase: UC-001
parent: 010-mcp-server-private-ai
commit: 97ccd9f
---

# MCP-Server Option B – feste Person statt Personen-Kopfzeilen

> Nachträglich dokumentiert: Umgesetzt und nach `main` gemergt am 2026-11-01
> (Commits `97ccd9f`, Merge `60593e7`), außerhalb dieses Spec-Registers.
> Diese Datei hält den Stand fest.

## Why

Mit Spec 010 musste Private AI bei jedem Aufruf Name und E-Mail der
angemeldeten Person in Kopfzeilen mitschicken (`X-FC-Person-Email/-Name`),
und der Server prüfte sie gegen eine Freigabeliste. Das ließ sich in Private
AI nicht oder nur umständlich einrichten. Option B vereinfacht die
Einrichtung: nur noch ein Schlüssel, eine feste Person.

## What

Im Umfang:
- Anmeldung nur noch über `Authorization: Bearer <MCP_SCHLUESSEL>`.
- Keine Personen-Kopfzeilen und keine Freigabeliste (`MCP_PERSONEN`) mehr;
  mitgeschickte Kopfzeilen werden ignoriert.
- Alle Commits laufen unter einer festen Person aus `MCP_PERSON`
  (`email=Name`), Standard „Private AI“ `<private-ai@fcluebbecke.de>`.
- `api/mcp.mjs` (`anmelden()`, `festePerson()`), Tests, `MCP.md`.

Nicht im Umfang:
- Werkzeuge und Schutzregeln (unverändert aus Spec 010).

## Acceptance

- Wenn Private AI mit gültigem Schlüssel aufruft, dann funktionieren alle
  Werkzeuge ohne Personen-Kopfzeilen.
- Wenn der Schlüssel fehlt oder falsch ist, dann antwortet der Server mit 401.
- Wenn eine Änderung geschrieben wird, dann ist der Commit-Autor die feste
  Person aus `MCP_PERSON` (ohne Angabe „Private AI“).

## Decisions

1. 2026-11-01 · Ersetzt Spec 010 Decision 6. Zugriffskontrolle liegt damit
   vollständig bei Private AI (wer dort den MCP-Server nutzen darf) und beim
   Schlüssel. Bewusst in Kauf genommen: In Git-Historie und Vercel-Log steht
   nicht mehr, welcher Mensch eine Änderung ausgelöst hat.

## Tasks

- [x] `anmelden()` prüft nur den Schlüssel, `festePerson()` aus `MCP_PERSON`
- [x] Freigabeliste `MCP_PERSONEN` entfernt
- [x] Tests angepasst (kein Personen-Header nötig, fremder Header ignoriert, Autor „Private AI“)
- [x] `MCP.md` angepasst
- [x] (added) Spec und UC-001 nachgeführt (2026-11-01)

## Verification

- `npm run test:mcp`: 19 Tests grün (lokal nach dem Holen von `main` geprüft).
- Live genutzt: zwei Inhaltsänderungen an `sparten-infos/darts` mit Autor
  „Private AI“ (`16528d7`, `201db4b`), netto wieder auf dem Ausgangsstand.

## Review

## Questions
