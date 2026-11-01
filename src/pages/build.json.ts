/**
 * Stand-Kennung des Builds (Spec 009): Commit, Branch, Zeitpunkt.
 * Die Entwurfs-Vorschau fragt diese Datei regelmäßig ab und lädt neu, sobald
 * sich der Commit ändert. Kein Caching (siehe vercel.json).
 */
import type { APIRoute } from "astro";
import { buildInfo } from "../lib/vorschau";

export const GET: APIRoute = () =>
  new Response(JSON.stringify(buildInfo), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
