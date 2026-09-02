---
nummer: 004
titel: Sanity-Änderungen gehen automatisch live (Webhook → Vercel Rebuild)
status: geplant
bereich: infra
prio: hoch
angelegt: 2026-09-02
gestartet:
erledigt:
branch:
commit:
verantwortlich:
---

# Sanity-Änderungen gehen automatisch live

## Ziel

Wer im Studio unter `/admin` eine Mannschaft, einen Trainer oder einen
Sponsor ändert und auf **Publish** klickt, sieht die Änderung ein bis zwei
Minuten später auf der Live-Seite. Ohne Git, ohne Vercel, ohne dass jemand
„neu bauen“ muss. Pflegende brauchen nur den Studio-Zugang.

## Ausgangslage

Die Seite ist statisch: Sanity-Daten werden **beim Build** geholt
(`useCdn: false` in `astro.config.mjs`). Live ändert sich nichts, bis Vercel
neu baut. Heute passiert das nur

- bei einem `git push` auf `main` (Code-Deploy) und
- täglich um 6 Uhr über den GitHub-Workflow `daily-rebuild.yml`, der die
  Deploy-Hook-URL aus dem Secret `VERCEL_DEPLOY_HOOK_URL` aufruft (sofern
  das Secret gesetzt ist).

Die in `DEPLOY.md` beschriebene Kette **Sanity-Webhook → Vercel Deploy Hook**
ist offenbar nicht eingerichtet: Studio-Änderungen erscheinen live nicht.
Ob der Webhook existiert, ließ sich nicht prüfen, die Sanity-CLI ist lokal
nicht eingeloggt.

Nebenbefund: `DEPLOY.md` nennt als Repo `Felixdahm/Fc-Luebbecke-neu`, das
Remote heißt inzwischen `FCLuebbecke/fc-luebbecke-neu`.

## Anforderungen

- [ ] Nach **Publish** im Studio startet automatisch ein Vercel-Build für
      `main`. Kein manueller Schritt für Pflegende.
- [ ] Der Webhook feuert bei Create, Update und Delete für alle gepflegten
      Inhaltstypen, **nicht** aber für `liveKauf` (wird automatisch von der
      Kauf-API angelegt, jeder Ticketkauf würde sonst einen Build auslösen).
- [ ] Der tägliche GitHub-Rebuild bleibt bestehen (Spielplan von fußball.de).
- [ ] Pflegende sehen im Studio einen Hinweis, dass Änderungen nach Publish
      ein bis zwei Minuten brauchen.
- [ ] `DEPLOY.md` und `SANITY.md` sind auf dem aktuellen Stand (Repo-Name,
      Webhook-Filter, Hinweis für Pflegende).
- [ ] Die Kette ist mit einer echten Teständerung nachgewiesen (Publish →
      Build in Vercel sichtbar → Änderung live).

## Nicht Teil dieser Spec

- Umstellung auf serverseitiges Rendern (SSR/ISR). Bewusst verworfen: mehr
  Komplexität, Sanity-Aufrufe pro Besucher, Ausfälle bei Sanity träfen die
  Besucher direkt.
- Vorschau von Entwürfen (Draft-Preview) vor dem Publish.
- Benachrichtigung der Pflegenden, wenn der Build fertig ist.

---

## ⚠️ Manuelle Schritte – müssen von dir gemacht werden

Diese Schritte brauchen Logins in Vercel, GitHub und Sanity, die Claude nicht
hat. Bitte in dieser Reihenfolge erledigen und die Ergebnisse (URL bzw.
„erledigt“) zurückmelden. Erst danach kann die Umsetzung starten.

### M1 · Vercel: Deploy Hook prüfen oder anlegen

1. https://vercel.com öffnen → Projekt der Vereinsseite auswählen.
2. **Settings → Git → Deploy Hooks**.
3. Gibt es dort bereits einen Hook für Branch **`main`**?
   - **Ja:** URL über „Copy“ kopieren. Weiter mit M2.
   - **Nein:** Name `sanity`, Branch **`main`**, **Create Hook**. Die
     erzeugte URL kopieren (Form:
     `https://api.vercel.com/v1/integrations/deploy/prj_…/…`).
4. ⚠️ Die URL ist ein Geheimnis: Wer sie kennt, kann beliebig oft Builds
   auslösen. Nicht in Chats, Issues oder Commits ablegen. Nur in die zwei
   Stellen aus M2 und M3 eintragen.

**Rückmeldung an Claude:** „M1 erledigt“ (die URL selbst bitte **nicht**
in den Chat kopieren, siehe M3 für die Übergabe).

### M2 · GitHub: Secret für den täglichen Rebuild prüfen

1. https://github.com/FCLuebbecke/fc-luebbecke-neu → **Settings →
   Secrets and variables → Actions**.
2. Existiert das Repository-Secret **`VERCEL_DEPLOY_HOOK_URL`**?
   - **Ja:** nichts tun.
   - **Nein:** **New repository secret**, Name exakt
     `VERCEL_DEPLOY_HOOK_URL`, Wert = URL aus M1, speichern.
3. Optional prüfen: **Actions → „Täglicher Rebuild“ → Run workflow**.
   Nach etwa einer Minute muss in Vercel unter **Deployments** ein neuer
   Build erscheinen. Falls der Workflow rot ist: Secret fehlt oder URL falsch.

**Rückmeldung an Claude:** „M2 erledigt“ oder „M2: Workflow rot“.

### M3 · Sanity: Claude einloggen und Deploy-Hook-URL hinterlegen

1. Im Claude-Prompt eingeben (öffnet den Browser für den Sanity-Login):

   ```
   ! npx sanity login
   ```

   Mit dem Sanity-Konto anmelden, das Zugriff auf das Projekt `u7v527gk`
   hat. Danach kann Claude Webhooks per CLI anlegen und prüfen.

2. Die Deploy-Hook-URL aus M1 **lokal** in die Datei `.env` eintragen
   (die Datei ist per `.gitignore` vom Repo ausgeschlossen und landet nicht
   in Git):

   ```
   VERCEL_DEPLOY_HOOK_URL=https://api.vercel.com/v1/integrations/deploy/…
   ```

   Claude liest die URL beim Anlegen des Webhooks aus dieser Datei, sie
   muss nicht in den Chat.

**Rückmeldung an Claude:** „M3 erledigt“.

### M4 · Nach der Umsetzung: Abnahme im Studio (5 Minuten)

1. Live-Studio öffnen: `https://<live-domain>/admin`, einloggen.
2. Bei einer Mannschaft eine kleine Änderung machen (z. B. im
   Beschreibungstext ein Wort ergänzen), **Publish** klicken.
3. Vercel → **Deployments**: innerhalb von etwa 30 Sekunden erscheint ein
   neuer Build mit Quelle „Deploy Hook“.
4. Nach Abschluss des Builds (1–2 Minuten) die Live-Seite
   `/fussball/mannschaften` neu laden: Änderung ist sichtbar.
5. Änderung im Studio rückgängig machen und erneut Publish.

**Rückmeldung an Claude:** „M4 erledigt“ oder was nicht funktioniert hat.

---

## Umsetzung (Claude, nach M1–M3)

1. **Bestand prüfen:** `npx sanity hook list` – vorhandene Webhooks anzeigen.
   Gibt es schon einen auf eine Vercel-URL, diesen prüfen/anpassen statt
   doppelt anzulegen.
2. **Webhook anlegen** (Dataset `production`, Trigger Create/Update/Delete,
   POST, URL aus `.env`), mit GROQ-Filter, der `liveKauf` ausschließt:

   ```
   _type != "liveKauf"
   ```

   Falls die CLI keinen Filter unterstützt: Webhook in der Weboberfläche
   anlegen lassen (dann wird das ein weiterer manueller Schritt M3b mit
   genauer Klickanleitung).
3. **Hinweis für Pflegende im Studio:** Studio-Titel in `sanity.config.ts`
   ergänzen und im Schema `mannschaft` einen kurzen Hinweistext am Feld
   `name` hinterlegen: „Änderungen sind nach Publish in 1–2 Minuten live.“
4. **Doku:** `DEPLOY.md` (Repo-Name, Filter, Hinweis „Secret nicht in Git“),
   `SANITY.md` (Absatz „Nach Inhaltsänderungen neu bauen“ ersetzen durch
   „Publish genügt, 1–2 Minuten warten“).
5. **Test:** Teständerung per Studio oder CLI-Patch, Build in Vercel
   beobachten (`npx sanity hook logs` bzw. Vercel-Deployments), Ergebnis in
   den Umsetzungsnotizen festhalten. Endabnahme durch dich in M4.

## Abnahme

- Publish im Studio → neuer Vercel-Build ohne weiteres Zutun.
- Ein Ticketkauf über FCL LIVE löst **keinen** Build aus (Filter wirkt;
  prüfbar über `npx sanity hook logs`).
- Täglicher GitHub-Rebuild läuft weiterhin grün.
- Studio zeigt den Hinweis zur Wartezeit.
- `DEPLOY.md` und `SANITY.md` stimmen mit dem eingerichteten Stand überein.

## Notizen

- Vercel bricht bei mehreren Hook-Aufrufen kurz hintereinander ältere
  Builds ab (Queue), viele Publishes am Stück sind also unkritisch.
- Kostenrahmen: Jeder Build zählt auf das Vercel-Build-Kontingent. Bei
  gelegentlicher Pflege irrelevant; bei sehr häufigen Änderungen ließe sich
  ein „Debounce“ über Sanity-Webhook-Einstellungen oder einen kleinen
  Zwischen-Endpoint ergänzen. Erst bei Bedarf.
