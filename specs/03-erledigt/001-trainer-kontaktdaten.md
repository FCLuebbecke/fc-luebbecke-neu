---
nummer: 001
titel: Telefonnummer und E-Mail-Adresse für Trainer
status: erledigt
bereich: fussball
prio: mittel
angelegt: 2026-09-02
gestartet: 2026-09-02
erledigt: 2026-09-02
branch: spec/001-trainer-kontaktdaten
commit: cdbc30b
verantwortlich:
---

# Telefonnummer und E-Mail-Adresse für Trainer

## Ziel

Eltern und Interessierte sollen den Trainer einer Mannschaft direkt erreichen
können. Zu jedem Trainer lassen sich im Admin-Studio optional eine
Telefonnummer und eine E-Mail-Adresse pflegen, die auf der Mannschaftsseite
anklickbar angezeigt werden.

## Ausgangslage

Der Trainer ist im Sanity-Schema `mannschaft` nur ein einzelnes Textfeld
`trainer` (z. B. „Peter Dahm (Cheftrainer)“). Kontaktdaten können nicht
hinterlegt werden. Auf der Seite `/fussball/mannschaften` wird der Name als
reine Textzeile unter „Trainer“ ausgegeben. Wer Kontakt aufnehmen will, muss
über das allgemeine Kontaktformular gehen.

Betroffene Dateien:

- `src/sanity/schemaTypes/mannschaft.ts` – Schema, Feld `trainer`
- `src/lib/sanity.ts` – Typ `Mannschaft` und `MANNSCHAFTEN_QUERY`
- `src/pages/fussball/mannschaften.astro` – Ausgabe in drei Kartenvarianten
  (Erste Mannschaft, weitere Herren, Jugend) sowie Fallback-Daten

## Anforderungen

- [x] Im Admin-Studio können je Trainer **Telefonnummer** und **E-Mail-Adresse**
      erfasst werden. Beide Felder sind optional.
- [x] Eine Mannschaft kann **mehrere Trainer** haben (Cheftrainer, Co-Trainer,
      Betreuer), jeder mit eigener Rolle und eigenen Kontaktdaten.
- [x] Auf der Mannschaftsseite werden Telefon als `tel:`-Link und E-Mail als
      `mailto:`-Link ausgegeben. Fehlt ein Wert, wird die Zeile weggelassen.
- [x] Bestehende Einträge im alten Textfeld `trainer` funktionieren weiter,
      bis sie im Studio umgezogen sind (Fallback wie bei `trainingszeiten`).
- [x] Mobil sind Telefon- und Mail-Links mindestens 44 px hoch antippbar.
- [x] Ausgabe der Kontaktdaten nur, wenn im Studio ein Haken
      „Kontaktdaten veröffentlichen“ gesetzt ist (Einwilligung des Trainers).

## Nicht Teil dieser Spec

- Trainer als eigenen Dokumenttyp mit Foto und Vita.
- Kontaktdaten für Badminton- und Darts-Ansprechpartner (eigene Spec).
- Spamschutz für Mailadressen (z. B. Verschleierung), zunächst Klartext-Link.

## Umsetzung

1. **Schema:** Neues Array-Feld `trainerteam` im Typ `mannschaft` mit
   Objekten `{ name, rolle, telefon, email, veroeffentlichen }`. Das alte
   Feld `trainer` als `deprecated` markieren und nur anzeigen, wenn befüllt
   (Muster wie bei `trainingszeiten`).
2. **Query & Typ:** `MANNSCHAFTEN_QUERY` und Typ `Mannschaft` in
   `src/lib/sanity.ts` um `trainerteam[]{ name, rolle, telefon, email,
   veroeffentlichen }` erweitern.
3. **Ausgabe:** Hilfsfunktion `trainerZeilen(mannschaft)` analog zu
   `trainingZeilen`, die `trainerteam` bevorzugt und sonst auf `trainer`
   zurückfällt. Alle drei Kartenvarianten in `mannschaften.astro` darauf
   umstellen. Telefon und Mail als Links mit Icon oder Präfix („Tel.“, „Mail“).
4. **Fallback-Daten:** Die D-Jugend im Fallback als Beispiel mit
   `trainerteam` befüllen, restliche Einträge belassen.
5. **Datenschutz:** Hinweis in der Datenschutzerklärung prüfen, ob die
   Veröffentlichung von Trainer-Kontaktdaten abgedeckt ist.

## Abnahme

- Im Admin-Studio lässt sich für die D-Jugend ein Trainer mit Telefon und
  Mail anlegen und der Haken „veröffentlichen“ setzen.
- Auf `/fussball/mannschaften` erscheinen beide Angaben als Links; ein Tipp
  auf dem Handy startet Anruf bzw. Mail-App.
- Ohne Haken oder ohne Werte erscheint nur der Name wie bisher.
- Mannschaften mit altem Feld `trainer` zeigen weiterhin den Namen an.

## Notizen

- Einwilligung der Trainer zur Veröffentlichung schriftlich einholen, bevor
  Daten live gehen.
- Offen: Soll auch WhatsApp verlinkt werden? Vorerst nein, nur `tel:`.

## Umsetzungsnotizen (2026-09-02)

- Umgesetzt wie geplant, zusätzlich Komponente `src/components/TrainerListe.astro`
  für die drei Kartenvarianten.
- Fallback-Daten der D-Jugend enthalten bewusst **keine** Kontaktdaten; echte
  Telefon/E-Mail werden im Admin-Studio gepflegt, nicht im Code.
- Datenschutzerklärung um Abschnitt 6 „Veröffentlichte Kontaktdaten von
  Trainern und Ansprechpartnern“ ergänzt, Folgeabschnitte neu nummeriert.
- Geprüft per `npm run build` und Rendertest der Komponente mit Beispieldaten
  (Links `tel:`/`mailto:` korrekt, ohne Haken nur Name). Mobil-Test auf echtem
  Gerät steht noch aus.
- Vor Livegang: Einwilligung der Trainer einholen, dann im Studio Haken setzen.
