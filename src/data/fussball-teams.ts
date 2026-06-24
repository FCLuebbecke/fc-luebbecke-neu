/**
 * Mannschaften des FC Lübbecke mit Link zur jeweiligen FUSSBALL.DE-Team-Seite.
 * Übernommen aus dem Next.js-Prototyp (src/app/(main)/spielplan/page.tsx).
 * Dort findet man je Mannschaft kompletten Spielplan, Ergebnisse und Tabelle.
 */
export interface FussballTeamLink {
  name: string;
  liga: string;
  url: string;
}
export interface FussballTeamGruppe {
  title: string;
  teams: FussballTeamLink[];
}

/** Vereinsprofil mit allen Mannschaften, Ergebnissen und Tabellen. */
export const VEREIN_URL =
  "https://www.fussball.de/verein/fc-luebbecke-westfalen/-/id/00ES8GN8PK00004CVV0AG08LVUPGND5I";

/** 1. Mannschaft (für die Live-Spiele auf dieser Seite). */
export const ERSTE_MANNSCHAFT_URL =
  "https://www.fussball.de/mannschaft/fc-luebbecke-fc-luebbecke-westfalen/-/saison/2526/team-id/011MIFCCRK000000VTVG0001VTR8C1K7";

export const teamGruppen: FussballTeamGruppe[] = [
  {
    title: "Herren",
    teams: [
      { name: "FC Lübbecke", liga: "Landesliga", url: "https://www.fussball.de/mannschaft/fc-luebbecke-fc-luebbecke-westfalen/-/saison/2526/team-id/011MIFCCRK000000VTVG0001VTR8C1K7" },
      { name: "FC Lübbecke II", liga: "Kreisliga A", url: "https://www.fussball.de/mannschaft/fc-luebbecke-ii-fc-luebbecke-westfalen/-/saison/2526/team-id/011MIE7QRS000000VTVG0001VTR8C1K7" },
      { name: "FC Lübbecke III", liga: "Kreisliga C", url: "https://www.fussball.de/mannschaft/fc-luebbecke-iii-fc-luebbecke-westfalen/-/saison/2526/team-id/02BCT8APCS000000VS5489B1VTPVH7C1" },
      { name: "SG Lübbecke IV / Alswede III", liga: "Kreisliga D", url: "https://www.fussball.de/mannschaft/sg-luebbecke-iv-alswede-iii-fc-luebbecke-westfalen/-/saison/2526/team-id/02Q08KBN8S000000VS5489B1VTF0A3SN" },
      { name: "FC Lübbecke Ü32 I", liga: "Herren Ü32", url: "https://www.fussball.de/mannschaft/fc-luebbecke-ue32-i-fc-luebbecke-westfalen/-/saison/2526/team-id/02FK0NLCUG000000VS5489B2VVJ0OMQO" },
      { name: "FC Lübbecke Ü40 II", liga: "Herren Ü40", url: "https://www.fussball.de/mannschaft/fc-luebbecke-ue40-ii-fc-luebbecke-westfalen/-/saison/2526/team-id/02QL60TOS0000000VS5489B2VUEKSRPC" },
    ],
  },
  {
    title: "A- & B-Junioren",
    teams: [
      { name: "JSG Lübbecker Land (A-Junioren)", liga: "A-Junioren Kreisliga A", url: "https://www.fussball.de/mannschaft/jsg-luebbecker-land-tus-gehlenbeck-westfalen/-/saison/2526/team-id/02M4983FSG000000VS5489B1VVVHS1D7" },
      { name: "JSG Lübbecker Land I (B-Junioren)", liga: "B-Junioren Kreisliga", url: "https://www.fussball.de/mannschaft/jsg-luebbecker-land-fc-luebbecke-westfalen/-/saison/2526/team-id/027LI57170000000VS5489B1VTUKARPV" },
      { name: "JSG Lübbecker Land II (B-Junioren)", liga: "B-Junioren Kreisliga", url: "https://www.fussball.de/mannschaft/jsg-luebbecker-land-ii-fc-luebbecke-westfalen/-/saison/2526/team-id/02M7HT0NES000000VS5489B1VT732LUQ" },
    ],
  },
  {
    title: "C- & D-Junioren",
    teams: [
      { name: "JSG Lübbecker Land (C-Junioren)", liga: "C-Junioren Kreisliga A", url: "https://www.fussball.de/mannschaft/jsg-luebbecker-land-fc-luebbecke-westfalen/-/saison/2526/team-id/027LI5LRHC000000VS5489B1VTUKARPV" },
      { name: "JSG Lübbecker Land I (D-Junioren)", liga: "D-Junioren Kreisliga", url: "https://www.fussball.de/mannschaft/jsg-luebbecker-land-i-bsc-blasheim-westfalen/-/saison/2526/team-id/02M4CSBTUG000000VS5489B2VTKNAG5C" },
      { name: "JSG Lübbecker Land III (D-Junioren)", liga: "D-Junioren Kreisliga", url: "https://www.fussball.de/mannschaft/jsg-luebbecker-land-iii-bsc-blasheim-westfalen/-/saison/2526/team-id/02M5J6E7MG000000VS5489B1VT732LUQ" },
    ],
  },
  {
    title: "E- & F-Junioren",
    teams: [
      { name: "FC Lübbecke I (E-Junioren)", liga: "E-Junioren", url: "https://www.fussball.de/mannschaft/fc-luebbecke-i-fc-luebbecke-westfalen/-/saison/2526/team-id/011MID2PQO000000VTVG0001VTR8C1K7" },
      { name: "FC Lübbecke F1", liga: "F-Junioren", url: "https://www.fussball.de/mannschaft/fc-luebbecke-f1-fc-luebbecke-westfalen/-/saison/2526/team-id/018J9PRGEG000000VV0AG80NVVNE68KJ" },
      { name: "FC Lübbecke FII", liga: "F-Junioren", url: "https://www.fussball.de/mannschaft/fc-luebbecke-f2-fc-luebbecke-westfalen/-/saison/2526/team-id/02TNN131J4000000VS5489BSVTNMVP4D" },
      { name: "FC Lübbecke FIII", liga: "F-Junioren", url: "https://www.fussball.de/mannschaft/fc-luebbecke-f3-fc-luebbecke-westfalen/-/saison/2526/team-id/01HLAEOVUK000000VV0AG80NVVKQLCU9" },
      { name: "FC Lübbecke FIV", liga: "F-Junioren", url: "https://www.fussball.de/mannschaft/fc-luebbecke-f4-fc-luebbecke-westfalen/-/saison/2526/team-id/02TNN0EQ8S000000VS5489BSVTNMVP4D" },
    ],
  },
];
