# Critical-feature release verification

Candidate version: 2026.11.22 0705
Overall decision: PASS
Affected features: CF15, CF31, CF33, CF34, CF42, CF43, CF48
Scope rationale: Plan picture removal affects weekly planning; the saved-copy fix affects editor/History loading; the restore fix affects backups. Release-policy and delivery changes affect publication. Browser checks exercised those flows and their saved-day dependencies. Saved-day loading also affects Today save/lock state, History and journal. Other rows below retain actual completed supplemental results, not mandatory new tests.
Automated evidence: npm test passes all 242 Node tests and 3 Python caption tests, including restore and release-policy regressions. Server and Pages builds pass; git diff --check passes. See docs/releases/2026.11.22-0705/automated.txt and pages.txt.
Browser evidence: External isolated Chrome: Today and Plan at 375x667, 393x852, 440x956; full baseline/expanded GPS suite; expanded critical-feature restore/video/set/media/illness/planning/sharing/offline journeys. See docs/releases/2026.11.22-0705/{today,plan,gps,critical}.txt and scripts/check-{today-actions,gps-laps,critical-features}.mjs.
Device follow-up: After deployment, recommend installed iPhone update/offline retention, touch/safe areas/portrait, Camera-resume GPS, outdoor known-distance pace, VoiceOver and native Files/share checks. No physical-device pass is claimed. These recommendations do not block deployment per the user's November 21 clarification.
Data/backup evidence: The expanded browser suite imports a populated schema-1 backup via Settings, checks History/editor, exports and compares GPS/splits/rests/routes, photos/screenshots, videos/plans/results, nutrition, goals, library and dated mappings. It also verifies conflicting stores, failed-save retry and offline retention. All restore data is synthetic and isolated from personal logs.

This is pre-publication sign-off for the declared affected features. Per the
November 22 user instruction, the complete inventory is retained and unrelated
features need no fresh test. The earlier broad run below is supplemental evidence.
PASS does not claim a physical iPhone field test or an unavailable third-party
provider's signed-in page was tested. GPS, weather, tile, clipboard and share
fixtures are identified in the scripts and evidence. Known failures still block
publication. The earlier public 0758 release is not retrospectively certified.

Rows below retain actual results from the earlier supplemental broad run. Only
the declared affected features need fresh evidence. Physical-only checks remain
post-deployment recommendations. Exact deployment and affected live behavior
are verified separately before announcing live.

| Feature | Result | Evidence / verification |
| --- | --- | --- |
| CF01 | PASS | History/date unit cases; browser Eastern midnight and Monday adoption preserve the historical fixture. |
| CF02 | PASS | Navigation/swipe units; Today six-tab navigation and expanded touch swipe Progress to Settings; Home release controls. |
| CF03 | PASS | Worker unit cases; browser real service worker offline shell reload and online return retain saved records. Installed iPhone update is follow-up. |
| CF04 | PASS | Weather parser cases; denied Home location permission remains usable; tracker weather uses simulated GPS and weather. |
| CF05 | PASS | Today Manage/Open/second-major workflows at three sizes; restored mixed Strength/Endurance day has two History icons. |
| CF06 | PASS | Reuse/notes unit cases; browser repeats prior setup twice without duplicate notes or old result completion. |
| CF07 | PASS | Add-on unit cases; browser named Push-Ups toggle/reselect immediately orders it first; completion independently stored. |
| CF08 | PASS | Library browser add/rename/reload; reference photo/instructions survive restore/export; historical library normalization retained. |
| CF09 | PASS | Browser verifies one shared speaking-timer destination; add-on selections remain independently controlled. |
| CF10 | PASS | Browser Hard effort and long notes survive Finish, exported backup, Edit and reload; no manual metric fields reintroduced. |
| CF11 | PASS | Browser restores two photos and screenshot, uploads two photos and screenshot through real input handlers, verifies backups and journal. |
| CF12 | PASS | Body flags remain independent of completion; browser saved fixture and sick-rest include shoulder concern without losing records. |
| CF13 | PASS | Illness unit cases; browser sick/rest checkbox, note, Finish, saved rest status and independent body flag persist. |
| CF14 | PASS | Nutrition unit cases; browser restored food note/export and separate dated check-in persist across day changes/locks. |
| CF15 | PASS | Today script at 375/393/440: save, canceled optional backup, lock/Edit/resave/reload and backup; lap Finish saves pending GPS first. |
| CF16 | PASS | GPS classification/units tests; browser Run then edit to Walk, second Bike recording, miles/kilometers and preserved lap-mode separation. |
| CF17 | PASS | Pace math unit streams cover smoothing, rounding, spike/quality handling and time/distance definitions; browser steady simulated repeats retain per-repeat averages. Outdoor accuracy is follow-up. |
| CF18 | PASS | GPS saved-view/retry tests; browser full-screen and paused saves, one watch, ready state and immediate saved results across three sizes. |
| CF19 | PASS | Auto-pause tests; browser stationary six seconds then movement auto-resume; lap repeats never auto-pause. |
| CF20 | PASS | Recovery/resume tests; browser synthetic visibility hide/foreground and transient GPS error each resume with one watch, plus mid-repeat reload. |
| CF21 | PASS | Browser initial, Record another, prepared and recovered paths preserve authoritative lap setting; ordinary activity does not inherit laps. |
| CF22 | PASS | Browser eight variable repeats and seven rests; Pause closes repeat and starts recovery, Resume starts next, Stop saves final effort. |
| CF23 | PASS | Boundary/recovery unit tests; browser mile/800/400 repeats and rest times survive reload and failed-save retry. |
| CF24 | PASS | Browser fifteen rows with eight actual repeats/seven recoveries in Today and History; exported JSON agrees; zero-distance effort retained. |
| CF25 | PASS | Store/save units; browser dual-store failure, stopped receipt reload, retry with same ID and stop time, no premature day completion. |
| CF26 | PASS | Edit/delete unit cases; browser changes Run to Walk, confirms/cancels deletion of one of two recordings, reload and backup keep Bike. |
| CF27 | PASS | Prepared/off-date unit cases; browser unused preparation Finish creates no phantom record, second recording stays distinct; date rollover covered. |
| CF28 | PASS | Three-size lap screen fit assertions/screenshots; ordinary full-screen weather/map, Exit and Stop preserve state; portrait API is device follow-up. |
| CF29 | PASS | Map camera/route tests; browser actual two-finger touch pinch, +/minus, Following toggle and segmented saved route; map tiles mocked for export. |
| CF30 | PASS | Weather tests; browser 68F/20C, humidity 54%, wind units and changing heading produce tailwind/headwind/crosswind. Provider response mocked. |
| CF31 | PASS | Weekly-planning tests; browser no picture, seven previews, Next week mapping, custom future Monday, failed-save rollback, reload and Monday rollover. |
| CF32 | PASS | Artwork/type tests; Today second major type and one-day selection persist; future custom Hiking type adopted without rewriting old fixture. |
| CF33 | PASS | History/search tests; browser twelve weeks, two icons, body filter plus note search, completion and actual daily journal. |
| CF34 | PASS | Journal tests and browser actual saved fixture: dates, notes, images, check-ins, sets, split table, Edit then save/return/reload. |
| CF35 | PASS | Progress/strength tests; browser all 4/8/12-week controls and restored completed sets; sick-rest excluded by tested progress calculation. |
| CF36 | PASS | Browser YouTube save with blocked metadata provider, player/close, All/category filter, reload and confirmed library deletion. |
| CF37 | PASS | Browser explicit completed checkbox, save/backup retention and dated results; repeat setup resets prior completion/results before fresh logging. |
| CF38 | PASS | Transcript/cache/helper tests; browser correct selected-video POST handoff, denied clipboard, manual transcript and resumable reviewed draft. |
| CF39 | PASS | Parser/lexicon tests; browser known swing/squat transcript builds reviewed stated sets without weights, Save plan persists library template. |
| CF40 | PASS | Session/set/removal tests; browser actual weight/reps/completion, Repeat set resets done, skipped exercise cancel/confirm keeps other results and reusable template. |
| CF41 | PASS | Sharing tests; browser creates nine real PNG previews, validates dimensions, text/font/full-size return and mocked file-share handoff; three representative exports visually inspected. |
| CF42 | PASS | Loader/session-store tests; browser completed fallback beats newer partial indexed copy, editor and History agree; full restored/exported data compared. Restore map-index/callback defect fixed. |
| CF43 | PASS | Browser invalid schema rejected; complete populated schema-1 restore/export retains GPS repeats/rests/routes, photos/screenshots, videos/plans/results, nutrition, goals, custom types/mappings and library fields. |
| CF44 | PASS | Browser Settings sections initially closed; library edits, videos/filter/player, restore and About rendered; removed legacy controls covered by rendered tests. |
| CF45 | PASS | Browser Progress-only Assessment URL and new-tab target verified; normal storage data survives navigation. Private signed-in Drive display is follow-up. |
| CF46 | PASS | Three-size center-hit touch assertions and screenshots; expanded browser accessibility tree gives every button a name. Physical safe areas/VoiceOver are follow-up. |
| CF47 | PASS | Provider failure tests; browser blocked metadata/geocoding and denied location/clipboard remain honest while records and backups survive; export tiles explicitly mocked. |
| CF48 | PASS | Preflight release label 2026.11.22 0705, ten notes, worker cache/query and tested assets agree. Exact deployment and live workflows must be verified after push and recorded in HANDOFF.md. |

## Repeatable commands

```sh
npm run test:release
npm run build:pages
git diff --check
node scripts/check-today-actions.mjs
node scripts/check-gps-laps.mjs
node scripts/check-critical-features.mjs
npm run verify:release
```

Use CHROME_CDP_URL and APP_URL for an isolated external Chrome and built app.
Run the browser scenarios sequentially; a competing tab can legitimately pause
GPS. Plan visual inspection also checked all seven day previews and the current
or future Open workout destination at each phone size. Temporary screenshots
are /private/tmp/t4l-plan-no-graphic-{375,393,440}.png and
/private/tmp/t4l-share-{card,photo,route}-{square,portrait,story}.png.

Design review: D01/D02/D06/D07/D10/D12 PASS for release, save/data truth, Plan
hierarchy, History consistency, responsive touch controls and regression.
D03/D04/D05/D08/D09/D11 N/A for runtime changes outside those surfaces; their
existing functions are covered by the broader feature suite and sharing PNGs.
Duplicate review: one Plan detail card, one shared store-selection helper, one
restore write per record; no redundant controls introduced.

After successful Pages deployment, record the exact commit/run/public-asset
comparison and live workflow results in HANDOFF.md. Only then tell the user to
refresh. Physical checks remain recommendations for subsequent feedback.
