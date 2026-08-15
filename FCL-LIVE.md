# FCL LIVE – Livestream & Pay-per-View-Mediathek

Nachbau des WordPress-Plugins **„FC Lübbecke LIVE“ 3.0.73** als fester
Bestandteil dieser Astro-Seite. Besucher können Livestreams und Videos
(komplette Spiele, Highlights, Tore) per PayPal kaufen und sofort ansehen.

## Wie es aufgebaut ist

| Baustein | Ort | Aufgabe |
|---|---|---|
| Seite `/live` | `src/pages/live.astro` | Hero, Nächste Spiele + Livestream-Kauf, Mediathek, Meine Käufe |
| Server-API | `api/live/[action].ts` | Eine Vercel-Function: PayPal-Kauf, Cloudflare-Signierung, Wiederherstellung |
| Inhalte | Sanity Studio (`/admin`) | Neue Typen: **FCL LIVE – Video**, **Einstellungen**, **Kauf** |
| Spielplan | `src/lib/fussball.ts` | „Nächste Spiele“ live von FUSSBALL.DE (zur Laufzeit, 5-Min-Cache) |

Die Seite selbst bleibt statisch – Videos, Preise und Spiele lädt sie zur
Laufzeit von `/api/live/data`. **Neue Videos erscheinen also ohne neuen
Build/Deploy.**

## Einrichtung (einmalig)

1. **Sanity-Schreibtoken** anlegen: [sanity.io/manage](https://www.sanity.io/manage)
   → Projekt → API → Tokens → „Add API token“ mit **Editor**-Rechten.
   → in `.env` und Vercel als `SANITY_WRITE_TOKEN` eintragen.
2. **PayPal**: Im [PayPal-Developer-Dashboard](https://developer.paypal.com/dashboard/)
   die REST-App öffnen → `PAYPAL_CLIENT_ID` + `PAYPAL_SECRET` übernehmen.
   Zum Start `PAYPAL_MODE=sandbox`, für echten Verkauf auf `live` stellen
   (dann Client-ID/Secret der **Live**-App verwenden!).
3. **Cloudflare Stream**: Im Cloudflare-Dashboard ein API-Token mit
   „Stream: Lesen“ erstellen → `CF_API_TOKEN`. Account-ID, Customer-Code und
   Live-Input-UID sind aus dem Plugin vorbefüllt – bitte prüfen.
4. Alle Variablen aus dem Block „FCL LIVE“ in der `.env` auch in
   **Vercel → Settings → Environment Variables** eintragen (Production +
   Preview) und neu deployen.
5. Im Studio (`/admin`) einmal **„FCL LIVE – Einstellungen“** anlegen
   (Preise, Zugriffsdauer, Livestream an/aus).

## Videos einstellen (laufender Betrieb)

1. Video bei **Cloudflare Stream** hochladen (oder Aufnahme des Live-Inputs
   verwenden) und die **Video-UID** kopieren.
2. Im Studio (`/admin`) ein **„FCL LIVE – Video“** anlegen: Titel, Kategorie,
   Datum, Gegner, UID, ggf. eigener Preis – und **„Freigegeben“** aktivieren.
3. Fertig – das Video erscheint sofort in der Mediathek auf `/live`.

## Wie Käufe funktionieren

- Zahlung läuft über **PayPal Checkout** (auch Karte). Der Server prüft
  Status, Währung und Betrag der Zahlung, erst dann gibt es Zugang.
- Der Käufer bekommt einen **Wiederherstellungscode** (`FCL-XXXXXXXX`)
  angezeigt; der Zugang wird zusätzlich im Browser gespeichert
  („Meine Käufe“). Auf anderen Geräten: Code oder PayPal-Order-ID unter
  „Früheren Kauf wiederherstellen“ eingeben.
- **Livestream-Zugang gilt 6 Stunden** ab Kauf (wie im Plugin), Videos je
  nach Einstellung unbegrenzt oder x Stunden.
- Käufe landen als **„FCL LIVE – Kauf“** in Sanity – Codes/Order-IDs nur als
  Hash (Sanity-Datasets sind öffentlich lesbar), E-Mail nur maskiert.

## Unterschiede zum WordPress-Plugin

- **Keine Kauf-E-Mail**: Es gibt (noch) keinen Mail-Versand – der Code wird
  stattdessen nach dem Kauf deutlich angezeigt und muss notiert werden.
  Bei Bedarf später z. B. mit Resend nachrüstbar.
- Kein automatischer Cloudflare-Video-Import – Videos werden bewusst von
  Hand in Sanity angelegt (das Plugin hatte den Auto-Import ohnehin
  deaktiviert und auf „Prüfung“ gestellt).
- Gegner-Wappen im Spielplan sind noch nicht übernommen (die Logos aus
  `fcl-live-3.0.73/fcl-live/assets/` können später ergänzt werden).

## Testen

- **Lokal**: `astro dev` zeigt die Seite, aber ohne API (`/api/…` läuft nur
  auf Vercel). Für den kompletten Test `vercel dev` nutzen oder ein
  Preview-Deployment ansehen.
- **Sandbox-Kauf**: `PAYPAL_MODE=sandbox` + Sandbox-Testkonto aus dem
  PayPal-Developer-Dashboard. Erst wenn alles passt, auf `live` umstellen.
