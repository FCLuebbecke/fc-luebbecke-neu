import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './src/sanity/schemaTypes';

// Studio-Konfiguration des eingebetteten Sanity Studios (erreichbar unter /admin).
// Project-ID & Dataset kommen aus der .env (PUBLIC_SANITY_*).
export default defineConfig({
  name: 'fc-luebbecke',
  title: 'FC Lübbecke – Inhaltspflege',
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET || 'production',
  plugins: [structureTool(), visionTool()],
  schema: {
    types: schemaTypes,
  },
});
