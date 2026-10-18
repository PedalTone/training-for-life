# Training for Life pre-ship testing checklist

Run this checklist before every patch and release. The goal is to verify the complete user journey, not just that the build succeeds.

## 1. Source and version

- [ ] Record the release decision in VERSIONING.md. Public releases use the America/New_York publication timestamp `YYYY.MM.DD HHmm`; internal changes retain the current label.
- [ ] Confirm the displayed release, release notes, tests, service-worker cache identifier, and deployed files match.
- [ ] Check `git diff --check` and confirm only intended files changed.

## 2. Automated checks

- [ ] Run `npm test`.
- [ ] Run `npm run build:pages`.
- [ ] Confirm all rendered HTML tests pass and no build errors are hidden by warnings.

## 3. Product journey

- [ ] Home: Today shows the resolved workout; all five destinations work; What’s New displays ten categorized release groups and its close button works.

- [ ] GPS auto-pause: fresh near-zero fixes for four seconds freeze time/distance; real movement resumes with a separate route segment. Weak/stale/missing GPS does not pause/resume alone. Manual/background pause stays manual; opt-out persists and stop/save works while auto-paused. Live map has no place box/editor until saved; explanatory notes are in Settings About.
- [ ] GPS tracker: green Play/Start/Resume, light orange Pause and red Stop & save respond once; Record another only prepares. Edit saved activity/distance/duration, including older intervals; preserve id/order/routes, manual daily fields, reload and backup. Confirm pace/speed changes, invalid/cancel/storage-failure behavior, late place labels, and completed Edit/relock.
- [ ] Today: the correct date and workout type appear; controls are readable; Finish + Backup has a clear saved/completed state; reopening the day preserves data.
- [ ] Plan: This week/Next week tabs match Progress; dates run Monday–Sunday. This week retains the artwork/overview. Next week mapping saves from next Monday without changing this week or saved workouts; custom types, reload, Monday rollover and failed-storage rollback work. Assessment shortcut opens/focuses the card in Progress.
- [ ] History: 12 chronological weeks scroll with the current week initially visible; Earlier/Later move three weeks and load older windows at the edges; Back to this week and journal-return position work; prior schedule snapshots are used; blank/unassigned days do not show false Rest; icons and status marks remain readable.
- [ ] Progress: percentage bars use all completed days as the denominator, including labeled recovery; zero core/previously recorded types remain visible; 4/8/12 weeks update counts/order/observations; colors match History; completed add-ons expand and exclude uncompleted selections; comparisons remain available; the obsolete Saved training reports section is absent even when legacy reports exist in storage.
- [ ] Video plans: one-tap automatic captions → draft/review (no autosave), cached reuse, error/cancel and manual paste/file fallback; caption paste/file import → reviewed template → Today with blank weights/checks; distinct per-set weights and shorter actuals persist; recorded rows cannot be discarded by plan replacement; library edits leave dated snapshots intact; repeat/add-to-today clears results; warm-ups are excluded from same-load comparisons; backup/restore and completed Edit lock retain plans/results.
- [ ] Progress: Training Assessment opens the unchanged Drive folder in a new window; weekly mapping and assessments are absent from Settings.
- [ ] Settings: collapsible sections—including Future workout videos—start closed; mobility editing, reference photos, descriptions, schedule mapping, YouTube links, backup, and restore remain usable.

## 4. Persistence and regression checks

- [ ] Finish a workout, reload, and confirm status, notes, details, mobility, links, and injury data persist.
- [ ] Add mobility exercises, reload, and confirm the mobility section is collapsed while the loaded exercises remain present.
- [ ] Change the schedule mapping and confirm it affects future planning without rewriting prior history.
- [ ] Check History and Plan after changing the mapping; prior dates must retain their historical types.
- [ ] Verify backup filename includes date/time and restore does not erase unrelated data. Dated schedule snapshots roundtrip; older schedule-only backups retain known earlier history and replace the future routine.

## 5. Responsive visual QA

- [ ] Inspect rendered iPhone-sized views and safe areas; no tablet or desktop visual testing is required.
- [ ] Look for small text, clipped labels, crowded rows, excessive blank space, horizontal scrolling, and bottom-nav overlap.
- [ ] Confirm buttons have clear labels and adequate touch targets; icons never carry meaning by color alone.

## 6. Live release verification

- [ ] Push the exact tested frontend commit to GitHub; confirm the Pages workflow succeeds for that commit.
- [ ] If worker/API code changed, separately deploy the verified source through the Sites hosting workflow. A Pages push does not update the worker.
- [ ] Wait for deployment success, then reload the live URL.
- [ ] Click Home, Today, Plan, History, Performance, and Settings on the live app and verify the release version and primary layout.
