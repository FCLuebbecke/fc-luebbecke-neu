/**
 * Spielplan der 1. Mannschaft (Landesliga).
 * Quelle: Prototyp fc-l-bbecke.vercel.app/spielplan (Saison 2025/26).
 * ⚠️ Später idealerweise durch das offizielle FUSSBALL.DE-Widget ersetzen.
 */
export interface Spiel {
  datum: string;
  zeit: string;
  heim: string;
  gast: string;
  wettbewerb: string;
}

export const FUSSBALL_DE_URL =
  "https://www.fussball.de/verein/fc-luebbecke";

export const spielplan: Spiel[] = [
  { datum: "07.07.2026", zeit: "19:30", heim: "FC Lübbecke", gast: "FC RW Kirchlengern", wettbewerb: "Landesliga" },
  { datum: "19.07.2026", zeit: "15:00", heim: "FC Lübbecke", gast: "SC Herford", wettbewerb: "Landesliga" },
  { datum: "21.07.2026", zeit: "19:30", heim: "TuS GW Pödinghausen", gast: "FC Lübbecke", wettbewerb: "Landesliga" },
  { datum: "26.07.2026", zeit: "15:00", heim: "FC Lübbecke", gast: "FC Sennestadt", wettbewerb: "Landesliga" },
];
