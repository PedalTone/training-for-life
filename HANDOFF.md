# Training for Life — development handoff

Updated October 10, 2026. Read README.md, VERSIONING.md and AGENTS.md first.

## Latest update-delivery repair

Phone reported `2032` after `2037` deployed. Live HTTP headers show a 600-second
HTML cache lifetime. Navigation fetch previously used the default HTTP cache;
it now uses `cache: "no-store"` to request fresh HTML online, preserving the
offline fallback. This is a likely cause, not a confirmed phone-side diagnosis.
Release remains `2026.09.28 2037` under the deployment-repair policy.
Both builds and 18 tests pass, including two service-worker behavior tests.
Repair commit `d2a7857` deployed successfully in run `36504530490`. HTTPS
verification confirmed the repaired worker and all checked assets match the
local build. Phone-side confirmation remains outstanding. No workout storage
was changed.

## Current change — strength and easy aerobic activity artwork

Candidate `2026.10.10 1023`: built-in image generation finalized approved
strength-boulder.png (woman with natural athletic arms lifting in alpine clearing)
and aerobic-jogger.png (man jogging beside river), both text-free 2:1 assets.
Shared scene helper uses them across Home, Today, Plan, Progress and journal;
Recovery/Endurance/other atlas scenes preserved. No data or workout changes.
Both builds, 13 rendered and 4 scene tests pass; diff clean. External Chrome
verified both scene types, mapping/override behavior and phone/tablet/desktop
Today/Plan views; full figures remain visible in small iPhone cards.
Source images: exec-6439d1bb-e397-43c9-8685-d13ab9540ccc.png and
exec-23134ceb-7251-40d1-b844-c9820e5a9d97.png in this thread's generated_images.
Final prompt intent: approved scenes; soften woman's arm/shoulder bulk to everyday
fit proportions; preserve people/scenery/style; remove all labels; single 2:1
landscapes with full figures and ivory edges. Publication pending.

## Previous release — balanced Today header

Published `2026.10.10 0956`: Today title takes its natural width (up to half
of the row), with artwork centered in the remaining space. Existing 2:1 image
size retained where space allows; narrower rows shrink proportionally. No data
or tracking changes. Both builds, 13 rendered tests and diff check pass.
External Chrome phone/tablet/desktop views and longer full-body title inspected;
expanded logging and workout-driven scene changes verified. Commit `11049b9`
deployed in successful Pages run `38057753845`; HTTPS verified exact release,
JS/CSS assets and service worker.

## Previous release — Endurance artwork and full-body strength naming

Published `2026.10.10 0938`: approved runner/cyclist winding trail saved as
public/endurance-trail.png and used for Endurance across Home, Today, Plan,
Progress and journal. Shared background helper preserves other atlas scenes.
Strength choices/categories/balance labels now say Full-body strength; Wednesday
and Friday defaults both use full-body guidance. Current/future saved strength
plans display the canonical name; prior recorded themes and storage keys retained.
Both builds, 13 rendered and 12 focused tests pass; diff clean. External Chrome
verified mapping labels, both strength days, workout-driven image changes and
phone/tablet/desktop Today/Plan layouts. Commit `8e0a422` deployed in successful
Pages run `38056683275`; HTTPS verified release, exact JS/CSS, artwork and worker.

## Previous release — saved GPS controls and wide Today landscape

Published `2026.10.10 0922`: saved GPS totals show “Workout saved · GPS totals”
and a quiet “Record another run or ride” action instead of Start GPS. Latest saved
record restores with its activity/totals after reload and stays tied to its date.
Today’s resolved workout terrain now uses a 2:1 horizontal view matching Plan.
No GPS calculations, workout data or backup formats changed. Both builds and
22 tests passed; external Chrome simulated save/reload/restart and checked
phone/tablet/desktop layouts, journal and workout-driven landscape changes.
Commit `db695a9` deployed in successful Pages run `38055637160`; HTTPS
verified exact release, JS/CSS assets and service worker.

## Previous release — foreground GPS workout tracking

Published `2026.10.10 0819`: Today has collapsed Run/Bike GPS tracking with
elapsed time, distance, current and average speed, mi/km units, pause/resume,
stop/save and paused-draft discard. High-accuracy watchPosition starts on user
request. Screen Wake Lock requested where available. Hidden pages auto-pause;
foreground web tracking only, not lock-screen/background recording. Weak fixes,
jitter, implausible jumps, stale points and >30-second gaps filtered. No bridging
pauses/gaps. Average includes active stops. Totals-only draft recovers paused.
Coordinates remain transient; never uploaded/stored. GPS summary records in dated
session (gpsWorkouts) carry start/end, active seconds, meters, maximum speed, gaps;
normal backup/restore preserves them. Journal displays each recording. Empty main
totals filled; successive GPS-owned totals accumulate; manual data/setup preserved.
Finish+Backup guarded until same-day draft saved/discarded; tracking survives tab
navigation and always saves to its original date. No API worker changed.
Both builds, 13 rendered and 39 focused tests pass, plus diff check. Six GPS tests
cover calculations, signal filtering, stationary fixes, manual-field preservation,
accumulation and JSON backup fields. External Chrome simulated tracking, hidden
pause, reload/resume, no pause bridging, finish guard, saving, journal and denial;
phone/tablet/desktop views visually inspected. User field-tested iPhone on a bike
ride and reported speed and distance broadly consistent with another rider's
measurements; accuracy judged sufficient (informal comparison, not calibration).
Permission prompts and wake-lock behavior remain unverified. Existing unrelated
TypeScript diagnostics remain; no GPS-module diagnostics. Commit `1d3c2e1`
deployed in successful Pages run `38051608683`; HTTPS verified exact release,
JS/CSS assets and service worker.

## Previous release — approved splash

Published `2026.10.10 0627`: implements approved mockup with original texture,
navy logo header, ivory Today card with resolved-workout terrain, four original
navigation icons and softly floating shadows on all five cards. Weather remains
opt-in; compact live condition/off label and collapsed Local weather settings
retain permission disclosure, attribution and disable. Date/workout are live.
What's new keeps five groups. No workout storage or backup changes.
Both builds, 13 rendered tests and diff check pass. External Chrome verified
all five destinations and card shadows, Today-only terrain, four icons, day override
updates, weather settings and release notes; desktop/tablet/phone screenshots
inspected. Approved mockup sources remain untracked in mockups/ for reference.
Commit `28701ee` deployed in successful Pages run `38045046854`; HTTPS
verified exact release, JS/CSS and service worker.

## Previous release — Today cosmetic refresh

Published `2026.10.10 0608`: Today matches Plan/Progress with navy hero, serif
workout title and live terrain thumbnail; warm ivory cards, orange accents,
clearer labels, balanced desktop action row and harmonized expanded controls.
Designly composition and visual QA applied. Same reusable terrain atlas; artwork
follows resolved day workout immediately. No logging handlers, storage or backup
schema changed. Both builds and 13 rendered tests pass, plus diff check.
External Chrome verified desktop/tablet/phone layouts, strength/recovery artwork
changes, main-workout controls and editable notes/body check-in. Rendered expanded
setup/logging and recovery views inspected. No built-in browser used.
Commit `7729852` deployed in successful Pages run `38044089049`; HTTPS
verified exact release, JS/CSS and service worker.

## Previous release — on-device Progress

Published `2026.10.10 0554`: replaces the old overview with illustrated training
balance in 4/12-week windows, latest matching completed workout pairs, and familiar
library add-ons last completed at least 14 days ago. Add to today preserves existing
setup/results and avoids duplicates; selected add-ons never count as completed.
Historical workout themes and activities keep comparisons separate. Completed
workout/recovery counts and supporting-work days are explicit; no API calls for
these features. Optional existing AI review remains collapsed below. Same Plan
terrain atlas, navy/ivory/orange, Designly composition and visual QA applied.
No storage or backup schema changes. Period choice survives journal navigation.
Both builds, 13 rendered tests and 33 focused tests pass, plus diff check.
External Chrome verified 4/12-week counts, comparison journals, duplicate-safe
add-on copy and persisted selection; historical fixtures unchanged. Rendered
phone/tablet/desktop, comparisons and revisit sections visually inspected.
Commit `0bad84f` deployed in successful Pages run `38043216302`; HTTPS
verified exact release, JS/CSS and service worker.

## Previous release — journal search

Published `2026.10.10 0534`: History has local search across workout titles,
activities, notes, add-ons, video titles and body check-ins, plus collapsed
historical workout-theme and inclusive date filters. Matching excerpts open the
journal; Back preserves search/filters. Clear restores normal calendars and
nutrition history. No new storage or backup schema; records unchanged.
Both builds, 13 rendered tests and 30 focused tests pass. Three search tests
cover matching, accents/multiple words, inclusive dates, distinct historical
strength themes, future exclusion, excerpts and source immutability. External
Chrome verified search/type/date filters, video-title matches, empty state,
clear, journal Back and unchanged source. Desktop/tablet/phone screenshots
visually inspected with no horizontal overflow. Commit `c2f133f` deployed in
successful Pages run `38042000678`; HTTPS verified exact release, JS/CSS and
service worker.

## Previous release — Adventure Journal

Published `2026.10.09 2318`: Plan stops on/before today and all History day links
open a scrollable journal, with Back/Edit, previous/next and date picker. Future
Plan stops still open the editor. Displays recorded metrics, notes, photos, selected
and completed add-ons, imported details/warnings, body check-in and nutrition
(including legacy fasting answers), plus embedded YouTube players and duplicate-safe
Add to today. Empty sections hidden. Directly reads existing records, so original
backup/restore schema is unchanged; no separate journal data. Read-only viewing
does not load/write historical records through the editor. Fixed getSession to
honor richer/newer localStorage fallback records, matching history merge behavior.
Three tests cover complete daily data, immutability, empty days, invalid
video links and richer/newer fallback record loading. External Chrome verified contents, dates, edit and video copying.
Both builds, 13 rendered tests and 27 focused tests pass, plus diff check.
Desktop/tablet/phone journal views and lower video section inspected in external
Chrome. Source unchanged after viewing and copying videos; editing loads the same
record. Commit `bf4f474` deployed in successful Pages run `38020228294`;
HTTPS verified the exact release, JS/CSS and service worker. Embedded frame rendering
tested with external video requests blocked in the fixture; real YouTube playback
is subject to the video’s embed permission, with Open video fallback available.

## Previous release — warm orange navigation

Published `2026.10.09 2202`: bottom menu matches mockup’s warm ivory surface,
orange active icon/label and underline, with readable SVG home/calendar/map/
history/chart/settings icons. Active destination exposes aria-current=page.
Six destinations and touch target sizes preserved. Both builds, 13 rendered
tests, 24 focused tests and diff check pass. External headless Chrome verified
all six destinations, orange active state, and inspected desktop/tablet/phone
views. No built-in browser used. Commit `b8dc3e4` deployed in successful
Pages run `38015581830`; HTTPS verified exact release, JS/CSS and service worker.

## Previous release — adventure Plan

Published `2026.10.09 2158`: Plan defaults to Adventure with persistent List switch.
Six reusable painted terrain tiles; the resolved historical/one-day workout key
selects terrain, including mountain for both strength themes, forest for endurance,
beach for recovery; custom types use meadow. Dates, Today and completion markers
are live code. Terrain sheet is precached for offline use; no image-generation API.
External headless Chrome checked desktop/tablet/iPhone layouts and verified a
strength-to-recovery override immediately changes Plan to beach. No built-in browser.
Both builds, 13 rendered tests, 24 focused tests and diff check pass.
Desktop, tablet and phone screenshots visually inspected; phone fits all seven
stops plus next-week action. List/Adventure switching verified. Commit `b071fef`
deployed in successful Pages run `38015267779`; HTTPS verified release, worker,
exact JS/CSS and terrain artwork. Artwork generated using built-in imagegen;
prompt: six equal 2×3 expedition-journal terrain tiles, mountain/downhill/river/
meadow/forest/beach, no text, consistent warm palette. Asset: public/adventure-terrain.png.

## Previous release — repeat prior workout

Published `2026.10.09 2059`: one collapsed Repeat a prior workout row between
setup and log, shown only when an earlier matching workout has reusable setup.
Uses historical key/theme matching. Reuses format, add-ons, videos and notes;
merges current setup without duplicates. Never copies results, completion, injury,
photos or screenshots, and preserves existing current entries. Copy uses normal
persistence. Three new tests cover source selection, field boundaries, source
immutability and repeated application. Both builds, 13 rendered tests, 22 focused
tests and git diff --check pass. Commit `7ddcd16` deployed successfully in
Pages run `38011435325`; HTTPS verified the exact release, worker and app assets.
Non-browser verification follows the user’s browser restriction; visual review
remains with Safari/Chrome.

## Previous release — copy prior workout notes

Published `2026.10.09 1936`: Log Workout → Note shows the latest earlier matching
workout with nonblank notes and its date. Copy fills empty notes; Append preserves
existing text. Repeated copies do not duplicate the same text. Matching uses resolved
historical workout key and theme, keeping Upper Body and Full-Body Strength distinct,
respecting overrides, custom types and dated schedule snapshots. Uses normal note
persistence and leaves source history untouched. Both builds, 13 rendered tests,
19 focused tests (including three new note-copy tests), and diff check pass.
Commit `478447e` deployed in successful Pages run `38005281604`. HTTPS
verified the release label, service worker and exact JS/CSS against the local build.
Non-browser verification follows the user’s browser restriction.

## Previous release — recent videos

Published `2026.10.09 1928` adds Add to today to Settings → Recent videos.
Reuses the existing saved-video flow and duplicate protection, copies only video
fields, preserves the source workout, and shows success/failure feedback.
Rapid repeated recent-video taps are serialized. Both builds, 13 rendered tests,
16 focused tests and git diff --check pass. A mocked execution of the actual
add handler verified field preservation, source-history preservation and duplicates.
Commit `9913e0e` deployed in successful Pages run `38004586139`; HTTPS verified
the exact release, service worker and both assets against the local build.
Non-browser verification follows the user’s browser restriction.

## Previous release — graphic spacing and optional weather

Published `2026.10.06 2229`: dedicated graphic column between text and arrow.
Optional Enable local weather asks device permission; rounded 0.1-degree coordinates
are sent to Open-Meteo, never stored. Preference `t4l:local-weather-enabled` persists;
conditions refresh every 30 minutes while Home is open. Failure keeps the decorative
sun with an explicit unavailable message. Attribution and disable control included.
User explicitly approved approximate-coordinate transmission to Open-Meteo and
publication. Weather requests bypass the service worker and HTTP cache. Both builds,
13 rendered tests and six weather/service-worker tests pass; other 10 focused tests passed earlier.
No workout storage or Plan changes. Non-browser verification under user restriction;
physical-device permission and appearance checks remain with user Safari/Chrome review.
Commit `590e190` deployed in successful Pages run `37562143238`; HTTPS verified
the exact release, service worker and both app assets against the local build.

## Previous release — centered splash graphics

Published `2026.10.06 2222`: centered destination graphics; Today uses a warm ivory/peach
highlight and orange icon, with dark readable labels, distinct from the navy banner.
No storage or Plan layout changed. Non-browser verification follows user restriction.
Both builds and 13 rendered-HTML tests pass. Commit `50545c1` deployed successfully
in Pages run `37561595710`; live release, service worker and both assets verified
against the local build. User visual review on Safari/Chrome remains the normal workflow.

## Previous release — Plan fit and splash styling

Published `2026.10.06 2217`: compact single-line Plan guidance and seven equal rows
within available portrait phone height; navy/orange Today card, larger splash
headings, gradient icons and subtle destination graphics. No storage logic changed.
Published at user request using non-browser verification under the updated browser
restriction. Physical iPhone layout confirmation belongs to user Safari/Chrome review.
Both builds and all 25 tests passed. Commit `ba4ddbf` deployed successfully in
Pages run `37561243699`; HTTPS verified both assets against the local build,
the exact live release and service-worker cache. No built-in-browser inspection.

## Previous release — iPhone optimization

Published `2026.10.06 2148`: full Plan guidance, larger navigation/Progress/Nutrition labels,
44px workout fields and history arrows, top safe-area padding. History arrows scroll
with the content to avoid covering dates when Safari reduces the available height.
Inspected all six destinations at 440×956 and shorter 440×780 browser viewport;
expanded workout data and Nutrition, checked Plan footer. Physical iPhone Safari/PWA,
keyboard and actual safe-area behavior remain unverified. Both builds and all 25 tests passed; final History positioning and spacing were visually rechecked.
Codex-safe preview configuration and README now disable HMR. No storage logic changed.
Commit `956f14d` deployed successfully in Pages run `37558841648`. HTTPS confirmed
the release, service worker and both assets exactly match the local build. Live
phone-width navigation checked all six destinations without horizontal overflow.

## Previous release

Published `2026.10.04 1602`: Nutrition is below the workout session, collapsed
by default using native details/summary. Fasting controls and history display
are removed. Legacy fast values remain in storage/backups for compatibility;
fast-only dates no longer appear in Nutrition History.
Food/cutoff Yes/No and notes remain, with Friday/Saturday flexibility. Separate
`t4l:nutrition` storage, immediate saves and backup/restore support are unchanged.
Today no longer repeats the weekly icon strip. Both builds and all 25 tests passed.
Commit `5eea50e` deployed in Pages run `37230649386`; HTTPS confirmed the
live release, app assets and service worker. No browser inspection. Previous release `2026.10.04 1558` introduced
nutrition (commit `a238415`, Pages run `37230334637`).

## Preview attempt

User authorized a limited Sites visual inspection October 3. Local Vite served
HTTP 200, but creating the in-app browser tab timed out after 32 seconds and
reset browser control. Server was stopped; no visual inspection completed.
Subsequent testing showed Vite HMR was a reproducible crash trigger, but later
native Codex Desktop crashes occurred even during ordinary development work, so
HMR is not considered the sole cause. Routine Codex built-in-browser inspection
is currently disabled. Use Safari or Chrome for normal visual inspection. If the
user explicitly requests built-in-browser inspection, use `npm run dev:codex`,
which runs Vite with HMR disabled.

## Verification and session constraints

- Both Pages and vinext builds pass. All 13 rendered-HTML tests, three focused
  insight tests, two service-worker tests, and two video-cleanup tests and five nutrition tests pass. `git diff --check` passes.
- TypeScript still has nine pre-existing diagnostics (exercise tuple inference,
  insight types, and Vite/Cloudflare environment declarations). Lint reports 1,832 errors and 10 warnings,
  including generated Pages output; do not describe either check as clean.
- The October 4 release was published using non-browser verification only,
  so visual behavior for that specific release was not verified at publication.
  Routine Codex built-in-browser inspection is currently disabled because of
  repeated native Codex Desktop crashes. Continue builds, tests, linting and other
  non-browser verification normally. The user will perform routine visual inspection
  in Safari or Chrome and may provide screenshots or observations for follow-up.
  If built-in-browser inspection is explicitly requested, use `npm run dev:codex`
  to keep Vite HMR disabled.
- No worker/API code changed; only GitHub Pages was deployed.
- Leave generated untracked `tsconfig.tsbuildinfo` out of product commits.

## Continuing work

- Preserve workout data and dated schedule history. Inspect Git state before editing.
- User grants standing permission to publish requested app changes to GitHub.
- User wants an early reminder to start a fresh chat using HANDOFF.md before
  conversation history becomes unwieldy. Keep this file concise and current.
- Remaining maintenance: resolve TypeScript/lint diagnostics. Routine visual
  verification should be performed by the user in Safari or Chrome; Codex should
  not automatically invoke its built-in browser. Installed iPhone icon/cache behavior
  has not been tested on a physical device.

## Product and design decisions to preserve

- An iPhone-friendly workout planner/logger for sustainable fitness. Prioritize
  clear next actions, compact readable screens, and easy logging over clutter.
- Current destinations: Home/splash, Today, Plan, History, Progress, Settings.
  Internally, `week` means Plan, `performance` means Progress, `more` means
  Settings. Old notes also use Week, Progress, Config, and More.
- Video workout guides are retired. Preserve video playback and saved video details.
- Use Plan’s left-edge accents as the template for Today, History and Settings.
- Deep blue/navy is the main brand color across all tabs. Use muted orange as a
  small accent, especially the T4L swoosh. Preserve status meanings of green,
  yellow, and red. The splash must feel consistent with the rest of the app.
- Splash uses `public/splash-training-texture.jpg`, floating glass-style buttons,
  and the T4L mark. Keep the logo legible against blue.
- Banner tagline is two lines: "Move well, daily." and "Relentless forward progress."
- The Home Today button displays the resolved workout and a short cue, including
  one-day overrides and an activity when selected. Keep Home and Today in sync.
- What's New groups the **five** most recent releases by dated label.
- Provide generous touch targets, descriptive icons, full-width readable notes,
  and sensible collapsed sections. Inspect alignment and bottom-navigation
  clearance on actual rendered phone layouts.
- Keep historical workouts stable when weekly mapping changes. Distinguish a
  one-day override from the recurring weekly schedule. Only the actual current
  week should be labeled This Week when browsing History.
- Workout data, notes, photos, injuries, mobility selections/completions, videos,
  goals and backups matter. Preserve persistence and restore compatibility.
- Performance advice should be concise and actionable, with category-specific
  keep/increase/decrease guidance. Do not generalize one injury across unrelated
  exercise categories or recommend decreases without supporting evidence.
- Selected mobility/add-on exercise cards include Start timer links to the
  separate speaking-timer app, defaulting to 60 seconds and one round/autostart.

## Recovering a specific older decision

The original transcript remains at
`~/.codex/sessions/2026/08/20/rollout-2026-08-20T21-34-58-01a021f4-fb03-7370-8f94-16cabe850cf7.jsonl`.
It is approximately 385 MB, contains images/tool output, and has 33 compaction
records. Do not load or paste the entire transcript into a new chat. If needed,
stream-parse JSONL, select `response_item` records with role `user` or `assistant`,
and extract only `input_text`/`output_text`/`text` content relevant to the question.
Keep tool arguments, image payloads, credentials, and unrelated personal data
out of handoff documents. Specific older attachments may need separate recovery;
the app's current code and public assets are already in this project.
