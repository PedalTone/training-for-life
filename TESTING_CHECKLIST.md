# Training for Life pre-ship testing checklist

Run this checklist before every patch and release. The goal is to verify the complete user journey, not just that the build succeeds.

## Mandatory critical-feature release gate

Established November 9, 2026 at the user's request. This is the current critical
feature inventory, not a claim that every feature has passed. For **every new
public version**, test every CF item below, including unchanged features, and
record the candidate version, result and concrete evidence in
[RELEASE_VERIFICATION.md](RELEASE_VERIFICATION.md). Use PASS, FAIL, BLOCKED or
UNTESTED. Every CF item must be PASS before publication. "Unchanged", "builds",
"test file exists" and "worked in an earlier version" are not passing results.
Do not weaken a test or remove a CF item to get a release through.

- Run `npm test`: it builds the server and runs **all** `tests/*.test.mjs`, not
  only GPS tests, plus `tests/video-caption-fallback.test.py`. Run
  `npm run build:pages` and `git diff --check` too.
- Run both external-browser scenarios: `scripts/check-today-actions.mjs` and
  `scripts/check-gps-laps.mjs`. Perform the additional browser/device checks
  listed below; these two scripts do not cover the whole app.
- For every CF item, include its automated result **and** its functional smoke
  result. For changed features and their dependencies, exercise new, saved,
  locked, editing, failed-save, retry and reload states where applicable.
- Check the actual persisted record and exported backup, not just visible labels.
  A checked Track laps box or a saved notification does not prove splits exist.
- Use isolated test data. Never reset the user's browser, overwrite real logs,
  or restore a test backup over the user's live data.
- Browser GPS simulation does not certify physical iPhone location, touch,
  backgrounding, portrait APIs, VoiceOver or Files/share behavior. Record actual
  device evidence for those claims. Dated device evidence may be carried forward
  only for unchanged native behavior, with the source and reason stated; run the
  candidate's browser smoke again. Missing required evidence is BLOCKED.
- Run `npm run verify:release` before upload/deployment. It rejects missing,
  stale-version, failed or untested feature sign-offs. This checks the evidence
  record's completeness; it cannot independently prove a manual test was run.
- After deployment succeeds, verify exact live JS/CSS/service-worker assets and
  repeat the live navigation/save/split smoke. Only then announce "live" and tell
  the user to refresh. A deployment failure leaves the release incomplete.
- Add a CF item and a regression case whenever a critical capability is added.
  Never drop an existing item merely because another feature is being changed.

### Home, dates and daily logging

| ID | Critical feature provided today | Required verification before every public version | Existing automation; additional functional checks |
| --- | --- | --- | --- |
| CF01 | Correct current day and historical dates | Eastern date/midnight rollover, month/year/DST transitions, Today versus selected older day, History completion agrees with saved day | `tests/history-timeline.test.mjs`, `tests/rendered-html.test.mjs`; browser fake-clock rollover and older-day edit |
| CF02 | Home and six-section navigation | Home, Today, Plan, History, Progress, Settings; correct selected tab/artwork; back/return; swipe never steals taps, typing, map or scroll gestures | `tests/adventure-scenes.test.mjs`, `tests/swipe-navigation.test.mjs`; both browser scripts and swipe smoke |
| CF03 | Installed app, offline shell and cache updates | Fresh open, reopen/reload, online update and offline cached shell; correct icon/version; cached shell upgrade preserves all workout data | `tests/service-worker.test.mjs`, `tests/rendered-html.test.mjs`; external browser online/offline and installed iPhone update |
| CF04 | Optional Home local weather | Opt in/out persists; appropriate day/night icon; denied location, unknown conditions and timeout show unavailable; approximate coordinates only | `tests/weather-kind.test.mjs`, `tests/gps-weather.test.mjs`; Home permission/refresh/offline smoke |
| CF05 | Primary and second major workout selection | Manage/Open visibly reveal and focus controls; choose/change a second workout; saved days retain both types and History icons; no silent completion | `scripts/check-today-actions.mjs`; browser mixed strength/endurance day, reload and paired History icons |
| CF06 | Repeat prior workout and copy prior notes | Copy appropriate earlier matching setup/notes; preserve current work; no old completion, weights or results; repeated copying does not duplicate | `tests/repeat-workout.test.mjs`, `tests/prior-workout-notes.test.mjs`; browser reuse with existing entries |
| CF07 | Add-on selection, ordering and completion | Full library visible; checkbox selects the named row; selected rows move up immediately; Mark done is separate; unselect/reselect and reload preserve correct data | `tests/addon-selection.test.mjs`; touch Push-Ups, neighbors and long/custom rows in varied orders |
| CF08 | Editable exercise library | Add/rename exercise; edit equipment/instructions/reference photo/graphic description; Today selections and saved backups remain consistent; historical entries preserved | `tests/addon-selection.test.mjs`, `tests/rendered-html.test.mjs`; Settings edits, Today, reload and backup smoke |
| CF09 | Shared add-on timer | One prominent blue Start timer link opens speaking timer; no per-exercise timer duplication; opening it never selects or completes an exercise | Browser link destination/query, new-tab return and unchanged selections |
| CF10 | Perceived effort and workout notes | Easy/Medium/Hard, toggle/undo, long notes, append/copy; typing keeps focus; legacy metrics retained; no removed manual distance/duration fields | `tests/prior-workout-notes.test.mjs`, `tests/daily-journal.test.mjs`; Today Log edit/save/reload and keyboard smoke |
| CF11 | Workout photos and local screenshots | Up to six photos, compression, add/remove/reopen; screenshots stay images and never invent metrics; all media retained through lock/reload/backup | `tests/workout-photos.test.mjs`, `tests/daily-journal.test.mjs`; real file picker and multiple image smoke |
| CF12 | Injury/body check-ins | Report/clear concern, area/impact/note; red flags/search; concern independent of completion; preserve during edits and backup | `tests/daily-journal.test.mjs`, `tests/history-search.test.mjs`; Check-ins to History and locked/edit states |
| CF13 | Non-injury illness and rest | Sick/unwell independent of injury; rest choice saves/locks without false workout completion; amber flag, note/search and Progress exclusion survive reload | `tests/illness.test.mjs`; simultaneous illness/body-note and normal completed recovery smoke |
| CF14 | Nutrition check-ins | Food/cutoff answers, No versus unanswered, undo, optional notes, weekday/weekend rules; History; lock and backup/restore preserve nutrition independently | `tests/nutrition.test.mjs`; check-in, calendar day switch, reload and restore smoke |
| CF15 | Finish day, backup, Edit and locking | Save completion before optional backup; cancellation never undoes completion; Edit below picture unlocks only that date; re-save/reload relock; Share remains available | `tests/workout-lock.test.mjs`, `tests/illness.test.mjs`; both browser scripts, successful/cancelled/failed backup and active/ready GPS cases |

### GPS recording and track repeats

| ID | Critical feature provided today | Required verification before every public version | Existing automation; additional functional checks |
| --- | --- | --- | --- |
| CF16 | Run, Walk, Bike and units | All three activities selectable/saved/editable; miles/kilometers; Run/Walk min-per-distance versus Bike speed; mixed records use correct units | `tests/gps-math.test.mjs`, `tests/gps-edit.test.mjs`, `tests/gps-saved-view.test.mjs`, `tests/share-card-data.test.mjs`; browser activity/unit switch |
| CF17 | Current, split and average pace/speed | Stable believable current pace; split time/distance and total applicable time/distance remain distinct; correct rounding; stationary/weak GPS unavailable; reject jumps/jitter | `tests/gps-math.test.mjs`, `tests/gps-laps.test.mjs`; steady/change/spike/poor-signal browser streams and physical known-distance workout |
| CF18 | Start, Pause, Resume, Stop/save | Ready does not start; immediate tap feedback; one clock/watch; paused time excluded; Stop works running/paused/pending/full-screen; saved totals replace live metrics | `tests/gps-saved-view.test.mjs`; `scripts/check-gps-laps.mjs`, repeated/rapid center taps and physical iPhone control smoke |
| CF19 | Ordinary-mode auto-pause/resume | Four-second standstill; progressive walking resumes after long stop with missing/zero native speed; no jitter/weak-signal chatter; opt-out; explicit Pause stays manual | `tests/gps-auto-pause.test.mjs`, `tests/gps-resume.test.mjs`; browser motion streams and outdoor stop/restart |
| CF20 | Backgrounding, GPS errors and draft recovery | Camera/background pauses safely; one Resume restarts after error; reload restores paused state and exact stored totals/route/date; no implicit start | `tests/gps-recovery.test.mjs`, `tests/gps-resume.test.mjs`; browser interruption/reload plus actual iPhone Camera/foreground sequence |
| CF21 | Authoritative Track laps selection | Fresh Start, prepared draft, Record another, on/off toggles and recovered draft agree between checkbox and recorder; no mid-recording mode switch; auto-pause off | `scripts/check-gps-laps.mjs`; inspect persisted lapMode and actual resulting splits for each entry path |
| CF22 | One-button repeat/recovery workflow | Start begins repeat; Pause saves it and starts recovery; Resume starts next; Stop includes final active repeat; stopping during rest never duplicates it; zero-distance time retained | `tests/gps-laps.test.mjs`; full browser track scenario and actual device Start/Pause/Resume/Stop |
| CF23 | Variable repeat distances and durable boundaries | Mile warm-up/cool-down treated as repeats; mixed 400/800/other lengths measured by GPS; interruptions continue current repeat; explicit rest starts new one; exact last clock fraction retained | `tests/gps-laps.test.mjs`; eight-repeat/seven-recovery browser scenario, mid-repeat reload and pause/stop timing assertions |
| CF24 | Saved repeat/recovery results table | Today and History show matching time-to-tenths/meters/average pace rows; recoveries interleaved; reload/backup retain them; older estimates labeled; missing splits never fabricated | `tests/gps-laps.test.mjs`, `tests/gps-saved-view.test.mjs`; inspect actual stored arrays, backup and both rendered tables |
| CF25 | GPS save failures and retry integrity | Serialized writes defeat stale autosave; storage timeout/fallback; draft/receipt retained on failure; same ID/original stop time on retry/reload; no duplicate or zeroed workout | `tests/session-store.test.mjs`, `tests/gps-recovery.test.mjs`, `tests/gps-save.test.mjs`; browser dual-store failure, reload, retry and exact payload assertions |
| CF26 | Edit/delete individual GPS recordings | Correct activity/duration/distance, validate inputs; confirmation/cancel/delete; retain route, splits, manual fields and other records; late geocoding never resurrects deletion; respect lock | `tests/gps-edit.test.mjs`, `tests/gps-save.test.mjs`; browser older/latest/last-record edit/delete, failed write and reload |
| CF27 | Multiple recordings, preparation and date ownership | All recordings retained in order; Record another only prepares; unused preparation never blocks Finish or adds a record; ready Start uses selected day; recorded older draft saves to original day | `tests/gps-save.test.mjs`, `tests/gps-saved-view.test.mjs`; browser repeat recording and cross-midnight/off-day scenarios |
| CF28 | Full-screen tracker and portrait behavior | Same watch/state across entry/exit; map above endurance metrics; map absent in laps; big pace; all controls fit 375/393/440 widths and short heights; portrait lock/guidance, Escape/focus return | `scripts/check-gps-laps.mjs`; endurance full-screen browser screenshots plus physical iPhone portrait/safe-area test |
| CF29 | Route maps and gestures | Correct segmented trace/start/finish; pinch, drag, +/−, Follow me, Fit route; chosen zoom retained; no bridging pauses/gaps; saved place label editable; attribution/failure fallback | `tests/gps-map-camera.test.mjs`, `tests/gps-route.test.mjs`; real two-finger browser/device gestures and saved map edit/reload |
| CF30 | Tracker weather and relative wind | Temperature/humidity/wind speed/direction; green labeled tailwind/red headwind/crosswind; missing heading honest; unit conversion, refresh/timeout; reuse existing GPS and approximate weather location | `tests/gps-weather.test.mjs`; browser mocked headings/wind/units/failure plus physical heading/weather display |

### Planning, history and progress

| ID | Critical feature provided today | Required verification before every public version | Existing automation; additional functional checks |
| --- | --- | --- | --- |
| CF31 | Weekly planning and future-effective changes | This/Next week, Monday–Sunday, featured day/overview; mapping applies next Monday/repeats; Sunday/current/past days unchanged; future revisions and reload correct | `tests/weekly-planning.test.mjs`, `tests/rendered-html.test.mjs`; browser plan edit, failure and rollover |
| CF32 | One-day overrides and additional workout types | Built-in/custom types and strength variants resolve consistently; override changes only chosen day; restore weekly plan; artwork/icons/types preserved in History and Progress | `tests/adventure-scenes.test.mjs`, `tests/weekly-planning.test.mjs`, `tests/rendered-html.test.mjs`; browser override/custom/mixed-type save/reload |
| CF33 | History timeline, completion and search | Twelve weeks; Earlier/Later three weeks; return/current-week labels; journal return position; two workout icons; completion independent of flags; query/date/type/body filters compose | `tests/history-timeline.test.mjs`, `tests/history-search.test.mjs`, `tests/rendered-html.test.mjs`; full/sparse/legacy History browser smoke |
| CF34 | Readable daily journal | Previous/next/date selection; saved totals, notes, photos, screenshots, check-ins, videos/sets and split tables; Edit/Share in correct order; no mutation while viewing | `tests/daily-journal.test.mjs`, `tests/video-session-log.test.mjs`; browser open actual fixture from History, reload, edit and return |
| CF35 | Progress and strength comparisons | 4/8/12 weeks; ranked percentages include completed recovery and exclude sick rest/future days; zero categories; completed add-ons; actual non-warm-up strength comparisons at matching load/reps | `tests/local-progress.test.mjs`, `tests/video-training-plan.test.mjs`, `tests/illness.test.mjs`; browser periods/empty/mixed days and weight changes |

### Videos and strength logging

| ID | Critical feature provided today | Required verification before every public version | Existing automation; additional functional checks |
| --- | --- | --- | --- |
| CF36 | YouTube library and playback | Add valid URL/metadata without blocking on lookup failure; in-app player/close and external link; categories/All initial list; add-to-Today/recent videos/deletion without unintended duplication | `tests/future-video-list.test.mjs`, `tests/video-cleanup.test.mjs`; external browser add/play/close/filter/reload/delete smoke |
| CF37 | Explicit video completion | Playing/adding never completes; checkbox retained in Today/History/backup; finished-day lock; repeat/add starts unchecked while preserving existing same-day results | `tests/video-completion.test.mjs`, `tests/repeat-workout.test.mjs`; browser checkbox, Finish/Edit and reload |
| CF38 | Transcript handoff, cache and resumable draft | Correct selected URL to requested free site; Paste & build/review/save; denied clipboard/manual paste/file import; bounded cache/draft; blocked provider stays honest, no silent alternate | `tests/video-plan-workflow.test.mjs`, `tests/video-caption-client.test.mjs`, `tests/video-captions.test.mjs`; browser handoff/denial/blocked-source/cache/reload |
| CF39 | Reviewed workout-plan generation | Exercise variations/aliases, per-side units and stated doses preserved; no invented weights/reps/rounds; edit/cancel/save, persistent Plan ready badge; reusable templates isolated from dated results | `tests/video-training-plan.test.mjs`, `tests/transcript-lexicon.test.mjs`; browser draft review with known and unknown movements |
| CF40 | Session strength logging and skipped exercises | Manual exercise/add set without plan; weights/load/unit/reps/time/warm-up; Repeat chosen set resets completion; Remove from today confirms and preserves library/other results; locks and backup retain all rows | `tests/video-session-log.test.mjs`, `tests/video-remove-exercise.test.mjs`, `tests/video-training-plan.test.mjs`; browser complete/edit/repeat/remove-last/reload |

### Sharing, persistence, settings and publication

| ID | Critical feature provided today | Required verification before every public version | Existing automation; additional functional checks |
| --- | --- | --- | --- |
| CF41 | Workout sharing and image export | Today/journal composer; Photo/Route/Card, square/portrait/story; correct units/artwork; editable title/text/font/size/position; full-size preview; route privacy; no private notes/check-ins or editing guides in export | `tests/share-card-data.test.mjs`, `tests/share-route-map.test.mjs`; render actual PNGs for each template/format, inspect and test native share/download |
| CF42 | Durable records and store reconciliation | IndexedDB/fallback freshness/richness/completion agree; legacy and current data load; stale autosave cannot replace new data; empty/partial copies never mask trustworthy records; no unrelated deletion | `tests/session-store.test.mjs`, `tests/daily-journal.test.mjs`, `tests/gps-save.test.mjs`; browser conflicting-store fixtures, blocked/quota failures and reload |
| CF43 | Complete backup/restore compatibility | Dated filename; schema-1 old/new roundtrip; sessions, all GPS records/splits/recoveries/routes, photos, screenshots, videos/plans/results, nutrition, library, settings and dated schedules retained; invalid input safe | `tests/nutrition.test.mjs`, `tests/weekly-planning.test.mjs`, `tests/gps-laps.test.mjs`, `tests/workout-photos.test.mjs`; full fixture restore in isolated browser and native Files |
| CF44 | Settings and exercise/video libraries | Sections open/close predictably; library changes persist; recent video actions respect locks; restore and About accurately describe capabilities; obsolete controls stay absent | `tests/future-video-list.test.mjs`, `tests/rendered-html.test.mjs`; complete Settings edit/return/reload smoke |
| CF45 | Training Assessment link | Progress opens the established private Drive folder; link absent from Plan/Settings; opening it never removes workouts; no false in-app report/download/AI success | Browser link target/new-tab/return/storage check; `app/assessment-card.tsx` is implementation, not automated proof |
| CF46 | iPhone interaction and accessibility | Visible button center equals active hit area; readable text, contrast, focus/labels, large text, safe areas/keyboard; no clipped controls/horizontal scroll; map/scroll/swipe coexist | Both external-browser scripts; additional 375/393/440 screenshots, coordinate hit tests and physical iPhone/VoiceOver checks |
| CF47 | External services and privacy/failure handling | Maps/geocoding/weather/YouTube/transcript/timer/Drive failures do not destroy recordings or falsely report success; no unexpected data sharing or requests before intended action | Existing GPS/weather/caption/share tests; browser blocked/offline providers, cancellation and request inspection |
| CF48 | Exact release delivery and update truth | New Eastern timestamp, ten dated notes, worker/cache and live assets match tested commit; Pages succeeds; API deployed separately if changed; installed update retains data; refresh only after live proof | `tests/rendered-html.test.mjs`, `tests/service-worker.test.mjs`, `npm run verify:release`; workflow/asset comparison and live navigation/save/table smoke |

### Mandatory cross-feature scenarios

In addition to the inventory, run these complete journeys for each candidate:

1. New date → choose two major workouts → add-ons and effort/notes → Finish →
   cancel backup → verify completed History → Edit → save/backup → reload.
2. New lap tracker **and** Record another/prepared/recovered entry paths → toggle
   lap mode → mile warm-up, two 800s, four 400s, mile cool-down → seven rests →
   Stop or direct Finish → verify eight actual split records and fifteen table
   rows in Today, History and exported backup. Repeat with failure/reload/retry.
3. Ordinary Run/Walk/Bike with laps off → auto-pause/resume → manual pause →
   Camera/background → Resume → full-screen Stop/save → second recording →
   edit/delete one → reload. No lost totals, duplicate watch or split-mode leak.
4. Video → transcript handoff/manual fallback → reviewed plan → Today → record
   actual sets → Repeat set → Remove skipped exercise → Finish/Edit/reload →
   History/Progress → backup and restore in an isolated browser.
5. Illness-rest with independent body concern and nutrition → save/reload →
   History flags/search → Progress excludes sick-rest while normal recovery counts.
6. Current versus older date and next week's mapping → simulate midnight/week
   rollover → verify dates, completion, plan/artwork and stored history unchanged.
7. Existing populated legacy backup → restore in an isolated profile → verify
   all data families → create all sharing formats → simulated offline reload →
   online cache upgrade → repeat navigation/save/split smoke on the public build.

### Scope and honest coverage

Saved-route libraries, same-course comparisons, breadcrumb route guidance,
track-lane snapping, background/lock-screen GPS, automatic Grok file transfer
inside the web app, and complete per-point GPS diagnostic export are **not
currently implemented app capabilities**. Do not mark them tested as features.
External scheduled Grok/Drive transfers require their own operational checks;
changes to exports must verify that downstream consumers retain compatible data.
There is no app login flow or in-app AI assessment reader to certify.

Several CF items currently have only partial automation or require manual/device
checks. The coverage column identifies starting points, not full certification.
The initial report records existing gaps/failures; do not retroactively claim
this inventory was executed for the already-published 0758 release.

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
- [ ] Confirm it ran every `tests/*.test.mjs`, including journal, planning, video, strength, nutrition, sharing, storage and cache regressions; GPS-only success is insufficient.
- [ ] Run `npm run build:pages`.
- [ ] Confirm all rendered HTML tests pass and no build errors are hidden by warnings.
- [ ] Complete every CF result/evidence row in RELEASE_VERIFICATION.md and pass `npm run verify:release` before publishing a new version.

## 3. Product journey

- [ ] Home: Today shows the resolved workout; all destinations work; What’s New displays ten categorized release groups and its close button works.

- [ ] GPS auto-pause: fresh near-zero fixes for four seconds freeze time/distance; small progressive walking steps resume after a two-minute stop even with missing/zero native speed, using a fresh short movement window and separate route segment; speed-only spikes, a single coordinate jump and stationary GPS jitter do not resume. Weak/stale/missing GPS does not pause/resume alone. Manual/background pause stays manual; opt-out persists and stop/save works while auto-paused. Live map has no place box/editor until saved; explanatory notes are in Settings About.
- [ ] GPS tracker: green Play/Start/Resume, light orange Pause and red Stop & save respond once; Stop & save switches to saved summaries/Edit without duplicate live metrics/setup controls; Record another only prepares and restores setup. Edit saved activity/distance/duration, including older intervals; Delete recording opens Yes, delete / Keep recording confirmation; test cancel, storage failure, older/latest/last deletion, updated totals and no late-map resurrection; preserve id/order/routes, manual daily fields, reload and backup. Confirm pace/speed changes, invalid/cancel/storage-failure behavior, late place labels, and completed Edit/relock.
- [ ] Today: Manage, primary/secondary Open workout and Add a second major workout switch to Workout, open the controls, scroll the targeted selector into view and focus it, including repeated taps/from Log or Check-ins. Finish + Backup places one saved/locked banner with Edit directly beneath the picture, before Today’s workouts. View workout retains the lock; Edit unlocks; re-save/reload relocks. No duplicate saved/Edit block in the footer; sharing remains below; reopening the day preserves data. External Chrome regression: `node scripts/check-today-actions.mjs` (isolated Chrome CDP on port 9223; local preview on 5174, or APP_URL for the live release).
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

- [ ] Video completed checkbox works with/without a plan; separate per-video status survives reload, backup/restore and journal. Playing/adding does not complete; finish locks and Edit permits correction. Repeat/add-to-today starts unchecked, templates unchanged.

- [ ] Add-on selection: touch checkbox and label on Push-Ups and neighboring/long/custom rows in varied order, repeated check/uncheck and completion. Selected exercises move immediately to the top, deselected ones return to library order; no wrong selection or swipe navigation. Verify full library, selected-only backup, reload and completed lock.

- [ ] Today Log: Perceived effort is first, with Easy/Medium/Hard. No manual duration/distance/More metrics/pace/calories/start-time fields. Notes/photos/screenshots retained; legacy metrics survive effort edits, backup/reload; GPS unchanged.

- [ ] Illness: Check-ins Sick/unwell is independent of injury; optional rested day saves/backs up/locks without workout completion, remains searchable and flagged in History/journal, excluded from Progress completed totals. Note/clear/Edit/reload and simultaneous injury flags preserved. Normal workouts/recovery unchanged.

- [ ] Tracker: Stop & save while auto-paused and after movement resumes; stalled/blocked IndexedDB and native clearWatch failure do not wedge saving. All storage failure retains draft and enables retry with one recording ID. Full screen before/during/after tracking shows map then metrics/controls, fits short iPhone heights/safe areas, supports Exit/Escape/focus return, and never starts another watch.

- [ ] GPS save retention: delayed older autosave cannot overwrite Stop/save; queued autosave rechecks freshness; second copy restores the recording when IndexedDB is missing; missing primary/fallback restores the last stopped receipt with exact totals/route/ID; failed save plus reload retries one recording; explicit deletion/discard never resurrects; notes and backup remain intact.

- [ ] Prepared GPS draft from a prior day starts on the selected day and keeps its selected activity. Previously started paused tracking keeps its actual date; an off-day save remains open with exact totals, no zero live metrics, and a working View saved workout link.

- [ ] Tracker weather/map: temperature and humidity above full-screen map; °F/°C follow units; missing/error/timeout values never become zero; 15-minute refresh and no second GPS watch. Real touch pinch and +/− adjust zoom while Following keeps location centered; drag pauses follow, Follow me recenters, Fit route shows all points. Full-screen toggles and gestures retain recording; Stop/save and saved route editing still work.
- [ ] Tracker laps: enable Track laps before Start; Start begins repeat 1, Pause saves the current GPS-measured repeat and starts recovery, Resume begins the next repeat, and Stop & save saves the final repeat; reload/recovery, backup and saved editing retain repeat data; ordinary endurance mode keeps normal pause behavior.
- [ ] Lap regression: `node scripts/check-gps-laps.mjs` with isolated external Chrome on CDP 9234. Run mile warm-up, two 800s, four 400s and mile cool-down; seven timed recoveries, one watch, no auto-pause. Reload mid-repeat and during a failed save; preserve boundaries, ID, stop timestamp and all splits. Today and History show the same 15-row table, with meters/pace and unavailable recovery distance. Check short/large iPhone layouts, Stop in full screen, direct Finish while tracking, failure/retry, backup/reload, zero-GPS timed repeat and unused preparation followed by Finish. APP_URL selects the live release for the same fixture; it never reads existing browser data.
