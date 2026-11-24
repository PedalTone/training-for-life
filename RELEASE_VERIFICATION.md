# Critical-feature release verification

Candidate version: 2026.11.24 0949
Overall decision: PASS
Affected features: CF17, CF22, CF24, CF28, CF48
Scope rationale: Simplify the lap-mode pace label, preserve the live GPS split-distance display, and normalize completed running/walking track split distance and pace to 200 m increments. Verify exact rounding including 840→800 and 1700→1600, time/distance/pace display, and compatibility with Pause/Resume, the Today/History table, backups and full-screen layouts. Raw GPS meters, saved time, running current-pace model, overall workout average and Bike speed remain unchanged.
Automated evidence: `npm run test:release` passes affected pace, lap, saved-view, design and release-rendering tests; server and Pages builds pass; `npm run verify:release` and `git diff --check` pass. See `docs/releases/2026.11.24-0949/automated.txt` and `pages.txt`.
Browser evidence: `scripts/check-gps-laps.mjs` passes at 375x667, 393x852 and 440x956. It verifies the plain Current pace label, visible GPS split distance, large Split time, completed split time/pace labels, 200 m rounded pace for a GPS-measured 1609 m warm-up, and unchanged Pause/recovery/Resume/final save flows. Table render tests verify 840→800 and 1700→1600 in the displayed distance and pace while retaining raw recorded meters. See `docs/releases/2026.11.24-0949/browser.txt` and screenshots.
Data/backup evidence: The new distance rule is display/calculation-only. The GPS values in each saved repeat, route samples, total GPS distance, split time, existing JSON schema and backups remain unchanged. Helper tests prove 840/1700 meter inputs are not mutated; saved-view assertions show 800/1600 m in the track table while preserving raw GPS values in the workout data.
Device follow-up: After publication, check on an actual track that displayed split distance helps you remember completed laps and that final split pace feels right. No physical iPhone run has been performed; simulated GPS is not a device test and does not block publication.

Design review: D03 tracker hierarchy, D07 mobile readability and D12 data preservation PASS. The Current pace label is concise; GPS split distance remains explicit during the workout; a note in saved tables explains nearest-200 m track distance and pace. No GPS measurement is overwritten. Running/recovery layouts were inspected at 375x667; no clipping or scrolling. Existing controls and table are reused; no competing metric/button was added.

| Feature | Result | Evidence |
| --- | --- | --- |
| CF17 | PASS | `tests/gps-laps.test.mjs`: 840→800, 1700→1600 tie-down, 1701→1800, 200 m minimum, zero distance unavailable; `tests/gps-math.test.mjs` retains rolling current pace behavior. |
| CF22 | PASS | `scripts/check-gps-laps.mjs`: Current pace label, live GPS distance, split completion, Pause/rest/Resume and final Stop. |
| CF24 | PASS | `tests/gps-saved-view.test.mjs`: table shows 800/1600 m and calculates pace from those values; stored GPS distances remain 840/1700 m; note explains the rule. |
| CF28 | PASS | Browser scenarios at 375x667, 393x852 and 440x956; live distance and full-screen controls fit without scrolling. |
| CF48 | PASS | Exact app version, affected release tests, Pages build and public asset/live browser verification after deployment. |
