# T Salon Protocol — selected site system

This directory contains both the approved high-fidelity prototype and a working static Astro implementation.

## Review pages

- `index.html` — homepage prototype
- `event.html` — event detail and registration/archive lifecycle
- `article.html` — long-form article and source metadata
- `components.html` — tokens and component library
- `previews/` — desktop and mobile renders

## Astro implementation

The Astro source is under `src/`. It uses build-time Content Collections for:

- `events` — date, venue, registration status, agenda, speakers, FAQ and permanent archive;
- `articles` — author, dates, topics, related events, citations and SEO fields;
- `people` — reusable speaker and author records.

The site generates static HTML, sitemap, `robots.txt`, `llms.txt`, canonical URLs and schema.org JSON-LD. No database, CMS or runtime server is required.

```bash
npm install
npm run dev
npm run content:validate
npm run build
```

The production output is written to `dist/`.

## Content workflow

See `content-ops/README.md`. AI is triggered on demand from a human-approved brief, creates a draft Markdown file, and cannot publish until fact review and schema validation pass.
