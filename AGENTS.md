# Training for Life development standards

## Versioning and release control

Use semantic versioning, but choose the increment from the user-visible scope of
the change. Do not increment a number merely because a deployment occurred.

### The decision rule

1. **No version change** — internal refactors, test-only changes, dependency
   maintenance, deployment repairs, or content corrections that do not change
   the user-facing app. Record the work in the commit and testing notes.
2. **Patch (`MAJOR.MINOR.PATCH`)** — a backward-compatible bug fix, small copy
   adjustment, accessibility fix, visual polish, or interaction repair. Increase
   only the patch component by one (for example, `1.40.1` → `1.40.2`).
3. **Minor (`MAJOR.MINOR`)** — a backward-compatible user capability, a new
   workflow, a substantial screen redesign, a new tab, or a meaningful data
   presentation change. Increase the minor component and reset patch history
   (for example, `1.39.78` → `1.40`). The next small fix becomes `1.40.1`.
4. **Major (`MAJOR.0`)** — only after explicit agreement that the release
   changes the core navigation contract, data model, compatibility guarantees,
   or product identity enough to require migration or a coordinated relaunch
   (for example, `1.40.3` → `2.0`). Never infer a major release from the number
   of commits or patches.

### Required release check

Before editing the displayed version, write a one-line release decision in the
change notes or commit message: `No version`, `Patch`, `Minor`, or `Major`, with
the user-facing reason. If a change spans categories, use the highest category
that is actually user-visible; do not bundle unrelated changes just to justify
a larger number. Preserve the existing major/minor line until a minor or major
threshold is genuinely met. Never let a long run of bug fixes masquerade as a
major release, and never use a high patch number as a substitute for a new
minor release.

The version shown in the app, tests, release notes, and deployment must match.
After publishing, verify the live app serves that exact version. Keep the
versioning history in `VERSIONING.md` and update its current-release entry only
when the release decision is made.
