# Training for Life — development handoff

Updated October 6, 2026. Read README.md, VERSIONING.md and AGENTS.md first.

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

## Current release — graphic spacing and optional weather

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
