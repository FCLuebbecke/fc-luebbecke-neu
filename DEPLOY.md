# Deployment auf Vercel + Auto-Rebuild bei Inhaltsänderungen

Die Seite wird **statisch** gebaut und holt die Sanity-Inhalte zur Build-Zeit.
Damit eine Studio-Änderung automatisch live geht, löst ein **Sanity-Webhook**
einen **Vercel Deploy Hook** aus → die Seite wird neu gebaut. Kein Code-Deploy nötig.

```
Pflege im Studio (/admin)  ──▶  Sanity Webhook  ──▶  Vercel Deploy Hook  ──▶  Rebuild ──▶ live
```

## Schritt 1 – Projekt auf Vercel importieren

1. https://vercel.com → **Add New… → Project**
2. GitHub-Repo **`Felixdahm/Fc-Luebbecke-neu`** importieren.
3. Framework wird als **Astro** erkannt (Build `astro build`, Output `dist`). So lassen.
4. **Environment Variables** hinzufügen (für alle Environments):
   - `PUBLIC_SANITY_PROJECT_ID` = `u7v527gk`
   - `PUBLIC_SANITY_DATASET` = `production`
   - `ADMIN_USER` = frei wählbarer Benutzername fürs Studio-Login
   - `ADMIN_PASSWORD` = frei wählbares Passwort fürs Studio-Login
5. **Deploy** klicken. Nach dem ersten Build gibt es eine `…vercel.app`-URL.

> 🔒 **Studio-Schutz:** `/admin` ist über eine Vercel **Edge Middleware**
> (`middleware.ts` im Projekt-Root) mit HTTP Basic Auth geschützt. Beim Aufruf
> von `…/admin` fragt der Browser nach `ADMIN_USER` / `ADMIN_PASSWORD`. Sind die
> beiden Variablen **nicht** gesetzt, bleibt `/admin` komplett gesperrt
> (fail closed). Lokal (`npm run dev`) greift die Middleware nicht – dort ist das
> Studio zum Entwickeln offen erreichbar.

## Schritt 2 – CORS in Sanity für die Live-Domain

Damit das Studio auch online funktioniert:
- https://www.sanity.io/manage → Projekt → **API → CORS origins → Add**
- die Vercel-URL eintragen (z. B. `https://fc-luebbecke-neu.vercel.app`), **Allow credentials** an.

## Schritt 3 – Vercel Deploy Hook anlegen

1. Vercel → Projekt → **Settings → Git → Deploy Hooks**
2. Name z. B. `sanity`, Branch **`main`** → **Create Hook**
3. Die erzeugte **URL kopieren** (sieht aus wie
   `https://api.vercel.com/v1/integrations/deploy/prj_…/…`).

## Schritt 4 – Sanity-Webhook auf diese URL zeigen lassen

Variante A – Weboberfläche:
- https://www.sanity.io/manage → Projekt → **API → Webhooks → Create webhook**
- **Name:** `Vercel Rebuild`
- **URL:** die Deploy-Hook-URL aus Schritt 3
- **Dataset:** `production`
- **Trigger on:** Create, Update, Delete
- **HTTP method:** POST · **API version:** v2021-06-07 (Standard)
- Speichern.

Variante B – CLI (im Projektordner, du bist bei Sanity eingeloggt):
```
! npx sanity hook create
```
und die Deploy-Hook-URL eingeben.

## Fertig

Ab jetzt: im Studio etwas ändern + **Publish** → Vercel baut automatisch neu
(~1–2 Min) → Änderung ist live. Bei Code-Änderungen genügt wie gewohnt `git push`
auf `main`, dann deployt Vercel ebenfalls automatisch.
