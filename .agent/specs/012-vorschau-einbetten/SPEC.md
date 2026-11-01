---
modules: vorschau, infra
station: Backlog
order: 3
needs_human: true
angelegt: 2026-11-01
usecase: UC-001
parent: 009-vorschau-server
open_question: Q1
---

# Vorschau neben dem Chat in Private AI anzeigen

## Why

UC-001 sieht vor, die Vorschau direkt neben dem Chat zu sehen. Die Vorschau
funktioniert (Spec 009), ist aber durch Vercel Authentication geschützt und
sendet `X-Frame-Options: DENY`. Damit lässt sie sich weder ohne
Vercel-Anmeldung öffnen noch in Private AI einbetten.

## What

Im Umfang:
- Klären, ob und wie Private AI eine Webseite neben dem Chat anzeigen kann
  (iframe, Panel, MCP Apps) und von welcher Adresse aus.
- Entscheiden, wie die Vorschau zugänglich wird, ohne sie öffentlich zu machen.
  Mögliche Wege:
  - eigene Domain `vorschau.fcluebbecke.de` für den Branch `preview`, vom
    Vercel-Schutz ausgenommen, dafür mit eigenem einfachen Schutz
  - Vercel „Protection Bypass“ (geheimer Parameter in der Vorschau-URL), den
    der MCP-Server in `vorschau_zeigen` mitliefert
  - Schutz für Vorschauen ganz abschalten (Vorschau enthält nur Vereinsinhalte)
- Danach `Content-Security-Policy: frame-ancestors` auf die Adresse von
  Private AI beschränken.

Nicht im Umfang:
- Änderungen an Vorschau-Logik oder MCP-Werkzeugen außer dem Vorschau-Link.

## Acceptance

- Wenn Private AI die Vorschau neben dem Chat anzeigt, dann ist sie ohne
  Vercel-Anmeldung sichtbar und lädt bei Änderungen selbst neu.
- Wenn eine fremde Seite die Vorschau einbetten will, dann blockiert der
  Browser sie.
- Wenn jemand die Vorschau-Adresse ohne Berechtigung aufruft, dann sieht er
  sie nicht (bzw. bewusst entschieden, dass das in Ordnung ist).

## Decisions

## Tasks

- [ ] Q1 klären (Fähigkeiten von Private AI)
- [ ] Zugangsweg entscheiden und in Vercel einrichten
- [ ] `frame-ancestors` setzen, `vorschau_zeigen` ggf. anpassen
- [ ] Test in Private AI

## Verification

## Review

## Questions

### Q1 · open · 2026-11-01T17:15:00Z
Kann Private AI eine Webseite neben dem Chat anzeigen (iframe, Panel oder
MCP Apps)? Falls ja: unter welcher Adresse läuft Private AI (für
`frame-ancestors`)? Und soll die Vorschau dafür ohne Vercel-Anmeldung
erreichbar sein (z. B. über eine eigene Domain oder einen geheimen Link)?
