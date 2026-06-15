// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import { execSync } from 'node:child_process';
import editCatalog from './src/integrations/edit-catalog/index.mjs';
import responsiveImages from './src/integrations/responsive-images/index.mjs';

// Resolve git HEAD short SHA at config-load time (once per `astro build`).
// Mirrors src/integrations/edit-catalog/index.mjs:126-133 so the <meta x-build-sha>
// value in deployed HTML and the catalog's buildSha field are byte-identical.
let buildSha;
try {
  buildSha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
} catch (_err) {
  buildSha = 'unknown';
}

export default defineConfig({
  site: 'https://www.moulinareves.com',
  output: 'static',
  adapter: vercel(),
  integrations: [sitemap({
    filter: (page) => !page.includes('/success/') && !page.includes('/the-compound/')
  }), editCatalog(), responsiveImages()],
  vite: {
    define: {
      // Replaces every BUILD_SHA identifier in the source tree with this JSON-stringified value.
      BUILD_SHA: JSON.stringify(buildSha),
    },
  },
});
