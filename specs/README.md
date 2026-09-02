# Specs – FC Lübbecke Webseite

Hier werden Änderungen an der Webseite als kleine Spezifikationen geplant,
umgesetzt und archiviert. Eine Spec = eine Markdown-Datei, die im Laufe ihres
Lebens durch drei Ordner wandert.

## Struktur

```
specs/
├── README.md          ← diese Anleitung
├── TEMPLATE.md        ← Vorlage für neue Specs
├── 01-geplant/        ← Ideen und Anforderungen, noch nicht begonnen
├── 02-in-arbeit/      ← wird gerade umgesetzt
└── 03-erledigt/       ← umgesetzt und live, bleibt als Doku erhalten
```

## Ablauf

1. **Anlegen:** Nächste freie Nummer ermitteln, `TEMPLATE.md` nach
   `01-geplant/NNN-kurzer-titel.md` kopieren und ausfüllen. Das passiert
   direkt auf `main`.
2. **Starten:** Feature-Branch anlegen (siehe unten), darin die Datei nach
   `02-in-arbeit/` verschieben (`git mv`), Status im Kopf auf `in-arbeit`
   setzen, Startdatum eintragen.
3. **Umsetzen:** Alle Änderungen auf dem Feature-Branch committen, nie direkt
   auf `main`.
4. **Abschließen:** Datei nach `03-erledigt/` verschieben, Status auf
   `erledigt`, Abschlussdatum und Branch/Commit eintragen. Dann Rückfrage,
   ob der Branch in `main` gemergt werden darf.
5. **Mergen:** Erst nach ausdrücklicher Freigabe nach `main` mergen, danach
   den Feature-Branch löschen.

Faustregel: In `02-in-arbeit/` sollten nie mehr als zwei bis drei Specs liegen.

## Feature-Branch

Jede Spec wird auf einem eigenen Branch umgesetzt. Name:

```
spec/NNN-kurzer-titel
```

Beispiel: `spec/001-trainer-kontaktdaten`. Der Branch wird von `main`
abgezweigt:

```bash
git checkout main && git pull
git checkout -b spec/001-trainer-kontaktdaten
```

Der Merge nach `main` erfolgt **nie automatisch**. Wer die Spec umsetzt
(auch Claude), fragt am Ende nach und mergt erst nach Freigabe:

```bash
git checkout main
git merge --no-ff spec/001-trainer-kontaktdaten
git branch -d spec/001-trainer-kontaktdaten
```

## Dateiname

```
NNN-kurzer-titel.md
```

Beispiel: `007-instagram-2-klick.md`. Die Nummer ist dreistellig, wird
fortlaufend über alle drei Ordner hinweg vergeben und ändert sich beim
Verschieben nicht. So bleibt eine Spec eindeutig referenzierbar
(„siehe Spec 007“), egal in welchem Ordner sie gerade liegt.

Nächste freie Nummer ermitteln:

```bash
ls specs/0*/ | grep -oE '^[0-9]{3}' | sort -n | tail -1
```

## Kopfbereich (Frontmatter)

Jede Spec beginnt mit einem YAML-Block. Pflichtfelder:

| Feld       | Werte                                   |
|------------|-----------------------------------------|
| `nummer`   | Laufende Nummer, identisch mit Dateiname |
| `titel`    | Kurzer, sprechender Titel               |
| `status`   | `geplant` · `in-arbeit` · `erledigt`    |
| `bereich`  | `startseite` · `fussball` · `badminton` · `darts` · `verein` · `fcl-live` · `admin` · `infra` · `sonstiges` |
| `prio`     | `hoch` · `mittel` · `niedrig`           |
| `angelegt` | Datum JJJJ-MM-DD                        |

Optional: `gestartet`, `erledigt`, `branch`, `commit`, `verantwortlich`.

## Übersicht auf der Kommandozeile

```bash
# Alle Specs mit Status, nach Nummer sortiert
grep -H '^status:' specs/0*/*.md | sort -t/ -k3

# Nur offene Specs nach Priorität
grep -l 'prio: hoch' specs/01-geplant/*.md
```
