---
modules: seiten
station: Doing
ready: true
branch: spec/013-hero-hochkant
order: 6
needs_human: true
angelegt: 2026-11-23
---

# Hero-Foto: eigener Hochkant-Ausschnitt für Handys

## Why

Das Hero-Foto ist eine breite Luftaufnahme (4:3). Auf dem Handy ist der Hero
hochkant, `object-fit: cover` schneidet links und rechts rund 60 % weg.
Übrig bleibt ein Streifen mit viel Himmel und Parkplatz, Platz und
Vereinsheim sind kaum zu sehen.

## What

Im Umfang:
- Hochkant-Ausschnitt (2:3) aus dem Original `assets-src/hero.jpg`, mit
  Spielfeld und Vereinsheim in der Mitte: `public/hero-hochkant-980.webp`
  und `public/hero-hochkant-640.webp`.
- `Hero.astro`: im `picture`-Element eine `source` mit
  `media="(max-width: 767px)"`, die nur Handys den Hochkant-Ausschnitt
  liefert. Desktop/Tablet unverändert.

Nicht im Umfang: Höhe oder Text des Heros, neues Foto.

## Acceptance

- Wenn die Startseite auf einem Handy (≤ 767 px) lädt, dann zeigt der Hero
  den Hochkant-Ausschnitt mit Spielfeld und Vereinsheim.
- Wenn die Startseite auf Desktop lädt, dann ist das Foto wie bisher.

## Decisions

1. 2026-11-23 – Ausschnitt x = 540…1520 px des Originals (volle Höhe):
   Vereinsheim bleibt im Bild, Beachfeld links fällt weg.

## Tasks

- [x] Hochkant-Varianten erzeugen (980 und 640 px breit, WebP)
- [x] `picture`-Quelle für Handys in `Hero.astro`
- [x] Build + Screenshots Handy/Desktop

## Verification

- `npm run build` (2026-11-23): fehlerfrei.
- Playwright, iPhone-Emulation 390 × 844 (DPR 2): `currentSrc` ist
  `/hero-hochkant-980.webp`, das Bild misst 390 × 585 px; Screenshot zeigt
  Spielfeld und Vereinsheim statt Himmel und Parkplatz.
- Desktop 1440 px: `currentSrc` unverändert `/hero-1280.webp`/`-1920.webp`,
  Bild wie vorher.
- Dateigrößen: 640er 86 kB, 980er 147 kB (WebP, Qualität 80).

## Review

Build: Branch spec/013-hero-hochkant · Vercel-Vorschau

### R1 · Hero-Foto auf dem Handy
- Given: die Startseite der Vorschau auf deinem Handy
- When: du den Hero anschaust
- Then: Spielfeld und Vereinsheim sind zu sehen, nicht nur Himmel und Parkplatz
- [ ] ok

## Questions
