# Sanity – Inhaltspflege (Fußball)

Die Fußball-**Mannschaften** (Herren & Jugend) werden über Sanity gepflegt. Das
Studio ist in die Astro-Seite eingebettet und unter **`/admin`** erreichbar.
Solange in Sanity noch keine Mannschaften angelegt sind, zeigt die Seite die
gepflegten Platzhalter-Daten (Fallback) – sie ist also nie leer.

## Einmalige Einrichtung (von dir auszuführen)

1. **Bei Sanity einloggen** (öffnet den Browser):

   ```
   ! npx sanity login
   ```

2. **Projekt + Dataset anlegen** – am einfachsten über die Oberfläche:
   https://www.sanity.io/manage → „Create new project“ → Name z. B. „FC Lübbecke“,
   Dataset **`production`** (public).
   Alternativ per CLI: `! npx sanity init` (vorhandenen Ordner nutzen).

3. **Project-ID eintragen** in die Datei `.env`:

   ```
   PUBLIC_SANITY_PROJECT_ID=<deine-project-id>
   PUBLIC_SANITY_DATASET=production
   ```

   Die Project-ID steht in sanity.io/manage in den Projekt-Einstellungen.

4. **CORS-Freigabe** für lokale Entwicklung (in sanity.io/manage →
   API → CORS origins): `http://localhost:4321` hinzufügen (mit Credentials).
   Für die Live-Domain später `https://fc-luebbecke.de` ergänzen.

## Loslegen

```
npm run dev
```

- Seite: http://localhost:4321/fussball/mannschaften
- Studio (Pflege): http://localhost:4321/admin

Im Studio unter **„Fußball-Mannschaft“** Teams anlegen:
- **Kategorie** Herren oder Jugend wählen → blendet die passenden Felder ein.
- **Reihenfolge** (Zahl) steuert die Sortierung.
- **Platzhalter** = Hinweis „Daten folgen“ auf der Karte.

Sobald mindestens eine Mannschaft je Kategorie existiert, ersetzt sie den Fallback.
Da der Fetch zur **Build-Zeit** läuft: nach Inhaltsänderungen neu bauen/deployen.
