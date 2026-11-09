# Critical-feature release verification

Candidate version: 2026.11.09 0758
Overall decision: BLOCKED
Automated evidence: November 9 npm test run: 240 Node tests, 239 pass, 1 existing store-reconciliation failure; /private/tmp/t4l-critical-features-full.log. All 8 focused policy/guard tests pass; all 3 Python caption-helper tests pass separately. Pages build and git diff --check pass. Release guard exits 1 as required for this incomplete report.
Browser evidence: UNTESTED for the full CF inventory; earlier track/Today smoke is partial coverage only.
Device evidence: UNTESTED for this full inventory; no new physical iPhone certification is claimed.
Data/backup evidence: UNTESTED for the full cross-feature restore scenario.

This is the initial coverage audit after the user's November 9 instruction.
Version 0758 was already published before this gate existed; it is **not being
retrospectively certified**, and this work does not publish a new app version.
Before the next public version, update Candidate version and replace every
result with fresh test outcomes and concrete evidence for that candidate.
Use the requirements and journeys in [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md).

The evidence column must identify what ran, its result, and where its output,
screenshot, backup comparison or device confirmation can be checked. A test path
by itself is not proof. Do not copy PASS from a previous release. Keep any dated
device evidence that is explicitly carried forward distinguishable from fresh
candidate tests. Record failures as failures; do not remove their tests.

| Feature | Result | Evidence / remaining verification |
| --- | --- | --- |
| CF01 | UNTESTED | Node date coverage exists; candidate midnight/older-day workflow not signed off. |
| CF02 | UNTESTED | Navigation/swipe tests exist; full candidate touch/swipe journey not signed off. |
| CF03 | UNTESTED | Worker tests exist; installed update/offline/data-retention verification missing. |
| CF04 | UNTESTED | Weather parser tests exist; full permission/opt-in/refresh workflow missing. |
| CF05 | UNTESTED | Today script exists; complete mixed-workout and paired-icons smoke required. |
| CF06 | UNTESTED | Setup/note tests exist; complete candidate reuse workflow required. |
| CF07 | UNTESTED | Add-on unit tests exist; named-row varied-order touch smoke required. |
| CF08 | UNTESTED | Full library edit/reference/rename/backup workflow required. |
| CF09 | UNTESTED | External timer destination and unchanged-selection smoke required. |
| CF10 | UNTESTED | Long-note/effort/keyboard/reload smoke required. |
| CF11 | UNTESTED | Multiple media/file-picker/backup smoke required. |
| CF12 | UNTESTED | Independent injury/completion/History workflow required. |
| CF13 | UNTESTED | Illness unit tests exist; combined injury/rest/Progress smoke required. |
| CF14 | UNTESTED | Nutrition unit tests exist; candidate day switch/lock/restore smoke required. |
| CF15 | UNTESTED | Earlier Today/lap scripts cover some cases; full candidate save/cancel/Edit/backup sign-off required. |
| CF16 | UNTESTED | GPS units/classification tests exist; full activity/unit and mixed-day smoke required. |
| CF17 | UNTESTED | Pace math tests exist; current-pace streams and known-distance device evidence required. |
| CF18 | UNTESTED | Earlier tracker simulation is partial; candidate rapid taps/pending/paused/physical controls required. |
| CF19 | UNTESTED | Auto-pause unit tests exist; browser streams and outdoor resume verification required. |
| CF20 | UNTESTED | Draft/recovery tests exist; full Camera/error/foreground/reload sequence required. |
| CF21 | UNTESTED | Earlier lap script covers prepared/on/off state; new candidate sign-off required. |
| CF22 | UNTESTED | Earlier mixed-repeat script covers core transitions; candidate/device sign-off required. |
| CF23 | UNTESTED | Earlier durable-boundary tests exist; fresh candidate mixed-distance workflow required. |
| CF24 | UNTESTED | Earlier saved-table/backup smoke exists; candidate table/data comparisons required. |
| CF25 | UNTESTED | Storage/retry tests exist; candidate dual-store failure/reload/one-ID checks required. |
| CF26 | UNTESTED | Edit/delete unit tests exist; full candidate cancel/fail/delete/reload sequence required. |
| CF27 | UNTESTED | Prepared/off-date unit checks exist; repeated-recording and midnight workflow required. |
| CF28 | UNTESTED | Earlier phone renders exist; candidate endurance/lap/focus/portrait checks required. |
| CF29 | UNTESTED | Camera/route math tests exist; actual pinch/drag/follow/map-edit checks required. |
| CF30 | UNTESTED | Weather parser tests exist; relative-wind/heading/unit/refresh/device checks required. |
| CF31 | UNTESTED | Weekly-planning unit tests exist; candidate edit/failure/rollover workflow required. |
| CF32 | UNTESTED | Artwork/override tests exist; custom/secondary-type persistence smoke required. |
| CF33 | UNTESTED | History timeline/search tests exist; sparse/legacy/two-icon/filter workflow required. |
| CF34 | UNTESTED | Journal render tests exist; full saved fixture and edit/return journey required. |
| CF35 | UNTESTED | Progress/strength unit tests exist; browser windows/percentages/comparisons required. |
| CF36 | UNTESTED | Library/filter tests exist; actual add/play/filter/delete/return workflow required. |
| CF37 | UNTESTED | Video completion tests exist; candidate Finish/Edit/History/backup sequence required. |
| CF38 | UNTESTED | Caption/workflow tests exist; provider/clipboard/import/cache/blocked-site smoke required. |
| CF39 | UNTESTED | Plan/lexicon tests exist; candidate reviewed draft/save/template isolation required. |
| CF40 | UNTESTED | Session strength tests exist; full actual-set/repeat/remove-last/backup workflow required. |
| CF41 | UNTESTED | Sharing data/map tests exist; actual template/format PNGs and native export evidence required. |
| CF42 | FAIL | Existing tests/daily-journal.test.mjs:33 fails: with equal timestamps and completedAt in both stores, the loader chooses the less complete IndexedDB copy instead of the richer fallback. Investigate and fix before another public release; do not weaken the assertion. |
| CF43 | UNTESTED | Several data-family unit roundtrips exist; complete populated backup/restore comparison required. |
| CF44 | UNTESTED | Settings/library/restore/return workflow required. |
| CF45 | UNTESTED | Actual assessment-folder link/new-tab/return/storage check required. |
| CF46 | UNTESTED | Earlier phone screenshots are partial; full candidate hit-target/accessibility/native evidence required. |
| CF47 | UNTESTED | Provider unit fallbacks exist; full browser network failure/privacy audit required. |
| CF48 | UNTESTED | 0758 publication was previously checked; next candidate requires a new preflight, exact deployment/assets proof and live smoke. |

## Pre-publication commands

```sh
npm test
npm run build:pages
git diff --check
node scripts/check-today-actions.mjs
node scripts/check-gps-laps.mjs
npm run verify:release
```

Use an isolated external Chrome instance and the documented CDP ports/overrides
for browser scripts; never attach test code to the user's normal browser data.
All required commands, CF results and manual/device evidence must pass before
publication. Record the final successful deployment commit/run and live asset
comparison in HANDOFF.md after the release, together with the live smoke result.
