---
modules: vorschau, infra
station: Backlog
order: 2
needs_human: true
angelegt: 2026-11-01
usecase: UC-001
open_question: Q1
depends_on: 008-inhalte-als-dateien
---

# Vorschau-Server mit Entwurfs-Branch

## Why

UC-001 verlangt, dass Änderungen aus dem Chat in unter zwei Sekunden neben dem
Chat sichtbar sind, bevor sie veröffentlicht werden. Nach Spec 008 liegen die
Inhalte als Dateien vor; ein dauerhaft laufender Astro-Dev-Server auf einem
Entwurfs-Branch zeigt Dateiänderungen sofort an.

## What

Im Umfang:
- Ein kleiner Server (Anbieter siehe Q1) mit:
  - Git-Arbeitskopie des Repos auf dem Branch `entwurf`
  - dauerhaft laufendem `astro dev` (Dienst, startet nach Neustart wieder)
  - Reverse-Proxy mit HTTPS unter z. B. `vorschau.fcluebbecke.de`
  - Zugangsschutz (Anmeldung), `X-Robots-Tag: noindex`
- Die Vorschau lädt bei Dateiänderung automatisch neu (Astro-HMR über den
  Proxy, WebSocket durchreichen).
- Die Vorschau lässt sich in einem iframe einbetten (für ein Panel in Private
  AI oder eine Redaktionsseite): `Content-Security-Policy: frame-ancestors`
  nur für die erlaubten Herkünfte.
- Entwurfs-Branch-Regeln: `entwurf` startet als Kopie von `main`; nach jeder
  Veröffentlichung wieder gleich `main`.
- Betriebsdoku `VORSCHAU.md`: Einrichtung, Neustart, Logs, Kosten.

Nicht im Umfang:
- Schreiben, Veröffentlichen, Verwerfen (macht der MCP-Server, Spec 010).
- Eine eigene Redaktionsseite mit Chatfenster (nur falls Q2 das ergibt, dann
  eigene Spec).

## Acceptance

- Wenn man auf dem Server eine Inhaltsdatei im Branch `entwurf` ändert, dann
  zeigt ein offenes Vorschau-Fenster die Änderung nach spätestens 2 Sekunden
  ohne Klick.
- Wenn man `vorschau.fcluebbecke.de` ohne Anmeldung aufruft, dann sieht man
  nichts außer der Anmeldung.
- Wenn man die Vorschau in einem iframe einer nicht erlaubten Seite einbettet,
  dann blockiert der Browser sie; in einer erlaubten Seite wird sie angezeigt.
- Wenn der Server neu startet, dann läuft die Vorschau danach ohne Eingriff
  wieder.
- Suchmaschinen indexieren die Vorschau nicht (`noindex`).

## Decisions

1. 2026-11-01 · Vorschau über `astro dev` statt über Vercel-Preview-Builds:
   Vercel braucht pro Änderung 1–2 Minuten, UC-001 verlangt unter 2 Sekunden.

## Tasks

- [ ] Anbieter und Servergröße festlegen (Q1)
- [ ] Server einrichten (Node, Git, Dienst für `astro dev`)
- [ ] Repo-Zugang mit eigenem Deploy-Key (nur dieses Repo)
- [ ] Reverse-Proxy mit HTTPS, WebSocket für HMR, Zugangsschutz, noindex
- [ ] `frame-ancestors` für erlaubte Herkünfte (Q2)
- [ ] DNS `vorschau.fcluebbecke.de`
- [ ] Neustart-Test, Latenz-Test (Dateiänderung → Anzeige)
- [ ] `VORSCHAU.md` schreiben

## Verification

## Review

## Questions

### Q1 · open · 2026-11-01T14:00:00Z
Wo soll der Vorschau-Server laufen (z. B. Hetzner Cloud, Fly.io, eigener
Server bei ITSD)? Er braucht dauerhaft ca. 1 GB RAM und muss vom MCP-Server
erreichbar sein (am einfachsten: beide auf demselben Server).

### Q2 · open · 2026-11-01T14:00:00Z
Kann Private AI die Vorschau neben dem Chat einbetten (iframe oder MCP Apps)?
Falls ja: von welcher Adresse aus (für `frame-ancestors`)? Falls nein, braucht
es eine eigene Redaktionsseite (eigene Spec) oder zwei Fenster nebeneinander.
