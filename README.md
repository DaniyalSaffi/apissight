# ApisSight — project website

A static website presenting a final-year project: an AI system for honeybee
disease detection and beehive health monitoring, built at Namal University,
Mianwali, with mentorship from SAWiE Ecosystem.

**Status: early release.** The site carries a `noindex` tag and an
"Early release: some sections are still being completed" banner. The launch
gate (`npm run gate:strict`) stays red until every remaining blocker in the
local open-items list is cleared and the owner approves the full launch. The
CI launch-gate job is report-only (non-blocking) for the early release.

"ApisSight" is the brand name decided 2026-11-12, kept in
`apps/web/src/site.config.ts`. A public web check found no exact-name product,
website, or social handle, but domain registration and trademark status are
unconfirmed and a professional clearance search is still needed. See the
local research notes (entries #37–#42) and the local open-items list
(BRAND-1). Both are kept outside the public repo.

## What the site is — and is not

- It presents the project, the team, the partner, the field work, the awards,
  and the research — using only facts from the FYP report plus confirmed
  public sources. Anything unconfirmed is a visible placeholder.
- The Research page shows **reported project results** from the final report
  and poster, each with its exact source and what it measures, under the line
  "Reported by the project team. Independent measurement of the deployed demo
  models is pending." Three literature-review values are withheld by owner
  decision, and **no figure is attached to the demo models** until a
  parity/measurement run exists. See the local open-items list (metrics
  decision record) and `docs/PARITY_REPORT.md`.
- The Detector page runs the **Phase 2 detector UI** (queue, result cards,
  history, exports, charts, offline support) but shows a friendly
  **"Live demo coming soon"** state until the converted models exist and
  parity passes. No mock predictions. See `ml/COLAB_RUNBOOK.md`.
- The site makes no licence, open-source, patent, market, or "field-validated"
  claims. Wording is deliberately cautious: this is a prototype for
  decision support, not a replacement for expert inspection.

## Run it locally

Requirements: Node 18+ and npm. No other setup.

```bash
npm install
npm run build     # builds apps/web into apps/web/dist
npm run preview   # serves the built site locally
```

During development:

```bash
npm run dev       # Astro dev server for apps/web
```

Checks:

```bash
npm run check:links   # internal-link check over the built site (needs build first)
npm run gate          # launch-gate report (lists blockers, exits 0)
npm run gate:strict   # launch-gate strict (exits 1 while any blocker remains)
npm test              # stub-model unit tests (tests/ only, never bundled)
npm run test:e2e      # Playwright smoke test + axe on every page (needs build first)
```

## Structure

```
apps/web/            Astro site (showcase pages + detector + DE/UR shells)
  src/site.config.ts   Single source of truth: brand, links, languages, release flags
  src/pages/           Routes: /, /project, /detector, /journey, /partnership,
                       /field-work, /research, /awards, /team, /models-data,
                       /roadmap, /learn, /news, /press, /faq, /contact,
                       /privacy, /terms, /imprint, /credits, /de, /ur
  src/data/            Typed content data (team, awards, timeline, faq, learn, roadmap, results, credits)
  src/lib/detector/    Phase 2 detector: worker, client, queue UI, history, exports, charts
  src/i18n/            en (current), de + ur (drafts, needsReview)
  public/images/       Original SVG art + licensed stock photos (see CREDITS.md)
  public/manifest.webmanifest + sw.js + icons/   PWA (offline app shell)
packages/core/         Shared types + inference interfaces (incl. detector types)
packages/ui/           Design tokens (honey palette, type scale)
packages/models/       Converted model output — EMPTY until conversion + parity pass
ml/                    Conversion + parity scripts, Colab runbook (no training)
  parity_images/       Unlabelled parity image set (gitignored; backend-agreement only)
docs/                  Pages setup, parity report, model-publishing note
scripts/               Launch-gate + link checker
tests/                 Stub-model unit tests + Playwright smoke/axe tests (never bundled)
.github/workflows/     ci.yml (build + gate report), deploy.yml (Pages deploy)
```

Four working documents are kept OUTSIDE the public repo, in a local folder
next to it: research findings, open items, the access log, and outreach
drafts. They contain working notes and drafts that are not for publication.
Do not copy them into this repo.

## Deploy

See `docs/GITHUB_PAGES_SETUP.md` for click-by-click steps. In short: create a
public repo (GitHub Pages on a free plan needs a public repo; private-repo
Pages needs a paid plan), push, set repo variables `SITE_URL` and `BASE_PATH`,
set Pages source to GitHub Actions. The deploy workflow publishes the early
release automatically on push to `main` and on manual dispatch.

## Documents

- `docs/GITHUB_PAGES_SETUP.md` — click-by-click Pages setup.
- `docs/PARITY_REPORT.md` — parity template; pending until the Colab run.
- `docs/MODEL_PUBLISHING.md` — decision note: how converted model weights may
  be published once the IP decision is recorded.
- `ml/COLAB_RUNBOOK.md` — exact Colab steps for conversion + parity.
- `ml/README.md` — dashboard-reference mapping to Phase 2 detector requirements.

## Rules for contributors

1. **Never invent a fact.** If the report or a cited public source does not
   state it, use a visible `[PLACEHOLDER: ...]` and log it in the local
   open-items list.
2. **Never publish a person or partner** without confirmed permission,
   recorded in the local open-items list.
3. **Never edit the models.** Conversion only; parity decides the demo route.
4. **Never publish student IDs**, the report PDF, or the poster as-is.
5. **Keep brand/domain/links in `site.config.ts` only.** No hardcoded copies.
6. **Keep the gate honest.** Do not remove pending markers to make CI green.
   Clear the underlying item instead, and record it in the local open-items
   list.

## Deviations from the master plan (documented)

The master plan is the source of truth; these early-release deviations are
deliberate and recorded here rather than hidden:

- **npm workspaces instead of pnpm** — pnpm was unavailable in the build
  environment. Monorepo layout is identical; switching later is tooling-only.
- **Plain CSS design tokens instead of Tailwind** — build reliability for the
  early release. Tokens match the plan palette. Tailwind can be added later.
- **Astro + vanilla TypeScript instead of React islands** — the Phase 2
  detector is built in plain TypeScript modules (worker, client, UI) for
  build reliability in this environment. The plan's React stack can replace
  it later without changing the worker protocol or types.
- **Google Fonts via link** instead of self-hosted fonts — disclose + self-host
  before the full launch (local open-items list, TECH-1).
- **Deploy via `actions/configure-pages` + upload/deploy artifact** instead of
  `withastro/action` — equivalent GitHub Pages flow, fewer moving parts.
- **Pagefind search and Lighthouse CI deferred** (local open-items list,
  TECH-3). PWA (manifest + service worker + icons) is shipped. No fake search
  is shipped.
