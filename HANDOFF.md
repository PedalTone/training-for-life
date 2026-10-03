# Training for Life — development handoff

Updated October 3, 2026. Read README.md, VERSIONING.md and AGENTS.md first.

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

## Current release

Published `2026.10.03 1512`: removes the blue glow that washed out the Home
title. An orange radial glow occupies only the bottom-right 42% width / 55%
height of the brand panel, pulsing gently in place while Home is mounted.
Reduce Motion shows a static glow. No layout, storage, or API changes.
Both builds and all 20 tests passed. Commit `46c731b` deployed in Pages run
`37147093127`; HTTPS verified the release and matching app/service-worker assets.
Browser QA remains unavailable after timeout.

Previous release `2026.10.03 1507`: commit `f656825`, run `37146805222`.
User liked the orange glow but found the blue sweep reduced title contrast.
Release `2026.10.03 1500` fills available phone height in Plan. Release
`2026.10.03 1444` added button feedback and completion checkmark motion.
Completion feedback is transient, triggered after successful Finish + Backup.

## Preview attempt

User authorized a limited Sites visual inspection October 3. Local Vite served
HTTP 200, but creating the in-app browser tab timed out after 32 seconds and
reset browser control. Server was stopped; no visual inspection completed.
Do not retry without evidence of recovery. Use supplied screenshots and
non-browser checks for now; the failed attempt does not prove the app crashed.

## Verification and session constraints

- Both Pages and vinext builds pass. All 13 rendered-HTML tests, three focused
  insight tests, two service-worker tests, and two video-cleanup tests pass. `git diff --check` passes.
- TypeScript still has nine pre-existing diagnostics (exercise tuple inference,
  insight types, and Vite/Cloudflare environment declarations). Lint reports 1,832 errors and 10 warnings,
  including generated Pages output; do not describe either check as clean.
- User explicitly requested publication using non-browser verification only,
  overriding the usual visual-release check for this release. No browser,
  computer-use tools, screenshots, visualizations, or automated visual layout
  checks may be used this session. Visual behavior remains unverified.
- No worker/API code changed; only GitHub Pages was deployed.
- Leave generated untracked `tsconfig.tsbuildinfo` out of product commits.

## Continuing work

- Preserve workout data and dated schedule history. Inspect Git state before editing.
- User grants standing permission to publish requested app changes to GitHub.
- User wants an early reminder to start a fresh chat using HANDOFF.md before
  conversation history becomes unwieldy. Keep this file concise and current.
- Remaining maintenance: resolve TypeScript/lint diagnostics; visual verification
  in a later session where permitted. Installed iPhone icon/cache behavior has
  not been tested on a physical device.

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
