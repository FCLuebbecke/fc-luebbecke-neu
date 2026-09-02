---
nummer: 002
titel: Mannschaftsfotos für 2. Mannschaft und Alte Herren
status: erledigt
bereich: fussball
prio: mittel
angelegt: 2026-09-02
gestartet: 2026-09-02
erledigt: 2026-09-02
branch: spec/002-fotos-weitere-herren
commit: ed3cfb6
verantwortlich:
---

# Mannschaftsfotos für 2. Mannschaft und Alte Herren

## Ziel

Auch die weiteren Herren-Mannschaften (2. Mannschaft, Alte Herren) zeigen
auf der Mannschaftsseite ihr Mannschaftsfoto. Die Erste bleibt optisch
führend, aber die anderen Teams wirken nicht mehr wie reine Datenkarten,
sondern als vollwertige Mannschaften mit Gesicht.

## Ausgangslage

Im Sanity-Schema `mannschaft` gibt es das Feld `foto` bereits für alle
Herren-Mannschaften. Auf `/fussball/mannschaften` wird es aber nur bei der
ersten Mannschaft ausgegeben: als große 16:9-Bühne oberhalb der Karte
(`.team-star`). Die weiteren Herren-Teams erscheinen darunter als kompakte
Karten (`.mcard`) in einem Dreispalter, nur mit Name, Liga, Trainer und
Training. Ein gepflegtes Foto wird dort schlicht ignoriert.

Betroffene Dateien:

- `src/pages/fussball/mannschaften.astro` – Block `weitereHerren` / `.mcard`
  sowie die zugehörigen Styles
- `src/sanity/schemaTypes/mannschaft.ts` – nur Beschreibungstext des Feldes
  `foto` anpassen („gedacht v. a. für die 1. & 2. Mannschaft“)

## Anforderungen

- [x] Jede weitere Herren-Mannschaft zeigt ihr Foto, sofern in Sanity eines
      gepflegt ist. Ohne Foto sieht die Karte aus wie heute.
- [x] Das Foto ist **deutlich kleiner** als das der Ersten, aber groß genug,
      um Gesichter zu erkennen: Fotobreite entspricht der Kartenbreite,
      Seitenverhältnis 16:9 oder 3:2, Ecken gerundet wie die Karte.
- [x] Die Hierarchie bleibt lesbar: Erste Mannschaft = breite Bühne über die
      volle Breite, weitere Teams = Kartenreihe mit Foto oben. Kein Foto der
      weiteren Teams darf höher sein als etwa die halbe Höhe der Ersten.
- [x] Alle Fotos einer Reihe haben dieselbe Höhe, unabhängig vom Original
      (Zuschnitt über Sanity-Hotspot, `fit("crop")`).
- [x] Alt-Text aus Sanity, sonst Fallback „Mannschaftsfoto <Name>“.
- [x] Mobil (eine Spalte) stapeln sich die Karten wie bisher, das Foto sitzt
      oben in der Karte.
- [x] Bilder werden lazy geladen und in passender Breite angefordert
      (ca. 800 px, nicht 1600 wie bei der Ersten).

## Nicht Teil dieser Spec

- Fotos für Jugend-Mannschaften (Feld ist dort ausgeblendet, Kinderfotos
  brauchen gesonderte Einwilligung der Eltern → eigene Spec).
- Lightbox / Vergrößern per Klick.
- Bildergalerie mit mehreren Fotos pro Team.

## Umsetzung

1. **Karte erweitern:** In `mannschaften.astro` im `weitereHerren`-Block
   vor `.team__head` ein `<img class="mcard__foto">` ausgeben, wenn
   `t.foto?.asset` vorhanden ist. URL über `urlFor(t.foto).width(800)
   .height(450).fit("crop").auto("format")`.
2. **Styles:** `.mcard` bekommt `overflow: hidden` und `padding: 0`;
   Innenabstand wandert in einen neuen Wrapper `.mcard__body`. Foto:
   `width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block`.
   Der grüne Akzent (heute `border-left`) wird zu einem 4-px-Balken oben,
   damit er nicht am Foto vorbeiläuft (Muster wie `.team-star::before`).
3. **Ohne Foto:** Karte ohne Bild behält den heutigen Aufbau, nur mit dem
   neuen Wrapper. Prüfen, dass Karten mit und ohne Foto in einer Reihe
   sauber nebeneinander stehen (Grid streckt auf gleiche Höhe).
4. **Schema-Text:** Beschreibung des Feldes `foto` auf „Wird oben auf der
   Karte angezeigt – bei der 1. Mannschaft groß, bei allen weiteren
   Herren-Teams als Kartenbild.“ ändern.
5. **Fallback-Daten:** Bleiben ohne Foto, dort ändert sich nichts.

## Abnahme

- Im Studio bei „2. Mannschaft“ ein Foto hochladen und veröffentlichen.
  Auf `/fussball/mannschaften` erscheint es oben in der Karte, die Erste
  bleibt sichtbar größer.
- „Alte Herren“ ohne Foto sieht aus wie bisher und steht sauber neben der
  Karte mit Foto.
- Mobil: Fotos füllen die Kartenbreite, keine horizontale Scrollleiste.
- Alt-Text im Quelltext vorhanden.

## Notizen

- Hotspot im Studio setzen, sonst werden bei 16:9-Zuschnitt Köpfe
  abgeschnitten.
- Offen: 16:9 (wie Erste) oder 3:2 (zeigt bei Gruppenfotos mehr Höhe)?
  Vorschlag: 16:9 für einheitliche Optik, Entscheidung bei der Umsetzung
  anhand echter Fotos.

## Umsetzungsnotizen (2026-09-02)

- Umgesetzt wie geplant, Seitenverhältnis **16:9** gewählt (einheitlich mit
  der Ersten; die echten Fotos sind Querformat-Gruppenbilder, Köpfe bleiben
  mit Hotspot im Bild).
- Abweichung: Das Grid streckt Karten **nicht** mehr auf gleiche Höhe
  (`align-items: start`). Mit Streckung wirkten Karten ohne Foto neben einer
  Fotokarte wie große Leerflächen. Karten ohne Foto sehen exakt aus wie vorher.
- Geprüft per `npm run build` und Screenshots (Headless Chrome, 1280 px) mit
  echten Sanity-Daten: 1. Mannschaft groß, 3. Mannschaft mit Kartenbild,
  2. und 4. ohne Foto daneben. Mobil-Test auf echtem Gerät steht noch aus.
