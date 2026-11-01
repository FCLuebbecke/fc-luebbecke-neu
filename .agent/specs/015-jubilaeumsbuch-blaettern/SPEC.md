---
modules: seiten
station: Doing
ready: true
branch: spec/015-jubilaeumsbuch-blaettern
owner: FC Luebbecke <Git@fcluebbecke.de>
order: 1
needs_human: true
angelegt: 2026-11-01
usecase: UC-002
parent: 014-jubilaeumsbuch
---

# Jubiläumsbuch: eigener Menüpunkt und Leseprobe zum Blättern

## Why

Rückmeldung zu Spec 014: Das Jubiläumsbuch gehört zum ganzen Verein, nicht
unter Fußball. Und die Leseprobe soll sich wie ein echtes Buch blättern
lassen – ohne zusätzliche Installation.

## What

- Navigation: „100 Jahre“ als eigener Hauptmenüpunkt (nach Laufsport), raus
  aus dem Fußball-Untermenü; aktiver Menüpunkt auf `/100-jahre`.
- Leseprobe als Blätterbuch (`src/components/Blaetterbuch.astro`), reines
  CSS-3D + wenig JavaScript, keine neue Abhängigkeit:
  - Desktop (≥ 700 px): Doppelseite, Seiten drehen sich um den Buchrücken,
    geschlossenes Buch mittig, Schattierung zur Bindung.
  - Mobil: eine Seite, die nach links wegklappt.
  - Bedienung: Knöpfe, Tippen auf rechte/linke Hälfte, Wischen, Pfeiltasten;
    „Seite vergrößern“ öffnet die bestehende Großansicht.
  - Schlussseite „Ende der Leseprobe“ mit Preis + „Jetzt bestellen“
    (bei `lieferbar: false` „Leider vergriffen“), danach Rückseite.
  - Ohne JavaScript bleibt die Bilder-Galerie; „Bewegung reduzieren“ → ohne Animation.
- Header: Mit 7 Menüpunkten passt die Leiste erst ab 1024 px → Burger-Menü
  jetzt bis 1023 px (vorher 859 px), zwischen 1024 und 1279 px engere Abstände.
- `CLAUDE.md` Abschnitt 5: Menüpunkt „100 Jahre“ ergänzt.

Nicht enthalten: weitere Leseprobe-Seiten, Änderungen an Bestellung/Preis.

## Acceptance

- Wenn ich das Hauptmenü öffne, dann steht dort „100 Jahre“; im
  Fußball-Untermenü steht das Buch nicht mehr.
- Wenn ich auf `/100-jahre` bin, dann ist „100 Jahre“ als aktiv unterstrichen.
- Wenn ich auf dem Desktop „Weiter“ klicke, dann dreht sich die rechte Seite
  sichtbar um den Buchrücken und ich sehe eine Doppelseite.
- Wenn ich auf dem Handy wische, dann klappt die Seite weg und die nächste erscheint.
- Wenn ich „Seite vergrößern“ tippe, dann öffnet sich die Großansicht der
  aktuellen Seite.
- Wenn ich bis zum Ende blättere, dann sehe ich „Ende der Leseprobe“ mit
  Preis und Bestellknopf.
- Zwischen 1024 px und 1279 px passt die Menüleiste in eine Zeile, darunter
  erscheint das Burger-Menü.
- Es kommt kein npm-Paket hinzu; die Build-Zeit verlängert sich nicht spürbar.

## Decisions

1. 2026-11-01 · Menüpunkt heißt „100 Jahre“ (kurz, passt in die Leiste),
   steht nach Laufsport, ohne Untermenü – ein „Verein“-Menü mit nur einem
   Eintrag wäre leer. Footer-Link und Startseiten-Teaser bleiben.
2. 2026-11-01 · Blättern selbst gebaut (CSS `transform: perspective()
   rotateY()`, `backface-visibility`) statt Bibliothek – Vorgabe „ohne
   Installation“, keine Build-Zeit, ca. 200 Zeilen.
3. 2026-11-01 · Jede Seite hat ihre eigene Perspektive, das Buch selbst ist
   flach → `z-index` regelt die Stapelreihenfolge zuverlässig (kein Flackern).
4. 2026-11-01 · Burger-Menü bis 1023 px: bei 860 px wurde „Mitglied werden“
   mit 7 Menüpunkten abgeschnitten (Screenshot).
5. 2026-11-01 · Schatten nur auf sichtbaren/drehenden Blättern – sonst
   addieren sich die Schatten des Stapels zu einem dunklen Rand.

## Tasks

- [x] „100 Jahre“ als Hauptmenüpunkt, aus Fußball-Untermenü entfernen, `active` setzen
- [x] Komponente `Blaetterbuch.astro` (Doppel-/Einzelseite, Steuerung, Fallback, reduced motion)
- [x] Schlussseite + Rückseite, „vergriffen“-Variante
- [x] Großansicht über Ereignis `jb:grossansicht` anbinden, alte Galerie-Styles entfernen
- [x] (added) Menüleiste bricht bei 1280 px um → `nowrap`, engere Abstände 1024–1279 px, Burger bis 1023 px
- [x] (added) Stapelschatten zu dunkel → Schatten nur für sichtbare Blätter, mobil `overflow-x: clip`
- [x] (added) `CLAUDE.md` Navigationstabelle ergänzt
- [x] Build, Build-Zeit, Browser-Prüfung

## Verification

- `npm run build`: 16 Seiten, ohne Cache 5,6 s gesamt (Spec 014: 4,8–5,2 s,
  Messschwankung); `package.json` unverändert.
- Browser-Prüfung per Chrome DevTools Protocol in echter Zeit (Skript nur
  lokal, nicht im Repo), Ergebnisse:
  - 1280 px geschlossen: Cover mittig, Zähler „Titel“, alle 10 Bilder geladen.
  - nach 2× Weiter: Doppelseite „1925 – 1975 · 70er – 90er“; Momentaufnahme
    während des Blätterns zeigt die Seite in 3D-Drehung.
  - nach 5× Weiter: „Das neue Vereinsheim · Ende der Leseprobe“ mit Preis
    19,25 € und „Jetzt bestellen“.
  - „Seite vergrößern“: Großansicht öffnet `seite-030.webp` („Seite 5 von 10“).
  - Pfeiltaste rechts auf dem Buch: „Vorwort · Inhalt“.
  - 390 px (mobil emuliert): Einzelseite, Seitenbreite 390 px (kein
    seitliches Scrollen), Wegklappen sichtbar, Knöpfe 44 px.
  - Menü: 1280 px und 1024 px einzeilig, „100 Jahre“ aktiv unterstrichen;
    1000 px Burger.
- Nicht geprüft: echtes Wischen auf einem Touch-Gerät, Safari/iOS → Review.

## Review

Build: Vercel-Vorschau des Branches spec/015-jubilaeumsbuch-blaettern
Not part of this acceptance: Android-Tablets im Querformat

### R1 · Menüpunkt
- Given: Vorschau auf dem Laptop
- When: du dir die Menüleiste ansiehst und „100 Jahre“ anklickst
- Then: „100 Jahre“ steht im Hauptmenü (nicht mehr unter Fußball), Leiste einzeilig, auf der Seite aktiv unterstrichen
- [ ] ok

### R2 · Blättern am Laptop
- Given: `/100-jahre`, Abschnitt Leseprobe
- When: du mit „Weiter“, Klick auf die rechte Seite und den Pfeiltasten bis zum Ende und zurück blätterst
- Then: Seiten drehen sich flüssig wie ein Buch, am Ende „Ende der Leseprobe“ mit Bestellknopf
- [ ] ok

### R3 · Blättern am Handy (iPhone/Safari)
- Given: `/100-jahre` auf dem Handy
- When: du durch die Leseprobe wischst und „Seite vergrößern“ tippst
- Then: Seite klappt weg, nächste erscheint, nichts flackert; Großansicht ist lesbar
- [ ] ok
