import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel/static';

export default defineConfig({
  site: 'https://www.tsalon.tech',
  output: 'static',
  adapter: vercel(),
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
    '/gallery/': '/history/',
    '/gallery/[id]': '/history/[id]',
    '/en/gallery/': '/en/history/',
    '/en/gallery/[id]': '/en/history/[id]',
    '/stories/': '/events/',
    '/stories/[id]': '/events/[id]',
    '/en/stories/': '/en/events/',
    '/en/stories/[id]': '/en/events/[id]',
  },
  build: {
    format: 'directory',
  },
});
