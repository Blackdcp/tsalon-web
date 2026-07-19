# T Salon — Protocol

> Direction 01 · A community, expressed as a protocol.

**Status:** Selected visual system · July 2026

## 1. Position

T Salon is treated as a piece of long-lived technical infrastructure: open, precise and composable. The interface should feel maintained rather than marketed, allowing the community's activities, people and accumulated knowledge to become the visual focus.

### Principles

1. Structure before decoration.
2. Every visual state has semantic responsibility.
3. Density is welcome; noise is not.
4. The community is shown through real evidence: people, events, notes and archives.

## 2. Logo

- Use the existing T Salon lock-up without redrawing it.
- Primary use: `Ink` on white or transparent backgrounds.
- Reverse use: white on `Ink` or photography with sufficient contrast.
- Minimum width: 112 px for the complete lock-up.
- Clear space: at least one stroke-width of the `< >` symbol on every side.
- Never add outlines, gradients, shadows or glow to the mark.
- `Signal Blue` belongs to interface state, not the Logo.

## 3. Color

| Token | Value | Role |
|---|---:|---|
| Ink | `#151515` | Primary text, dark surfaces |
| Canvas | `#FFFFFF` | Main page background |
| Soft | `#F6F6F3` | Quiet section and input background |
| Line | `#E4E4E0` | Dividers and card boundaries |
| Body | `#5B5B59` | Secondary text |
| Signal | `#146EF5` | Links, live status, selected state only |

Black and white should occupy at least 90% of a page. Signal Blue must never become a decorative wash.

## 4. Typography

- Display and UI: `Noto Sans SC`, 600/500/400.
- Latin fallback: Arial or a neutral grotesk.
- Metadata and code: `IBM Plex Mono`, 500/400.
- Display: 64–88 px, line-height 1.08–1.12, tracking -0.055 em.
- H1: 48–72 px; H2: 28–40 px; body: 16–18 px; metadata: 11–12 px.
- Chinese body line-height: 1.8. Keep long content columns between 640 and 760 px.

## 5. Layout

- Maximum page width: 1440 px.
- Desktop grid: 12 columns, 40 px outer gutter, 24 px inner gap.
- Mobile gutter: 20 px.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
- Radius: 5 px for controls; no rounding on editorial/image containers.
- Use 1 px borders in `Line`; shadows are rare and low contrast.

## 6. Components

### Actions

- Primary button: white on Ink or Ink on white depending on surface.
- Secondary button: transparent with a 1 px current-color border.
- Inline link: text underline or right arrow; `Signal` may indicate active state.

### Event card

Must show date, city, registration state, title, format and action. On event-detail pages, expose speakers, agenda, venue, capacity, registration deadline and structured FAQ as real text.

### Article card

Must show content type, reading time, title, summary and author/editor. Cards link to permanent article URLs, not overlays.

### Taxonomy

Use stable topic names such as AI, Apple, Robotics and Community. Categories are content architecture and must map to archive pages.

## 7. Photography

- Preserve natural colour and documentary character.
- Crop around relationships between people, not generic stage geometry.
- Do not put text across faces.
- Captions carry event name, year and city in monospaced metadata.

## 8. Motion

- 160–240 ms for hover and state transitions.
- Use opacity and 2–4 px translation; no elastic easing.
- Respect `prefers-reduced-motion`.

## 9. Homepage application

The first screen contains one proposition, one explanatory paragraph, two actions and a real community image. The next-event ticker is visible without scrolling. Activity, content and archive pages reuse the same taxonomy and grid.

## 10. Accessibility and search

- Target WCAG AA contrast.
- Keep headings in logical order and all meaningful copy in HTML.
- Use `Event`, `Article`, `Organization`, `Person`, `BreadcrumbList` and `FAQPage` structured data where applicable.
- Every event becomes a permanent archive page after it ends; registration UI is replaced by recap, media and related reading.

## 11. Implementation inventory

- High-fidelity homepage: `prototype/index.html`
- High-fidelity event detail: `prototype/event.html`
- High-fidelity article detail: `prototype/article.html`
- Component library: `prototype/components.html`
- CSS design tokens: `prototype/assets/tokens.css`
- Platform-neutral token source: `prototype/assets/tokens.json`
- Shared components: `prototype/assets/components.css`
- Responsive page layouts: `prototype/assets/pages.css`
- Astro content schemas: `prototype/src/content.config.ts`
- AI editorial workflow: `prototype/content-ops/README.md`

The Astro build is fully static. Content lives in reviewed Markdown files, registration links to an external form, and publishing requires no database, CMS or application server.
