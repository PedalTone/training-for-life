# Critical-feature release verification

Candidate version: 2026.11.24 0916
Overall decision: PASS
Affected features: CF17, CF22, CF28, CF48
Scope rationale: The Track laps live pace calculation, five-second readout label and full-screen pace presentation changed. Verify pace math under irregular timing and pace changes, live display in lap mode, split/recovery behavior, responsive fit and release/version assets. Ordinary tracker remains on its existing eight-second window; persisted workouts and backup structure do not change.
Automated evidence: `npm run test:release` passes the affected pace, lap, saved-view, design and release-readiness tests; server and Pages builds pass; `git diff --check` passes. See `docs/releases/2026.11.24-0916/automated.txt` and `pages.txt`.
Browser evidence: Focused external Chrome track workflows pass at 375x667, 393x852 and 440x956, including numeric 5-second pace after data acquisition, >=60px pace typography, eight repeats/seven rests, seven continuous repeats/six rests, continuation, zero-distance, hour-long, and ordinary tracker paths. See `docs/releases/2026.11.24-0916/browser.txt` and screenshots.
Data/backup evidence: Pace samples are runtime-only. Repeat time, distance, split pace, overall average, saved GPS routes and backup formats are unchanged; existing workout records are not rewritten.
Device follow-up: After deployment, try one physical track workout and report whether the five-second pace feels steady and responsive. Browser GPS simulation is not a physical iPhone test; this does not block publication.

| Feature | Result | Evidence |
| --- | --- | --- |
| CF17 | PASS | `tests/gps-math.test.mjs`: exact interpolated five-second window, uneven GPS timestamps, pace change, no-motion and insufficient-window behavior. |
| CF22 | PASS | `tests/gps-laps.test.mjs`; `scripts/check-gps-laps.mjs`: Pause, timed recovery, Resume, one-session split behavior at three phone viewports. |
| CF28 | PASS | External Chrome screenshots at 375x667 and 440x956; label and live pace >=60px; no full-screen overflow. |
| CF48 | PASS | Release readiness, exact version, Pages build, public asset verification after deployment. |

Verified live publication: GitHub Pages deployment 45412637913 succeeded for `4de700aadeca8e436ee211ffd1647c9abc88d500`. Public release `2026.11.24 0916` and exact JS/CSS/service-worker hashes match the tested build. The affected live lap workflow passes at 440x956. See `docs/releases/2026.11.24-0916/live-assets.json`, `published-live-browser.txt`, `published-live-440.png` and `deployment.txt`.
