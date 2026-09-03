// @ts-check
import { defineConfig } from 'astro/config';
import sanity from '@sanity/astro';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';

// Sanity-Zugang aus .env (PUBLIC_ = auch im Browser/Studio verfügbar).
const { PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET } = loadEnv(
  process.env.NODE_ENV ?? 'development',
  process.cwd(),
  '',
);

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
    sanity({
      projectId: PUBLIC_SANITY_PROJECT_ID,
      dataset: PUBLIC_SANITY_DATASET || 'production',
      // Build-Zeit-Fetch: keine CDN-Verzögerung, immer frische Daten beim Bauen.
      useCdn: false,
      // Pflege-Oberfläche (Sanity Studio) eingebettet unter /admin.
      studioBasePath: '/admin',
    }),
    react(),
    sitemap({
      // Sanity Studio (/admin) ist passwortgeschützt und gehört nicht in die Sitemap.
      filter: (page) => !page.includes('/admin'),
      // Build-Zeitpunkt als lastmod: Inhalte werden zur Build-Zeit geladen,
      // jeder Build (täglicher Rebuild, Sanity-Publish) ist ein neuer Stand.
      serialize: (item) => ({ ...item, lastmod: new Date().toISOString() }),
    }),
  ],
});
