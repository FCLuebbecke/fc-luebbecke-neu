import { defineField, defineType } from 'sanity';

/**
 * Trainingszeiten & Ort einer Sparte – eine pro Sportart. Badminton und Darts sind
 * GETRENNTE Dokumenttypen, teilen aber die Feld-Vorlage:
 * Liste der Trainingszeiten (Gruppe + Zeit) sowie Halle/Ort mit Adresse.
 */
function defineSparteInfo(name: string, title: string, label: string) {
  return defineType({
    name,
    title,
    type: 'document',
    fields: [
      defineField({
        name: 'training',
        title: 'Trainingszeiten',
        type: 'array',
        of: [
          {
            type: 'object',
            name: 'zeit',
            title: 'Trainingszeit',
            fields: [
              defineField({
                name: 'gruppe',
                title: 'Gruppe',
                type: 'string',
                description: 'z. B. „Erwachsene (offen)“ oder „Jugend“',
                validation: (rule) => rule.required(),
              }),
              defineField({
                name: 'zeit',
                title: 'Zeit',
                type: 'string',
                description: 'z. B. „Mittwoch, 19:30 – 21:30 Uhr“',
                validation: (rule) => rule.required(),
              }),
            ],
            preview: {
              select: { title: 'gruppe', subtitle: 'zeit' },
            },
          },
        ],
      }),
      defineField({
        name: 'ortName',
        title: 'Ort / Halle',
        type: 'string',
        description: 'z. B. „Sporthalle Kollegienwall“',
      }),
      defineField({
        name: 'ortAdresse',
        title: 'Adresse',
        type: 'string',
        description: 'z. B. „Kollegienwall 1, 32312 Lübbecke“',
      }),
    ],
    preview: {
      select: { ort: 'ortName' },
      prepare({ ort }) {
        return { title: `Trainingszeiten – ${label}`, subtitle: ort };
      },
    },
  });
}

export const badmintonInfo = defineSparteInfo(
  'badmintonInfo',
  'Badminton – Trainingszeiten & Ort',
  'Badminton',
);
export const dartsInfo = defineSparteInfo(
  'dartsInfo',
  'Darts – Trainingszeiten & Ort',
  'Darts',
);
