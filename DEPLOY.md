# Deployment auf Vercel

Die Seite wird **statisch** gebaut. Alle Inhalte liegen als Dateien im Repo
(`src/content/`, siehe [INHALTE.md](INHALTE.md)), es gibt kein externes CMS.
Jede Änderung – Code oder Inhalt – ist ein Git-Commit.

```
Push auf main  ──▶  Vercel baut  ──▶  live (1–2 Minuten)
Push auf dev / spec/*  ──▶  Vercel-Vorschau-URL (nicht live)
```

## Branches

- **`main`** wird bei jedem Push sofort live deployt.
- Gearbeitet wird auf **`dev`** bzw. `spec/NNN-…`-Branches (CLAUDE.md
  Abschnitt 12). Vercel baut dafür eigene Vorschau-URLs.

## Projekt auf Vercel

- GitHub-Repo: **`FCLuebbecke/fc-luebbecke-neu`**
- Framework: **Astro** (Build `astro build`, Output `dist`) – Standard lassen.
- **Environment Variables:** für die Seite selbst keine nötig.
  Optional `BEHOLD_FEED_ID` für einen anderen Instagram-Feed.

## Täglicher Rebuild (Spielplan & Instagram)

Spielplan (fußball.de) und Instagram-Feed werden zur Build-Zeit geholt. Damit
sie aktuell bleiben, stößt der GitHub-Workflow `.github/workflows/daily-rebuild.yml`
täglich um 04:00 UTC einen Vercel-Build an. Dafür braucht das Repo das Secret
**`VERCEL_DEPLOY_HOOK_URL`**:

1. Vercel → Projekt → **Settings → Git → Deploy Hooks** → Name z. B. `daily`,
   Branch **`main`** → **Create Hook**, URL kopieren.
2. GitHub → Repo → **Settings → Secrets and variables → Actions** →
   **New repository secret** `VERCEL_DEPLOY_HOOK_URL` = die URL.

## Früher: Sanity

Bis Spec 008 kamen Mannschaften, Sponsoren und Sparten-Infos aus Sanity, mit
Studio unter `/admin`, Edge-Middleware und Webhook → Deploy Hook (Spec 004).
Das ist alles entfallen. Den Sanity-Webhook in sanity.io/manage kann man
löschen; einen Build löst er ohnehin nur noch aus, wenn dort jemand etwas
ändert.
