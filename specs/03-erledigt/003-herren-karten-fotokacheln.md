---
nummer: 003
titel: Herren-Karten als grüne Kacheln mit Foto im Hintergrund (Hover/Overlay)
status: erledigt
bereich: fussball
prio: mittel
angelegt: 2026-09-02
gestartet: 2026-09-02
erledigt: 2026-09-02
branch: spec/003-herren-karten-fotokacheln
commit: 3b1d33d
verantwortlich:
---

# Herren-Karten als grüne Kacheln mit Foto im Hintergrund

## Ziel

Die weiteren Herren-Mannschaften (2., 3., 4. …) stehen in ihrer gewohnten
Reihenfolge in einer Reihe gleich großer Karten. Ein vorhandenes
Mannschaftsfoto ist sichtbar, ohne die Reihe aus dem Gleichgewicht zu
bringen: Es liegt hinter einem grünen Schleier im Kartenhintergrund, tritt
beim Hover hervor und lässt sich per Tipp in voller Größe öffnen. Teams ohne
Foto sehen gleichwertig aus, nicht wie unfertig.

## Ausgangslage

Spec 002 hat das Foto als Kartenbild oben in die kompakte Karte gesetzt.
Ergebnis mit echten Daten: Nur die 3. Mannschaft hat ein Foto, die 2. und 4.
bekommen keines. Die Fotokarte ist dadurch doppelt so hoch wie ihre
Nachbarn, die Reihe wirkt unausgewogen. Eine Umsortierung (Fotokarten nach
oben) scheidet aus, weil die Reihenfolge 2. → 3. → 4. erhalten bleiben soll.

Heutiger Stand in `src/pages/fussball/mannschaften.astro`:

- `.teams-mini` – Dreispalter, `align-items: start`
- `.mcard` – weiße Karte, grüner Akzentbalken oben, optional `.mcard__foto`
  (16:9-Bild) über `.mcard__body`
- Trainer-Ausgabe über `TrainerListe` (Spec 001), Links in Logo-Grün

Design-Tokens in `src/styles/global.css`: `--color-green-900` (Tiefgrün),
`--color-green-overlay` (rgba Tiefgrün 0,55 – „dezenter Grün-Schleier“),
`--color-green-500` (Akzent).

## Anforderungen

- [x] Alle Karten der Reihe haben **dieselbe Höhe und denselben Aufbau**,
      unabhängig davon, ob ein Foto vorhanden ist. Reihenfolge bleibt die
      aus Sanity (`reihenfolge`).
- [x] Grundfläche aller Karten: Tiefgrün, Schrift weiß. Karte ohne Foto ist
      schlicht grün.
- [x] Karte mit Foto: Foto als Hintergrund (`object-fit: cover`), darüber ein
      grüner Schleier, sodass das Foto nur schemenhaft durchscheint und der
      Text sicher lesbar bleibt (Kontrast weiß auf Schleier ≥ 4,5:1).
- [x] **Hover / Fokus (Desktop):** Schleier wird deutlich heller, das Foto
      tritt hervor. Der untere Bereich mit dem Text behält einen dunklen
      Verlauf, sodass die Schrift auch im Hover lesbar bleibt.
- [x] **Tipp / Klick:** Ein kleines Kamera-Symbol (nur bei Karten mit Foto)
      öffnet das Foto in voller Größe in einem Overlay. Schließen per
      Schaltfläche, Klick auf den Hintergrund oder Escape. Umsetzung mit dem
      nativen `<dialog>`-Element und wenigen Zeilen Inline-Script, keine
      externe Bibliothek.
- [x] Karte ohne Foto: kein Kamera-Symbol, kein Hover-Effekt (nichts
      versprechen, was es nicht gibt); ggf. dezente Textur oder Verlauf,
      damit die Fläche nicht tot wirkt.
- [x] Tags (Liga) und Trainer-Kontaktlinks werden auf dunklem Grund weiß
      dargestellt (Links unterstrichen), Icons in Weiß.
- [x] Mobil: Karten stapeln, Kamera-Symbol mind. 44 px Tippfläche, Overlay
      füllt den Bildschirm, Bild bleibt im Seitenverhältnis.
- [x] Alt-Text aus Sanity für Hintergrund- und Overlay-Bild; Hintergrundbild
      als `<img>` (nicht CSS-`background`), damit lazy loading, `srcset`
      und Alt-Text funktionieren.
- [x] Ohne JavaScript: Kamera-Symbol ist ein Link direkt auf die Bilddatei
      (öffnet in neuem Tab), der Hover funktioniert rein per CSS.
- [x] `prefers-reduced-motion`: Übergänge des Schleiers entfallen.

## Nicht Teil dieser Spec

- Änderungen an der Karte der 1. Mannschaft (`.team-star`).
- Fotos für Jugend-Mannschaften.
- Bildergalerien oder Blättern zwischen Fotos im Overlay.

## Umsetzung

1. **Markup `.mcard`:** Struktur wird zu
   `article.mcard[.mcard--foto]` → optional `img.mcard__bg` (Foto, 800 px)
   → `div.mcard__schleier` → `div.mcard__body` (Kopf, Meta, Platzhalter)
   → optional `button.mcard__foto-btn` (Kamera) + `dialog.mcard__dialog`
   mit `img` in großer Auflösung (1600 px) und Schließen-Button.
   Die Kartenbild-Variante aus Spec 002 (`.mcard__foto` oben) entfällt.
2. **Styles:** `.mcard` mit `position: relative; min-height` (z. B. 12 rem)
   und `background: var(--color-green-900)`; `.mcard__bg` absolut, volle
   Fläche, `object-fit: cover`; `.mcard__schleier` absolut mit
   `background: linear-gradient(to top, rgba(10,80,18,.92), rgba(10,80,18,.55))`.
   Hover/Focus-within auf `.mcard--foto`: oberer Stop des Verlaufs auf
   ≈ 0,15, unterer bleibt ≈ 0,85. Transition 0,25 s, unter
   `prefers-reduced-motion` aus. `.mcard__body` relativ, weiße Schrift;
   `.tag`, `dt`, Trainer-Links auf weiß umstellen.
3. **Grid:** `.teams-mini` zurück auf `align-items: stretch` (Standard),
   damit alle Kacheln gleich hoch sind; Body füllt per Flex.
4. **Overlay:** Pro Fotokarte ein `<dialog>` mit dem Bild. Inline-Script
   (ein `<script>` in der Seite): Klick auf `.mcard__foto-btn` →
   `dialog.showModal()`; Klick auf den Dialog-Hintergrund oder den
   Schließen-Button → `close()`. Ohne JS: Button ist ein `<a href=bild
   target=_blank>` (progressive enhancement: Script tauscht Verhalten).
5. **TrainerListe:** Farbe der Links über eine CSS-Variable
   (z. B. `--trainer-link-color`) steuerbar machen, Standard Logo-Grün,
   in `.mcard` auf Weiß setzen.
6. **Schema-Text** des Feldes `foto` anpassen: „… bei allen weiteren
   Herren-Teams als Hintergrund der Karte (Hover zeigt das Foto, Tipp öffnet
   es groß).“
7. **Spec 002** in `03-erledigt/` um Notiz ergänzen: „Durch Spec 003
   ersetzt.“

## Abnahme

- Reihe 2./3./4. Mannschaft: drei gleich hohe grüne Kacheln in der
  Sanity-Reihenfolge. Nur die 3. zeigt Foto (schemenhaft) und Kamera-Symbol.
- Hover über der 3.: Foto wird klar sichtbar, Text bleibt lesbar.
- Klick auf Kamera: Foto groß im Overlay, Escape schließt.
- 2. und 4.: schlicht grün, kein Symbol, kein Hover.
- Mobil (echtes Gerät): Kacheln gestapelt, Tipp öffnet Overlay, Overlay
  schließt sauber, kein horizontales Scrollen.
- Kontrast der weißen Schrift auf Schleier und im Hover-Zustand geprüft
  (z. B. mit dem Kontrast-Tool des Browsers).

## Notizen

- Bewusst gegen Platzhalter-Wappen entschieden: Zwei von drei Karten mit
  „Foto folgt“ wirken wie eine Baustelle.
- Bewusst gegen Umsortierung (Fotokarten nach oben) entschieden: Reihenfolge
  2. → 3. → 4. ist inhaltlich gesetzt.
- Farbregel 60-30-10: Die Reihe wird durch drei dunkelgrüne Flächen
  schwerer. Falls es zu viel Grün wird: Alternative ist Hellgrün
  `--color-green-050` als Grundfläche mit dunkler Schrift, Foto dann nur
  im Hover. Bei der Umsetzung anhand Screenshots entscheiden.

## Umsetzungsnotizen (2026-09-02)

- Umgesetzt wie geplant. Tiefgrün als Grundfläche beibehalten (nicht die
  Hellgrün-Alternative): Auf den Screenshots wirkt die Reihe ruhig und klar
  unter der hellen Bühne der Ersten.
- Mindesthöhe der Kacheln 11 rem mobil, 15 rem ab 760 px, damit über dem
  Text etwas Foto sichtbar bleibt und leere Kacheln mobil nicht zu hoch sind.
- Text sitzt in allen Kacheln unten (`margin-top: auto`), bei viel Text
  füllt er die Kachel – das Foto scheint dann vor allem im Hover durch.
- Geprüft per Build und DevTools-Protokoll (Headless Chrome): Ruhe, Hover,
  Overlay auf/zu per Escape, mobil 390 px ohne horizontales Scrollen.
  Kontrast: weiße Schrift auf Schleier ≥ 0,80 Alpha Tiefgrün, im Hover
  unten ≥ 0,70. Test auf echtem Gerät steht noch aus.
