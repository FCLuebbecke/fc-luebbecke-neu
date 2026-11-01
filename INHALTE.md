# Inhalte der Webseite

Mannschaften, Trainer, Trainingszeiten und Sponsoren liegen als **JSON-Dateien**
im Repo, eine Datei pro Eintrag. Die Regeln (Pflichtfelder, Formate) stehen in
[`src/content/schemas.mjs`](src/content/schemas.mjs) (gemeinsam für Build und MCP-Server); Astro prüft sie bei jedem
Build. Ist eine Datei fehlerhaft, bricht der Build mit einer Meldung ab, und
nichts Falsches geht live.

Später werden die Inhalte per Chat (Private AI über MCP) gepflegt, mit Vorschau
daneben (Use Case UC-001, Specs 009/010). Bis dahin: Datei ändern, mit
`npm run dev` ansehen, committen.

## Wo liegt was?

| Sammlung | Ordner | Erscheint auf |
|---|---|---|
| Fußball-Mannschaften | `src/content/mannschaften/` | `/fussball/mannschaften` |
| Badminton-/Darts-Mannschaften | `src/content/sparten-mannschaften/` | `/badminton/mannschaften`, `/darts/mannschaften` |
| Trainingszeiten & Ort Badminton/Darts | `src/content/sparten-infos/badminton.json`, `darts.json` | `/badminton/trainingszeiten`, `/darts/trainingszeiten` |
| Sponsoren | `src/content/sponsoren/` | Startseite |
| Beiträge „Aktuelles“ | `src/content/beitraege/` | Startseite, `/aktuelles`, Sparten-Seiten |

Bilder liegen unter `src/assets/content/<sammlung>/` und werden relativ zur
JSON-Datei angegeben. Astro rechnet sie beim Build automatisch klein (WebP).

Feste Seitentexte der Sparten (Vorstellung, Ansprechpartner, Schnuppertraining)
stehen weiterhin in `src/data/sparten.ts`.

## Felder

**Alle Sammlungen:** `reihenfolge` (Zahl) bestimmt die Sortierung, kleiner =
weiter oben. Die Zahlen gehen in Zehnerschritten, damit man dazwischen
einfügen kann (z. B. 15).

**Bilder** (`foto`, `logo`):

```json
"foto": {
  "src": "../../assets/content/mannschaften/2-mannschaft.jpg",
  "alt": "Mannschaftsfoto 2. Mannschaft",
  "fokus": "50% 30%"
}
```

`alt` ist Pflicht (Barrierefreiheit). `fokus` ist optional: der Bildpunkt, der
beim Zuschneiden sichtbar bleiben soll (x% y%), z. B. `"50% 20%"`, damit keine
Köpfe abgeschnitten werden.

### Fußball-Mannschaft (`mannschaften/*.json`)

| Feld | Pflicht | Hinweis |
|---|---|---|
| `name` | ja | z. B. „2. Mannschaft“, „D - Jugend(D1)“ |
| `kategorie` | ja | `herren` oder `jugend` |
| `reihenfolge` | ja | Die Herren-Mannschaft mit der kleinsten Zahl erscheint als große Karte mit Foto. |
| `liga` | | nur Herren |
| `text` | | Beschreibung, nur Herren |
| `jahrgang` | | nur Jugend, z. B. „11-12 Jahre“ |
| `foto` | | nur Herren |
| `trainerteam` | | Liste: `name` (Pflicht), `rolle`, `telefon`, `email`, `veroeffentlichen` |
| `training` | | Liste: `zeit` (Pflicht), `ort` |
| `platzhalter` | | `true` zeigt „Daten folgen“ |

⚠️ **Telefon und E-Mail von Trainern** erscheinen nur mit
`"veroeffentlichen": true`, und das nur, wenn die Person zugestimmt hat.

### Badminton/Darts-Mannschaft (`sparten-mannschaften/*.json`)

| Feld | Pflicht | Hinweis |
|---|---|---|
| `sparte` | ja | `badminton` oder `darts` |
| `name` | ja | |
| `reihenfolge` | ja | |
| `liga` | | |
| `info` | | Beschreibung |
| `href` | | Link zu Spielplan/Tabelle (vollständige URL) |
| `foto` | | |
| `platzhalter` | | `true` zeigt „Daten folgen“ |

### Trainingszeiten & Ort (`sparten-infos/badminton.json`, `darts.json`)

| Feld | Pflicht | Hinweis |
|---|---|---|
| `training` | ja | Liste: `gruppe` und `zeit` (beide Pflicht) |
| `ortName` | ja | z. B. „Sporthalle Kollegienwall“ |
| `ortAdresse` | ja | |

### Sponsor (`sponsoren/*.json`)

| Feld | Pflicht | Hinweis |
|---|---|---|
| `name` | ja | |
| `stufe` | ja | `premium` (groß) oder `normal` |
| `reihenfolge` | ja | |
| `website` | | vollständige URL |
| `logo` | | Ohne Logo erscheint der Name als Text. |

### Beitrag „Aktuelles“ (`beitraege/*.json`, Spec 007)

Der Dateiname ist die Adresse: `saisonstart-2026.json` → `/aktuelles/saisonstart-2026/`.

| Feld | Pflicht | Hinweis |
|---|---|---|
| `titel` | ja | höchstens 120 Zeichen |
| `datum` | ja | `JJJJ-MM-TT`, z. B. `2026-11-01` |
| `sparte` | ja | `fussball`, `badminton`, `darts` oder `verein` |
| `teaser` | ja | Kurztext für die Karten, höchstens ~200 Zeichen |
| `inhalt` | ja | Text in Markdown: Absätze, `## Zwischenüberschrift`, `**fett**`, `*kursiv*`, `[Link](https://…)`, `- Aufzählung`. HTML wird nicht übernommen. |
| `titelbild` | (ja) | Bild mit `alt`; ohne Titelbild veröffentlicht der MCP-Server nicht |
| `galerie` | | Liste von Bildern mit `alt` |
| `autor` | | z. B. „Jugendabteilung“ |

Ton: bodenständig, wir-Form, kurze Sätze. Namen nur mit Einverständnis, bei
der Jugend nur Vornamen oder keine Namen; Fotos von Kindern nur mit
Einwilligung der Eltern.

## Neuen Eintrag anlegen

1. Eine vorhandene Datei derselben Sammlung kopieren, Dateiname in
   Kleinbuchstaben mit Bindestrichen (z. B. `baeckerei-meyer.json`).
2. Felder anpassen, Bild ggf. nach `src/assets/content/<sammlung>/` legen.
3. `npm run dev` und die Seite ansehen. Fehler erscheinen im Terminal.
4. Committen (Branch-Regeln: CLAUDE.md Abschnitt 12).
