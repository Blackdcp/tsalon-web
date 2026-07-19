# T Salon — Night Build

> Direction 02 · Ideas under construction, brought to light.

## 1. Position

T Salon is presented as a public workbench for ideas still under construction. The atmosphere comes from a dark working environment, editorial typography and small areas of controlled light—not from cyberpunk decoration.

### Principles

1. Black is the working environment.
2. Light identifies the frontier; it is never filler.
3. Serif headlines ask questions; sans-serif text explains.
4. Experimental does not mean illegible.

## 2. Logo

- Use the white T Salon lock-up on black as the default.
- Use the dark lock-up only on off-white editorial pages.
- Minimum width: 112 px; clear space equals one symbol stroke-width.
- The Logo stays flat and monochrome. Atmospheric light may exist behind a section, never attached to the mark.
- Do not turn the `< >` symbol into a repeated neon motif.

## 3. Color

| Token | Value | Role |
|---|---:|---|
| Void | `#000000` | Primary canvas |
| Paper | `#F5F6F2` | Primary text and light editorial surface |
| Panel | `#0B0B0D` | Raised content surface |
| Line | `#27272A` | Dividers and control boundaries |
| Muted | `#999BA0` | Supporting text |
| Electric | `#6E8BFF` | Cool atmospheric light, active state |
| Ember | `#FF7A45` | Warm counterpoint, live moments |

Electric and Ember are allowed as glow, hairline, tiny status or data highlight. Primary actions remain monochrome.

## 4. Typography

- Display Chinese: `Noto Serif SC`, 600/500.
- Interface and body: `Noto Sans SC`, 500/400.
- Metadata and system copy: `IBM Plex Mono`, 500/400.
- Hero display: 64–88 px, line-height 1.04–1.1.
- Editorial titles: 36–56 px; body: 16–18 px with 1.85 line-height.
- Serif is never used for buttons, navigation, dates or taxonomy.

## 5. Layout

- Maximum page width: 1440 px; desktop outer gutter 40 px.
- 12-column grid for site structure; reading column 680–760 px.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
- Pill radius is reserved for actions and status; editorial containers stay square.
- Use hairline borders and subtle radial illumination instead of drop shadows.

## 6. Components

### Actions

- Primary: Paper background on Void, pill shape.
- Secondary: transparent, Paper outline at reduced contrast.
- Text link: monochrome underline or arrow. Colour appears only on interaction/status.

### Event card

Event imagery is desaturated and high-contrast. A small system label carries the event number. Date, location, registration status and format remain explicit HTML text.

### Dispatch card

Long-form content is called a dispatch only when it documents an unresolved question, field observation or ongoing technical shift. It still receives a stable article URL, author, date and reading time.

### Status

Use a single luminous dot plus a text label. Never communicate state with colour alone.

## 7. Photography

- Reduce saturation and slightly deepen blacks.
- Preserve recognisable faces and venue details.
- Blue/Ember light may be applied as a localized environment layer, never a full-image duotone.
- Alternate wide scene evidence with close human interaction.

## 8. Motion

- 200–320 ms, ease-out.
- Light can slowly breathe at very low amplitude on hero areas only.
- Article and registration interactions remain immediate and static.
- Disable ambient motion with `prefers-reduced-motion`.

## 9. Homepage application

The homepage opens as a quiet black field with an editorial proposition and one documentary image. A visible next-event line anchors the experience in real community activity. Content pages introduce more off-white surface for sustained reading.

## 10. Accessibility and search

- Never use muted grey for essential information below AA contrast.
- All glow is decorative and ignored by assistive technology.
- Preserve semantic headings, explicit link text and keyboard focus rings.
- Publish permanent event, article, speaker and topic URLs with relevant schema.org JSON-LD.
- Render complete content statically so crawlers and answer engines receive the same information as users.
