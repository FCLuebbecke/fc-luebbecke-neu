---
modules: seiten
station: Doing
ready: true
branch: spec/012-hero-schlanker
order: 5
needs_human: true
angelegt: 2026-11-23
---

# Hero der Startseite entschlacken

## Why

Der Hero trägt zu viel Text: Kicker, Titel, Claim, Fließtext, zwei Buttons,
Sparten-Leiste und ein „1925“-Siegel. Vieles davon steht doppelt: das Logo
im Header sagt „FC Lübbecke e.V. – since 1925“, der Sparten-Block direkt
darunter erklärt die vier Sparten. Der Hero soll eine Aussage machen, nicht
die Seite zusammenfassen.

## What

Im Umfang:
- Entfernen: Kicker („Sportverein seit 1925 · Lübbecke“), Fließtext,
  zweiter Button „Unsere Sparten“, „1925 gegründet“-Siegel.
- Bleibt: Foto mit Grün-Schleier, Titel „FC Lübbecke“, Claim
  „Unser Verein. Unser Lübbecke.“, ein Button „Mitglied werden“.
- Sparten-Leiste wird zur Navigation: die vier Chips verlinken auf die
  Sparten-Seiten (Laufsport extern, ↗), ersetzen damit den Button
  „Unsere Sparten“.
- Einblend-Animation von sechs gestaffelten Schritten auf zwei reduzieren.

Nicht im Umfang: neues Foto, Änderungen am Sparten-Block.

## Acceptance

- Wenn die Startseite lädt, dann zeigt der Hero genau: Titel, Claim, einen
  Button und vier Sparten-Chips. Kein Kicker, kein Fließtext, kein Siegel.
- Wenn ein Sparten-Chip geklickt wird, dann öffnet sich die jeweilige
  Sparten-Seite; Laufsport in neuem Tab mit ↗.
- Wenn `prefers-reduced-motion` aktiv ist, dann ist alles sofort sichtbar.

## Decisions

1. 2026-11-23 – Titel bleibt „FC Lübbecke“ (H1 für Suchmaschinen), der
   Claim bleibt als einzige Zeile Text darunter.
2. 2026-11-23 – Die Sparten-Chips werden Links statt reiner Deko: das ist
   das eine Element, das der Hero behält, also soll es auch etwas tun.

## Tasks

- [x] Hero.astro: Kicker, Lead, Ghost-Button, Siegel entfernen
- [x] Sparten-Chips als Links (Laufsport extern)
- [x] Animation vereinfachen, reduced-motion prüfen
- [x] Build + Screenshots Desktop/Handy

## Verification

- `npm run build` (2026-11-23): fehlerfrei, 14 Seiten.
- Playwright + lokales Chrome gegen `astro preview`, 390 und 1440 px,
  `reducedMotion: reduce`: Hero zeigt Titel, Claim, einen Button, vier
  Sparten-Links (Laufsport mit ↗); kein Kicker, Fließtext, Siegel. Kein
  horizontaler Überlauf. Handy: Chips in zwei Reihen, Button volle Breite.
- Entfernte CSS-Blöcke (`hero__kicker`, `hero__lead`, `hero__seal`) sind
  weg, keine verwaisten Selektoren.

## Review

Build: Branch spec/012-hero-schlanker · Vercel-Vorschau

### R1 · Hero wirkt ruhiger
- Given: die Startseite der Vorschau auf Desktop und Handy
- When: du den Hero anschaust
- Then: nur Titel, Claim, „Mitglied werden“ und die vier Sparten; es fehlt dir nichts
- [ ] ok

### R2 · Sparten-Chips führen zur Sparte
- Given: der Hero
- When: du „Darts“ und „Laufsport ↗“ anklickst
- Then: Darts öffnet die Darts-Seite, Laufsport die Berglöwen in neuem Tab
- [ ] ok

## Questions
