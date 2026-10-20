# Training for Life pre-ship testing checklist

Run this checklist before every patch and release. The goal is to verify the complete user journey, not just that the build succeeds.

## 0. Design standards gate

Review DESIGN_STANDARDS.md for every app change, including functional fixes, data/storage changes, refactors, dependencies, documentation and deployment changes.

- [ ] Read the [Designly design standards report](DESIGN_STANDARDS.md).
- [ ] Mark applicable D01–D12 rows PASS / FAIL / N/A with reason; record commands, rendered evidence, device-only limitations and exceptions in HANDOFF.md or the change description.
- [ ] Run `npm run test:design` (also included in `npm test` and Pages CI). Documentation checks do not replace visual inspection of changed UI.
- [ ] Update the report and checklist when an explicit user-approved design changes.

## Duplicate functionality gate

Review duplicate functions and buttons for every app change.
- [ ] Inspect affected handlers/components for overlapping implementations; share equivalent logic without changing behavior.
- [ ] Inspect each rendered new/edit/saving/saved/locked/failure state for redundant buttons, repeated saved/status blocks and competing actions with the same result.
- [ ] Keep one action per task context; document justified repeats across views, per-record actions or accessibility/navigation. Record findings in HANDOFF.md.

## 1. Source and version

- [ ] Record the release decision in VERSIONING.md. Public releases use the America/New_York publication timestamp `YYYY.MM.DD HHmm`; internal changes retain the current label.
- [ ] Confirm the displayed release, release notes, tests, service-worker cache identifier, and deployed files match.
- [ ] Check `git diff --check` and confirm only intended files changed.

## 2. Automated checks

- [ ] Run `npm test`.
- [ ] Run `npm run build:pages`.
- [ ] Confirm all rendered HTML tests pass and no build errors are hidden by warnings.

## 3. Product journey

- [ ] Home: Today shows the resolved workout; all destinations work; What’s New displays ten categorized release groups and its close button works.

- [ ] GPS auto-pause: fresh near-zero fixes for four seconds freeze time/distance; small progressive walking steps resume after a two-minute stop even with missing/zero native speed, using a fresh short movement window and separate route segment; speed-only spikes, a single coordinate jump and stationary GPS jitter do not resume. Weak/stale/missing GPS does not pause/resume alone. Manual/background pause stays manual; opt-out persists and stop/save works while auto-paused. Live map has no place box/editor until saved; explanatory notes are in Settings About.
- [ ] GPS tracker: green Play/Start/Resume, light orange Pause and red Stop & save respond once; Stop & save switches to saved summaries/Edit without duplicate live metrics/setup controls; Record another only prepares and restores setup. Edit saved activity/distance/duration, including older intervals; Delete recording opens Yes, delete / Keep recording confirmation; test cancel, storage failure, older/latest/last deletion, updated totals and no late-map resurrection; preserve id/order/routes, manual daily fields, reload and backup. Confirm pace/speed changes, invalid/cancel/storage-failure behavior, late place labels, and completed Edit/relock.
- [ ] Today: the correct date and workout type appear; controls are readable; Finish + Backup has one saved/locked banner with Edit at the top; no duplicate saved/Edit block in the footer; sharing remains below; reopening the day preserves data.
- [ ] Plan: This week/Next week tabs match Progress; dates run Monday–Sunday. This week retains the artwork/overview. Next week mapping saves from next Monday without changing this week or saved workouts; custom types, reload, Monday rollover and failed-storage rollback work. No Training Assessment shortcut appears in either Plan tab; Training Assessment remains in Progress only.
- [ ] History: 12 chronological weeks scroll with the current week initially visible; Earlier/Later move three weeks and load older windows at the edges; Back to this week and journal-return position work; prior schedule snapshots are used; blank/unassigned days do not show false Rest; icons and status marks remain readable.
- [ ] Progress: percentage bars use all completed days as the denominator, including labeled recovery; zero core/previously recorded types remain visible; 4/8/12 weeks update counts/order/observations; colors match History; completed add-ons expand and exclude uncompleted selections; comparisons remain available; the obsolete Saved training reports section is absent even when legacy reports exist in storage.
- [ ] Video plans: Add video & get transcript opens the requested free site with the chosen URL; Paste & build → review → Save plan; persistent Plan ready badge, clipboard denial/manual fallback and optional automatic-retrieval errors; no claim that cross-site automatic return works; caption paste/file import → reviewed template → Today with blank weights/checks; distinct per-set weights and shorter actuals persist; recorded rows cannot be discarded by plan replacement; library edits leave dated snapshots intact; repeat/add-to-today clears results; warm-ups are excluded from same-load comparisons; backup/restore and completed Edit lock retain plans/results.
- [ ] Progress: Training Assessment opens the unchanged Drive folder in a new window; weekly mapping and assessments are absent from Settings.
- [ ] Settings: collapsible sections—including Future workout videos—start closed; mobility editing, reference photos, descriptions, YouTube links, backup, and restore remain usable.

## 4. Persistence and regression checks

- [ ] Finish a workout, reload, and confirm status, notes, details, mobility, links, and injury data persist.
- [ ] Add mobility exercises, reload, and confirm the mobility section is collapsed while the loaded exercises remain present.
- [ ] Change the schedule mapping and confirm it affects future planning without rewriting prior history.
- [ ] Check History and Plan after changing the mapping; prior dates must retain their historical types.
- [ ] Verify backup filename includes date/time and restore does not erase unrelated data. Dated schedule snapshots roundtrip; older schedule-only backups retain known earlier history and replace the future routine.

## 5. Responsive visual QA

- [ ] For UI changes, inspect external Safari/Chrome at iPhone widths 375/393/440, safe areas, short usable height and keyboard-open states; no tablet or desktop visual testing is required. Do not use the Codex built-in browser for routine inspection. Record device-only gaps; documentation-only changes need no new render.
- [ ] Look for small text, clipped labels, crowded rows, excessive blank space, horizontal scrolling, and bottom-nav overlap.
- [ ] Confirm clear labels, 44 × 44 CSS px touch targets (main tracker controls about 60 px high), readable 16–18 px body/input text, verified contrast, visible focus, VoiceOver names/order and reduced-motion behavior; icons never carry meaning by color alone.
- [ ] Sharing: Today and journal use the same prominent share icon/button and original Instagram/TikTok icons to the right of the title on the same row, in place of a subtitle; verify both locally hosted images load and have accessible names; both open the composer without changing saved data. Verify actual exports, large/full-size previews, title editing without focus/scroll jumps, Instagram/TikTok labels, optional text positioning/fonts/size, route visibility and no blue box/editing guides in full-size preview or exported images.

## 6. Live release verification

- [ ] Push the exact tested frontend commit to GitHub; confirm the Pages workflow succeeds for that commit.
- [ ] If worker/API code changed, separately deploy the verified source through the Sites hosting workflow. A Pages push does not update the worker.
- [ ] Wait for deployment success, then reload the live URL.
- [ ] Click Home, Today, Plan, History, Progress, and Settings on the live app and verify the release version and primary layout.


- [ ] Walk tracker activity: selection, draft/save/reload/edit/backup retain Walk. Run/Walk use min/mile or min/km; Bike uses mph or km/h, including mixed sharing. Plan/Progress category options remain unchanged. Existing Run/Bike records retain types; no duplicate controls.

- [ ] Today add-ons: one visible shared blue Start timer link opens the speaking timer without selecting/completing exercises; no per-exercise links in Details or Add/edit picker. Full saved/default library (including custom/renamed items) is visible, not just Face Pulls/Dead Hang; rendering never selects or completes exercises. Inline selection and Add/edit picker agree; backup/summary include only chosen items.
- [ ] Video set logging: with a saved plan or no plan, play video and add exercise/sets directly in its session log. Retain existing results/IDs, blank new actuals, copy previous weight only on request; session additions do not modify reusable templates. Reload/backup/edit/relock retain all rows; read-only/template views have no session-add controls.

- [ ] Repeat set: choose any completed set (including an earlier one with different weights/units/reps/time); append a fresh ID with copied actuals/load/warm-up and unchecked completion. Preserve originals, other exercises and reusable template; copy plan/results in one session update. Verify caps, reload/backup, History read-only and completed Edit lock.

- [ ] Dated video exercise removal: Remove from today → Keep exercise / Yes, remove exercise; cancel preserves data, confirm removes only chosen exercise/results; last exercise supported; Settings template/other videos unchanged; reload/backup and finished Edit lock retained.
