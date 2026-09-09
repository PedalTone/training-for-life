# Training for Life versioning

The detailed release decision policy lives in [`AGENTS.md`](./AGENTS.md). In
short:

- **No version** for internal-only or deployment-only work.
- **Patch** (`1.40.1`) for backward-compatible fixes and polish.
- **Minor** (`1.40`) for a new capability, workflow, tab, or substantial
  user-facing redesign; reset the patch component when moving to a new minor.
- **Major** (`2.0`) only after explicit agreement that the core product or
  compatibility contract has changed.

The current release is `1.46.6`, a patch that lets recorded recovery days use
the same green-complete and yellow-body-consideration statuses as every other
workout day, while removing the redundant Rest legend. The next small fix
should be `1.46.7`; a future substantial redesign may become `1.47`. The
displayed app version, tests, release notes, and live
deployment must always agree.
