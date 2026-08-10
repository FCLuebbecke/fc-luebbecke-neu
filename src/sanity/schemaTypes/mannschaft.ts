import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * Fußball-Mannschaft (Herren & Senioren ODER Jugend / Nachwuchs).
 * Bildet die zwei Karten-Typen der Seite /fussball/mannschaften ab:
 *  - Herren:  Liga + Beschreibungstext
 *  - Jugend:  Jahrgang + Trainer
 * Über `kategorie` werden die jeweils passenden Felder ein-/ausgeblendet.
 */
export const mannschaft = defineType({
  name: 'mannschaft',
  title: 'Fußball-Mannschaft',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'z. B. „1. Mannschaft“ oder „D-Jugend (D1)“',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'kategorie',
      title: 'Kategorie',
      type: 'string',
      options: {
        list: [
          { title: 'Herren & Senioren', value: 'herren' },
          { title: 'Jugend / Nachwuchs', value: 'jugend' },
        ],
        layout: 'radio',
      },
      initialValue: 'herren',
      validation: (rule) => rule.required(),
    }),

    // ── Felder für Herren & Senioren ──
    defineField({
      name: 'foto',
      title: 'Mannschaftsfoto',
      type: 'image',
      description:
        'Wird oben auf der Karte angezeigt. Gedacht v. a. für die 1. & 2. Mannschaft.',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Bildbeschreibung (Alt-Text)',
          type: 'string',
          description: 'Kurze Beschreibung des Fotos – wichtig für Barrierefreiheit.',
        }),
      ],
      hidden: ({ parent }) => parent?.kategorie !== 'herren',
    }),
    defineField({
      name: 'liga',
      title: 'Liga / Spielklasse',
      type: 'string',
      description: 'z. B. Landesliga, Kreisliga, Freizeit',
      hidden: ({ parent }) => parent?.kategorie !== 'herren',
    }),
    defineField({
      name: 'text',
      title: 'Beschreibung',
      type: 'text',
      rows: 3,
      hidden: ({ parent }) => parent?.kategorie !== 'herren',
    }),

    // ── Felder für Jugend / Nachwuchs ──
    defineField({
      name: 'jahrgang',
      title: 'Jahrgang / Alter',
      type: 'string',
      description: 'z. B. „11–12 Jahre“',
      hidden: ({ parent }) => parent?.kategorie !== 'jugend',
    }),

    // ── Gemeinsam (alle Mannschaften) ──
    defineField({
      name: 'trainer',
      title: 'Trainer',
      type: 'string',
      initialValue: 'N. N.',
    }),
    defineField({
      name: 'training',
      title: 'Trainingszeiten',
      description:
        'Ein Eintrag pro Einheit – mit „+ Add item“ weitere hinzufügen (z. B. Mittwoch UND Freitag).',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'einheit',
          title: 'Trainingseinheit',
          fields: [
            defineField({
              name: 'zeit',
              title: 'Tag & Uhrzeit',
              type: 'string',
              description: 'z. B. „Mittwoch, 19:30–21:00 Uhr“',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'ort',
              title: 'Ort',
              type: 'string',
              description: 'z. B. „Sportplatz Obernfelder Allee“ oder „Sporthalle …“',
            }),
          ],
          preview: {
            select: { title: 'zeit', subtitle: 'ort' },
          },
        }),
      ],
    }),
    defineField({
      name: 'trainingszeiten',
      title: 'Trainingszeiten (alt, eine Zeile)',
      type: 'string',
      description: 'Veraltet – bitte oben das neue Feld „Trainingszeiten“ verwenden.',
      deprecated: {
        reason: 'Durch die Liste „Trainingszeiten“ (mit Ort) ersetzt.',
      },
      hidden: ({ parent }) => !parent?.trainingszeiten,
    }),
    defineField({
      name: 'platzhalter',
      title: 'Platzhalter (Daten folgen)',
      type: 'boolean',
      description: 'Aktiviert den Hinweis „Daten folgen“ auf der Karte.',
      initialValue: false,
    }),
    defineField({
      name: 'reihenfolge',
      title: 'Reihenfolge',
      type: 'number',
      description: 'Sortierung innerhalb der Kategorie (kleiner = weiter oben).',
    }),
  ],
  orderings: [
    {
      title: 'Reihenfolge',
      name: 'reihenfolgeAsc',
      by: [{ field: 'reihenfolge', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'name',
      kategorie: 'kategorie',
      liga: 'liga',
      jahrgang: 'jahrgang',
    },
    prepare({ title, kategorie, liga, jahrgang }) {
      const gruppe = kategorie === 'jugend' ? 'Jugend' : 'Herren';
      const detail = kategorie === 'jugend' ? jahrgang : liga;
      return {
        title,
        subtitle: [gruppe, detail].filter(Boolean).join(' · '),
      };
    },
  },
});
