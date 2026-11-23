# Critical-feature release verification

Candidate version: 2026.11.22 2207
Overall decision: PASS
Affected features: CF05, CF12, CF13, CF33, CF34, CF48
Scope rationale: History type inference duplicated GPS Run/Walk/Bike as Endurance on Speed/Easy aerobic days. Change only History classification/labels, its icon key and shared illness color. Verify explicit second-workout selections, legacy mixed types, flags/search/journal, completion and release updates. GPS recording and storage algorithms are unchanged.
Automated evidence: npm run test:release passes 52 selected tests and server build; Pages build and git diff --check pass. Evidence: docs/releases/2026.11.22-2207/automated.txt and pages.txt.
Browser evidence: Isolated external Chrome passes 375x667, 393x852 and 440x956; screenshots inspected. Tests cover the reported weekly pattern, genuine explicit and older mixed workouts, flags in calendar/legend/search, journal, unchanged completion and reload. Every icon/flag fits its own day and paired icons remain at least 15px wide. Evidence: docs/releases/2026.11.22-2207/browser.txt and screenshots.
Device follow-up: Check the updated History icons/flags after refresh; physical iPhone tests are post-deployment feedback, not a release prerequisite.
Data/backup evidence: No schema or historical record changes; browser compares all nine original fixture records byte-for-field after viewing and reload; they are unchanged.

| Feature | Result | Evidence |
| --- | --- | --- |
| CF05 | PASS | Explicit primary/second types remain authoritative; legacy mixed workouts retained; generic GPS activity does not invent an additional endurance type. |
| CF12 | PASS | Computed red (#b3332b) flags match calendar, legend and search; completion remains 6/7 with simultaneous flags. |
| CF13 | PASS | Computed blue (#145dcc) flags match calendar, legend and search; illness normalization/rest/search unit checks pass. |
| CF33 | PASS | Type inference unit/browser checks pass; one labeled icon/color key replaces old color-only key; search and completion retained. |
| CF34 | PASS | Journal retains both notes and completion status. |
| CF48 | PASS | New Eastern label, ten release notes, worker/query labels and selected tests/builds pass; live delivery proof follows publication. |

Design review: D07 History and adjacent D02/D10 apply. PASS after inspecting actual phone renders: approved SVGs/colors, readable two-column key, flags under completion marks, no adjacent-day spill. Other D rows N/A: unchanged surfaces. Duplicate review: reuse approved SVGs and existing flags; one optional icon/color key replaces the old color-only disclosure, no duplicate workout actions. Old pending GPS work and personal records remain untouched.
