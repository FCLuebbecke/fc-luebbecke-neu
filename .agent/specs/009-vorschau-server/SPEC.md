---
modules: vorschau, infra
station: Doing
branch: spec/009-vorschau-vercel
owner: FC Luebbecke <Git@fcluebbecke.de>
order: 2
needs_human: true
angelegt: 2026-11-01
usecase: UC-001
open_question: Q2
depends_on: 008-inhalte-als-dateien
---

# Vorschau über Vercel-Previews mit Entwurfs-Branch

## Why

UC-001: Pflegende sehen Änderungen aus dem Chat neben dem Chat, bevor sie
veröffentlicht werden. Entschieden ist (Decision 1), dafür keinen eigenen
Server zu betreiben, sondern Vercel-Previews zu nutzen: Jeder Commit auf den
Branch `preview` erzeugt eine Vorschau, die unter einer festen Adresse
erreichbar ist. Die geöffnete Vorschau lädt sich selbst neu, sobald ein neuer
Stand fertig gebaut ist.

## What

Im Umfang:
- Branch **`preview`** im Repo, startet als Kopie von `main`. Nach jeder
  Veröffentlichung bzw. jedem Verwerfen wieder gleich `main` (macht der
  MCP-Server, Spec 010).
- **Feste Vorschau-Adresse:** die Branch-Adresse von Vercel
  (`…-git-preview-….vercel.app`), optional eine eigene Domain wie
  `vorschau.fcluebbecke.de`, die in Vercel dem Branch `preview` zugeordnet ist.
- **Stand-Kennung:** Jeder Build schreibt `/build.json` mit Commit-SHA und
  Zeitpunkt (aus `VERCEL_GIT_COMMIT_SHA`).
- **Automatisches Neuladen:** Nur in Builds des Branches `preview`
  (`VERCEL_GIT_COMMIT_REF === "preview"`) bindet das Layout ein kleines Skript
  ein, das alle 5 Sekunden `/build.json` abfragt und die Seite neu lädt, sobald
  sich der Commit ändert. Die Scroll-Position bleibt erhalten. Live- und
  andere Vorschau-Builds enthalten das Skript nicht.
- **Hinweisband** oben auf jeder Seite der Entwurfs-Vorschau: „Vorschau –
  nicht veröffentlicht“, damit sie nicht mit der Live-Seite verwechselt wird.
- **Nicht indexieren:** Vercel setzt für Preview-Adressen bereits
  `X-Robots-Tag: noindex`; für eine eigene Vorschau-Domain zusätzlich prüfen.
- **Einbettbarkeit:** Die Vorschau lässt sich in einem iframe anzeigen (für
  ein Panel in Private AI, Q2). Erlaubte Adressen über
  `Content-Security-Policy: frame-ancestors`, sobald Q2 geklärt ist.
- **Messung:** Zeit von Commit bis zur sichtbaren Änderung in der Vorschau,
  dokumentiert in `VORSCHAU.md`.

Nicht im Umfang:
- Schreiben, Veröffentlichen, Verwerfen (MCP-Server, Spec 010).
- Ein eigener Server für Vorschau in unter 2 Sekunden. Kann später ergänzt
  werden, ohne dass sich am MCP-Server viel ändert (Decision 1).
- Eine eigene Redaktionsseite mit Chatfenster (nur falls Q2 das ergibt).

## Acceptance

- Wenn ein Commit auf `preview` gepusht wird, dann zeigt eine im Browser
  geöffnete Vorschau den neuen Stand ohne Klick, sobald der Vercel-Build fertig
  ist; gemessen und dokumentiert, Ziel unter 90 Sekunden.
- Wenn man die Live-Seite oder eine andere Vorschau öffnet, dann gibt es weder
  das Neuladen-Skript noch das Hinweisband.
- Wenn man die Entwurfs-Vorschau öffnet, dann steht oben „Vorschau – nicht
  veröffentlicht“.
- Wenn man die Vorschau in einem iframe einer erlaubten Seite öffnet, dann wird
  sie angezeigt (sobald Q2 die Adresse liefert).
- Suchmaschinen indexieren die Vorschau nicht.

## Decisions

1. 2026-11-01 · Aus A1 („kann der nicht auch bei Vercel laufen?“) und
   Freigabe im Chat („weiter“): Vorschau über Vercel-Previews statt eigenem
   Server (Variante A). Vercel kann keinen dauerhaft laufenden Dev-Server
   betreiben; die Vorschau braucht deshalb geschätzt 30–60 Sekunden statt
   ~1 Sekunde, dafür kein zusätzlicher Server und keine Zusatzkosten. Ein
   eigener Server (Variante B) bleibt als spätere Ergänzung möglich.
3. 2026-11-01 · Geprüft und verworfen: Vorschau in der VM von Private AI.
   Private AI kann eine kleine VM für Skills starten, aber `astro dev` läuft
   dort nicht (Auskunft im Chat).
4. 2026-11-01 · Der Entwurfs-Branch heißt `preview` statt `entwurf` (Wunsch
   im Chat). Achtung, nicht verwechseln: Vercel nennt alle Nicht-Live-Builds
   ebenfalls „Preview“ (`VERCEL_ENV=preview`). Maßgeblich für Band und
   Neuladen ist allein der Branch-Name (`VERCEL_GIT_COMMIT_REF === "preview"`).
2. 2026-11-01 · Neuladen per Abfrage von `/build.json` statt WebSocket:
   funktioniert mit rein statischen Vercel-Builds ohne Server-Code.

## Tasks

- [x] Feature-Branch `spec/009-vorschau-vercel` von `dev` anlegen
- [x] `/build.json` beim Build erzeugen (Commit-SHA, Zeitpunkt)
      `src/pages/build.json.ts`, `src/lib/vorschau.ts`; `Cache-Control: no-store` in `vercel.json`
- [x] Neuladen-Skript und Hinweisband im Layout, nur für Branch `preview`
      `src/components/VorschauHinweis.astro`; zusätzlich `noindex`-Meta; lokal per `VORSCHAU=1`
- [ ] Branch `preview` von `main` anlegen und pushen (manuell, Push hier nicht möglich; Befehl in VORSCHAU.md)
      Hinweis: `preview` zweigt von `main` ab; Neuladen-Skript und
      Hinweisband wirken dort erst, wenn dieser Code live (in `main`) ist.
- [ ] Vorschau-Adresse festlegen (Vercel-Branch-Adresse oder eigene Domain)
- [ ] Zeit Commit → sichtbare Änderung messen
- [ ] `frame-ancestors` setzen (nach Q2)
- [x] `VORSCHAU.md` schreiben

## Verification

- `npm run build` (normal): `/build.json` = `{"commit":"lokal",…}`, kein
  Hinweisband, kein Skript, kein `noindex` in den Seiten; `/build.json` nicht
  in der Sitemap.
- `VORSCHAU=1 VERCEL_GIT_COMMIT_SHA=aaa111 VERCEL_GIT_COMMIT_REF=preview npm run build`:
  Hinweisband mit `data-commit="aaa111"` und `noindex, nofollow` auf allen
  Seiten.
- Neuladen im echten Browser (Chrome headless über DevTools-Protokoll, statisch
  ausgelieferter Vorschau-Build): `/fussball/mannschaften/` geöffnet, auf
  1200 px gescrollt, dann `commit` in `build.json` geändert → Seite lud nach
  3,3 s neu, Scroll-Position 1200 px wiederhergestellt, Band zeigt
  „· aktualisiert“.
- Auf Vercel getestet (2026-11-01, Peter): `preview` auf Stand `dev` gesetzt,
  zwei markierte Test-Commits gepusht (Badminton, Darts). Die offene Vorschau
  lud nach dem Vercel-Build selbst neu und zeigte die Änderung. Danach
  `preview` wieder auf `dev` zurückgesetzt.
- Offen: genaue Zeit Commit → Anzeige stoppen; Messung auf Vercel (braucht den gepushten Branch `preview` mit diesem
  Code in `main`).

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

### A1 · bo · 2026-11-01T14:22:23Z
kann der nicht auch bei versel laufen ?

### A2 · bo · 2026-11-01T14:23:18Z
beides noch nicht, was sollten wir machen ?
