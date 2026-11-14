# Tiago Saraiva — Portfolio

[Português](LEIA-ME.md)

Personal portfolio of Tiago Saraiva, designer and developer. It presents games, web projects and creative experiments.

**Live site:** https://tiagojsaraiva.github.io/Portfolio/

## Highlights

- **Interactive landing:** three sectors (Games, Web, Misc) meet at a shared point. Each has a ball you can click, focus or drag into any sector.
- **Animated category transitions:** the selected sector sweeps over the screen, its ball flies to the corner with overshoot, and a continuous project belt rises into view.
- **Project belt:** an auto-scrolling carousel that pauses on hover, focus, drag or the explicit control. Dragging never opens a link, and keyboard activation still works after a drag.
- **English and Portuguese:** interface, content, accessibility labels and error messages are fully translated. The chosen language is remembered when the browser allows storage.
- **Accessible by design:** native buttons, visible focus, skip link and named icons. `prefers-reduced-motion` disables automatic and animated movement.
- **Shareable URLs:** categories open directly through `#/games`, `#/web` and `#/misc`.
- **Fully static:** no server, database or CMS. All content lives in typed TypeScript and local assets.

## Tech stack

React 19, TypeScript (strict), Vite, React Router (hash routing), Motion, Embla Carousel, Lucide and CSS Modules. Tooling: pnpm, Oxlint, Prettier, Vitest + Testing Library, and Playwright.

## Running locally

Requirements: Node.js 22+ and pnpm 9 (`corepack enable` picks the version pinned in `package.json`).

```bash
pnpm install
pnpm dev
```

| Command                | Purpose                                                       |
| ---------------------- | ------------------------------------------------------------- |
| `pnpm dev`             | Development server                                            |
| `pnpm build`           | Strict type check and production build in `dist/`             |
| `pnpm preview`         | Serve the production build locally                            |
| `pnpm lint`            | Oxlint                                                        |
| `pnpm format:check`    | Check formatting (`pnpm format` applies it)                   |
| `pnpm test`            | Component and data-contract tests (Vitest + jsdom)            |
| `pnpm test:e2e`        | Browser tests in Chromium (Playwright)                        |
| `pnpm artwork`         | Regenerate the placeholder SVG artwork                        |

Before the first `pnpm test:e2e`, install the browser with `pnpm exec playwright install chromium`.

## Project structure

```
src/
  app/         providers, language and routes
  pages/home/  landing and category screens, with their geometry and transitions
  features/    shared project, carousel and skill behavior
  components/  reusable UI with no personal content
  data/        typed contracts, profile, categories, projects, skills and UI text
  styles/      design tokens and global rules
  assets/      project artwork imported through Vite
e2e/           Playwright specs
scripts/       placeholder artwork generator
```

## Editing content

| Content                                      | Source                                  |
| -------------------------------------------- | --------------------------------------- |
| Name, introduction, GitHub and LinkedIn      | `src/data/portfolio.ts` → `profile`     |
| Categories                                   | `src/data/portfolio.ts` → `categories`  |
| Skill catalog                                | `src/data/portfolio.ts` → `skills`      |
| Projects                                     | `src/data/portfolio.ts` → `seeds`       |
| Interface text and messages                  | `src/data/messages.ts`                  |
| Types and available fields                   | `src/data/types.ts`                     |

- Translated text requires both `en` and `pt`.
- Category IDs are `games`, `web` and `misc`. Project IDs must be unique and stable, because they are part of shareable links.
- Reference skills by ID, and add new skills to the catalog first.
- Project artwork lives in `src/assets/projects/<Project>/` as `bg.png` and an optional `logo.png`. Import both through Vite. Missing or broken images fall back to a translated "Preview coming soon" card.
- `github` and `access` links are optional and independent. A link without a URL is omitted entirely.

## Deployment

Every push to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). It runs lint, format check, unit tests, the production build and the Playwright suite. The site is published to GitHub Pages only if all of them pass. Pull requests run the same checks without deploying.

The build uses a relative base (`base: './'`) and hash routing, so it works under the `/Portfolio/` subpath without server rewrites.

## License

All rights reserved. The source is public for viewing and reference only. The code, artwork, text and visual identity may not be copied, modified or redistributed without permission.
