import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import auth from 'auth-astro';

export default defineConfig({
  site: 'https://www.tsalon.tech',
  output: 'hybrid',
  adapter: vercel(),
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    auth(),
    sitemap({
      filter: (page) => !page.endsWith('/gallery/') && !page.endsWith('/join/'),
    }),
  ],
  build: {
    format: 'directory',
  },
});
