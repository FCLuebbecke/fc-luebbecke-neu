# Entwurfs-Vorschau

Änderungen aus dem Chat (UC-001) landen zuerst auf dem Branch **`entwurf`**.
Vercel baut daraus eine Vorschau unter einer festen Adresse. Erst
„veröffentlichen“ übernimmt den Entwurf nach `main` (live). Spec 009.

```
Chat → MCP-Server → Commit auf entwurf → Vercel baut Vorschau → Vorschau lädt neu
                                       └─ „veröffentlichen“ → main → live
```

## Wie die Vorschau funktioniert

- Jeder Build schreibt **`/build.json`** mit Commit, Branch und Zeitpunkt
  (`src/pages/build.json.ts`, nie gecacht, siehe `vercel.json`).
- Nur in Builds des Branches `entwurf` bindet das Layout
  `src/components/VorschauHinweis.astro` ein:
  - **Hinweisband** oben: „Vorschau – nicht veröffentlicht“
  - **Automatisches Neuladen:** Die Seite fragt alle 5 Sekunden `/build.json`
    ab. Steht dort ein neuer Commit, lädt sie neu und springt an dieselbe
    Stelle zurück. Im Band steht dann „· aktualisiert“. In einem verborgenen
    Tab wird nicht abgefragt.
  - `<meta name="robots" content="noindex, nofollow">`; Vercel setzt für
    Vorschau-Adressen zusätzlich `X-Robots-Tag: noindex`.
- Die Live-Seite und alle anderen Vorschauen enthalten davon nichts.
- Gesteuert über `src/lib/vorschau.ts` (`VERCEL_GIT_COMMIT_REF === "entwurf"`).

## Lokal testen

```
VORSCHAU=1 npm run dev
```

zeigt das Hinweisband. Das Neuladen reagiert dort auf `/build.json`, das sich
im Dev-Server nicht ändert. Fürs Ausprobieren reicht ohnehin der normale
Dev-Server, der bei jeder Dateiänderung sofort neu lädt.

## Einrichtung (einmalig, manuell)

1. **Branch `entwurf` anlegen und pushen** (Stand von `main`):
   ```
   git push origin origin/main:refs/heads/entwurf
   ```
2. **Vorschau-Adresse ermitteln:** Vercel → Projekt → Deployments → Branch
   `entwurf` → die Adresse der Form
   `<projekt>-git-entwurf-<team>.vercel.app` zeigt immer auf den neuesten
   Build des Branches.
3. **Optional eigene Adresse:** Vercel → Projekt → Settings → Domains →
   `vorschau.fcluebbecke.de` hinzufügen und unter „Git Branch“ `entwurf`
   wählen; beim Domain-Anbieter einen CNAME auf `cname.vercel-dns.com`.
4. **Zugriffsschutz prüfen:** Ist bei Vercel „Deployment Protection“ (Vercel
   Authentication) für Vorschauen an, muss man bei Vercel angemeldet sein,
   um die Vorschau zu sehen, und sie lässt sich nicht in Private AI einbetten.
   Für die Entwurfs-Vorschau entweder ausschalten oder per eigener Domain
   ausnehmen.

## Wichtig

- Neuladen und Hinweisband wirken in der Entwurfs-Vorschau erst, wenn dieser
  Code in `main` ist, denn `entwurf` startet jeweils als Kopie von `main`.
- **Wartezeit:** Von einer Änderung bis zur Anzeige vergehen die Vercel-Buildzeit
  plus höchstens 5 Sekunden. Gemessen: siehe unten.
- **Einbetten:** Vercel setzt standardmäßig kein `X-Frame-Options`; die
  Vorschau lässt sich also in einem iframe anzeigen. Sobald feststeht, von
  welcher Adresse Private AI einbettet (Spec 009, Q2), wird das per
  `Content-Security-Policy: frame-ancestors` auf diese Adresse beschränkt.

## Messung

| Datum | Commit → Vorschau zeigt Änderung | Bemerkung |
|---|---|---|
| – | – | steht aus (nach Einrichtung) |

Lokal geprüft (2026-11-01): Nach einem neuen Stand in `/build.json` lädt die
Seite nach 3,3 s neu und kehrt an die vorherige Scroll-Position zurück.
