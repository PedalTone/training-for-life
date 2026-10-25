# Training for Life

An iPhone-friendly fitness planner and workout log, with a Home screen, Today,
Plan, History, Progress, and Settings. The app supports recurring schedules,
one-day changes, mobility exercises, videos, photos, backup/restore, local screenshot attachments, GPS route maps and social share images. Plan uses This week/Next week underline tabs. This week has a seven-day selector, one featured workout picture and a compact overview. Next week contains Monday–Sunday workout mapping; changes save automatically from next Monday and repeat weekly, retaining this week and logged workouts. Dated mappings are included in backups; older backups remain supported. Yoga, Pilates, Swimming, Pickleball, Tennis and Basketball are available in weekly mapping and one-day changes, with matching artwork on Home, Today, Plan and the journal. Today uses Workout, Log and Check-ins tabs. Nutrition is in Check-ins, with quick Yes/No answers,
with notes via typing or the phone keyboard’s dictation.

## Continue development

Read `AGENTS.md`, `HANDOFF.md`, `VERSIONING.md`, and `TESTING_CHECKLIST.md` first.
Inspect `git status` before editing: this folder can contain unfinished work.
Keep the handoff updated after substantial changes.
The [Designly design standards report](DESIGN_STANDARDS.md) defines the visual
system, interaction rules and D01–D12 feature acceptance matrix. Apply it with
the pre-ship checklist; record visual evidence separately from automated checks.
Review DESIGN_STANDARDS.md for every app change, including functional fixes, data/storage changes, refactors, dependencies, documentation and deployment changes.

- Project folder: `/Users/thomasmorris/Documents/ChatGPT/Fitness Plan/source-recovered-2026-10-23`
- GitHub: https://github.com/PedalTone/training-for-life
- Public frontend: https://pedaltone.github.io/training-for-life/app/
- Separate API service: https://training-4-life.tommy-tritone.chatgpt.site

## Architecture and files

React 19 + TypeScript, with a Vite static frontend and a vinext/Cloudflare worker
build for server features. Node must be at least 22.13.0; CI uses Node 22.

| File | Responsibility |
| --- | --- |
| `app/page.tsx` | Main client UI, state, scheduling, persistence and backups |
| `app/globals.css` | Responsive styles and design system |
| `app/screenshot-attachments.tsx` | Local screenshot images, viewing and removal |
| `src/main.tsx`, `index.html` | GitHub Pages entry and service-worker registration |
| `vite.github.config.ts` | Static build, base `/training-for-life/app/` |
| `scripts/write-github-pages-root.mjs` | Redirect from repository root to `/app/` |
| `app/layout.tsx`, `vite.config.ts` | vinext layout, metadata and server build |
| `worker/index.ts` | API routes and server entry |
| `worker/training-insights.ts` | Retired frontend API; kept for compatibility |
| `worker/workout-screenshot.ts` | Retired frontend API; kept for compatibility |
| `worker/workout-guide.ts` | Legacy API implementation; current frontend no longer calls it |
| `app/transcript-exercises.ts`, `app/data/kettlebell-transcript-lexicon.json` | Local exercise recognition from the supplied kettlebell lexicon |
| `worker/video-captions.ts` | On-demand automatic captions, validation, bounded retrieval and caching |
| `public/` | Brand artwork, texture, exercise illustrations, icons, PWA files |
| `.github/workflows/deploy-pages.yml` | Builds and publishes GitHub Pages |

Workout sessions are stored in browser IndexedDB (`training-for-life`, store
`sessions`) with a localStorage fallback. Settings, library, goals, insight
reports and schedule snapshots use `t4l:` localStorage keys. Data is tied to the
browser/origin; local preview data is separate from live iPhone data. Preserve
storage names and migrations. Backup/restore exports/imports JSON. Do not erase
storage to solve a deployment or cache issue. Nutrition is saved separately in
`t4l:nutrition`, keyed by calendar date, and included in backup exports. Restore
merges nutrition dates; older backups leave existing check-ins untouched.
Nutrition does not alter workout completion or streaks.

The public frontend calls the separate Sites service only for on-demand video captions; it no longer calls AI extraction or training assessment. The obsolete Saved training reports section is removed from Progress. Legacy report data, extracted screenshot details and goals are retained in storage and backups. Local screenshot attachments are compressed images, up to six per workout, included in History and backups; they never update metrics automatically.
The service uses server-side `OPENAI_API_KEY` and `INSIGHTS_ACCESS_CODE`; never
put their values in documentation or client code. Existing credential setup is
separate from this chat migration. Inspect applicable API/hosting instructions
before changing that infrastructure.

## Run and verify

Install dependencies with `npm ci` when needed.

For a preview matching the deployed static frontend:

```sh
npm run dev:codex
```

Open `http://127.0.0.1:5174/training-for-life/app/`.
This preview disables HMR for the Codex built-in browser and does not provide the worker API routes. For the vinext/server path,
use `npm run dev` and the URL printed by the command.

Primary checks:

```sh
npm run build:pages
npm test
git diff --check
```

`npm run build:pages` writes `gh-pages-dist/` (app under `app/`).
`npm test` runs the design-documentation integration checks, vinext build and
`tests/rendered-html.test.mjs`; it does not
include every test file. On a Node version supporting TypeScript stripping,
additional focused tests can be run with:

```sh
node --experimental-strip-types --test tests/insight-validation.test.mjs tests/training-insights.test.mjs tests/service-worker.test.mjs tests/video-cleanup.test.mjs tests/nutrition.test.mjs
```

`npm run lint` and `npx tsc --noEmit` are additional diagnostics. Earlier runs
failed; see HANDOFF.md and investigate current output before claiming they pass.
Inspect the rendered app at iPhone sizes, including safe areas, and walk through
changed interactions. Tablet and desktop visual testing is not required. Automated assertions alone do not verify layout quality.

## Publish requested frontend changes

The configured remote is named `github`. Pushing a tested commit to its `main`
branch triggers `.github/workflows/deploy-pages.yml`. Confirm the exact diff,
commit only intended files, and follow the release rules in AGENTS.md.

```sh
git push github main
gh run list --repo PedalTone/training-for-life --workflow deploy-pages.yml --limit 3
```

Verify the successful workflow corresponds to the intended commit, then verify
the live app release and service-worker cache identifier. A local version change
is not proof of deployment. Installed iPhone behavior also requires checking
cache refresh and icon references.

The GitHub workflow only deploys the static frontend. Worker/API changes require
a separate Sites deployment using the applicable Sites hosting workflow. Do not
assume a GitHub push updates the API service.

Public release labels use `YYYY.MM.DD HHmm` in America/New_York. Documentation
updates alone do not create a new public release. See HANDOFF.md for the current
local candidate versus the last verified deployment.

## Optional local weather

Home’s Enable local weather control requests device location permission and sends
coordinates rounded to 0.1 degrees to Open-Meteo for current model conditions. No
coordinates are stored. The opt-in preference persists separately; turn it off on Home.
Conditions refresh every 30 minutes while Home is open. Errors show an explicit
unavailable message with a decorative sun. Weather does not change workout plans.

## iPhone GPS workouts

Today’s Workout tab has a prominent cream GPS feature card with a navy runner,
bicycle and route graphic. The whole card opens setup; it does not start GPS.
The launcher shows ready, recording/waiting, paused and saved-recording states.

Today → Workout → Track my run / walk / bike uses foreground browser geolocation with explicit
permission. Select Run/Walk/Bike and miles/kilometers, then the green Play/Start timer button. Light orange Pause and green Resume
exclude paused time and never joins missing route segments. Red Stop & save
adds a GPS summary and segmented route map to the dated session; Finish + Backup then backs it up normally.
Each saved recording has a pencil Edit control for Run/Walk/Bike, distance and duration.
Changing activity preserves exact raw measurements, route and start/end times;
pace/speed, auto-filled daily totals and sharing follow the correction. Activity
can also change while paused. Finished workouts require Edit workout first.
Recording another prepares a new timer; tap Start to begin. Edits and place-label
updates serialize so late lookup results cannot overwrite a correction.
Existing manual details remain; blank totals are filled and GPS-owned totals can
accumulate multiple recordings. Journal shows each recording’s time, distance,
average/maximum speed, start/end and detected gaps. GPS coordinates are stored locally, included in backups, and excluded from AI requests. A local route draft recovers paused after reload.

Maps use OpenStreetMap tiles with visible attribution and normal browser caching.
Photon reverse geocoding names up to eight sampled route points once when saving;
place names are cached locally. Both services receive location information and
may be unavailable. The live/paused tracker omits city/state overlays and label
editing so the map stays clear. Labels appear after Stop & save and can be edited
in Today or the journal to include missed crossings. Old totals-only recordings
remain intact and cannot gain a route retroactively.

Keep the app visible: hidden pages automatically pause. Screen Wake Lock is
requested where available, but lock-screen/background recording is not supported
by this web app. GPS accuracy and iPhone screen-awake behavior need physical-device
verification. Auto-pause is enabled by default, with a local opt-out stored in
`t4l:gps-auto-pause`. Four seconds of fresh reliable GPS at ≤0.5 m/s pauses the
clock while keeping the watch alive. Movement at ≥0.9 m/s plus real displacement
resumes into a separate route segment. Poor/stale GPS breaks the stop countdown;
it never pauses/resumes on missing signal alone. Auto-paused time/distance are
excluded; manual Pause and app hiding stop the watch and require explicit Resume.
Reload recovers paused rather than starting GPS automatically. Tracking estimates,
foreground/privacy and map-provider notes live in Settings → About.

## Share workout images

Open a completed Today workout or a recorded workout in History and choose Share workout. Photo, Route and Workout Card templates use only recorded metrics. Export Story (1080×1920), Portrait (1080×1350) or Square (1080×1080) PNGs with one Share Image button: native file sharing when available, automatic image download otherwise. Format choices identify Instagram and TikTok’s shared 1080×1920 vertical size. Photos chosen in the composer are temporary; workout records remain unchanged. Route images include OpenStreetMap street tiles, start/finish markers and attribution, show the full route by default, with optional hiding of 200 meters around each segment endpoint, and include the saved city/state label by default (editable in the composer for crossings). Notes, injury/body check-ins and nutrition are excluded. Rendering happens locally; Route preview requests the visible map tiles from OpenStreetMap using normal browser caching. The composer makes no geocoding requests and offers retry if map loading fails.

Share titles can be edited in the composer; they affect only the exported image, with the recorded title used if left blank. Settings no longer shows AI access or assessment goals. About describes current tracking, sharing, screenshot, map/video, storage and backup behavior.

Share previews retain their dimensions while text edits render. Story Workout Cards use a larger illustration and a grouped title/date/metrics block; Photo and Route templates retain their full-image/map layouts.

GPS Run tracking uses current and average min/mi pace (min/km with kilometers); Bike uses mph or km/h. Journals and shared images use the same activity-specific metrics. Mixed days derive run pace and bike speed independently.

Average running pace displays inline as “Avg Pace: 15:32 min/mile” in tracking, journal details and share images.

Share cards group artwork, title/date and stats, give Avg Pace a full-width line, format recorded duration as readable hours/minutes and include the approved T4L mark. On phones, the compact preview/title remain visible while options scroll.

Sharing previews can be enlarged with View full-size preview; Back to editing preserves every choice. Phone editing previews are larger, and full-size mode uses the available width.

Share images support an optional movable text box with Modern, Classic or Typewriter font and adjustable size. Drag it in the preview/full-size view; arrow keys also move it. Text is baked into the export and does not change saved workout data.

Custom sharing text has a transparent background with a subtle text shadow. The outline and Drag text label are editing guides and never appear in exports.

Full-size sharing previews show the finished image without text positioning guides. Use Back to editing to move text.

Workout logs support up to six compressed photos, selected together or added later, with individual removal. Existing single photos remain available. History and backups include the full gallery. GPS discard controls are separate from Resume behind Discard options.

Completed workouts are read-only until Edit is chosen on Today or the journal. Completion stays recorded during editing; Save changes + Backup locks again. Reloading also returns completed workouts to read-only mode. Photos, notes, add-ons, media, tracking and check-ins follow this lock; viewing and sharing remain available.

History uses a 12-week scrolling timeline with Earlier/Later arrows moving three weeks at a time and loading older periods at the edges. Back to this week returns to the current week. Browsing position is preserved when opening a journal and returning. Subtle workout icon colors help reveal training patterns; completion checks remain green and body-note flags remain red. Search and Body notes only remain inside Filters; Nutrition follows the timeline.

Progress shows ranked bars on a shared 0–100% scale for completed days in the selected 4/8/12-week period, including explicitly labeled recorded recovery. The six core workout types and previously recorded additional/custom types stay visible at zero. Percentages use one decimal when needed and category colors match History. Most frequent/not recorded observations describe records without prescribing equal shares. Completed add-ons are expandable, sorted most to least and counted separately from the mix. Legacy completedAt records count consistently with History; planned/unfinished days and uncompleted selections do not count.

## Video-to-plan workflow

Settings → Future workout videos has one primary **Add video & get transcript**
action. It saves the video immediately and submits its canonical YouTube address
to **https://youtubetotranscript.com/** using that site's public POST form
(`/transcript`, `youtube_url`), opening a separate browser tab. Metadata enriches
in the background; failed metadata lookup never prevents adding the video.
Existing videos with a valid plan are recognized instead of duplicated/rebuilt.
**Save video only** is available as a quiet alternative.

Copy the transcript on the free site, return to the app and tap **Paste & build**.
Clipboard reading occurs only on that tap. If unavailable/denied, one text box and
**Build plan** appear. Review the compact exercise list, expand movements to edit,
then **Save plan**. Add/Delete card actions stay hidden until save/cancel. A
persistent **✓ Plan ready · N exercises** badge reflects the actual saved plan
before opening any disclosure, including after reload. Blank future weights and
prior workout snapshots remain independent.

The most recent Settings draft (up to 300,000 transcript characters; 750,000
serialized characters) resumes via a separate sessionStorage record. Drafts are
not saved blueprints and do not appear as Plan ready. Today/session editors do not
load Settings drafts. Saving/canceling clears only that video's matching temporary
record. The category filter is one compact selector; category editing is collapsed.

File import, manual creation and **Try automatic transcript** remain under
**Other options**. Imported text builds the review directly. Automatic requests
still use only the exact recommended website, with no silent source substitution.
The exact website currently blocks automated retrieval with HTTP 403; a browser
handoff passes the address, but the site still controls access and transcript
copying. No cross-site automatic return or successful live transcript extraction
is claimed. No alternate service, account or API key is used by this workflow.

## Video plans and set logging

Successful full captions are cached separately on this device (up to five videos,
300,000 characters total); this cache is not included in workout backups. The
server also attempts a seven-day edge cache; an unavailable Cache API does not
prevent retrieval. Some videos lack English captions or temporarily block access.
Other options includes `.txt`/`.vtt`/`.srt` transcript and version-1 JSON plan
import. The computer helper remains downloadable as documented below.

Draft processing is local, uses explicit exercise/volume cues and requires
review; it is not an AI interpretation of the complete video. The supplied
94-entry kettlebell lexicon is stored intact in
`app/data/kettlebell-transcript-lexicon.json`. Its exercise names/aliases recognize
abbreviations such as RDL/TGU and preserve distinct variations, side, loading and
position. Long compound names stay one movement; ordinary phrases such as
“good morning” need exercise context. Position, technique, style and programming
terms become review notes rather than extra exercises. EMOM/AMRAP block durations
do not become individual work/rest/set targets. Explicit per-side reps/time are
retained without multiplying counts. Generic presses stay unspecified in
technique; named complexes do not imply a default rep scheme. Weights stay blank.
Existing saved workouts/results are not renamed or migrated. Unknown movements
can be added manually, unknown set counts stay labeled, and circuit instructions
are retained in notes without silently expanding rounds. Source cue excerpts
are retained with exercises; full captions are not stored in workout backups.

Save reusable plan creates/updates the video blueprint in the library. Adding a
video to Today or repeating a prior workout copies the blueprint without old
weights, warm-up flags or completion. In Today → Workout → Workout videos →
Workout plan, enter each set’s weight/unit/load and actual reps/time. Marking a
set complete uses a specified exact rep/time target only when actual values are
blank; shorter entered results are preserved. Ranges/unknown reps are not turned
into exact counts. Warm-ups stay recorded but are excluded from comparisons.
Recorded set rows cannot be dropped when saving a replacement plan. Completed
workouts respect the existing Edit lock. Library edits do not rewrite older
workout snapshots. Optional fields `Video.trainingPlan` and `trainingResults`
are included in existing schema-1 backups; old backups remain compatible.

Progress → Recorded strength sets compares the best completed non-warm-up set
per day at the same exercise, unit and load setup: reps at the same weight, or
changed weight at the same reps, within the selected period. Numeric actual reps are required. Results are descriptive;
no estimated max or automatically prescribed load is generated. History shows
read-only plans/results and links to the normal Edit workout flow.

The optional [caption fallback](public/video-caption-fallback.py) runs on a
computer, only after the primary site returns empty. It requires an existing
`yt-dlp` installation, prefers uploader English captions, otherwise selects one
English auto-caption track, never downloads media or reads browser cookies, and
reuses `caption-cache/<video-id>.txt`. No automatic retry loop is used.

```sh
python3 public/video-caption-fallback.py 'https://www.youtube.com/watch?v=VIDEO_ID' --site-empty
python3 public/video-caption-fallback.py --captions /path/to/captions.vtt
python3 tests/video-caption-fallback.test.py
```

Prepared JSON plans (including plans authored here from a transcript) use this
shape. All exercise/set IDs must be unique. Weight/results are excluded:

```json
{"version":1,"source":"transcript","reviewedAt":"","notes":"Coach's circuit instructions",
 "exercises":[{"id":"exercise-1","name":"Goblet squat","setsSpecified":true,
 "evidence":"Coach explicitly says one set of ten reps, then twenty seconds rest.",
 "sets":[{"id":"set-1","reps":"10","work":"","rest":"20 sec"}]}]}
```

Import remains a draft until the user reviews and saves it. Limits: 60 exercises,
20 rows per exercise, 500 rows total; transcript text 300,000 characters, files 1 MB.

## Grok Bot assessments

Progress has one quiet **Training Assessment** link below its period choices, before the training mix. It appears in Progress only; Plan has no assessment shortcut. Weekly mapping is now in Plan → Next week.
It opens the private Google Drive Assessments folder in a new tab/window. Read the
report in Google Drive, then return to the app to plan the week. There is no file
picker, in-app report reader, unread badge, metadata polling or report storage.
Opening the assessment card in Progress removes only the former reader’s three assessment cache keys;
workout history, schedule, legacy insight reports and backups remain unchanged.

The Sunday transfer automation still updates Grok-created latest-workout.json
(ID 1oAFMw065E5ibpWtd5VJRw2tK1DWJwy3C) at 6 p.m. Eastern and copies the newest
assessment to the previously specified local folder at 8 p.m. It no longer
publishes assessment metadata or changes app source. The app always links to the
same Assessments folder and does not need a weekly release.

Saved run/bike recordings can be deleted inside their Edit panel after confirmation. Automatic tracked totals update; other recordings, manual totals and workout notes remain. Completed workouts must first be unlocked with Edit workout.

After Stop & save, GPS tracking shows saved summaries with Edit and average pace/speed, without duplicate live metrics or setup controls. Record another workout restores setup and a separate Start button; saved intervals stay visible.

Today and the journal share one prominent navy Share workout action with a share icon and original Instagram/TikTok logo assets instead of a subtitle. It opens the existing local image composer; it does not post directly to social accounts.

GPS auto-resume accumulates small walking steps across a fresh, short GPS window, even after a long stop and when native speed is missing or stuck at zero. Progressive displacement is required; stationary time and the resume bridge remain excluded. Manual/background pause still requires Resume.


Walk is available as a GPS tracker activity alongside Run and Bike. Run and Walk use pace; Bike uses speed in tracking, saved recordings, journal and sharing. This does not add a new Plan/Progress workout category or reclassify past workouts.

Today lists the full add-on library, including custom exercises; nothing is selected merely by displaying it. Video session logs have Add set per exercise and Add exercise for manual logging without captions/a prebuilt plan. These additions belong to the dated workout and leave reusable video templates unchanged. New set results start blank, existing result IDs persist, and finished workouts require Edit before adding rows.

Completed video exercise sets have Repeat set. It appends a new set with the chosen set’s recorded weight, units, load type, reps/time and warm-up status; completion starts unchecked. The original set and reusable video template stay intact. Repeat works on earlier sets as well as the most recent set, within existing set limits.

In a dated video workout, expand an exercise and choose **Remove from today**
when skipping it. Confirmation removes that exercise and any logged sets from
that day only. Other results and the reusable Settings plan stay unchanged;
finished workouts require Edit first.

Each dated workout video has a **Video completed** checkbox, even without a
plan. The journal and backups retain the explicit status. Playback alone does
not complete it; adding/repeating a video starts unchecked. Finished workouts
require Edit to change the status.

Today add-ons move into the selected group at the top immediately; selection and Mark done remain separate actions.

Today → Log starts with Perceived effort (Easy, Medium, Hard), followed by
notes and attachments. Manual duration/distance/extra metrics inputs are removed;
previously recorded values and GPS recording remain available in saved records.

Check-ins includes a separate non-injury Illness check-in: Sick / unwell, an
optional note and Rested instead of working out. Save rest day + Backup records
that decision without completing a workout. History flags, journal and backups
retain the illness; sick rest days are excluded from the completed training mix.

Tracker **Full screen** shows the map above live metrics and tracking controls.
**Exit full screen** returns without restarting tracking. Stop & save bounds stalled
device storage and uses the existing fallback; failed saves keep a retryable draft.

GPS save protection: session writes run in order, and queued autosaves recheck that their editor snapshot is current. GPS sessions are also mirrored to the existing localStorage fallback when available. Stop keeps a separate last-save recovery receipt until a later load confirms the recording exists; if absent, the tracker restores paused totals with the same recording ID for retry. This protects future saves and any receipt retained by this release; it cannot reconstruct data already absent from all iPhone storage.
