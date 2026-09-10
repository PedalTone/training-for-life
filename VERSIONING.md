# Training for Life versioning

The detailed release decision policy lives in [`AGENTS.md`](./AGENTS.md). In
short:

- **No version** for internal-only or deployment-only work.
- **Patch** (`1.40.1`) for backward-compatible fixes and polish.
- **Minor** (`1.40`) for a new capability, workflow, tab, or substantial
  user-facing redesign; reset the patch component when moving to a new minor.
- **Major** (`2.0`) only after explicit agreement that the core product or
  compatibility contract has changed.

The current release is `1.48`, a minor release that adds a compressed workout
photo attachment. Photos are saved locally with their workout and included in
user-created backups. The next small fix should be `1.48.1`. The displayed app
version, tests, release notes, and live deployment must always agree.
