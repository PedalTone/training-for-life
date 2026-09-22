# Training for Life development standards

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
