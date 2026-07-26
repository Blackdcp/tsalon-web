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
    '/archives/[...slug]': '/articles/[...slug]',
    '/en/archives/': '/en/articles/',
    '/en/archives/[...slug]': '/en/articles/[...slug]',
  },
  build: {
    format: 'directory',
  },
});
