---
modules: seiten
station: Doing
ready: true
branch: spec/011-vereinsshop
order: 4
needs_human: true
angelegt: 2026-11-22
---

# Vereinsshop (Macron) einbinden: Banner „Trag Lübbecke.“ + Links

## Why

Der FC Lübbecke hat einen Vereinsshop bei Macron
(https://clubshop.macron.com/selfd_gmbh/fc-lubbecke-e-v). Zur Eröffnung gibt
es 10 % Rabatt vom 26.11. bis 10.12.2026. Der Shop soll auf der Webseite
sichtbar sein: als auffälliger Banner auf der Startseite und als dauerhafter
Link, damit er von jeder Seite erreichbar ist.

## What

Im Umfang:
- Startseite: Banner nach der Vorlage „TRAG LÜBBECKE.“ (cremefarbener
  Grund, Logo-Lockup, große Überschrift, Text, Link „Zum Vereinsshop →“,
  Rabatt-Badge „−10 % bis 10.12.“, zwei Produktkarten Trikot + Sweatjacke).
  Position: direkt unter dem Hero, vor „Unsere Sparten“.
- Header: „Vereinsshop ↗“ im Untermenü „Verein“ (extern, neuer Tab);
  seit Spec 016 nicht mehr auf oberster Ebene, damit der Header ruhig bleibt.
- Footer: Link „Vereinsshop ↗“ in der Sparten-/Vereinsliste.
- Rabatt-Badge und Rabatt-Satz hängen an einem Enddatum im Code; nach dem
  10.12.2026 bleibt der Banner ohne Rabatt stehen (nächster Build).

Nicht im Umfang:
- Produktdaten live aus dem Shop laden (Macron bietet keine API; Bilder und
  Preise sind statisch aus der Vorlage übernommen).
- Eigene Shop-Seite auf der Vereinswebseite.

## Acceptance

- Wenn die Startseite geladen wird, dann steht unter dem Hero der Banner
  mit Überschrift „Trag Lübbecke.“, Rabatt-Badge und zwei Produktkarten;
  der Link öffnet den Macron-Shop in einem neuen Tab.
- Wenn die Startseite auf einem Handy (≤ 600 px) geladen wird, dann stehen
  Text und Produktkarten untereinander, nichts läuft über den Rand.
- Wenn eine beliebige Seite geladen wird, dann enthält das Untermenü
  „Verein“ den Punkt „Vereinsshop ↗“ und der Footer „Vereinsshop ↗“, beide
  mit `target="_blank"` und `rel="noopener noreferrer"`.
- Wenn das Build-Datum nach dem 10.12.2026 liegt, dann zeigt der Banner
  weder Badge noch Rabatt-Satz noch Streichpreise.

## Decisions

1. 2026-11-22 – Position direkt unter dem Hero: Aktionsbanner gehören in
   den ersten Scroll; „Unsere Sparten“ bleibt zweiter Block und verliert
   nichts, weil der Banner flach ist.
2. 2026-11-22 – Produktbilder aus der gelieferten Vorlage ausgeschnitten
   (`public/shop-trikot.webp`, `public/shop-jacke.webp`). Bessere Originale
   aus dem Shop können 1:1 ersetzt werden.
3. 2026-11-24 – Hintergrund des Banners im Tiefgrün der Seite statt Creme (Wunsch im Chat), Texte weiß, Badge und Preise bleiben limettengrün.
4. 2026-11-24 – Branch auf main (Spec 012/013/016) umgesetzt; Shop-Link
   wandert ins Verein-Untermenü (Wunsch im Chat), der frühere Header-Fix
   für mittlere Breiten entfällt mit dem schlankeren Header.
5. 2026-11-22 – Limettengrün aus der Vorlage übernommen
   (bewusste Ausnahme vom Grün/Weiß-Schema für den Aktionsbanner).

## Tasks

- [x] Komponente `src/components/Vereinsshop.astro` nach Vorlage bauen
- [x] Banner in `src/pages/index.astro` unter dem Hero einhängen
- [x] „Vereinsshop ↗“ im Verein-Untermenü und im Footer
- [x] Rabatt an Enddatum koppeln (Badge, Satz, Streichpreise)
- [x] `npm run build`, Desktop- und Handy-Ansicht prüfen

## Verification

- `npm run build` (2026-11-22): 14 Seiten, keine Fehler; `dist/index.html`
  enthält den Banner, Header und Footer auf allen Seiten den Shop-Link mit
  `target="_blank" rel="noopener noreferrer"`.
- Screenshots per Playwright + lokalem Chrome (astro preview) bei 390, 768,
  900, 1000, 1100, 1200 und 1440 px: `scrollWidth` = Viewport-Breite (kein
  horizontaler Überlauf); Banner auf Handy gestapelt, Badge neben dem CTA,
  zwei Produktkarten nebeneinander.
- 2026-11-24 nach Rebase auf main: Build fehlerfrei, Banner weiterhin
  zwischen Hero und Sparten; „Vereinsshop ↗“ im Verein-Dropdown (Screenshot).
- Enddatum-Logik: `aktion = new Date() <= 2026-12-10T23:59:59+01:00` zur
  Build-Zeit; danach erscheinen Badge, Rabatt-Satz und Streichpreise nicht
  mehr. Hinweis: nach dem 10.12. ist ein neuer Build (Push oder Redeploy)
  nötig, da die Seite statisch ist.

## Review

Build: Branch spec/011-vereinsshop · Vercel-Vorschau
Nicht Teil dieser Abnahme: Originalfotos aus dem Shop (aktuell Ausschnitte
aus der Vorlage, etwas unscharf)

### R1 · Banner unter dem Hero
- Given: die Startseite der Vercel-Vorschau
- When: du unter das große Hero-Foto scrollst
- Then: der cremefarbene Banner „Trag Lübbecke.“ mit Badge „−10 % bis 10.12.“ und zwei Produktkarten erscheint; Klick auf „Zum Vereinsshop →“ oder eine Karte öffnet den Macron-Shop in neuem Tab
- [ ] ok

### R2 · Handy-Ansicht
- Given: die Startseite auf dem Handy
- When: du zum Banner scrollst
- Then: Überschrift, Text, Link, Badge und die beiden Karten stehen sauber untereinander bzw. nebeneinander, nichts ist abgeschnitten
- [ ] ok

### R3 · Shop-Links in Menü und Footer
- Given: eine beliebige Unterseite (z. B. Fußball → Mannschaften)
- When: du „Verein“ aufklappst (Desktop und Burger) und in den Footer schaust
- Then: „Vereinsshop ↗“ im Verein-Menü und im Footer öffnen den Macron-Shop in neuem Tab
- [ ] ok

## Questions
