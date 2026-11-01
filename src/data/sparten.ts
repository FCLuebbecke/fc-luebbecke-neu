/**
 * Inhalte der Sparten Badminton & Darts (claude.md Abschnitt 7.2 / 7.3).
 * Struktur analog Fußball: Unterseiten Mannschaften · Trainingszeiten · Kontakt.
 * Mannschaften, Trainingszeiten und Ort liegen als Inhalte unter src/content/
 * (sparten-mannschaften, sparten-infos). Hier nur die festen Seitentexte.
 * ⚠️ Fotos und Ansprechpartner sind noch Platzhalter.
 */
export interface Foto {
  src: string;
  alt: string;
}
export interface SparteData {
  id: string; // = Header-Nav-id (badminton | darts)
  name: string;
  basePath: string; // z. B. "/badminton"
  claim: string;
  intro: string;
  heroImg: string;
  heroAlt: string;
  fotos: Foto[];
  ansprechName: string;
  ansprechRolle: string;
  ansprechMail: string;
  ansprechTel?: string;
  schnupper: string;
}

export const badminton: SparteData = {
  id: "badminton",
  name: "Badminton",
  basePath: "/badminton",
  claim: "Schnell, dynamisch und für jedes Alter – komm zum Federball in die Halle.",
  intro:
    "Unsere Badminton-Sparte ist eine bunt gemischte Truppe vom Freizeitspieler bis zur ambitionierten Spielerin. Wir treffen uns regelmäßig in der Halle, spielen Einzel und Doppel und legen großen Wert auf ein lockeres, freundliches Miteinander. Egal ob Anfänger oder erfahren – bei uns findest du Spielpartner auf deinem Niveau.",
  heroImg: "/sparte-badminton.svg",
  heroAlt: "Federball beim Badminton",
  fotos: [
    { src: "/sparte-badminton.svg", alt: "Spielszene aus dem Badminton-Training" },
    { src: "/sparte-badminton.svg", alt: "Federbälle und Schläger" },
    { src: "/sparte-badminton.svg", alt: "Gruppenfoto der Badminton-Sparte" },
  ],
  ansprechName: "FC Lübbecke e.V.",
  ansprechRolle: "Kontakt Badminton",
  ansprechMail: "kontakt@fcluebbecke.de",
  schnupper:
    "Schau einfach zu einem Training vorbei – Schläger zum Ausleihen sind da. Die ersten Male sind kostenlos und unverbindlich. Melde dich kurz vorher, dann freuen wir uns auf dich.",
};

export const darts: SparteData = {
  id: "darts",
  name: "Darts",
  basePath: "/darts",
  claim: "Präzision trifft Gemeinschaft – wirf mit und werde Teil der Runde.",
  intro:
    "In unserer Darts-Sparte zählt nicht nur die ruhige Hand, sondern vor allem der Spaß an der Sache. Wir spielen in gemütlicher Runde im Vereinsheim, treten in der Liga an und freuen uns über jeden, der mitwerfen möchte. Vom ersten 180er bis zum geselligen Abend – bei uns ist jeder willkommen, ganz ohne Vorkenntnisse.",
  heroImg: "/sparte-darts.svg",
  heroAlt: "Dartscheibe mit Pfeilen",
  fotos: [
    { src: "/sparte-darts.svg", alt: "Dartscheibe im Vereinsheim" },
    { src: "/sparte-darts.svg", alt: "Spieler beim Wurf" },
    { src: "/sparte-darts.svg", alt: "Gruppenfoto der Darts-Sparte" },
  ],
  ansprechName: "FC Lübbecke e.V.",
  ansprechRolle: "Kontakt Darts",
  ansprechMail: "kontakt@fcluebbecke.de",
  schnupper:
    "Komm einfach zum offenen Training vorbei – Pfeile zum Ausprobieren sind vorhanden. Kein Anmelden, kein Druck: reinschauen, mitwerfen, Spaß haben.",
};

export const sparten = { badminton, darts };
