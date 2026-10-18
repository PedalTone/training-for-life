# Training for Life pre-ship testing checklist

Run this checklist before every patch and release. The goal is to verify the complete user journey, not just that the build succeeds.

## 0. Design standards gate

- [ ] Read the [Designly design standards report](DESIGN_STANDARDS.md).
- [ ] Mark applicable D01–D12 rows PASS / FAIL / N/A with reason; record commands, rendered evidence, device-only limitations and exceptions in HANDOFF.md or the change description.
- [ ] Run `npm run test:design` (also included in `npm test` and Pages CI). Documentation checks do not replace visual inspection of changed UI.
- [ ] Update the report and checklist when an explicit user-approved design changes.

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

- [ ] GPS auto-pause: fresh near-zero fixes for four seconds freeze time/distance; real movement resumes with a separate route segment. Weak/stale/missing GPS does not pause/resume alone. Manual/background pause stays manual; opt-out persists and stop/save works while auto-paused. Live map has no place box/editor until saved; explanatory notes are in Settings About.
- [ ] GPS tracker: green Play/Start/Resume, light orange Pause and red Stop & save respond once; Record another only prepares. Edit saved activity/distance/duration, including older intervals; Delete recording opens Yes, delete / Keep recording confirmation; test cancel, storage failure, older/latest/last deletion, updated totals and no late-map resurrection; preserve id/order/routes, manual daily fields, reload and backup. Confirm pace/speed changes, invalid/cancel/storage-failure behavior, late place labels, and completed Edit/relock.
- [ ] Today: the correct date and workout type appear; controls are readable; Finish + Backup has a clear saved/completed state; reopening the day preserves data.
- [ ] Plan: This week/Next week tabs match Progress; dates run Monday–Sunday. This week retains the artwork/overview. Next week mapping saves from next Monday without changing this week or saved workouts; custom types, reload, Monday rollover and failed-storage rollback work. Assessment shortcut opens/focuses the card in Progress.
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
- [ ] Sharing: verify actual exports, large/full-size previews, title editing without focus/scroll jumps, Instagram/TikTok labels, optional text positioning/fonts/size, route visibility and no blue box/editing guides in full-size preview or exported images.

## 6. Live release verification

- [ ] Push the exact tested frontend commit to GitHub; confirm the Pages workflow succeeds for that commit.
- [ ] If worker/API code changed, separately deploy the verified source through the Sites hosting workflow. A Pages push does not update the worker.
- [ ] Wait for deployment success, then reload the live URL.
- [ ] Click Home, Today, Plan, History, Progress, and Settings on the live app and verify the release version and primary layout.
