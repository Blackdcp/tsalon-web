import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.tsalon.tech',
  output: 'static',
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    sitemap({
      filter: (page) => !page.endsWith('/gallery/') && !page.endsWith('/join/'),
    }),
  ],
  redirects: {
    '/join/': '/about/#join',
    '/archives/': '/articles/',
    '/archives/[id]': '/articles/[id]',
    '/en/archives/': '/en/articles/',
    '/en/archives/[id]': '/en/articles/[id]',
  },
  build: {
    format: 'directory',
  },
});
