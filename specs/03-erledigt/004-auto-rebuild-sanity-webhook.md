
## Umsetzungsnotizen (2026-09-03)

- Laut Peter bereits eingerichtet (Sanity-Webhook → Vercel Deploy Hook),
  ohne Feature-Branch, da reine Konfiguration außerhalb des Repos.
- Nicht nachprüfbar durch Claude: Der lokale `SANITY_WRITE_TOKEN` hat kein
  Recht `sanity.project.webhooks/read`, die CLI ist nicht eingeloggt.
- **Offen geblieben** (bei Bedarf nachziehen):
  - Filter `_type != "liveKauf"` am Webhook, sonst löst jeder Ticketkauf
    einen Build aus.
  - Hinweis im Studio zur Wartezeit nach Publish.
  - `DEPLOY.md`: Repo-Name aktualisieren.
  - Anforderungen oben sind deshalb nicht abgehakt.
