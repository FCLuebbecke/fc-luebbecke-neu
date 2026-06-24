import { defineField, defineType } from 'sanity';

/**
 * Mannschaft/Gruppe einer Sparte. Badminton und Darts sind GETRENNTE Dokumenttypen
 * (eigene Einträge im Studio), teilen sich aber dieselbe Feld-Vorlage:
 * Name, Liga (optional), Info-Text, externer Spielplan-Link (optional), Platzhalter.
 */
function defineSparteMannschaft(name: string, title: string) {
  return defineType({
    name,
    title,
    type: 'document',
    fields: [
      defineField({
        name: 'name',
        title: 'Name',
        type: 'string',
        description: 'z. B. „Mannschaft 1“ oder „Hobby-Runde“',
        validation: (rule) => rule.required(),
      }),
      defineField({
        name: 'foto',
        title: 'Mannschaftsfoto',
        type: 'image',
        description: 'Optional – wird oben auf der Karte angezeigt.',
        options: { hotspot: true },
        fields: [
          defineField({
            name: 'alt',
            title: 'Bildbeschreibung (Alt-Text)',
            type: 'string',
            description: 'Kurze Beschreibung des Fotos – wichtig für Barrierefreiheit.',
          }),
        ],
      }),
      defineField({
        name: 'liga',
        title: 'Liga / Spielklasse',
        type: 'string',
        description: 'Optional – z. B. „Landesliga Nord 2b“. Leer lassen, wenn keine Liga.',
      }),
      defineField({
        name: 'info',
        title: 'Beschreibung',
        type: 'text',
        rows: 3,
      }),
      defineField({
        name: 'href',
        title: 'Link zu Spielplan / Tabelle',
        type: 'url',
        description: 'Optional – externe Seite (z. B. DBV-Turnierseite). Öffnet in neuem Tab.',
      }),
      defineField({
        name: 'platzhalter',
        title: 'Platzhalter (Daten folgen)',
        type: 'boolean',
        initialValue: false,
      }),
      defineField({
        name: 'reihenfolge',
        title: 'Reihenfolge',
        type: 'number',
        description: 'Sortierung der Karten (kleiner = weiter oben).',
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
      select: { title: 'name', liga: 'liga' },
      prepare({ title, liga }) {
        return { title, subtitle: liga };
      },
    },
  });
}

export const badmintonMannschaft = defineSparteMannschaft(
  'badmintonMannschaft',
  'Badminton – Mannschaft',
);
export const dartsMannschaft = defineSparteMannschaft(
  'dartsMannschaft',
  'Darts – Mannschaft',
);
