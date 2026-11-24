# Critical-feature release verification

Candidate version: 2026.11.24 0933
Overall decision: PASS
Affected features: CF22, CF28, CF48
Scope rationale: The live lap screen now places Split time beneath pace and enlarges it to match. Verify the running and recovery labels, time precision, visual distinction, numeral size, narrow/short-screen fit, and that Pause/Resume, split metrics and final save remain usable. No pace math, GPS data, stored workout, backup, or other tracker mode changed.
Automated evidence: `npm run test:release` passes affected lap, design and release-rendering checks; server and Pages builds pass; `npm run verify:release` and `git diff --check` pass. See `docs/releases/2026.11.24-0933/automated.txt` and `pages.txt`.
Browser evidence: `scripts/check-gps-laps.mjs` passes at 375x667, 393x852 and 440x956. Automated layout assertions verify Split time directly follows pace, both numerals are equally large, and neither time text nor screen overflows. Running/recovery screenshots were inspected. See `docs/releases/2026.11.24-0933/browser.txt` and screenshots.
Data/backup evidence: This is a display-only change. Split seconds, GPS distance, pace calculations, workout records and backup schema remain unchanged; the focused lap workflow confirms the same totals and summary table.
Device follow-up: After publication, confirm on the iPhone that the two equally large values are comfortable to read while running. No physical device test has been performed; simulated GPS is not a physical iPhone test and this does not block publication.

Design review: D03 tracker hierarchy and D07 readable mobile metrics PASS. The blue time card distinguishes Split time from pace without color-only meaning because each value has a clear text label. Inspected running and recovery states at 375x667; both fit above the action buttons without scrolling. One live split-time card is shown only during an active split; the recovery view reuses the completed Split time hero. No duplicate timer was introduced.

| Feature | Result | Evidence |
| --- | --- | --- |
| CF22 | PASS | `tests/gps-laps.test.mjs`; `scripts/check-gps-laps.mjs`: live Split time and completed Split time labels, precision, Pause/recovery/Resume and final save. |
| CF28 | PASS | `scripts/check-gps-laps.mjs` at 375x667, 393x852 and 440x956; matching >=62px pace/time numerals, no clipping or scroll. |
| CF48 | PASS | Release readiness, exact version, Pages build and public asset/live browser verification after deployment. |
