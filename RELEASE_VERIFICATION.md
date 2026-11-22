# Critical-feature release verification

Candidate version: 2026.11.22 1703
Overall decision: PASS
Affected features: CF24, CF34, CF48
Scope rationale: The shared saved split table gains running/rest/workout duration footer rows in Today and History. Verify totals, legacy estimates, rounding, reload/backup and phone table layout; recording and GPS algorithms are unchanged.
Automated evidence: npm run test:release passes 53 selected tests and server build. Pages build and diff check pass. See docs/releases/2026.11.22-1703/automated.txt and pages.txt.
Browser evidence: Focused external Chrome lap scenario passes at 375x667, 393x852 and 440x956. Today, reloaded Today and History all show running 33:53.3, rest 20:52.2 and duration 54:45.5; footer fits. Zero-distance and hour-long cases pass; final screenshots inspected. See docs/releases/2026.11.22-1703/browser.txt and PNGs.
Device follow-up: After deployment, recommend checking the three totals in the next saved iPhone track workout; physical testing is not a publication prerequisite.
Data/backup evidence: Eight repeats and seven recoveries retain exact seconds/meters through backup, failed-save retry and reload; Today/History totals agree. No saved record/model changes; summaries are derived from the displayed segments, including older estimated recovery. Tests verify source data is unchanged.

| Feature | Result | Evidence |
| --- | --- | --- |
| CF24 | PASS | Unit cases cover mixed repeats, subtotals rounded once, reconciled grand total, empty/rest-free/legacy estimated recovery, zero distance and hours. Browser verifies matching three-row footer and unchanged eight repeats/seven rest intervals. |
| CF34 | PASS | Shared table renders correct activity labels, times and legacy estimate labels; actual Today and History footer values match before/after reload at three phone sizes. |
| CF48 | PASS | New Eastern version and matching ten notes/worker/query labels; selected tests and builds pass. Deployment and exact live proof follow publication. |

Design review: D02/D03/D07 PASS for saved tracker/Today and History summaries.
Other D rows N/A (surfaces unchanged). Footer reuses the existing table with
clear labels and navy combined total; wider time column keeps hour-long values
readable. Duplicate review PASS: one shared footer per recording, no new actions.
Original split records remain unchanged. Display subtotals round once to tenths;
combined duration adds those displayed subtotals. Physical feedback is follow-up.

## Verified live publication

[Deployment 45076053671](https://github.com/PedalTone/training-for-life/actions/runs/45076053671)
succeeded for 4d44ca039c4cc4aa4a44ad97e2ee2dc2f5f5c871. Public JS/CSS/worker
match the tested build byte-for-byte. The affected live 440x956 workflow shows
the exact same three totals in Today, reloaded Today and History, with unchanged
repeat/recovery records in the backup. See live-assets.json and live-browser.txt.
