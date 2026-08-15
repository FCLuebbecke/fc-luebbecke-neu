import { defineField, defineType } from 'sanity';

/**
 * FCL LIVE – Pay-per-View-Mediathek (Nachbau des WordPress-Plugins
 * "FC Lübbecke LIVE" 3.0.73 für diese Astro-Seite).
 *
 * - liveVideo:         ein Video in der Mediathek (Cloudflare Stream UID + Preis)
 * - liveEinstellungen: Preise & Zugriffsdauer (Singleton, einmal anlegen)
 * - liveKauf:          ein bezahlter Kauf (wird von der API angelegt – nicht von Hand!)
 */

export const liveVideo = defineType({
  name: 'liveVideo',
  title: 'FCL LIVE – Video',
  type: 'document',
  fields: [
    defineField({
      name: 'titel',
      title: 'Titel',
      type: 'string',
      description: 'z. B. „FC Lübbecke – TuS Tengern (komplettes Spiel)“',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'kategorie',
      title: 'Kategorie',
      type: 'string',
      options: {
        list: [
          { title: 'Komplettes Spiel', value: 'spiel' },
          { title: 'Highlights', value: 'highlights' },
          { title: 'Tore', value: 'tore' },
        ],
        layout: 'radio',
      },
      initialValue: 'spiel',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'datum',
      title: 'Spieldatum',
      type: 'date',
      options: { dateFormat: 'DD.MM.YYYY' },
    }),
    defineField({
      name: 'gegner',
      title: 'Gegner',
      type: 'string',
      description: 'Nur der Gegnername, z. B. „TuS Tengern“',
    }),
    defineField({
      name: 'cfUid',
      title: 'Cloudflare Stream Video-UID',
      type: 'string',
      description:
        'Die UID des Videos im Cloudflare-Stream-Dashboard (32 Zeichen).',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'preis',
      title: 'Preis in Euro',
      type: 'number',
      description:
        'Leer lassen = Standardpreis aus den FCL-LIVE-Einstellungen (Spiel bzw. Clip).',
      validation: (rule) => rule.min(0.01).precision(2),
    }),
    defineField({
      name: 'kostenlos',
      title: 'Kostenlos ansehen',
      type: 'boolean',
      description: 'Wenn aktiv, ist das Video ohne Kauf abspielbar.',
      initialValue: false,
    }),
    defineField({
      name: 'freigegeben',
      title: 'Freigegeben (in der Mediathek sichtbar)',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'beschreibung',
      title: 'Beschreibung',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'vorschaubild',
      title: 'Vorschaubild (optional)',
      type: 'image',
      description:
        'Leer lassen = automatisches Standbild aus dem Cloudflare-Video.',
      options: { hotspot: true },
    }),
    defineField({
      name: 'reihenfolge',
      title: 'Reihenfolge',
      type: 'number',
      description: 'Kleinere Zahl = weiter oben. Leer = nach Datum sortiert.',
    }),
  ],
  preview: {
    select: { title: 'titel', subtitle: 'kategorie', media: 'vorschaubild' },
    prepare({ title, subtitle, media }) {
      const label =
        subtitle === 'spiel'
          ? 'Komplettes Spiel'
          : subtitle === 'highlights'
            ? 'Highlights'
            : subtitle === 'tore'
              ? 'Tore'
              : subtitle;
      return { title, subtitle: label, media };
    },
  },
});

export const liveEinstellungen = defineType({
  name: 'liveEinstellungen',
  title: 'FCL LIVE – Einstellungen',
  type: 'document',
  description: 'Nur EIN Dokument dieses Typs anlegen.',
  fields: [
    defineField({
      name: 'livePreis',
      title: 'Preis Livestream (€ pro Spiel)',
      type: 'number',
      initialValue: 3.99,
      validation: (rule) => rule.required().min(0.01),
    }),
    defineField({
      name: 'spielPreis',
      title: 'Standardpreis komplettes Spiel (€)',
      type: 'number',
      initialValue: 0.99,
      validation: (rule) => rule.required().min(0.01),
    }),
    defineField({
      name: 'clipPreis',
      title: 'Standardpreis Highlights / Tore (€)',
      type: 'number',
      initialValue: 0.99,
      validation: (rule) => rule.required().min(0.01),
    }),
    defineField({
      name: 'zugriffsModus',
      title: 'Zugriff auf gekaufte Videos',
      type: 'string',
      options: {
        list: [
          { title: 'Unbegrenzt', value: 'unlimited' },
          { title: 'Zeitlich begrenzt (Stunden)', value: 'hours' },
        ],
        layout: 'radio',
      },
      initialValue: 'unlimited',
    }),
    defineField({
      name: 'zugriffsStunden',
      title: 'Zugriffsdauer in Stunden',
      type: 'number',
      initialValue: 24,
      hidden: ({ parent }) => parent?.zugriffsModus !== 'hours',
      validation: (rule) => rule.min(1).max(8760),
    }),
    defineField({
      name: 'livestreamAktiv',
      title: 'Livestream-Verkauf aktiv',
      type: 'boolean',
      description:
        'Wenn aus, wird auf der LIVE-Seite kein Livestream zum Kauf angeboten.',
      initialValue: true,
    }),
    defineField({
      name: 'liveKostenlos',
      title: 'Livestream aktuell kostenlos',
      type: 'boolean',
      description: 'Wenn aktiv, ist der Livestream ohne Bezahlung abspielbar.',
      initialValue: false,
    }),
  ],
  preview: {
    prepare: () => ({ title: 'FCL LIVE – Einstellungen' }),
  },
});

export const liveKauf = defineType({
  name: 'liveKauf',
  title: 'FCL LIVE – Kauf',
  type: 'document',
  description:
    'Wird automatisch von der Kauf-API angelegt. Nicht von Hand bearbeiten. ' +
    'Codes/Order-IDs sind aus Datenschutz-/Sicherheitsgründen nur als Hash gespeichert.',
  readOnly: true,
  fields: [
    defineField({
      name: 'videoId',
      title: 'Video-Dokument-ID',
      type: 'string',
      description: '„LIVE“ = Livestream-Kauf, sonst die _id des liveVideo-Dokuments.',
    }),
    defineField({
      name: 'videoTitel',
      title: 'Video-Titel (zum Zeitpunkt des Kaufs)',
      type: 'string',
    }),
    defineField({
      name: 'orderHash',
      title: 'PayPal Order-ID (Hash)',
      type: 'string',
    }),
    defineField({
      name: 'recoveryHash',
      title: 'Wiederherstellungscode (Hash)',
      type: 'string',
    }),
    defineField({
      name: 'deviceHash',
      title: 'Geräte-ID (Hash)',
      type: 'string',
    }),
    defineField({
      name: 'emailMasked',
      title: 'Käufer-E-Mail (maskiert)',
      type: 'string',
    }),
    defineField({
      name: 'captureIdSuffix',
      title: 'PayPal-Zahlung (letzte 6 Zeichen)',
      type: 'string',
      description: 'Zum Abgleich mit dem PayPal-Konto bei Support-Anfragen.',
    }),
    defineField({ name: 'betrag', title: 'Betrag (€)', type: 'number' }),
    defineField({ name: 'gekauftAm', title: 'Gekauft am', type: 'datetime' }),
    defineField({
      name: 'ablaufAm',
      title: 'Zugriff läuft ab am',
      type: 'datetime',
      description: 'Leer = unbegrenzter Zugriff.',
    }),
  ],
  preview: {
    select: { title: 'videoTitel', subtitle: 'emailMasked' },
  },
});
