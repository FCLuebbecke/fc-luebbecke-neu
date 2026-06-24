// @ts-check
import { defineConfig } from 'astro/config';
import sanity from '@sanity/astro';
import react from '@astrojs/react';
import { loadEnv } from 'vite';

// Sanity-Zugang aus .env (PUBLIC_ = auch im Browser/Studio verfügbar).
const { PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET } = loadEnv(
  process.env.NODE_ENV ?? 'development',
  process.cwd(),
  '',
);

// https://astro.build/config
export default defineConfig({
  site: 'https://fc-luebbecke.de',
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
  ],
});
