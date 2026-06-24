/**
 * Inhalte der Sparten Badminton & Darts (claude.md Abschnitt 7.2 / 7.3).
 * Struktur analog Fußball: Unterseiten Mannschaften · Trainingszeiten · Kontakt.
 * ⚠️ Alle Angaben sind Platzhalter – später durch echte Vereinsdaten/Fotos ersetzen.
 */
export interface Training {
  gruppe: string;
  zeit: string;
}
export interface Team {
  name: string;
  info: string;
  platzhalter?: boolean;
}
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
  teams: Team[];
  fotos: Foto[];
  training: Training[];
  ortName: string;
  ortAdresse: string;
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
  teams: [
    { name: "Hobby- & Freizeitgruppe", info: "Offenes Spiel für alle – ohne Druck, mit viel Spaß am Federball.", platzhalter: true },
    { name: "Wettkampfgruppe", info: "Für ambitionierte Spielerinnen und Spieler mit Punktspielbetrieb.", platzhalter: true },
  ],
  fotos: [
    { src: "/sparte-badminton.svg", alt: "Spielszene aus dem Badminton-Training" },
    { src: "/sparte-badminton.svg", alt: "Federbälle und Schläger" },
    { src: "/sparte-badminton.svg", alt: "Gruppenfoto der Badminton-Sparte" },
  ],
  training: [
    { gruppe: "Erwachsene (offen)", zeit: "Mittwoch, 19:30 – 21:30 Uhr" },
    { gruppe: "Jugend", zeit: "Freitag, 17:00 – 18:30 Uhr" },
  ],
  ortName: "Sporthalle Kollegienwall",
  ortAdresse: "Kollegienwall 1, 32312 Lübbecke",
  ansprechName: "Anna Beispiel",
  ansprechRolle: "Spartenleitung Badminton",
  ansprechMail: "badminton@fc-luebbecke.de",
  ansprechTel: "05741 / 123 456 7",
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
  teams: [
    { name: "Liga-Mannschaft", info: "Unser Team im Punktspielbetrieb der Dart-Liga.", platzhalter: true },
    { name: "Hobby-Runde", info: "Lockeres Werfen für alle – einfach vorbeikommen und mitmachen.", platzhalter: true },
  ],
  fotos: [
    { src: "/sparte-darts.svg", alt: "Dartscheibe im Vereinsheim" },
    { src: "/sparte-darts.svg", alt: "Spieler beim Wurf" },
    { src: "/sparte-darts.svg", alt: "Gruppenfoto der Darts-Sparte" },
  ],
  training: [
    { gruppe: "Offenes Training", zeit: "Dienstag, 19:00 – 22:00 Uhr" },
    { gruppe: "Liga-Mannschaft", zeit: "Freitag, 20:00 Uhr (Spieltage)" },
  ],
  ortName: "Vereinsheim FC Lübbecke – Clubraum",
  ortAdresse: "Obernfelder Allee 42, 32312 Lübbecke",
  ansprechName: "Tom Beispiel",
  ansprechRolle: "Spartenleitung Darts",
  ansprechMail: "darts@fc-luebbecke.de",
  ansprechTel: "05741 / 123 456 7",
  schnupper:
    "Komm einfach zum offenen Training vorbei – Pfeile zum Ausprobieren sind vorhanden. Kein Anmelden, kein Druck: reinschauen, mitwerfen, Spaß haben.",
};

export const sparten = { badminton, darts };
