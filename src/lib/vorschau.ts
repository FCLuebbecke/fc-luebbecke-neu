/**
 * Entwurfs-Vorschau (Spec 009).
 *
 * Builds des Branches `entwurf` auf Vercel sind die Vorschau für Änderungen
 * aus dem Chat (UC-001). Nur dort erscheinen Hinweisband und automatisches
 * Neuladen. Lokal lässt sich der Modus mit `VORSCHAU=1 npm run dev` testen.
 *
 * Wird zur Build-Zeit ausgewertet; die Live-Seite enthält davon nichts.
 */
export const VORSCHAU_BRANCH = "entwurf";

export const istEntwurfsVorschau =
  process.env.VERCEL_GIT_COMMIT_REF === VORSCHAU_BRANCH || process.env.VORSCHAU === "1";

/** Stand-Kennung dieses Builds, ausgeliefert unter /build.json. */
export const buildInfo = {
  commit: process.env.VERCEL_GIT_COMMIT_SHA ?? "lokal",
  branch: process.env.VERCEL_GIT_COMMIT_REF ?? "lokal",
  gebaut: new Date().toISOString(),
};
