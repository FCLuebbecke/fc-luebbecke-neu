/**
 * Jubiläumsbuch „100 Jahre FC Lübbecke“ (Spec 014, UC-002).
 *
 * Vorgabe Build-Zeit: Die Druckdatei (125 MB) liegt NICHT im Repository.
 * Die Leseprobe besteht aus vorab erzeugten WebP-Bildern unter
 * public/jubilaeumsbuch/ (seite-NNN.webp = 1200 px, seite-NNN-480.webp = 480 px),
 * damit Astro beim Build nichts umrechnen muss.
 */

export const BUCH = {
  titel: "100 Jahre FC Lübbecke",
  untertitel: "FC Lübbecke von 1925 – 100 Jahre Tradition",
  seiten: 116,
  format: "21 × 21 cm",
  /** Preis in Euro (Gründungsjahr 1925 → 19,25 €) */
  preis: 19.25,
  /** false = „Leider vergriffen“ statt Bestellformular */
  lieferbar: true,
  /** Betreff der Bestell-Mail – feststehend, damit sie sich im Postfach filtern lässt */
  bestellBetreff: "Bestellung Jubiläumsbuch",
};

export const preisText = BUCH.preis.toLocaleString("de-DE", {
  style: "currency",
  currency: "EUR",
});

export interface LeseprobeSeite {
  /** Seitennummer im PDF (dreistellig, wie im Dateinamen) */
  nr: string;
  titel: string;
  alt: string;
}

export const LESEPROBE: LeseprobeSeite[] = [
  { nr: "001", titel: "Titel", alt: "Buchtitel: Vereinswappen des FC Lübbecke vor einem historischen Schwarz-Weiß-Foto eines Spielers am Ball, darunter „100 Jahre FC Lübbecke e.V.“" },
  { nr: "002", titel: "Vorwort", alt: "Seite „Auf ein Wort“: Vorwort des 1. Vorsitzenden Gerhard Blase zum 100-jährigen Bestehen" },
  { nr: "003", titel: "Inhalt", alt: "Inhaltsverzeichnis des Jubiläumsbuchs mit den Kapiteln Vorsitzende, Vereinsgeschichte, Jugendarbeit und Unsere Heimat" },
  { nr: "010", titel: "1925 – 1975", alt: "Kapitelanfang „1925 – 1975“: Das erste Jahr des Vereins, mit einem historischen Foto eines Spielers der ersten Jugend" },
  { nr: "030", titel: "70er – 90er", alt: "Kapitelanfang „70er – 90er“ der Vereinsgeschichte" },
  { nr: "040", titel: "90er – heute", alt: "Kapitelanfang „90er – heute“: 1990 bis 2000, zwischen A-Klasse, B-Klasse und Bierkasten" },
  { nr: "062", titel: "Die jungen Grün-Weißen", alt: "Kapitel „Die jungen Grün-Weißen“: die frühen Jahre der Jugendabteilung von 1950 bis 1980" },
  { nr: "094", titel: "Die grauen Grün-Weißen", alt: "Kapitel „Die grauen Grün-Weißen“ über die Alten Herren des FC Lübbecke" },
  { nr: "102", titel: "Unsere Heimat", alt: "Kapitel „Unsere Heimat“: auf der Suche nach der richtigen Wiese – die Spielstätten des Vereins" },
  { nr: "108", titel: "Das neue Vereinsheim", alt: "Seite „Ein neuer Maßstab – Lübbeckes neue Vereinshütte“ mit Foto von Vereinsmitgliedern beim Bau" },
];

export const seitenBild = (nr: string, klein = false) =>
  `/jubilaeumsbuch/seite-${nr}${klein ? "-480" : ""}.webp`;
