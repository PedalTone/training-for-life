# Training for Life — Design standards and regression report

Maintained with Designly direction. Established October 18, 2026.
Applies to the iPhone app and exported workout images. Read with
[project instructions](AGENTS.md), [product documentation](README.md), and the
[pre-ship checklist](TESTING_CHECKLIST.md). Latest explicit user decisions take
precedence; update this report when an approved design decision changes.

## Purpose and authority

Review DESIGN_STANDARDS.md for every app change, including functional fixes, data/storage changes, refactors, dependencies, documentation and deployment changes.
The review is mandatory even when visual checks are N/A. Assess affected
interaction/data-state rules; record why any matrix row does not apply.

**Relentless forward progress:** make taking action easy, recognize small efforts,
and make the saved record trustworthy. A short stretch or a shorter workout is
still useful. Do not imply that equal category percentages or maximum duration
are automatically the goal. Report recorded progress without inventing targets.

This is a durable standard, not a claim that every existing screen passes it.
It combines approved user decisions, observed implementation, and future design
acceptance criteria. Existing CSS is evidence, not proof of compliance. Legacy
styles, undersized controls, and unused components must not become precedents.
No app layout or data is changed by this report.

Designly disciplines used: direction, composition, typography, brand fidelity,
and visual QA. Apply them to usable app screens rather than imposing advertising
poster grids, decorative effects, or arbitrary numerical creative scores.

## Brand and visual system

Use warm, calm utility: deep navy structure, cream surfaces, subtle texture,
painted workout illustrations, and small burnt-orange accents. Avoid competing
card treatments, excessive borders, gradients, badges, and equal emphasis on
three or more actions. Each task region has one primary action; a running timer
may need Pause and Stop simultaneously. Group related fields and their feedback.

### Palette

These are the current approved visual roles, drawn from the effective component
styles and `app/history-timeline.ts`, not the older green/red root defaults.
Check the CSS cascade and computed style before changing a shared color.

| Role | Reference | Use |
| --- | --- | --- |
| Navy | `#203449` | Text, navigation structure, primary utility actions |
| Cream | `#fffaf2` | Cards and reading surfaces |
| Warm secondary | `#f3ecdf` / `#f1e4d3` | Quiet grouping and selected backgrounds |
| Secondary text | `#596875` | Descriptions with verified contrast |
| Divider | `#d9d1c5` | Gentle separation, never the only state cue |
| Burnt orange | `#b94b17` | Active underlines and small brand accents |
| Start green | `#386047` | Play / Start / Resume with cream text |
| Pause amber | `#f4ae55` | Pause with navy text; distinct from Stop |
| Stop red | `#a93832` | Stop & save with cream text |
| Complete green | `#548160` | Completion check, independent of workout type |
| Body-note red | `#b3332b` | Flag in every body-note representation |

Workout type colors remain consistent between History and Progress:
Strength `#a34e24`, Mobility `#287c80`, Easy aerobic `#315f9e`, Speed `#77587c`,
Endurance `#526d91`, Recovery `#6d777e`. Yoga/Pilates inherit Mobility; Swimming
inherits aerobic; unassigned additional types use the established navy fallback.
Type color does not indicate completion, injury, failure, or prescribed balance.

### Typography, spacing and surfaces

- Use Georgia/established serif headings and the system sans family for controls,
  labels, data and prose. Preserve the approved T4L mark and tagline: “Move well,
  daily.” / “Relentless forward progress.” Never redraw or distort the logo.
- Target 16–18 CSS px for reading text and editable inputs; 16 px or larger inputs
  help avoid unwanted iPhone focus zoom. Metadata may be smaller when readable;
  essential actions and instructions must not become tiny to make a row fit.
- Use about 1.4–1.6 line-height for prose. Allow natural wrapping, long dictated
  notes, long activity names, large totals and validation text. Do not truncate
  information needed to act. Keep units next to their values.
- Reuse neighboring component spacing and radii. A 4 px spacing rhythm with
  roughly 8–12 px within groups and 16–24 px between groups is a working guide,
  not a requirement to rewrite approved layouts. Use comfortable cream padding
  behind text; the textured background must not compete with it.
- Keep navy left-edge card accents consistent where that pattern is used.
  Disclosures, fields, lists and hero cards have different jobs; do not wrap every
  nested region in another heavy card. Separate neighboring pictures visibly.

## Artwork and icons

Preserve the current painted texture, warm light, cream/navy/blue/orange family,
and believable settings across Home, Today, Plan, journal and sharing. Resolve
artwork from the actual dated workout type consistently across these surfaces.
Do not stretch images or clip the activity that makes them recognizable.

Strength and Mobility are indoors. Strength uses a person holding a realistic
kettlebell, with a coherent handle opening, body and hand contact; dumbbells may
be background equipment. Mobility must read as stretching. Speed is running on
a track, not fast cycling. Yoga, Pilates, Swimming, Pickleball, Tennis and
Basketball retain the same illustration family when selected in future weeks.
Home artwork must have meaningful width, not shrink into a tiny thumbnail or
make the initial screen excessively tall.

Keep people secondary to the activity: distance, back/three-quarter views and
natural pose can de-emphasize gender. Retain inclusive representation across
categories, including the approved woman in Easy Aerobic; avoid stereotypes or
changing the requested activity to achieve representation.

Use consistent SVG icon weight and optical scale, not platform-dependent emoji
as the primary workout vocabulary. Strength must be an obvious dumbbell or
realistic kettlebell; Mobility a recognizable seated stretch; Speed a runner
with motion marks; Endurance the established stopwatch rather than an ambiguous
winding path; Recovery a moon. Provide labels/key where meaning needs help.
Settings icons match the clean Home icons. Future workout videos retain a
recognizable red play treatment. Green checks and red flags remain separate
from the workout pictogram and appear consistently in legends and lists.

## Navigation and task hierarchy

Keep Home, Today, Plan, History, Progress and Settings labels consistent. Bottom
navigation needs readable labels, a visible selected state, and room above the
home indicator. Internal views use the approved underline-tab language, matching
Today/Progress; selection needs more than color alone. Body notes is a filter
inside Filters, not a competing History tab. Swipe navigation supplements taps
and must not hijack text selection, map gestures, dragging, fields or scrolling.

Use progressive disclosure for optional detail. Do not hide main capabilities
such as GPS tracking in a visually weak submenu. Keep labels concrete and short;
remove duplicate copy. Put background limitations in Settings → About while
keeping actionable errors and live status close to the relevant control.

## Duplicate functions and buttons

Review duplicate functions and buttons for every app change.
Search the affected feature and neighboring entry points for duplicate handlers,
overlapping components and repeated actions or status blocks. Render new/edit/
saving/saved/locked/failure states to catch duplicates that only appear together
in a specific state. One task context should have one clear action for a given
result; equivalent behavior should share a function/component where practical.
The same action on separate screens, per-record Edit controls and deliberate
accessibility/navigation affordances are legitimate when they serve distinct
contexts. Document exceptions and preserve existing save/data/lock semantics.
Record the review findings and any consolidation in the signoff. Static text
matching cannot decide whether two functions are semantically equivalent.

## Interaction and data truth

A tap must produce immediate, honest feedback. Distinguish ready, active, paused,
auto-paused, saving, saved, failed and locked states. Never show success until
persistence succeeds. Disable duplicate submissions while saving and provide a
retry without destroying input after failure. Avoid rerender-driven focus loss,
scroll jumps and layout changes during typing.

Today has one saved/locked banner and Edit action above its internal tabs;
do not duplicate saved status or Edit in the footer. The finished footer keeps
Share workout. Completed workouts stay locked until Edit is explicitly chosen; saving edits or
reloading locks again. Viewing and sharing remain available. Journal Edit workout
is prominent and directly above Share workout. The shared Today/journal Share
workout action uses a navy surface, share icon and original Instagram/TikTok logo assets to the right of the label on the same row,
replacing the subtitle; it opens the image composer and must not imply direct
posting or an account connection. Deletion has a separate destructive
region: Delete recording → explanation → **Yes, delete** / **Keep recording**.
Cancel leaves data intact; deletion removes only the selected record and updates
GPS-owned totals. Preserve manual fields, other recordings, notes and backups;
late map enrichment must never recreate a deleted record.

Privacy must reflect user choice: Route sharing includes the route by default;
optional endpoint hiding is explicit. Notes, body check-ins and nutrition stay out
of share images. Do not reintroduce obsolete API-key or AI-access controls.
Preserve historical schedule snapshots, old backup compatibility and browser
storage; a visual cleanup must not silently migrate or erase data.

## Feature acceptance matrix

For every change, mark each row **PASS**, **FAIL**, or **N/A with reason**.
Check affected rows and their adjacent entry/exit flows. Before public release,
walk the complete Home → Today → Plan → History → Progress → Settings journey.

| ID | Surface | Required design and behavior | Regression evidence |
| --- | --- | --- | --- |
| D01 | Home / opening | Resolved workout and matching artwork; legible logo/tagline; comfortable first iPhone view; navigation reachable; ten dated categorized What’s New groups | Phone screenshot, open/close notes, destination taps |
| D02 | Today | Workout / Log / Check-ins stay clear; Repeat prior workout first; prominent GPS before Add-ons; optional add-on artwork; full add-on library visible and unselected until chosen; one visible shared blue (#145dcc) Start timer link, no per-exercise timer links in details/picker; Finish + Backup feedback | Fresh day and saved day, reload, selected-only summary |
| D03 | Tracker | Distinct feature card; green Play, light amber Pause, red Stop & save with icons and words; Record another prepares without starting; all saved intervals visible; after Stop & save, show saved summaries/Edit without duplicate live metrics, Activity selector or auto-pause controls | Simulated GPS states plus physical iPhone field check for actual GPS/touch claims |
| D04 | Tracker editing | Edit activity/distance/duration; correct Run/Walk pace vs Bike speed; Delete → Yes, delete / Keep recording; recalculated automatic totals; locked-day safeguard | Cancel, failed write, older/latest/last deletion, reload and backup |
| D05 | Map / auto-pause | Unobstructed live map; city/state label only after save, editable for crossings; four-second near-stop auto-pause and movement resume, including small walking steps after multi-minute stops with missing/zero native speed; manual pause stays manual; missing GPS alone never triggers either | Fresh/weak/stale fixes, opted-out state, background/recovery, route segments and totals |
| D06 | Plan | This week / Next week underline tabs; one featured image plus day selector/overview; Monday–Sunday; mapping in Next week; Training Assessment in Progress only | Future-effective edits, rollover, historical isolation, long/custom names |
| D07 | History / journal | Twelve-week timeline; Earlier/Later advances three weeks; return to current week; remembered journal return; colored recognizable type icons; green checks/red flags; body-note filter inside Filters; Nutrition below timeline and navigation controls | Sparse/full history, all seven days, no false skipped/rest, filter/search, journal Edit above Share |
| D08 | Progress | Ranked percentage bars, not an unapproved pie-chart replacement; 4/8/12 weeks; denominator includes completed recovery; zero categories visible; same type colors; completed add-ons separate; comparisons use recorded evidence | Counts/order/units at each period, empty data, no invented goals or equal-share prescription |
| D09 | Videos | Add video & get transcript; selected URL sent to requested free site; Paste & build then review/Save plan; visible persistent Plan ready badge; Add to today becomes Added to today; initial filter matches displayed list | Save/cancel, cached/blocked captions, denied clipboard/manual fallback, reload, existing plans and multiple videos |
| D10 | Log / media / strength | Multiple photos (up to six), local fitness screenshots without extraction, editable long notes; set-by-set weights/units and actual reps/time; Add set in each session exercise; manual exercise logging without a video plan; new Add set actuals blank; Repeat set explicitly copies the chosen completed set but resets completion; save row/results together; reusable templates unchanged; partial efforts retained | Add/remove/reload/backup, warm-up exclusion, finished edit lock, no invented loads |
| D11 | Sharing | Large readable preview and full-size view; editable title without focus jump; coherent square/portrait/story composition; Instagram/TikTok size labels; one Share Image action; adjustable text position/font/size | All templates/formats, keyboard/editing, long titles, actual exported image; no blue text box or editing guides in full-size/export |
| D12 | Settings / recovery | Clean collapsible sections; Home-style icons and red video play; About matches capabilities and holds tracking notes; assessments in Progress; weekly mapping in Plan; backup/restore accessible | Closed/open states, storage failures, backup roundtrip, no obsolete AI controls |

## Accessibility and iPhone verification

Use an app target of at least 44 × 44 CSS px touch areas, with about 60 px height
for the main tracker actions. This is a web implementation target informed by
Apple’s 44 pt guidance, not a claim that CSS px and native points are identical.
Small pictograms may sit inside larger hit areas. Separate destructive and
frequent controls so an imprecise outdoor tap is less likely to hit the wrong one.

Require at least 4.5:1 normal-text contrast, 3:1 for WCAG large text, and 3:1 for
necessary control/state graphics against adjacent backgrounds. Test actual
foreground/background pairs, including texture and transparency. A palette table
alone does not prove contrast. Check + word, flag + label, underline + selection,
and icon + action label preserve meaning without color.

Use semantic buttons/fields, persistent accessible labels, accurate expanded and
selected states, visible focus and useful status/error announcements. Verify
VoiceOver order and names, keyboard focus in sheets/dialogs, dismiss behavior,
zoom/larger text, reduced motion, and disabled/locked explanations. Do not
announce the changing GPS clock every second or let a fixed footer cover focus.

Inspect external Safari or Chrome at representative iPhone widths 375, 393 and
440 CSS px; use a narrower edge case when relevant. Include short usable heights,
top/bottom safe areas, standalone mode, scrolling and the software keyboard.
Do not require tablet/desktop QA. Never shrink critical text just to force Home
onto a single screen under every text-size setting.

Routine Codex built-in-browser inspection is prohibited by project instructions
because of native crashes. Use an external browser or user-supplied screenshots.
Actual iPhone GPS, permissions, backgrounding, native share/Files and VoiceOver
need device evidence; desktop emulation is not proof of those OS behaviors.
No new UI is rendered or visually approved solely for this documentation change.

## Regression workflow and signoff

1. Read this report and identify applicable D01–D12 rows before editing.
2. Preserve approved copy, data meanings, artwork and unaffected regions; inspect
   current diff and computed styles. Avoid copying superseded CSS defaults.
3. Run `npm test` (includes `npm run test:design`) and `npm run build:pages`.
   Run relevant behavioral suites with Node TypeScript stripping; `npm test`
   does not silently imply every test file ran. Keep typecheck/lint limitations
   separate from build/test outcomes.
4. Render affected iPhone screens and adjacent flows in an external browser.
   Inspect hierarchy in one glance, reading size, spacing/crops, grayscale state
   distinction, exact copy, and the actual exported image when sharing changes.
5. Fix failures, rerun affected checks, and record evidence below in HANDOFF.md
   or the change description. Automated documentation checks establish that this
   report stays wired into development; they do not evaluate pixels or certify
   accessibility. Never invent a visual PASS from source inspection alone.
6. For UI releases, follow VERSIONING.md, verify the exact published frontend
   commit/release/worker assets, and deploy API changes separately when applicable.
   Documentation/test-only changes keep the existing public release label.

### Signoff record template

```text
Change / commit:
Applicable matrix IDs:
Automated commands and outcomes:
Rendered evidence (screen/state, viewport, browser, screenshot path):
Physical iPhone checks (verified / still needed):
Readability / contrast / touch / focus / safe-area findings:
Data preservation / save-failure / lock / backup checks:
PASS / FAIL / N/A per applicable matrix row, with reason:
Duplicate functions/buttons review and intentional repeats:
Known limitations, fixes or explicit user-approved exceptions:
Release decision / deployment verification if applicable:
```

Block completion for wrong data/state, accidental deletion, inaccessible primary
actions, obscured/clipped essential content, unreadable text, malformed brand
assets or misleading success. Correct major hierarchy/craft issues before signoff.
For a bounded edit, compare against the approved prior output and check for
unrequested collateral changes. Keep minor follow-up findings explicit.

## Maintenance and sources

Update standards, checklist and tests together when the user approves a new
pattern. Add a matrix row for a genuinely new feature; do not silently certify it
through unrelated checks. Keep normative targets distinct from observed code.

Implementation references: [CSS](app/globals.css), [main views](app/page.tsx),
[tracker](app/gps-tracker.tsx), [history colors](app/history-timeline.ts),
[sharing data](app/share-card-data.ts), and [regression suites](tests/).

External guidance, checked October 18, 2026:
[Apple UI Design Dos and Don’ts](https://developer.apple.com/design/tips/) informs
touch-area sizing and readable interaction;
[WCAG 2.2](https://www.w3.org/TR/WCAG22/) supplies contrast, color independence,
focus and semantic accessibility criteria. These are acceptance references,
not a claim of a completed conformance audit.


Walk is a tracker activity only (user decision October 19, 2026). Use one shared Run/Walk/Bike selector. Run and Walk use pace consistently in tracker, journal and sharing; preserve existing Plan/History/Progress category behavior.
