# Critical-feature release verification

Candidate version: 2026.11.22 1655
Overall decision: PASS
Affected features: CF17, CF18, CF22, CF28, CF48
Scope rationale: Full-screen lap recovery display changes completed-repeat time and pace labels; verify Pause/Resume/Stop state, fit/hit targets and version delivery. Distance/GPS algorithms and saved data models are unchanged.
Automated evidence: npm run test:release passes 45 selected tests and server build; Pages build and diff check pass. See docs/releases/2026.11.22-1655/automated.txt and pages.txt.
Browser evidence: LAPS_ONLY=1 external Chrome scenario passes at 375x667, 393x852, 440x956. Seven recovery displays preserve exact last-repeat time and min/mile average while recovery advances; reload and Resume work. Zero-distance and hour-long repeats fit. See docs/releases/2026.11.22-1655/browser.txt and recovery screenshots.
Device follow-up: After deployment, recommend checking the paused repeat display during an ordinary iPhone track workout. Physical testing is not a deployment prerequisite.
Data/backup evidence: Eight variable repeats and seven recoveries retain exact seconds/meters through failed-save retry, reload, backup and Today/History tables. Stop during recovery adds no duplicate split. All data is synthetic and isolated.

| Feature | Result | Evidence |
| --- | --- | --- |
| CF17 | PASS | Selected pace/lap tests plus browser exact finished time and per-repeat average pace (distinct 400/800/mile values); unavailable pace for zero distance. |
| CF18 | PASS | Browser center taps Pause/Resume/Stop, interrupted reload, stopped-save retry and no duplicate recording. |
| CF22 | PASS | All seven pauses freeze completed time/pace while rest advances. First recovery survives reload; Resume switches back to Current pace for the next repeat. |
| CF28 | PASS | External Chrome at 375/393/440 widths: no scroll/clipped metrics, visible center-hit controls; hour-long and no-GPS repeat cases fit. Actual paused screenshots inspected. |
| CF48 | PASS | New Eastern release timestamp, ten notes and matching worker/query labels; selected tests and build pass. Exact deployment/live verification is required after push. |

Design: D03 PASS (clear finished time/pace and separate recovery timer), D02/D07
PASS for affected save/History exit; other D rows N/A (no changes to those
surfaces). Duplicate review PASS: existing cards and actions reused; split time
uses the same formatter as the saved table. No workout data/schema migration.
Publication itself will be recorded in HANDOFF.md after successful deployment,
byte comparison and affected live smoke. Physical follow-up remains optional.
