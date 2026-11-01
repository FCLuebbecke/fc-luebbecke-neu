// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Kanonische Domain (ohne Bindestrich!). fc-luebbecke.de ist fremd –
  // dort liegt die alte Badminton-Seite auf Strato (siehe Spec 005).
  site: 'https://www.fcluebbecke.de',
  image: {
    // Instagram-Bilder werden beim Build heruntergeladen und selbst gehostet:
    // Die signierten Meta-CDN-URLs laufen nach kurzer Zeit ab (403 auf Vercel),
    // und Besucher-Browser sollen keine Meta-Server kontaktieren (DSGVO).
    remotePatterns: [
      { protocol: 'https', hostname: '**.cdninstagram.com' },
      { protocol: 'https', hostname: '**.fbcdn.net' },
    ],
  },
  integrations: [
    sitemap({
      // Build-Zeitpunkt als lastmod: Inhalte werden zur Build-Zeit geladen,
      // jeder Build (täglicher Rebuild, Inhaltsänderung) ist ein neuer Stand.
      serialize: (item) => ({ ...item, lastmod: new Date().toISOString() }),
    }),
  ],
});
