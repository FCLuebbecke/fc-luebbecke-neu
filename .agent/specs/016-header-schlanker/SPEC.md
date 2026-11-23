---
modules: seiten
station: Done
ready: true
branch: spec/016-header-schlanker
order: 8
needs_human: true
angelegt: 2026-11-23
---

# Header entschlacken: Start raus, „Verein“-Untermenü

## Why

Der Header trägt sieben Menüpunkte plus Button: Start, Aktuelles, Fußball,
Badminton, Darts, Laufsport, 100 Jahre, „Mitglied werden“. Das wirkt
vollgepackt und wird mit jedem weiteren Punkt (z. B. Shop) enger.

## What

Im Umfang:
- „Start“ entfällt: das Logo führt zur Startseite (Standard).
- Neuer Punkt „Verein ▾“ mit Untermenü „Aktuelles“ und „100 Jahre
  FC Lübbecke“. Beide verschwinden als eigene Punkte.
- Der Button „Mitglied werden“ bleibt rechts (claude.md Abschnitt 5) und
  steht nicht zusätzlich im Untermenü.
- Anordnung: Logo links, Menü mittig zwischen Logo und Button, Button
  rechts außen (vorher hing das Menü asymmetrisch am Button).
- Aktiv-Zustand: „Verein“ ist unterstrichen, wenn eine Unterseite davon
  aktiv ist (`aktuelles`, `100-jahre`).

Ergebnis: Fußball ▾ · Badminton ▾ · Darts ▾ · Laufsport ↗ · Verein ▾ + Button.

Nicht im Umfang: Footer, Inhalte der Unterseiten, Shop-Link (Spec 011).

## Acceptance

- Wenn eine Seite lädt, dann zeigt das Hauptmenü genau fünf Punkte plus
  den Button, ohne „Start“, „Aktuelles“ und „100 Jahre“ auf oberster Ebene.
- Wenn „Verein“ aufgeklappt wird, dann stehen dort „Aktuelles“ und
  „100 Jahre FC Lübbecke“; beide Ziele funktionieren.
- Wenn `/aktuelles` oder `/100-jahre` geöffnet ist, dann ist „Verein“
  als aktiv markiert.
- Wenn das Burger-Menü auf dem Handy geöffnet wird, dann lässt sich „Verein“
  wie die Sparten aufklappen.

## Decisions

1. 2026-11-23 – „Start“ raus statt kleiner: Logo-Klick ist die bekannte
   Konvention, der Punkt bringt keine Information.
2. 2026-11-23 – „Aktuelles“ und „100 Jahre“ unter „Verein“ (Wunsch im
   Chat): beides gehört zum ganzen Verein, ein Untermenü „Verein“ ist in
   claude.md Abschnitt 5 vorgesehen. Die Startseite zeigt Aktuelles und
   das Jubiläum ohnehin als Teaser.
3. 2026-11-23 – „Mitglied werden“ nicht ins Untermenü: der Button rechts
   ist der eine Weg dorthin, doppelt wirkt unaufgeräumt.

## Tasks

- [x] Navigation in `Header.astro` umbauen
- [x] Aktiv-Logik: Elternpunkt aktiv, wenn Unterseite aktiv
- [x] Build + Screenshots Desktop (1024/1280/1440) und Handy-Burger

## Verification

- `npm run build` (2026-11-23): fehlerfrei.
- Playwright + lokales Chrome: Header bei 1024, 1280 und 1440 px zeigt
  Fußball · Badminton · Darts · Laufsport ↗ · Verein, mittig zwischen Logo
  und Button; Dropdown „Verein“ mit Aktuelles und 100 Jahre; auf `/100-jahre`
  ist „Verein“ unterstrichen. Handy 390 px: Burger-Menü, „Verein“ klappt
  auf, Button unten über volle Breite.

## Review

Build: Branch spec/016-header-schlanker · Vercel-Vorschau

### R1 · Header ruhig und symmetrisch
- Given: eine beliebige Seite der Vorschau auf dem Desktop
- When: du den Header anschaust
- Then: fünf Menüpunkte sitzen mittig zwischen Logo und Button, nichts wirkt gedrängt
- [x] ok

### R2 · Verein-Menü
- Given: der Header auf Desktop und im Handy-Burger
- When: du „Verein“ öffnest und „Aktuelles“ bzw. „100 Jahre FC Lübbecke“ wählst
- Then: die jeweilige Seite öffnet sich und „Verein“ ist dort unterstrichen
- [x] ok

## Questions
