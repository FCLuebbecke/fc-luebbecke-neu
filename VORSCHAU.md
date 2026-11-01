# Entwurfs-Vorschau

Änderungen aus dem Chat (UC-001) landen zuerst auf dem Branch **`preview`**.
Vercel baut daraus eine Vorschau unter einer festen Adresse. Erst
„veröffentlichen“ übernimmt den Entwurf nach `main` (live). Spec 009.

```
Chat → MCP-Server → Commit auf preview → Vercel baut Vorschau → Vorschau lädt neu
                                       └─ „veröffentlichen“ → main → live
```

## Wie die Vorschau funktioniert

- Jeder Build schreibt **`/build.json`** mit Commit, Branch und Zeitpunkt
  (`src/pages/build.json.ts`, nie gecacht, siehe `vercel.json`).
- Nur in Builds des Branches `preview` bindet das Layout
  `src/components/VorschauHinweis.astro` ein:
  - **Hinweisband** oben: „Vorschau – nicht veröffentlicht“
  - **Automatisches Neuladen:** Die Seite fragt alle 5 Sekunden `/build.json`
    ab. Steht dort ein neuer Commit, lädt sie neu und springt an dieselbe
    Stelle zurück. Im Band steht dann „· aktualisiert“. In einem verborgenen
    Tab wird nicht abgefragt.
  - `<meta name="robots" content="noindex, nofollow">`; Vercel setzt für
    Vorschau-Adressen zusätzlich `X-Robots-Tag: noindex`.
- Die Live-Seite und alle anderen Vorschauen enthalten davon nichts.
- Gesteuert über `src/lib/vorschau.ts` (`VERCEL_GIT_COMMIT_REF === "preview"`).

## Lokal testen

```
VORSCHAU=1 npm run dev
```

zeigt das Hinweisband. Das Neuladen reagiert dort auf `/build.json`, das sich
im Dev-Server nicht ändert. Fürs Ausprobieren reicht ohnehin der normale
Dev-Server, der bei jeder Dateiänderung sofort neu lädt.

## Einrichtung (einmalig, manuell)

1. **Branch `preview` anlegen und pushen** (Stand von `main`):
   ```
   git push origin origin/main:refs/heads/preview
   ```
2. **Vorschau-Adresse ermitteln:** Vercel → Projekt → Deployments → Branch
   `preview` → die Adresse der Form
   `<projekt>-git-preview-<team>.vercel.app` zeigt immer auf den neuesten
   Build des Branches.
3. **Optional eigene Adresse:** Vercel → Projekt → Settings → Domains →
   `vorschau.fcluebbecke.de` hinzufügen und unter „Git Branch“ `preview`
   wählen; beim Domain-Anbieter einen CNAME auf `cname.vercel-dns.com`.
4. **Zugriffsschutz prüfen:** Ist bei Vercel „Deployment Protection“ (Vercel
   Authentication) für Vorschauen an, muss man bei Vercel angemeldet sein,
   um die Vorschau zu sehen, und sie lässt sich nicht in Private AI einbetten.
   Für die Entwurfs-Vorschau entweder ausschalten oder per eigener Domain
   ausnehmen.

## Wichtig

- Neuladen und Hinweisband wirken in der Entwurfs-Vorschau erst, wenn dieser
  Code in `main` ist, denn `preview` startet jeweils als Kopie von `main`.
- **Wartezeit:** Von einer Änderung bis zur Anzeige vergehen die Vercel-Buildzeit
  plus höchstens 5 Sekunden. Gemessen: siehe unten.
- **Adresse:** `https://fc-luebbecke-neu-git-preview-fcl3.vercel.app`
- **Schutz:** Die Vorschau ist durch Vercel Authentication geschützt – sehen
  kann sie nur, wer bei Vercel angemeldet ist und Zugriff auf das Projekt hat.
- **Einbetten:** Wegen dieses Schutzes sendet Vercel `X-Frame-Options: DENY`;
  in Private AI einbetten geht so nicht. Wie das gelöst wird, ist Spec 012.

## Messung

| Datum | Commit → Vorschau zeigt Änderung | Bemerkung |
|---|---|---|
| 2026-11-01 | funktioniert, Zeit nicht gestoppt | Test-Commits auf `preview` (Badminton, Darts); Seite lud nach dem Vercel-Build selbst neu |
| 2026-11-01 | **17 s** bis Build fertig, Anzeige nach ca. 20 s | zwei Änderungen aus Private AI (`16528d7`, `201db4b`), gemessen über die GitHub-Commit-Status von Vercel |

Lokal geprüft (2026-11-01): Nach einem neuen Stand in `/build.json` lädt die
Seite nach 3,3 s neu und kehrt an die vorherige Scroll-Position zurück.
