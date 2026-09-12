# Training for Life versioning

The detailed release decision policy lives in [`AGENTS.md`](./AGENTS.md). In
short:

- **No version** for internal-only or deployment-only work.
- **Patch** (`1.40.1`) for backward-compatible fixes and polish.
- **Minor** (`1.40`) for a new capability, workflow, tab, or substantial
  user-facing redesign; reset the patch component when moving to a new minor.
- **Major** (`2.0`) only after explicit agreement that the core product or
  compatibility contract has changed.

Release decision: **Minor** — `1.51` adds user-defined workout types to Weekly
workout mapping. Custom types are available for any weekday and one-day
overrides, and are preserved in local backups.

The current release is `1.51`. The next small fix should be `1.51.1`. The
displayed app version, tests, release notes, and live deployment must always
agree.
