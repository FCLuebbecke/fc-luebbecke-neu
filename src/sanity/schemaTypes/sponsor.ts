import { defineField, defineType } from 'sanity';

/**
 * Sponsor / Partner des Vereins – erscheint in der Sponsoren-Sektion der Startseite.
 * Logo + Name + optional Website-Link.
 */
export const sponsor = defineType({
  name: 'sponsor',
  title: 'Sponsor / Partner',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'Name des Unternehmens / Partners.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'stufe',
      title: 'Stufe',
      type: 'string',
      description: 'Premium-Partner werden größer dargestellt.',
      options: {
        list: [
          { title: 'Premium (groß)', value: 'premium' },
          { title: 'Normal', value: 'normal' },
        ],
        layout: 'radio',
      },
      initialValue: 'normal',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      description: 'Logo des Sponsors (wird vollständig dargestellt, nicht beschnitten).',
      options: { hotspot: false },
      fields: [
        defineField({
          name: 'alt',
          title: 'Bildbeschreibung (Alt-Text)',
          type: 'string',
          description: 'z. B. „Logo Musterfirma GmbH“ – wichtig für Barrierefreiheit.',
        }),
      ],
    }),
    defineField({
      name: 'website',
      title: 'Website',
      type: 'url',
      description: 'Optional – Link zur Sponsor-Website. Öffnet in neuem Tab.',
    }),
    defineField({
      name: 'reihenfolge',
      title: 'Reihenfolge',
      type: 'number',
      description: 'Sortierung (kleiner = weiter vorne).',
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
    select: { title: 'name', media: 'logo', stufe: 'stufe' },
    prepare({ title, media, stufe }) {
      return {
        title,
        media,
        subtitle: stufe === 'premium' ? 'Premium-Partner' : 'Sponsor',
      };
    },
  },
});
