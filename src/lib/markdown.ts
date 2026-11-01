/**
 * Markdown der Beiträge (Feld `inhalt`, Spec 007) in HTML umwandeln.
 * HTML im Text wird nicht übernommen (escaped), externe Links öffnen in neuem Tab.
 */
import { Marked } from 'marked';

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const marked = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    html({ text }) {
      return escape(text);
    },
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const sicher = /^(https?:|mailto:|tel:|\/|#)/i.test(href) ? href : '#';
      const extern = /^https?:/i.test(sicher) && !/^https?:\/\/(www\.)?fcluebbecke\.de/i.test(sicher);
      const t = title ? ` title="${escape(title)}"` : '';
      return extern
        ? `<a href="${escape(sicher)}"${t} target="_blank" rel="noopener noreferrer">${text}<span class="sr-only"> (öffnet in neuem Fenster)</span></a>`
        : `<a href="${escape(sicher)}"${t}>${text}</a>`;
    },
    image({ text }) {
      // Bilder gehören in titelbild/galerie, nicht in den Text.
      return escape(text);
    },
  },
});

export function markdownZuHtml(md: string): string {
  return marked.parse(md, { async: false }) as string;
}
