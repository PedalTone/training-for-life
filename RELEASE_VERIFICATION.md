# Critical-feature release verification

Candidate version: 2026.11.23 1754
Overall decision: PASS
Affected features: CF18, CF21, CF22, CF23, CF24, CF25, CF27, CF28, CF34, CF48
Scope rationale: Lap Pause/Resume labels, prominent recovery clock, full-screen layout and saved-lap continuation affect recording boundaries, same-ID persistence/retry, recovery and comprehensive result summaries. Verify normal continuous repeats and early-save continuation, reload/failure/backup, saved lock and ordinary tracker actions. GPS distance/pace algorithms are unchanged; existing historical recordings are not merged or rewritten automatically.
Automated evidence: npm run test:release passes 79 selected tests and server build. Pages build and diff check pass; see docs/releases/2026.11.23-1754/automated.txt and pages.txt.
Browser evidence: 11 focused lap scenarios pass in isolated external Chrome: original eight-repeat journey, seven continuous 400/600/800 repeats and saved-session continuation at 375x667, 393x852 and 440x956, plus zero-distance/hour-long cases. Two ordinary/extended GPS journeys pass. Additional distance-integrity assertions at all three sizes verify no GPS bridge across rests/continuation. Final saved-message guidance and both paths pass on the final build. Actual running/resting/results screenshots inspected; see docs/releases/2026.11.23-1754/browser.txt, ordinary-browser.txt and PNGs.
Device follow-up: Recommend next iPhone track session feedback after deployment. Simulated GPS is not a physical iPhone test and physical testing does not hold publication.
Data/backup evidence: Seven repeats/six recoveries remain one recording, with 16:27.0 running + 6:40.0 rest = 23:07.0 total in Today and History. Early-save continuation retains the same ID and three repeat times, 60/65-second recoveries without duplicate trailing rest, and exact backup arrays; failed-save/reload/retry also remains one ID. Helper tests prove originals unchanged; notes/other recordings are preserved. Historical records are never automatically merged.

| Feature | Result | Evidence |
| --- | --- | --- |
| CF18 | PASS | Pause, Resume and final Stop workflows. |
| CF21 | PASS | Authoritative lap mode, including continued sessions. |
| CF22 | PASS | One-button repeat/recovery, visible rest clock, stable touch position. |
| CF23 | PASS | Variable repeat boundaries and restart/reload. |
| CF24 | PASS | One comprehensive repeat/recovery table and totals. |
| CF25 | PASS | Continued session save failure/reload/retry remains one ID. |
| CF27 | PASS | Continue same workout versus new recording, dates/order preserved. |
| CF28 | PASS | Full-screen running/resting layouts at three phone sizes. |
| CF34 | PASS | Matching saved History results. |
| CF48 | PASS | Version, builds and exact publication. |

Design review: D03 tracker, adjacent D02/D07/D10 and data-retention D12 apply. Other rows N/A, unchanged. Duplicate review: one Pause/Resume control; Continue extends the latest lap session while Record another creates a distinct workout. Reuse recovery clock/table/helper; no duplicate rest counters or result tables. PASS after inspecting actual three-size phone screenshots, including 375x667 hour-long strings, stable 88px action targets and the larger Rest time display. Labels distinguish saving a repeat from ending the entire session; no scrolling in lap full screen.

Investigation limit: the pre-change controlled eight-repeat/seven-rest workflow also passed. The exact cause of the user’s seven separate iPhone recordings was not reproduced. Confirmed missing capability: once saved, only Record another was available. Continue repeats now reopens that same session; normal Pause still never finalizes it. Do not claim automatic reconstruction or merging of the user’s existing seven records.

## Verified live publication

[Deployment 45285109802](https://github.com/PedalTone/training-for-life/actions/runs/45285109802)
succeeded for fb3f42156abb7eae8b4f3385fea4427f2d992fd2. Exact public JS/CSS/worker
match the tested build. The live original lap scenario, seven-repeat/six-rest
workflow, continued-session identity/recovery/backup checks and zero-distance/
hour-long cases pass. Actual live rest screen inspected. Evidence:
live-assets.json, live-browser.txt and live-rest-440.png.
