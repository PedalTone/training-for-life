# Training for Life development standards

## Continuing development across chats

Read `HANDOFF.md`, `README.md`, and `VERSIONING.md` before editing. Inspect
`git status` and the existing diff; preserve unfinished work from earlier chats.
Update `HANDOFF.md` after a substantial change with what was verified, what was
published, and what remains. Keep it concise and current.

The public frontend is GitHub Pages; the Sites worker supplies separate API
features. See README for the two build paths. Preserve browser-stored workout
data and dated schedule history. Render and visually inspect desktop, tablet,
and phone layouts before declaring interface changes complete.

The user's general learning-app and readability standards also live in
`~/.codex/AGENTS.md`. Apply them where relevant to this fitness tracker.

## Release labels and release control

Use a publication timestamp instead of semantic versioning for user-visible
releases. The format is `YYYY.MM.DD HHmm` in America/New_York local time, using
a 24-hour clock (for example, `2026.09.22 1854`).

Create a new release label only when a user-visible change is published.
Internal refactors, test-only changes, dependency maintenance, and deployment
repairs keep the existing label. Before changing the displayed label, record a
one-line `New public release` or `No new release` decision in `VERSIONING.md`
with the user-facing reason.

The splash-screen “What’s new?” list must succinctly describe changes since the
previous public release. The release shown in the app, tests, release notes,
service-worker cache identifier, and deployment must match. After publishing,
verify the live app serves that exact release label.

## Publication authorization

The user grants standing permission to publish tested app changes whenever they
ask for a change (reaffirmed October 10, 2026). Complete verification and publish
requested changes without asking again.
