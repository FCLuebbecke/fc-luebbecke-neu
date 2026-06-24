import { defineCliConfig } from 'sanity/cli';

// Projekt-Kontext für die Sanity-CLI (Project-ID ist öffentlich).
export default defineCliConfig({
  api: {
    projectId: 'u7v527gk',
    dataset: 'production',
  },
});
