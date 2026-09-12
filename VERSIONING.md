# Training for Life versioning

The detailed release decision policy lives in [`AGENTS.md`](./AGENTS.md). In
short:

- **No version** for internal-only or deployment-only work.
- **Patch** (`1.40.1`) for backward-compatible fixes and polish.
- **Minor** (`1.40`) for a new capability, workflow, tab, or substantial
  user-facing redesign; reset the patch component when moving to a new minor.
- **Major** (`2.0`) only after explicit agreement that the core product or
  compatibility contract has changed.

The current release is `1.49`, a minor release that adds one-day workout-plan
overrides. A change to a current or future date remains on that date only and
does not alter the recurring weekly cadence in Settings. The next small fix
should be `1.49.1`. The displayed app version, tests, release notes, and live
deployment must always agree.
