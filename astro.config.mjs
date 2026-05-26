// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import editCatalog from './src/integrations/edit-catalog/index.mjs';

export default defineConfig({
  site: 'https://www.moulinareves.com',
  output: 'static',
  adapter: vercel(),
  integrations: [sitemap({
    filter: (page) => !page.includes('/success/') && !page.includes('/the-compound/')
  }), editCatalog()],
});
