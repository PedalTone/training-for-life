# Training for Life

An iPhone-friendly fitness planner and workout log, with a Home screen, Today,
Plan, History, Progress, and Settings. The app supports recurring schedules,
one-day changes, mobility exercises, videos, photos, backup/restore, and optional
AI-assisted features. Nutrition starts collapsed below the workout session, with quick Yes/No check-ins,
with notes via typing or the phone keyboard’s dictation.

## Continue development

Read `AGENTS.md`, `HANDOFF.md`, `VERSIONING.md`, and `TESTING_CHECKLIST.md` first.
Inspect `git status` before editing: this folder can contain unfinished work.
Keep the handoff updated after substantial changes.

- Project folder: `/Users/thomasmorris/Documents/ChatGPT/Fitness Plan`
- GitHub: https://github.com/PedalTone/training-for-life
- Public frontend: https://pedaltone.github.io/training-for-life/app/
- Separate API service: https://training-4-life.tommy-tritone.chatgpt.site

## Architecture and files

React 19 + TypeScript, with a Vite static frontend and a vinext/Cloudflare worker
build for server features. Node must be at least 22.13.0; CI uses Node 22.

| File | Responsibility |
| --- | --- |
| `app/page.tsx` | Main client UI, state, scheduling, persistence, backups, API calls |
| `app/globals.css` | Responsive styles and design system |
| `app/insight-validation.ts` | Guards against incomplete insight responses |
| `src/main.tsx`, `index.html` | GitHub Pages entry and service-worker registration |
| `vite.github.config.ts` | Static build, base `/training-for-life/app/` |
| `scripts/write-github-pages-root.mjs` | Redirect from repository root to `/app/` |
| `app/layout.tsx`, `vite.config.ts` | vinext layout, metadata and server build |
| `worker/index.ts` | API routes and server entry |
| `worker/training-insights.ts` | Training assessment generation |
| `worker/workout-screenshot.ts` | Screenshot import |
| `worker/workout-guide.ts` | Legacy API implementation; current frontend no longer calls it |
| `public/` | Brand artwork, texture, exercise illustrations, icons, PWA files |
| `.github/workflows/deploy-pages.yml` | Builds and publishes GitHub Pages |

Workout sessions are stored in browser IndexedDB (`training-for-life`, store
`sessions`) with a localStorage fallback. Settings, library, goals, insight
reports and schedule snapshots use `t4l:` localStorage keys. Data is tied to the
browser/origin; local preview data is separate from live iPhone data. Preserve
storage names and migrations. Backup/restore exports/imports JSON. Do not erase
storage to solve a deployment or cache issue. Nutrition is saved separately in
`t4l:nutrition`, keyed by calendar date, and included in backup exports. Restore
merges nutrition dates; older backups leave existing check-ins untouched.
Nutrition does not alter workout completion, streaks, or AI insight inputs.

On GitHub Pages, the frontend calls the separate Sites service for worker APIs.
The service uses server-side `OPENAI_API_KEY` and `INSIGHTS_ACCESS_CODE`; never
put their values in documentation or client code. Existing credential setup is
separate from this chat migration. Inspect applicable API/hosting instructions
before changing that infrastructure.

## Run and verify

Install dependencies with `npm ci` when needed.

For a preview matching the deployed static frontend:

```sh
npm run dev:codex
```

Open `http://127.0.0.1:5174/training-for-life/app/`.
This preview disables HMR for the Codex built-in browser and does not provide the worker API routes. For the vinext/server path,
use `npm run dev` and the URL printed by the command.

Primary checks:

```sh
npm run build:pages
npm test
git diff --check
```

`npm run build:pages` writes `gh-pages-dist/` (app under `app/`).
`npm test` runs the vinext build and `tests/rendered-html.test.mjs`; it does not
include every test file. On a Node version supporting TypeScript stripping,
additional focused tests can be run with:

```sh
node --experimental-strip-types --test tests/insight-validation.test.mjs tests/training-insights.test.mjs tests/service-worker.test.mjs tests/video-cleanup.test.mjs tests/nutrition.test.mjs
```

`npm run lint` and `npx tsc --noEmit` are additional diagnostics. Earlier runs
failed; see HANDOFF.md and investigate current output before claiming they pass.
Inspect the rendered app at desktop, tablet, and phone sizes and walk through
changed interactions. Automated assertions alone do not verify layout quality.

## Publish requested frontend changes

The configured remote is named `github`. Pushing a tested commit to its `main`
branch triggers `.github/workflows/deploy-pages.yml`. Confirm the exact diff,
commit only intended files, and follow the release rules in AGENTS.md.

```sh
git push github main
gh run list --repo PedalTone/training-for-life --workflow deploy-pages.yml --limit 3
```

Verify the successful workflow corresponds to the intended commit, then verify
the live app release and service-worker cache identifier. A local version change
is not proof of deployment. Installed iPhone behavior also requires checking
cache refresh and icon references.

The GitHub workflow only deploys the static frontend. Worker/API changes require
a separate Sites deployment using the applicable Sites hosting workflow. Do not
assume a GitHub push updates the API service.

Public release labels use `YYYY.MM.DD HHmm` in America/New_York. Documentation
updates alone do not create a new public release. See HANDOFF.md for the current
local candidate versus the last verified deployment.

## Optional local weather

Home’s Enable local weather control requests device location permission and sends
coordinates rounded to 0.1 degrees to Open-Meteo for current model conditions. No
coordinates are stored. The opt-in preference persists separately; turn it off on Home.
Conditions refresh every 30 minutes while Home is open. Errors show an explicit
unavailable message with a decorative sun. Weather does not change workout plans.
