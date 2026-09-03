---
nummer: 004
titel: Automatischer Rebuild bei Inhaltsänderungen im Admin-Studio
status: geplant
bereich: infra
prio: hoch
angelegt: 2026-09-03
gestartet:
erledigt:
branch:
commit:
verantwortlich:
---

# Automatischer Rebuild bei Inhaltsänderungen im Admin-Studio

## Ziel

Wer im Admin-Studio (`/admin`) Inhalte pflegt und auf **„Publish“** klickt,
sieht die Änderung wenige Minuten später von selbst auf der Webseite –
ohne dass jemand zusätzlich einen Git-Push machen oder in Vercel manuell
ein Deployment anstoßen muss.

## Ausgangslage

Die Seite ist ein statischer Astro-Build: Alle Sanity-Inhalte (Mannschaften,
Trainer, Termine …) werden **zur Build-Zeit** geladen (`useCdn: false` in
`astro.config.mjs`). Eine Änderung im Studio landet zwar sofort in Sanity,
auf der Webseite erscheint sie aber erst beim **nächsten Build**. Der passiert
heute nur:

- beim täglichen Rebuild um 04:00 UTC (GitHub Action `daily-rebuild.yml`
  → Deploy Hook „Täglicher Rebuild“), oder
- wenn jemand einen Commit nach `main` pusht bzw. manuell deployt.

Für die Redaktion heißt das: Inhalt gepflegt, aber auf der Seite tut sich
nichts – gefühlt „kaputt“, tatsächlich fehlt nur der Rebuild.

Betroffen ist **keine Datei im Repo** im engeren Sinn; die Umsetzung passiert
in den Dashboards von Vercel und Sanity. Dokumentiert wird sie hier und ggf.
in der README.

## Anforderungen

- [ ] Nach **Publish** (auch Unpublish/Delete) eines Dokuments im Studio
      startet automatisch ein neues Vercel-Production-Deployment.
- [ ] Die Änderung ist ohne weiteres Zutun auf der Live-Seite sichtbar,
      sobald der Build durch ist (Richtwert: unter 5 Minuten).
- [ ] Eigener, klar benannter Deploy Hook (z. B. „Sanity Publish“) –
      der bestehende Hook „Täglicher Rebuild“ bleibt unverändert für die
      GitHub Action.
- [ ] Kein Rebuild bei bloßen **Draft**-Änderungen – erst Publish zählt.
- [ ] Der tägliche 04:00-UTC-Rebuild bleibt bestehen (er aktualisiert auch
      FUSSBALL.DE-Spielplandaten und Instagram, unabhängig von Sanity).
- [ ] Kurz dokumentieren (README oder diese Spec), wie man prüft, ob der
      Webhook feuert (Sanity-Webhook-Log, Vercel-Deployments-Liste).

## Nicht Teil dieser Spec

- Umstellung auf SSR/ISR (Vercel-Adapter), damit Inhalte ganz ohne Rebuild
  live sind – bewusst nicht: der statische Build ist einfach und robust.
- Live-Vorschau von Drafts im Studio (Sanity Presentation/Preview).
- Schnellere Aktualisierung der FUSSBALL.DE- oder Instagram-Daten
  (dafür sorgt weiterhin der tägliche Rebuild).

## Umsetzung

1. **Vercel:** Im Projekt `fc-luebbecke-neu` (Team `fcl3`) unter
   *Settings → Git → Deploy Hooks* einen neuen Hook **„Sanity Publish“**
   auf Branch `main` anlegen und die URL kopieren.
2. **Sanity:** Unter [sanity.io/manage](https://www.sanity.io/manage) im
   Projekt unter *API → Webhooks* einen Webhook anlegen:
   - URL: die Deploy-Hook-URL aus Schritt 1
   - Dataset: `production`
   - Trigger: **Create, Update, Delete** (greift nur bei publizierten
     Dokumenten – Drafts lösen keinen Webhook aus)
   - HTTP-Methode: `POST`, kein Body/Secret nötig (Deploy Hooks sind
     unauthentifizierte Trigger-URLs – die URL geheim halten)
3. **Testen:** Im Studio ein unkritisches Feld ändern (z. B. Tippfehler in
   einer Trainingszeit), publizieren, in Vercel prüfen, dass ein Deployment
   mit Quelle „Deploy Hook: Sanity Publish“ startet.
4. **Dokumentieren:** Ablauf und Prüfweg in dieser Spec unter
   „Umsetzungsnotizen“ festhalten.

**Hinweis Build-Häufigkeit:** Jedes Publish löst einen Build (~1–2 Min) aus.
Bei einer Redaktionssitzung mit vielen Einzel-Publishes entstehen mehrere
Builds hintereinander – Vercel bricht überholte Builds automatisch ab
(„skipped/superseded“), das ist unkritisch. Sollte es stören, lässt sich im
Sanity-Webhook später ein Filter oder eine Verzögerung ergänzen.

## Abnahme

- Änderung im Admin-Studio publizieren → in der Vercel-Deployments-Liste
  erscheint ohne manuelles Zutun ein neuer Production-Build.
- Nach Build-Ende ist die Änderung auf der Live-Seite sichtbar
  (auch auf dem Handy prüfen, Cache beachten).
- Ein gespeicherter, aber **nicht** publizierter Draft löst keinen Build aus.
- Der tägliche Rebuild um 04:00 UTC läuft weiterhin (GitHub-Action-Historie).

## Notizen

- „In Vercel bearbeiten“ meint praktisch das Admin-Studio unter `/admin`
  (Sanity Studio, gehostet auf Vercel) – die Inhalte liegen in Sanity.
- Deploy-Hook-URLs sind geheim zu behandeln (wer die URL kennt, kann
  Builds auslösen). Nicht ins Repo committen.
- Alternative für später: Sanity-Webhook nur auf bestimmte Dokumenttypen
  filtern (GROQ-Filter `_type in [...]`), falls unnötige Builds auffallen.
