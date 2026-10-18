# Training for Life — development handoff

Updated October 18, 2026. Read README.md, VERSIONING.md and AGENTS.md first.

## Current change — clear deletion confirmation

Release candidate **2026.10.18 1054** changes only the final confirmation label
from Delete recording to Yes, delete; Keep recording and deletion safeguards
remain. Both builds and 13 rendered checks pass. External Chrome deletion,
cancel, failure rollback, reload, backup and completed-lock regression passes;
iPhone confirmation screenshot inspected. Publication pending.

## Previous change — delete individual GPS recordings

Published release **2026.10.18 0852** adds Delete recording with trash icon inside
Edit recording, inline confirmation/Keep recording, checked persistence and lock
protection. Removes only the chosen recording, updates GPS-owned totals/activity
and start time, preserves manual fields and clears cached latest recording.
Delayed route enrichment cannot recreate a deleted record. Both builds and all
180 tests pass. External Chrome verifies confirmation/cancel, failed storage,
remaining/last deletion, recalculated totals, reload, backup and completed lock;
440/393/375 layouts visually inspected. Typecheck retains eight baseline errors.
Frontend `26eb67c8bf33d5cb60af1a28c28a189835e9c741` published through successful
Pages run `39128959647`; exact live JS/CSS, release, worker and assets verified.
The full deletion/edit/backup/lock regression also passes against the public app.
Sites version 174, source `d832f35d50527c31202014aa6ec9b4fed803b262`, saved
`appgprj_6a87b0a15b7c819189a3ff37e2f4c26c~appgver_6a160bf9b0b88191b433434ffd124633`,
deployment `appgdep_6ad4c0c078dc8191814de206eb0cfaf3` succeeded; live label verified.
No required work remains. Unrelated untracked files preserved.

## Previous change — auto-pause and a cleaner live tracker

Published release **2026.10.18 0806** uses light orange/navy Pause, hides city/state
box + label editor on live/ready/paused maps until Stop & save, and moves the
tracker's foreground/estimate/privacy/provider notes into Settings → About.
Operational errors/status and map attribution remain. Saved/journal/share map
labels remain available; no existing workout/backup schema changes.

Auto-pause defaults on with an optional checkbox and t4l:gps-auto-pause preference.
Fresh reliable GPS ≤0.5 m/s continuously for four seconds pauses only the clock;
watch stays alive. ≥0.9 m/s plus displacement resumes a new route segment. Active
time/distance exclude the paused span and bridging jump. Missing/stale/inaccurate
fixes reset the low-motion countdown and never auto-resume. Manual pause/background
stop the watch and need explicit Resume; reload recovers paused. Auto-pause can be
turned off while auto-paused to resume explicitly. Stop/save works in every state.

Six focused state tests pass. External Chrome GPS fixture verifies thresholds,
excluded time/distance, GPS loss, manual/background pause, setting/reload, live vs
saved map boxes, Settings notes and 440/393/375 layouts. Complete prior GPS edit,
backup and completed-lock regression also passes. Both builds and all 177 tests
pass. Typecheck retains eight pre-existing diagnostics; no new tracker errors.
Frontend `493b764793dec58529b523e66fe4be2a2aa8b130` published via successful
Pages run `39125877875`. Exact live JS/CSS, service worker, icons and workout
assets verified; both full browser regressions pass on the public app.
Sites version 173, source `39134977436e56e28664c619d6f2a0848d0cc6df`, saved
`appgprj_6a87b0a15b7c819189a3ff37e2f4c26c~appgver_6ccae9b14830819191c54db51efec4ae`,
deployment `appgdep_6ad4b67586a08191aed9a11aa6a0bd20` succeeded; exact live
Sites 0806 label verified.
Physical iPhone GPS still needs the user's field check.

## Previous change — prominent GPS feature launcher

Published release **2026.10.18 0728** promotes the Today GPS tracker from a thin
orange submenu to a bordered cream card with navy runner/bicycle/route SVG,
iPhone GPS label, time/distance/map and run-pace/bike-speed copy. Footer exposes
ready, recording/waiting, paused and saved states plus Open/View/Resume action.
Native summary is the whole target; keyboard works and opening never starts GPS.
Open state says Hide tracker. Repeat/Main workout order and all tracker data,
controls, maps, editing, completed locks and backups remain unchanged.

Designly composition and independent actual visual QA approve 440/393/375 layouts.
External Chrome passes launcher/keyboard/no-auto-start, GPS state changes,
collapse without pausing, saved count/reload, 320px edge and safe areas. Existing
full simulated GPS/edit/reload/backup/lock regression also passes with new card.
Both release builds and all 13 rendered checks pass. Frontend
`a3bb11371e61b7be78b78024bb035d78057f8def` published via successful Pages run
`39123275117`. Exact live JS/CSS, release, service worker and assets verified.
Both the launcher/state/keyboard and complete GPS/edit/backup/lock iPhone
regressions pass on the public app. Sites version 172, source
`4d923322e5726862a574a1ed4ec74b175d28fab4`, saved
`appgprj_6a87b0a15b7c819189a3ff37e2f4c26c~appgver_aa560a0d46608191bff7131741d80484`,
deployment `appgdep_6ad4ad5fa8588191851f39fed5c0315f` succeeded; exact live
Sites 0728 label verified.
Preserve unrelated untracked files. No required implementation work remains.

## Previous change — editable recordings and familiar tracker controls

Published release **2026.10.17 1625** adds per-recording pencil Edit, inline
Run/Bike/distance/duration fields with Save/Cancel, and preserves exact raw totals
when only classification changes. Manual daily fields stay; GPS-owned totals and
auto activity names update. Routes, id/order, start/end/max/gaps stay recorded;
share and journal derive the corrected activity's pace/speed. Activity also changes
while paused/ready. Finished workouts require the existing Edit workout unlock;
tracker provides a direct affordance. Saving/reload locks the completed day again.

Designly directed 60px labeled Play (green), Pause (orange), Stop & save (red)
controls; Record another stays neutral and prepare-only. Editor scrolls into view.
Saved writes serialize; route-only enrichment merges into latest recording so it
cannot overwrite corrected totals/type. Pending old autosave is cleared at GPS
save, and stale session snapshots cannot write over a newer session.

20 focused edit/save/share checks pass, including exact preservation, malformed
inputs, aggregate/manual fields, late labels and finished locks. External Chrome
passes simulated GPS start/pause/resume/stop once, two intervals, ready-then-start,
classification correction, older interval time/distance, invalid/cancel/failed
storage, reload, backup and finished edit/relock. Inspected 440/393/375 and safe
areas; independent Designly visual signoff passes. Both builds, 158 app tests
and 13 rendered checks pass. Typecheck retains eight pre-existing diagnostics;
none in changed tracker/edit files. Initial feature frontend `431b1aa` published
via Pages run `39066568855`; final internal editor-state cleanup frontend
`a148913b86482db529867ca4cce7ef420c80a4fa` published via successful Pages run
`39066722540`. Exact live JS/CSS, release, service worker and assets verified.
The complete simulated GPS/edit/reload/backup/lock/iPhone flow passes against
the public app. No pending code changes; physical iPhone GPS remains a device check.
Sites version 171, source `bc4166c378d5b9bb4856fd0e6cce47f1d498a330`, saved
`appgprj_6a87b0a15b7c819189a3ff37e2f4c26c~appgver_1355b32b600c819199adcfa05c540b62`,
deployment `appgdep_6ad3da5aa5588191abcc71e4cf6666be` succeeded; exact live
Sites 1625 release verified. No required implementation or publication work remains.
Preserve unrelated untracked files.

## Previous change — retire the legacy Progress report section

Published release **2026.10.17 0554** removes Saved training reports and its
period/review UI from Progress, including unused rendering helpers. The current
Google Drive Training Assessment card and Next week shortcut remain. Legacy
report storage/backup/restore compatibility is preserved; nothing is erased.
Both builds and 13 rendered checks pass. External Chrome with seeded legacy
reports confirms their UI is absent, data retained, period choices/reload and
assessment/Plan shortcut intact. Inspected 440/393/375 top/bottom and safe areas.
Frontend `8c66ea0a48fa119f4a8b175aa5b089f5d6814ae2` published via successful
Pages run `39022794362`. Exact live JS/CSS, release, service worker and assets
verified; the same seeded-report/iPhone regression passes on the public app.
Sites version 170, source `879528aada463ee0cf29cedbf9d3cdec1c64f9c9`, saved
`appgprj_6a87b0a15b7c819189a3ff37e2f4c26c~appgver_55aa1e5fd2188191bd3f679ea9a3dbba`,
deployment `appgdep_6ad3459c30d48191a569d10e6c286624` succeeded; exact live
0554 label verified. No required work remains. Preserve unrelated untracked files.

## Previous change — week planning and Progress assessments

Published release **2026.10.17 0528** uses Progress-style This week/Next week
underline tabs in Plan. This week retains the day strip, artwork and overview.
Next week holds dated Monday–Sunday mapping, automatic saves, optional custom
types, and an internal assessment shortcut. Training Assessment now sits below
Progress period choices and above the training mix; shortcut scrolls/focuses it.
Settings no longer has assessment or mapping controls.

Mappings use existing t4l:schedule-history snapshots, effective next Monday;
this week's baseline is retained. Removed the old effect that copied the latest
future mapping into today's snapshot on reload. Date resolution consults dated
snapshots for future dates too. Schedule persists with checked writes/rollback;
failed saves retain the displayed/stored prior plan. Backups now include optional
scheduleHistory; restore supports both dated and old schedule-only backups.
Week starts Monday, ends Sunday. No workout records or one-day overrides changed.

Six focused checks pass for boundaries, future revisions, reload/Monday rollover,
historical isolation and real backup serialization. Both builds, 151 app tests
and 13 rendered checks pass; typecheck retains the same eight baseline errors.
External Chrome verifies the two weeks, dates, saves, custom types, rollback on
storage failure, reload, Monday adoption, new/old backup restore, assessment
navigation/focus/exact-folder popup, Settings removal and history preservation.
Inspected actual 440/393/375/320 iPhone layouts and safe-area allowance. No
material visual issues remain. Frontend `c05c5931b16a08b5b1a6c89374495e6d869852a9`
published via successful Pages run `39021188866`. Exact live JS/CSS, release,
service worker, icons/artwork and helper verified. The complete isolated planning,
assessment, backup/restore and iPhone flow also passes on the public app.
Sites version 169, source `24c554bcc2a134c9b3bf6b5c9eebe8c171a6701c`, saved
`appgprj_6a87b0a15b7c819189a3ff37e2f4c26c~appgver_a7839c80ef0881919341e16b199b38a0`,
deployment `appgdep_6ad33fae2cac8191883214cafe8ceb4e` succeeded. Exact live Sites
0528 label verified. No required work remains. Preserve unrelated untracked files.

## Previous change — Training Assessment icon and attribution

Release **2026.10.17 0513** adds a blue outline report/chart icon matching the
other Settings icons. Description now reads “Read the latest report on Google
Drive from Grok.” Same full-row link, exact folder, new-window behavior and cache
cleanup; no data or API changes. iPhone 440/393/375, 320px edge and safe-area
checks cover wrapping, icon, folder navigation, Plan focus, history and storage
preservation. Both builds and 13 rendered checks pass. Published frontend
`a3484bd0f4634ca67b3040d6eb2727f465b84b52` via successful Pages run
`39020243451`; exact live JS/CSS, release and service worker verified. Full
isolated link/iPhone checks also pass on the public app.
Sites version 168, source `3d5bb7163da61f2b7ed71469476e1219ead5c34e`, saved
`appgprj_6a87b0a15b7c819189a3ff37e2f4c26c~appgver_1fa8368e7684819198b1017a5112944c`,
deployment `appgdep_6ad33c245c0c8191a13b95e460f1ff51` succeeded; exact live
0513 release verified. No required work remains.

## Previous change — simple Assessments folder link

Published release **2026.10.17 0451** reduces Settings to one calm full-row
Training Assessment link above weekly mapping. Exact target is the private
Drive Assessments folder 1YJ98Xnn-ET46O70_xYzYqy1rkZQX0PbQ. Designly directed
cream/navy styling, readable 18/16px text, one external arrow and no competing
controls. Opens in a new tab/window, keeping weekly planning in place.

Removed file parsing/import/reader, notice polling/read state, published notice
JSON, its updater script and the direct fflate dependency. Opening Settings
removes only t4l:assessment-document, t4l:assessment-notice and t4l:assessment-read.
No other local records, legacy insight reports, history, schedules or backups
are touched. No report contents are stored or loaded by this link. Sunday
transfer times/targets stay the same; remove only the app-notice publication
steps from the heartbeat, as they are no longer needed.

Both builds and all 158 app checks (including 13 rendered checks) pass. External
Chrome verifies exact folder/new-window navigation, no importer/reader/notice
polling, narrow cache cleanup, history/legacy report preservation, Plan shortcut
focus/mapping, reload and storage denial. Inspected iPhone 440/393/375 plus 320px
edge and safe-area allowance. Independent Designly actual-screenshot signoff PASS
with no required fixes. Typecheck retains eight baseline diagnostics; no new ones.
The existing Sunday heartbeat now performs only the two original transfers;
app metadata publishing steps were removed. Initial 0449 feature published as
frontend 7bfef336f581167a1acf5dafb1fc21a05268bf4a via successful Pages run
39018881892, plus Sites version 166/deployment appgdep_6ad336f45fc481919e7c3a081f8677cf.
The user then requested the exact label Training Assessment. Final frontend
f9635e3801a604cc138c87e89fe13c447520002f published via successful Pages run
39019007722. Exact live JS/CSS and service worker match release 0451. The final
label and complete link/cache-cleanup/Plan/iPhone workflow pass on the public
app using synthetic folder navigation (no private report contents accessed).
Sites version 167, source d556634a29015f1be1b07b9f1ff37be76c908701, saved
appgprj_6a87b0a15b7c819189a3ff37e2f4c26c~appgver_70d40806497c81919dba653960ffe3ac,
deployment appgdep_6ad33770057c8191bf583454ae68a5d5 succeeded. Final label also
inspected in rendered iPhone screenshots. No required work remains.
Preserve unrelated untracked files.

## Previous change — native assessment file selection and local reader

Published release **2026.10.16 2008** replaces the embedded private Google viewer
with Read latest assessment → native file picker → locally extracted text in
Settings. Supports .docx/.txt/.md, heading/paragraph/list/table text, UTF-8 and
BOM-marked UTF-16. Files controls the starting folder; cannot force Drive's
Assessments directory. Help provides folder/native-Doc links and Word-export
instructions. Google native shortcuts require export first. No PDF/OCR/legacy
DOC support. Word imports lazy-load pinned fflate 0.8.2; XML/file/text bounds
prevent uncontrolled imports. Text is rendered literally; no external images,
links, scripts or Word relationships execute.

The selected filename is identified independently of the latest notice. Import
does not mark the latest notice read; the user explicitly marks it. Last selected
report caches in separate t4l:assessment-document and reopens after reload. It is
not part of workout backups. Cancel and malformed input preserve the prior copy;
storage failure keeps new content readable for that visit with clear feedback.
No report text is uploaded/published and no workouts or schedules are changed.
Notice metadata and Sunday times stay the same.

External Chrome with synthetic reports passes actual filechooser trigger/cancel,
DOCX formatting/text extraction, TXT, literal markup/no external loads, invalid
file preservation, cache/reload/reopen, explicit read, planning/history retention
and storage failure. Inspected 440/393/375 plus safe-area allowance. Typecheck
retains eight baseline diagnostics with none in the assessment files. Actual iOS
Files provider navigation remains a physical-iPhone check. Both builds and all 164 app checks (including 13 rendered checks) pass.
Frontend `2c4fc3aefbf0c86c2a3822676dae9dbc5333dbe3` published via successful
Pages run `38985028855`. Exact live JS/CSS, lazy Word-reader chunk and service
worker match release 2008. Full synthetic-file workflow also passes on the live
app. The existing Sunday heartbeat wording was updated for Files/local reading;
its times and operations are unchanged. Physical iOS Google Drive provider
navigation remains user verification; no forced start-folder claim.
Sites source `e4e3f263d4fdcaf87e3a59aa90467f62671358e8`, version 165, saved
`appgprj_6a87b0a15b7c819189a3ff37e2f4c26c~appgver_f69de1a7f4d48191899d52ffa715cb0d`,
deployment `appgdep_6ad2bcd0322c8191b9fe56f7fa74ef09` succeeded. No runtime
credentials or API behavior changed. No required implementation work remains.

## Previous change — Settings assessment reader

Published release **2026.10.16 1956** adds an unread/re-read assessment card
above weekly mapping, explicit Mark as read, Google Docs private preview and
Open in Google Drive fallback, source-check timestamp, notice refresh/errors
and Plan next week landing at the report. Same-document revisions become unread.
No workout/schedule/backup schema changes or automatic plan edits.

Only a validated native Doc ID and modification/check timestamps are published
in public/assessment-latest.json. Full report text remains in private Drive;
iframe content is not copied to storage/source or cached by our service worker.
Check for updates refreshes the published notice, not Drive. Sunday 8 p.m.
automation must publish refreshed metadata after fetching the assessment;
6 p.m. must update Grok-created latest-workout.json in place, keeping ID
1oAFMw065E5ibpWtd5VJRw2tK1DWJwy3C. This workaround was confirmed by the user.
Metadata-only updates keep the release label. Use scripts/update-assessment-notice.mjs
with a verified native Google Doc ID and modified timestamp. Current notice is
Assessment 2026-10-16, ID 1vsWuDF-erzfb8C8AGkFwv0ARiTdsRYxylFTNd6nju68.

Both builds, all 161 app checks (including 13 rendered checks) pass. Typecheck
retains the same eight baseline diagnostics. External Chrome fixtures cover
unread/re-read/revision, explicit marking, cache/failure, no implicit iframe load,
private URL, weekly mapping, prior history and Plan next week. Inspected iPhone
440/393/375 and safe-area allowance. Corrected generic DATA label and strengthened
Read button. Automatic approval review rejected the actual private viewer test
because it printed private document body text to QA output; no bypass attempted.
Actual signed-in report display requires the user's iPhone check; fixture tests
verify viewer plumbing, not private Google authentication or report rendering.
No new access-code service or Google/Gmail account permission was introduced.
Frontend commit `5fd8c6e83037657ba919bd739b49f0e9cc7fe8d1` published via
successful Pages run `38984266104`. Exact live JS/CSS, release, service worker
and notice JSON match the tested build. Full fixture-based iPhone workflow also
passes on the public app. The single Sunday heartbeat was updated to preserve
Grok's file ID at 6 p.m. and download + publish notice metadata at 8 p.m.; timing
and task name remain unchanged. Actual future scheduled execution is untested.
Sites version 164, source `3fe2124c66a8c2aea392249af1bde7dd171cc6a4`, saved
`appgprj_6a87b0a15b7c819189a3ff37e2f4c26c~appgver_9a40b0c9a23081918c858b85d6036b79`,
deployment `appgdep_6ad2baa7b738819192e9caa1af37b3b8` succeeded. No API or
credentials changed. Remaining check: the user should open the private Google
viewer on their signed-in iPhone; Open in Google Drive is the fallback.

## Previous change — smooth Settings video-to-plan workflow

Published release **2026.10.16 1148** follows Designly review: Add video & get
transcript → user copies on exact free site → Paste & build → compact review →
Save plan. Uses the website's actual POST /transcript form with youtube_url, not
an assumed GET prefill. One user-triggered clipboard read; denied/unavailable
access reveals one manual box. No cross-site automatic return claim. Website
success is still blocked/unverified; browser tests intercept the public form to
verify the canonical address is supplied and no other data is sent.

Plan ready + exercise count is visible outside disclosures and derived from
validated persisted trainingPlan. Save succeeds only after library persistence;
failure leaves the draft editable. Saved plans/duplicates are reused, metadata
loads in background, filters collapse to one selector, category edits and uncommon
source tools collapse. Add/Delete disappear while building/reviewing; only Save
is prominent. Imported text goes directly to review; full source stays optional.

A bounded session draft resumes the most recent Settings builder after reload;
it is separate from saved plans/workout storage and never opens in Today editors.
Recorded-row protections, blank repeat results, backups, completed locks and
Add-to-today confirmations remain. No workout/result/backup schema changes.

10 focused helper tests and 34 parser/helper checks pass. External Chrome passes
actual form request shape, explicit clipboard/no implicit reads, review without
autosave, restored draft, save badge/reload, duplicate preservation, Today add,
clipboard denial, storage failure/retry, recorded-row protection, backup/locks,
automatic-error/file import and prior history. Inspected iPhone 440/393/375 and
safe-area allowance; independent Designly review corrected competing actions.
Both builds, all 145 app tests and 13 rendered checks pass. Typecheck retains
the same eight pre-existing diagnostics; no new transcript-file diagnostics.
Frontend commit `856bfb1b453fc31fb33730b44fec14d05a7ff6f6` published via successful
Pages run `38927028886`. Live exact JS/CSS, release, service worker, icons/artwork
and downloadable helper verified; the full isolated iPhone workflow also passes
against the public app. Independent Designly visual signoff found no remaining
material issues in review/saved states.
Matching Sites version 163, source `c79693804adac13eaa9a464c1903fa8dcf7d7863`,
saved version `appgprj_6a87b0a15b7c819189a3ff37e2f4c26c~appgver_077289bec5dc81919f9afdef814d1ca5`,
successful deployment `appgdep_6ad247b78a448191b967d122996aa2cc`.
Preserve unrelated untracked files. Existing automatic website access limitation
remains; mocked website navigation verifies the form, not successful extraction.
No required work remains for the workflow simplification.

## Previous change — supplied kettlebell transcript lexicon

Published release **2026.10.15 1854** imports the user's original 94-entry JSON
unchanged into app/data. A local matcher recognizes 256 supplied exercise phrases,
plural/hyphen variants, specific movements and qualifiers. Longer compound names
win; left/right, loading and position stay visible. Generic KB press does not imply
strict technique; ordinary speech needs exercise context. Non-exercise families
become notes. EMOM/AMRAP durations cannot leak into adjacent exercise work time;
per-side reps/time remain per side. No default complex scheme, weights, circuit
expansion or saved-record migration. Existing set/result/backup schemas remain.

Long exercise-name fields now wrap in a two-line editor for iPhone review. The
JSON import uses an explicit TS module path for Node tests; allowImportingTsExtensions
is enabled with existing noEmit. 24 focused parser checks pass, including all 256
provided phrases, ambiguous speech, distinct variants, compounds, negation,
per-side cues, programming scope and saved/repeated data. Typecheck retains only
eight pre-existing diagnostics. External Chrome passes draft/no-autosave → review/
save → Today with blank results → reload, keeping prior history/notes; inspected
440/393/375 and safe-area allowance. Both builds, all 135 app tests and 13 rendered
checks pass; the existing full-transcript website/fallback fixture regression also
passes. Frontend commit `44cf932` published through successful Pages run
`38820266431`. Live exact JS/CSS, release, service worker, icons/artwork and helper
verified. The same draft/review/Today/reload/iPhone workflow passes on the public
app, retaining prior history and blank dated results. No required work remains.
Matching Sites version 162, source `e425014fb90df5537069e51046051b89d3e63617`,
saved version `appgprj_6a87b0a15b7c819189a3ff37e2f4c26c~appgver_a5e804a6e4f4819193e8d36ad14ec7bf`,
successful deployment `appgdep_6ad15a006e4481919d274b9d6a8f6af1`. First live
Sites check briefly served the prior release during propagation; the fresh
recheck serves the exact 1854 release.
Automatic website retrieval remains blocked as documented below; this change
improves local drafting for fetched, pasted or imported transcript text.

## Previous change — exact transcript website and easy fallback

Published release **2026.10.15 1825** uses only the user's requested
**https://youtubetotranscript.com/** for new automatic transcript requests. On
failure, a prominent direct free-site link appears and paste/import opens. User
asked October 15 to continue and provide this easy fallback; the tested flow is
published with its limitation stated. No alternate online service/account/key is used.
Do not propose TranscriptAPI again; no account, key, subscription or environment
change was made. Its unused optional adapter was removed and deployed.

The complete fetched text has a source/word-count viewer; provider-scoped cache
prevents direct YouTube text from satisfying website requests. Manual replacement
clears source attribution. Circuit parsing identifies the real sample's Deadlift,
unspecified Press and Goblet squat, two minutes each, with rounds/rest in notes.
No guessed reps/sets or changes to workout/history storage.

Exact website automatic requests and ordinary external Chrome form submission
return HTTP 403 “Just a moment.” No challenge bypass attempted. Successful
website retrieval remains unverified; successful parser/UI tests use fixtures.
Do not claim automatic access works based on mocks or direct YouTube results.
The direct website + manual fallback is the verified route when access fails.

126 app tests, 44 focused checks (included in app tests), Pages build and external
Chrome flow pass. iPhone 440/393/375 checks verify visible exact free-site link,
automatic paste expansion, no alternate-service control, entire fixture text,
source/count, circuit drafting, manual replacement, cache and reviewed save.
All 13 rendered checks pass; both builds pass. Typecheck retains eight existing
diagnostics, none in changed transcript files. GitHub code `a6e2b6b` published via
successful Pages run `38817122015`. Live JS/CSS exactly match the local build;
release, service worker, icons, workout artwork and fallback helper verified.
Actual public GitHub-origin Chrome website request returned website_blocked503;
the correct free-site link appeared, paste opened, and a manual transcript built
a draft that saved after review. Full website success remains fixture-only. No
required fallback/release work remains; automatic website access stays blocked.

Backend cleanup source `5fa9df2e436cd87ae7de25fbd54bff72f38ef161` is published
as Sites version 160, saved version
`appgprj_6a87b0a15b7c819189a3ff37e2f4c26c~appgver_fc130fa3d8788191841c26dac6ca9fa8`,
successful deployment `appgdep_6ad0e682dce88191b49199a1b179929a`.
The complete matching release was then published as Sites version 161, source
`683f15a3b7e353b373f31b6224625385f2fccb13`, saved version
`appgprj_6a87b0a15b7c819189a3ff37e2f4c26c~appgver_7f6854116f40819181bf17ea49082b4d`,
successful deployment `appgdep_6ad15370751081919a0fb4303b01d02a`. Backend checkout
is `/private/tmp/t4l-caption-api`; public frontend is GitHub Pages. Legacy
URL-only clients remain compatible.
Preserve unrelated untracked files.

## Previous change — automatic video captions

Published release `2026.10.14 1831` adds one-tap Fetch captions & build draft,
immediate loading/visible feedback, cancellation/lock guards, a bounded device
caption cache and collapsed manual fallback. Only the canonical video link is
sent to `/api/video-captions`; draft extraction/review and set results stay local.
No account, key, subscription/card or environment variables changed. The earlier
free-trial question is obsolete; unused optional provider code was removed.

Worker validates exact YouTube hosts/IDs, bounds input/output/time, applies
best-effort per-isolate cooldown/concurrency limits, tries the transcript site's
public GET page then English YouTube captions. Primary site returns 403; direct
YouTube retrieval succeeds locally and hosted (GRFRg4Oafxc, 211 segments / 5,954
characters; PkcpMul77Rg also succeeds). The edge rejects `redirect:error`; manual
redirect mode explicitly rejects 3xx instead. Cache API failure is nonfatal.
Native deployment propagation briefly served the prior version after success;
fresh later requests reached the fixed Worker. Successful captions reuse the
bounded device cache; newly isolated clients on one IP can hit the expected
one-minute same-video cooldown. No CAPTCHA/cookie bypass or media downloads.

Frontend `cd12130` published via successful Pages run `38648400368`. Backend
source `932e52e9`, Sites version 158, saved version
`appgprj_6a87b0a15b7c819189a3ff37e2f4c26c~appgver_058ce1d99ea08191965c93d3c099574f`,
deployment `appgdep_6ad00326e74c819186c2506f28cdc7cd` confirmed successful.
Exact live release, JS/CSS, worker cache, icons/artwork/fallback file verified.
Actual public GitHub-origin Chrome request returned 200 and full captions,
built a reviewable draft without autosave, reused cache, then saved the reviewed
plan. Full fixture flow covers errors/retry, manual fallback, different set
weights, protected recorded rows, backups, locks, History and fresh repeat.
Inspected external Chrome at 440/393/375 and safe-area allowance. 127 app tests,
13 rendered checks, 20 focused caption checks and both builds pass; TypeScript
retains only eight baseline diagnostics.

Backend checkout `/private/tmp/t4l-caption-api` has separate Git history; use the
Sites source helper and renewed credential for subsequent worker deployment.
Preserve unrelated untracked files. Malformed duplicate Git ref
`refs/remotes/github/main 2` blocked fetch; contents were preserved at
`/tmp/t4l-invalid-git-ref-main-2` before removal. No required work remains.

## Previous change — reusable video plans and set results

Release `2026.10.14 1633` adds local caption paste/file import and
version-1 prepared JSON plan import to video cards in Future videos and Today.
Drafts identify explicit known exercise/volume cues, retain source excerpts and
circuit instructions, leave unknowns unspecified and require review. This is a
free import workflow, not automatic caption retrieval or AI interpretation:
direct primary-site POST was blocked (403), so Copy video link + standard site
link is used. Downloadable `public/video-caption-fallback.py` is an on-demand
computer helper; existing yt-dlp is required, one English caption track is
selected, no media/cookies, cache reused, zero retry loop. Real caption download
was not attempted (yt-dlp unavailable); cleanup and retrieval/caching paths tested
with fixtures/mocked subprocesses. No API service or credentials changed.

Blueprints live on `Video.trainingPlan`, dated weights/reps/time/unit/load/done/
warm-up on `trainingResults`. Existing schema-1 backup includes both. Libraries
keep only blueprints; repeat/add-to-today clear results; dated snapshots remain
independent. Recorded rows cannot be discarded by replacing a plan. Completion
fills specified exact reps/time only when blank; shorter actuals remain intact.
Finished workouts follow Edit lock. History is read-only. Progress compares best
completed non-warm-up sets: actual reps at identical exercise/load/unit/weight,
or changed weight at matching reps/unit/setup, within selected weeks. Today now loads shared history for immediate repeat availability.

Production/Pages builds, 13 rendered checks, all 107 app regressions and three
fallback tests pass. External Chrome passes caption file/paste, draft/review,
weights, typing focus, warm-up comparison, retained rows, backup contents,
reload/lock, History and next-day repeat. Inspected 440×956, 393×852, 375×812
and 440×860 with 62px top/34px bottom safe-area allowance. Published code
`bf74c13` through successful Pages run `38633845964`. Live release label,
JS/CSS, service worker, icons, illustrations and downloadable fallback match
the tested build; the full external Chrome workflow also passes live.
Typecheck retains 8 baseline
errors. Optional retrieval preference question had no answer; proceeded with the
free import workflow as stated in commentary.

## Previous change — Progress training mix

Release `2026.10.14 0808` implements the approved percentage-bar mockup:
cream/navy card, underlined 4/8/12-week choices, ranked counts/shares with shared
History colors, missing types retained at zero, most frequent/not recorded copy,
and collapsed completed add-ons. Recovery is included and explicitly labeled;
add-ons are separate. Prior additional/custom types remain listed at zero even
when outside the period. Legacy completedAt counts agree with History. No
storage/schema changes. Seven focused data tests pass. External Chrome verifies
20-day sample percentages/bar lengths, zero Mobility, all periods, completed
add-ons, selected-only exclusion, journal preservation and empty state. Inspected
440×956, 393×852 and 440×860 with 62px top/34px bottom safe-area allowance.
Also inspected 375×812 with a long custom workout name and legacy completion.
Production/Pages builds, 13 rendered checks and all 95 regression checks pass.
Typecheck retains eight pre-existing diagnostics. Published `922bb01` via
successful Pages run `38561815069`. Live release 0808 and exact JS/CSS, worker,
icons and workout artwork verified. All percentage/period/add-on/journal, empty,
custom/legacy and iPhone browser checks also pass on the public app.

## Previous change — weekly History timeline

Release `2026.10.14 0302` replaces Month with a 12-week scrollable timeline,
three-week Earlier/Later jumps, older windows at the edges, and Back to this
week. Current week is initially visible. Cursor/scroll position survives journal
visits. Workout icons use muted category colors; completion checks stay green
and body flags red. Body notes alone no longer count toward completed totals.
No storage/schema changes. User confirmed iPhone-only support and verification;
recorded in AGENTS/README/checklist. Local external Chrome checks pass at
440×956 and 393×852, plus 440×860 with 62px top/34px bottom safe-area
allowance, for timeline navigation, colors, totals, filters, journals and position
restoration. Production/Pages builds, 13 rendered checks and all 92 regressions
pass. Typecheck retains the 8 pre-existing diagnostics. Published `40572f0` via
successful Pages run `38525940237`. Live release 0302 and exact JS/CSS/worker,
icons and artwork verified. The same timeline/filter/journal/position and iPhone
checks pass on the public app.

## Previous change — compact phone Home

Release `2026.10.14 0224` trims phone-only Home brand/card padding, section
gaps, destination spacing and icon-container height. Typography, artwork and
menu destinations remain unchanged. Layout retains natural scrolling for
shorter screens/expanded weather settings. External Chrome measures Settings
and release footer inside 440×893/860 viewports and a 956px viewport with
62px top + 34px bottom safe-area allowance; fonts remain unchanged.
Phone/tablet/desktop screenshots inspected. Production/Pages builds and 13
rendered checks pass; What’s New and all Home destinations tested in external
Chrome. Published `8647073` via successful Pages run `38522214855`. Live
release 0224 and exact JS/CSS/worker/art/icons verified; phone fit, safe-area
allowance, What’s New and Home navigation tests pass publicly.

## Previous change — journal Edit beside Share workflow

Release `2026.10.14 0203` moves the prominent journal Edit button directly
above Share workout; both are full-width in one action group below completion.
Back remains at the top. Edit/lock behavior unchanged. Production/Pages builds
and 13 rendered checks pass. External Chrome checks direct-above-Share ordering
and the full lock/Edit/save flow; phone/tablet/desktop screenshots inspected.
Published `c649863` via successful Pages run `38520215892`. Live release 0203
and exact JS/CSS/worker/art/icons verified; placement and lock/Edit/save checks
pass on the public app.

## Previous change — prominent journal Edit

Release `2026.10.14 0200` gives journal Edit workout a navy filled 52px button,
cream label, pencil icon and visible keyboard focus. The Edit/lock behavior is
unchanged. Production/Pages builds and 13 rendered checks pass. External
Chrome verifies navy styling, 52px target and unchanged lock/Edit/save flow;
phone/tablet/desktop journal screenshots inspected. Published `da073c1` via
successful Pages run `38519912246`; live release 0200 and exact assets verified.

## Previous change — completed workout lock

Release `2026.10.13 2234` locks completed/legacy completedAt workouts until
explicit Edit on Today or the journal. Edit is scoped to a date and retains
completion. Save changes + Backup locks again; cancellation leaves editing open.
Native disabled controls + handler guards cover workout setup, notes, media,
GPS, add-ons and check-ins; viewing/playback/sharing remain available. Settings
video and Progress add-on additions respect the lock; completed historical video
deletion and automatic library renames are blocked. Background GPS place
enrichment can update already saved routes but cannot append new recordings.
Finish blocks mutations/navigation and waits for media uploads; locked reloads
do not autosave workout edits. No persistent edit flag or schema changes.
Production/Pages builds, 13 rendered checks and all 89 regression checks pass.
External Chrome verifies completed reload locks, all mutation controls, Settings
additions, completion retention during Edit, cancel/save/relock, backup contents,
playback/share and historical Edit scoped to one date. Phone/tablet/desktop
lock banners inspected. Typecheck retains 8 pre-existing diagnostics. Published
`cd9979c` via successful Pages run `38502109599`. Live release 2234 and exact
JS/CSS/worker/art/icons verified; the full browser lock/Edit/save and historical
date tests pass on public app.

## Previous change — video All filter and add confirmation

Release `2026.10.13 2205` fixes All-filter ternary precedence through a shared
filter helper. Future/Recent Add buttons use today’s actual saved video IDs, show
Adding… then green ✓ Added to today, prevent duplicate taps during saves and
show failures without marking success. Parent updates sessionRef after saving.
No storage changes. Production/Pages builds, 13 rendered checks and 2 video
regressions pass. External Chrome verifies all 39 videos on initial open, filter
switching, added/disabled state, transaction failure + retry, reload, Recent
consistency and preserved notes; phone/tablet/desktop layouts inspected.
Published `13e3e22` via successful Pages run `38499630656`. Live release
2205 and exact JS/CSS/worker/art/icons verified; all 39/add/retry/reload checks
also pass against public app.

## Previous change — seated Mobility and unified filters

Release `2026.10.13 1456` replaces Mobility/Yoga/Pilates with a seated toe-touch
pictogram on a mat. Body notes only moves into Filters, combines with query/type/
dates, and results retain red flags and note excerpts. Clear search resets it.
Weekly Details/Month stay the only tab-like controls. No stored data changes.
Production/Pages builds, 13 rendered checks and 4 History search tests pass.
External Chrome verifies Body notes-only results, preserved excerpts, collapsed
filters staying active, clear/reset and Weekly/Month switching. Phone/tablet/
desktop pictograms and expanded filters inspected. Published `07140a0` via
successful Pages run `38451198080`. Live release 1456 and exact JS/CSS/worker/
art/icons verified; live Body notes filter/collapse/clear checks pass.

## Previous change — clearer Mobility figure

Release `2026.10.13 1425` gives Mobility/Yoga/Pilates a shaped side-bending
figure with overhead stretching arm and defined torso. Navy palette retained.
No workout/data changes. Production/Pages builds and 13 rendered tests pass.
External Chrome History checks pass; phone/tablet/desktop figure inspected.
Published `f25d1bb` via successful Pages run `38447021964`. Live release
1425 and exact JS/CSS/worker/art/icons verified; History checks pass publicly.

## Previous change — Speed motion icon

Release `2026.10.13 1422` replaces the History Speed shoe with a navy runner
and three motion lines. Other category icons and workout records unchanged.
Production/Pages builds and 13 rendered tests pass. External Chrome History
checks pass; motion runner inspected at phone/tablet/desktop sizes. Published `f4ae3b4` via successful Pages run `38446385028`; live release
1422, exact assets and History checks verified.

## Previous change — clear Strength and body flags

Release `2026.10.13 1419`: Body notes list flags use matching red with pale
red background; Strength is an unmistakable horizontal dumbbell with two weight
stacks and center bar. No data changes. Production/Pages builds and 13 rendered
checks pass. External Chrome confirms red list flag and unchanged History
interactions; phone/tablet/desktop dumbbell layouts inspected. Published
`aa7069f` via successful Pages run `38446031525`. Live release 1419 and exact
JS/CSS/worker/art/icons verified; red list flag checks pass on public app.

## Previous change — refined History icons and tiles

Release `2026.10.13 1130` implements approved mockup styling in Weekly Details:
navy SVG icons, Endurance stopwatch, separate green completion and red body flags,
neutral pending markers, orange today outline and legend. Existing workout
assignments, records and calendar behavior preserved. Production/Pages builds
and 13 rendered tests pass. External Chrome confirms SVG icons, constant navy,
today outline and separate green check/red flag on a completed body-note day.
Phone/tablet/desktop layouts inspected; view switching passes. Published
`d7a0541` via successful Pages run `38423044875`. Live release 1130 and exact
JS/CSS/worker/icons/art verified. Live icon/today/check/flag checks pass.

## Previous change — consistent History tabs

Release `2026.10.13 1055` uses Today tab styling for Weekly Details/Month:
shared typography, transparent background, orange selected underline. Body notes
remains a separate filter. No data changes. Production/Pages builds and 13
rendered tests pass. External Chrome verifies view switching, month navigation
and active underline; phone/tablet/desktop screenshots inspected. Published
`2ebafc5` via successful Pages run `38417675972`. Live release 1055 and exact
JS/CSS/worker/icons/art verified; live History interaction/style checks pass.

## Previous change — Progress periods and frequency

Release `2026.10.13 0004` offers 4/8/12 weeks. Training categories sort by
completed-day count, ties alphabetically; completed add-ons have a ranked list
within the same period, deduplicated per day. No persistence changes. Production/Pages builds, 13 rendered tests and 4
Progress tests pass. External Chrome verifies 4/8/12 period counts and ordering;
phone/tablet/desktop screenshots inspected. Published `2acf573` via successful
Pages run `38344759385`. Live release 0004 and exact JS/CSS/worker/art/icons
verified; live 4/8/12 counts, ordering and responsive checks pass.

## Previous change — multiple photos and safer resume

Release `2026.10.12 1819` adds up to six compressed photos per log, multi-file
selection, individual removal and journal galleries. Legacy single photos remain
visible and the first photo remains compatible with sharing. Photos stay in
existing session backups. GPS action buttons have stable identities; discard
is separated behind Discard options, away from Resume/Stop. Production/Pages
builds, 13 rendered checks and 5 photo/save regression checks pass. External
Chrome checks multi-file upload, removal and reload; simulated app hiding pauses
and single-touch Resume triggers no discard dialog. GPS regression checks pass.
Phone/tablet/desktop galleries inspected. Physical iPhone field confirmation
remains. Published product `45a68ae` via successful Pages run `38316103790`.
Live release 1819 and exact JS/CSS/worker/icons/art verified. Multi-photo, reload,
automatic visibility pause/single-tap resume and GPS checks pass on public app.

## Previous change — saved recording evidence

Release `2026.10.12 0922` adds a tracker list of all recordings for the selected
day, with green saved checks, interval number/activity, start time, distance and
duration. The list remains visible during a fresh or active recording and reloads
from the existing session data. No storage/schema changes. Production/Pages builds and 13 rendered checks pass.
External Chrome touch/GPS tests verify two intervals remain visible through
next-recording preparation, active tracking and reload; phone/tablet/desktop
screenshots inspected. Published product `17ac735` through successful Pages
run `38255382412`. Live release 0922 and exact JS/CSS/worker/icons/art verified;
all touch/GPS and saved-list/reload checks also pass on the public app.

## Previous change — responsive run/bike recording

Release `2026.10.12 0907`: timer starts before GPS acquisition; Stop saves
immediately before background place lookup. Record another prepares a zeroed
workout and requires a separate Start tap. Larger controls ignore tab-swipe
starts; last pace/speed holds through missing/weak fixes with sustained stationary
readings still reaching zero. Timer-only renders avoid route-map recalculation
and full-route persistence on every tick. Background enrichment preserves
interval ordering and manual place edits. Existing notes and workout data stay intact.
External Chrome touch/mocked-GPS checks pass for pending GPS, timeout, weak fixes,
stationary readings, pause/resume, stale callbacks, repeated recordings and blocked
place lookup. Phone/tablet/desktop screenshots inspected. Physical iPhone/GPS
behavior still needs field confirmation. Production/Pages builds, 13 rendered checks and 13 GPS regression checks pass.
Published product `6bb27ff` via successful Pages run `38253686476`.
Live release 0907 and exact JS/CSS/worker/icons/art verified. The complete
external Chrome touch/mocked-GPS checks also pass against the public app.

## Previous change — clean full-size sharing preview

Release `2026.10.11 2203` removes the positioning handle/outline/Drag text label
from full-size preview. Back to editing restores positioning controls; text/data/
exports remain unchanged. Help copy matches this interaction. Pages build and
13 rendered tests pass. External Chrome checks no handle in full-size mode,
mouse/touch/keyboard editing placement, return/edit, 9 font/format exports,
transparent pixels and unchanged storage. Phone full-size and tablet/desktop
editing screenshots visually inspected. Published product `d74825c` via successful
Pages run `38194335964`. Live release 2203 and exact JS/CSS/worker/art/icon assets
verified. Live full-size handle absence and editing/export checks pass.

## Previous change — transparent sharing text

Release `2026.10.11 2149` removes the navy fill from custom sharing text.
Only cream text with a subtle shadow exports; positioning outline/Drag text label
stay editor-only. No storage or positioning changes. Pages build and 13 rendered
tests pass. External Chrome verifies touch/mouse/keyboard movement, all fonts and
formats, removal restoring original bytes, and identical underlying image pixel
inside the previously filled box away from text. Phone/tablet/desktop editor and
export screenshots visually inspected. Published product `6610a67` through
successful Pages run `38193468052`. Live release 2149 and exact JS/CSS/worker/art
assets verified. Live transparent-pixel, dragging/fonts/size and nine export
checks pass.

## Previous change — movable share text box

Release `2026.10.11 2142` adds one optional share-only text box (160 characters),
Modern/Classic/Typewriter fonts and 24–96 font size. Mouse/touch dragging and arrow
keys position it within normalized image bounds in either preview mode. Canvas
export includes the text, rounded translucent navy backing and wrapping/clipping;
drag handles never export. Removal restores the original image. Focus trap now
includes textareas and excludes hidden full-size-mode controls.
External Chrome verifies editing/font/size, mouse/touch/keyboard movement, full-size
return, 9 font/format exports, exact PNG sizes, remove restoring original bytes,
unchanged saved data and 440/768/1280 layouts. Screenshots and export inspected.
Typecheck has no sharing diagnostics; existing unrelated diagnostics remain.
Pages build and 13 rendered tests pass. Published product `9d9c9b4` via successful
Pages run `38192926417`. Live release 2142 and exact JS/CSS/worker/art/icon assets
verified; live text editing, mouse/touch/keyboard movement, fonts/size, nine exports,
removal and unchanged storage checks pass.

## Previous change — readable sharing previews

Release `2026.10.11 2129` enlarges phone previews from 160px to up to 320px
(32dvh) and adds View full-size preview / Back to editing on all screen sizes.
Full-size phone preview uses available width with scrolling for tall images;
editing state/export data remain unchanged. Reduced-height editing uses 100px.
Pages build and 13 rendered tests pass. External Chrome verifies enlarged sizes,
expansion/return, preserved title, stable typing and Run/Bike export behavior at
440/768/1280 widths. Screenshots of editing/full-size mode visually inspected.
Published product `bf73f02` through successful Pages run `38192173064`.
Live release 2129 and JS/CSS/worker/art/icon assets match the local build. Live
external Chrome expanded preview, preserved edits, typing and exports pass.

## Previous change — polished sharing composition and editing

Release `2026.10.11 2053` balances Card art height per format/metric count,
groups stats below title/date, gives Avg Pace a full-width 48px line and displays
GPS/HH:MM:SS duration as readable minutes/hours. All templates use the approved
T4L icon/footer. On phones a compact preview and title stay fixed above scrollable
options; reduced-height viewports use a smaller preview. No saved data changes.
Pages build, 13 rendered tests and 9 share-data tests pass. External Chrome checks
five fixtures across three PNG sizes (route tiles mocked), Run/Bike units, natural
phone title typing, unchanged storage and photo/route availability. Phone/tablet/
desktop screenshots and exported long-text/Story/Photo cards visually inspected.
Typecheck retains 8 prior diagnostics with no sharing errors. Published product
`85ea299` through successful Pages run `38189779829`. Live release 2053, JS/CSS,
worker and art/icon assets match local build. Live external Chrome phone typing,
responsive composer, Run/Bike pace/speed and Story export checks pass.

## Previous change — inline average pace

Release `2026.10.11 2005` formats tracked running average pace inline as
`Avg Pace: 15:32 min/mile` in tracker/journal and canvas share exports. Kilometers
retain min/km. Data and calculations unchanged. Pages build, 13 rendered tests
and 8 share-data tests pass. External Chrome Run/Bike units/export checks pass;
phone/tablet/desktop screenshots and Story export visually inspected.
Published product `faab033` via successful Pages run `38186791554`. Live
JavaScript release 2005 and Avg Pace formatting verified; live external Chrome
Run/Bike tracking, unit selection and share export checks pass.

## Previous change — running pace and cycling speed

Release `2026.10.11 1943` uses current/average min/mi for Run (min/km
when kilometers chosen), mph/km/h for Bike. Journals show average/fastest
running pace. Sharing derives run pace and bike speed separately, including
mixed-activity days; stored GPS meters/seconds remain unchanged.
Pages build and 13 rendered tests pass; 13 GPS/share tests pass. External Chrome
checked saved Run/Bike metrics in miles/kilometers, share metrics and Story exports;
phone/tablet/desktop screenshots inspected. Typecheck retains 8 existing errors.
Published product `7ea88c8` through successful Pages run `38185510414`.
Live release 1943 and JS/CSS/worker/art assets match the local build. Live external
Chrome Run/Bike mile/km tracking and Story sharing export checks pass.

## Previous change — stable share editing and Story composition

Release `2026.10.11 1936` keeps the previous preview visible while rendering its
replacement, with a fixed aspect-ratio frame, debounce and proper blob cleanup.
Only the newest generated file can be shared; stale generations are cancelled.
This removes loading-placeholder collapse that shifted the mobile title field.
Story cards use a larger portrait crop (56% height with stats, 65% without), with
title/date/stats grouped beneath the artwork instead of an empty middle.
Portrait/Square composition and saved workout/storage data are unchanged.
Verification: Pages build and 13 rendered tests pass; 15 focused journal/share
tests pass. External Chrome verified typing stability at phone and reduced
keyboard-sized heights, all image formats, five workout fixtures and screenshot
backup/restore. Desktop/tablet/phone previews inspected. Physical iPhone keyboard
not tested. Typecheck retains 8 pre-existing diagnostics; sharing lint has no
errors (one image advisory). Published product commit `177be04` through successful
Pages run `38184962768`. Live release `2026.10.11 1936`, JS/CSS, service worker,
icons and artwork match the local build. Live external-Chrome typing/Story export
and screenshot compatibility checks pass.

## Previous change — custom share titles and local screenshots

Release `2026.10.11 1927` adds a share-only Title field with live/exported text
and original-title fallback when blank. AI access/goals Settings and API-backed
screenshot extraction/insight generation controls/callers are removed per user
approval. Existing extracted screenshot details and saved reports remain readable;
legacy goals/reports and server APIs remain preserved for compatibility/backups.
ScreenshotAttachments saves up to six compressed local images per workout in new
optional workoutScreenshots; Choose/Paste/View/Remove work without extraction.
Journal and backups include these images. Saved metrics and workout title do not
change. Settings About and restore copy describe current tracking/maps/videos,
sharing, local storage, backups and screenshot behavior. Initialization guards
prevent stored settings/libraries/reports/goals being overwritten before loading.
Both builds, 13 rendered and 15 focused tests pass. External Chrome verifies
custom title/export/fallback, local screenshot upload/view/remove/reload, backup
and restore, unchanged recorded metrics, legacy reports/goals and no API calls.
Phone/tablet/desktop title, screenshot and Settings/About layouts inspected.
Eight existing TypeScript diagnostics remain; changed modules lint with zero
errors and two image advisories. Saved legacy report direction "stay" safely
uses the existing keep label. Commit `d51ca48` published successfully in Pages run `38184377812`. Live
release `2026.10.11 1927`, JS/CSS, worker and artwork match the tested build.
External Chrome repeated custom share-title export, local screenshot saving,
view/remove/reload/backup/restore, preserved metrics and legacy data, clean
Settings/About and absence of API requests on the live app.

## Previous change — street maps in shared Route images

Release `2026.10.11 1913` uses OpenStreetMap tiles in the exported Route image,
with overlaid separate GPS segments, start/finish markers and visible attribution.
City/state labels default on and can be edited temporarily, including crossings;
full route remains the default. Only visible preview tiles load, with browser HTTP
cache and bounded in-memory reuse. Photo/Card remain unchanged. A missing map
blocks export and offers Retry preview; routes are never silently exported without
the requested map. No stored workouts/backups change. Both builds, 13 rendered and nine sharing/map
tests pass. External Chrome checked map PNGs in all three sizes, edited crossing
labels, optional privacy, share/download fallbacks and phone/tablet/desktop layouts
using mocked tiles; one real OpenStreetMap viewport exported successfully with
CORS and was visually inspected. Map failure disables sharing; retry recovers.
Nine preexisting type errors remain, no new diagnostics; changed-module lint has
zero errors and one existing image advisory. Commit `2f29be3` published successfully in Pages run `38183476571`. Live
release `2026.10.11 1913`, JS/CSS, worker and assets exactly match the tested
build. External Chrome repeated all five workout fixtures, route map exports
(all formats), default location visibility, edited crossing labels and native
share/download fallbacks on the live app using mocked provider tiles.

## Previous change — simpler social image sharing

Release `2026.10.11 1903` replaces separate Share/Download buttons with one
Share Image action. Unsupported or failed native sharing downloads the image;
cancellation leaves the image ready without downloading. Format labels identify
Instagram and TikTok (shared vertical 1080×1920), plus Instagram portrait/square.
Full routes now show by default; optional endpoint hiding remains available.
No storage or backup changes. Both builds, 13 rendered and seven sharing-data
tests pass; changed composer lint has zero errors (one existing image advisory).
External Chrome confirms one action, explicit format labels, full-route default,
optional hiding, native activation/cancel/error fallback and automatic download
across all five workout fixtures and three sizes. Phone/tablet/desktop inspected.
Commit `30a9605` published successfully in Pages run `38182887421`. Live
release `2026.10.11 1903`, JS/CSS, worker and assets match the tested build.
External Chrome repeated all five workout cases and all export sizes live,
including one Share Image action, Instagram/TikTok labels, full-route default,
native sharing and automatic saving fallbacks.

## Previous change — workout image sharing

Release `2026.10.11 1853` adds Share workout to completed Today sessions and
recorded journal details. Isolated adapter, canvas renderer and composer offer
Photo, Route and Workout Card; actual selectable metrics (maximum four),
Story 1080×1920, Portrait 1080×1350 and Square 1080×1080 PNGs. Preview is the
exported file; it is prepared before the share click to preserve native user
activation. Native file sharing has cancellation/error/download fallbacks.
Existing or temporary photos work; temporary photos do not change records.
Routes keep gaps separate, hide 200m around each segment endpoint by default,
and show existing city/state only if selected. No notes, body or nutrition,
raw coordinates or photo metadata go into PNGs; rendering makes no map/API calls.
No storage/backup schemas changed. Builds and 13 rendered + 12 focused tests
pass. External Chrome verifies run/hike/strength/no-photo/missing-metrics/long
strings, three exact PNG sizes, recorded journal entry, metric limits, route
privacy/location options, native activation/cancel/error and immutable records.
Phone 320/440, tablet 768 and desktop 1280 layouts inspected. Physical iPhone
share destinations remain device-dependent and were not physically tested.
Full lint/type checks retain existing repository errors; changed sharing modules
have zero lint errors (one image advisory) and no new TypeScript diagnostics.
Commit `4f3d055` published successfully in Pages run `38182215885`. Live
release `2026.10.11 1853`, JS/CSS, worker and artwork exactly match the tested
build. External Chrome repeated all five workout cases and three export sizes
on the live app, including native activation, cancellation/error, unsupported
file-sharing download fallback, journal entry and unchanged stored records.

## Previous change — featured-day Plan and expanded artwork

Release `2026.10.11 1815` implements approved Option 1: seven preview buttons,
one 2:1 featured illustration, dated workout details/Open workout and a compact
text-only weekly overview. Overview choices reveal the feature; Plan next week
continues to open Settings mapping. Today's selection is initial; previewing
never changes saved workout data. Existing historical resolution is retained.
Yoga, Pilates, Swimming, Pickleball, Tennis and Basketball are built-in choices
without changing anyone's schedule automatically. Shared image selection covers
Home/splash, Today, Plan and journal, including matching legacy custom names.
Speed is explicitly track running, per the user's correction. Seven new JPEG
assets are precached; prompt specifications are in
`docs/featured-plan-artwork-prompts.md`. Existing artwork remains.
A startup guard prevents initial default schedule persistence before stored
mapping loads; external Chrome confirms saved choices survive reload.
Both builds, 13 rendered and 23 focused tests passed. External Chrome checked
seven-day selection/overview, correct dated journal, all six new artworks,
Settings mapping and reload; phone (320/440), tablet (768) and desktop (1280)
layouts were visually inspected without horizontal overflow. Nine existing
TypeScript diagnostics remain; no new diagnostics from this change.
Commit `49e87ce` published successfully in Pages run `38180170383`. Live
release `2026.10.11 1815`, JS/CSS, worker, all icons and all new/existing
artwork match the tested build. External Chrome verified live seven-day Plan
selection/track art, Today panels, unselected add-on examples and all six
destinations. Downloaded backup retained the selected new schedule keys and
Tennis workout type; Home artwork was inspected at phone/tablet/desktop sizes.

## Current change — explicit add-on selection

Release `2026.10.11 1706` keeps Face Pulls and Dead Hang as display-only examples
on Today. Checkboxes now explicitly select/remove an exercise; a separate
Mark done button records completion. Viewing Details never selects an example.
Examples stay out of session data, counts, summaries and backups until chosen.
Existing saved choices/completions remain; unchecking removes that choice and
its completion mark. Picker and Repeat still count as explicit setup choices.
Both builds, 13 rendered tests and 14 focused tests pass. External Chrome checked
empty examples, Details without selection, select/complete/remove, counts,
downloaded backups and reload; phone/tablet/desktop layouts inspected without
horizontal overflow. Commit `1e02f6f` published successfully in Pages run
`38175152170`. Live release `2026.10.11 1706`, JS/CSS, service worker, icons and
artwork match the tested build. External Chrome verified all destinations and
confirmed a Sunday selection does not carry into a newly opened Monday: both
examples remain unchecked with zero selected.

## Current change — tabbed Today workspace

Release `2026.10.11 1600` implements the approved Workout / Log / Check-ins
layout with full-width 2:1 artwork. Repeat prior workout is first; the clean
run/bike tracker is above Add-ons. Selected add-ons use checkboxes; Details
reveals the existing graphic/equipment/timer. Videos remain in Workout. Log
keeps metrics, notes, prior-note copying, photos and screenshot import; optional
items expand. Body and existing Nutrition Yes/No questions are in Check-ins.
Finish/Backup stays above navigation while scrolling. Hidden panels stay mounted,
and active GPS has an Open tracker shortcut on the other two panels.
A finished workout with a body flag now retains its finished state in Today;
calendar flags and stored statuses are preserved. No storage/API/schema changes.

External Chrome tested setup, add-ons, graphics/timer disclosure, photo, metrics,
notes, body/Nutrition, simulated GPS pause/save/map, finish guard, downloaded JSON
backup and reload persistence. Inspected phone, tablet and desktop layouts;
no horizontal overflow. Both builds, 13 rendered tests and 31 focused regression
tests pass. TypeScript retains the nine pre-existing diagnostics; no new diagnostics
in the changed layout or tracker. Commit `6b4dd73` deployed successfully in Pages
run `38170590511`. Live HTTPS verified release `2026.10.11 1600`, exact JS/CSS,
worker, icons and artwork against the tested build. External Chrome verified the
three live Today panels, tracker controls and all six destinations. A final map
safeguard retains the last valid width while a Today panel is hidden, avoiding
nonfinite SVG coordinates; both builds and full Chrome flow pass with NaN/Infinity
console checks. The same release label is retained for this refinement. Physical iPhone
GPS/background limitations remain as documented; tracking behavior is unchanged.

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

## Current change — kettlebell artwork and matching Home image proportions

Release `2026.10.11 1324` applies the approved rear-view Strength and Mobility
examples. Strength holds one correctly shaped kettlebell; Mobility stretches
beside a kettlebell. Easy Aerobic features a woman jogging to balance the set.
Shared selection covers Home/splash, Today, Plan and the journal. The Home image
now uses a 2:1 aspect ratio and responsive width matching Today (150px on the
440px phone layout, capped at 150px to preserve title/description space). New images are precached; older
images remain. Prompts are in `docs/kettlebell-artwork-prompts.md`.

External Chrome at 440×956 checked all three categories on Home, Today and the
journal plus the weekly Plan; inspected images and confirmed matching Home/Today
widths, full figure visibility, six 6px gaps and no horizontal overflow.
Both build paths, 13 rendered-release tests and four artwork tests pass. Also
checked small-phone, tablet and desktop Home layouts; capped the image width to
keep descriptions comfortable on the centered Home card. Commit `eff1fd6`
deployed successfully in Pages run `38159760758`. HTTPS verification confirmed
release `2026.10.11 1324`, exact JS/CSS, worker, icons and all three updated art
files match the local build. No workout storage/API changes.

## Current change — indoor Strength and Mobility artwork

Release `2026.10.10 2258` uses two new indoor watercolor illustrations, keeping
ivory paper texture, blues, sage greens and orange accents consistent with the
landscapes. Strength shows dumbbells and a bench; Mobility shows a seated side
stretch. Shared artwork selection updates Home, Today, Plan and the journal.
Old art files remain. New assets are precached for offline use. Generation
prompts and asset paths are recorded in `docs/indoor-artwork-prompts.md`.

Both builds, 13 rendered tests and four artwork tests pass. External headless
Chrome at 440×956 verified all four surfaces; inspected screenshots and corrected
the Strength figure size to preserve its head and feet in the shallow weekly
cards. All six 6px picture gaps remain, with no horizontal overflow. No workout
storage or API changes. Commit `c872594` deployed successfully in Pages run
`38106925211`; HTTPS checks verified release `2026.10.10 2258`, exact live JS/CSS,
worker, icons, and both indoor illustrations against the local build.

## Current change — saved GPS route maps

Release `2026.10.10 2045` adds local GPS route coordinates, separate pause/gap
segments, OpenStreetMap basemaps with attribution, zoom/fit controls, and city/state
labels inside the image. Today and the journal allow editing labels to cover
missed cities, states and return crossings. Photon names up to eight sampled
points on save; both external services have graceful unavailable fallbacks.
Coordinates remain excluded from AI requests and are included in existing backups.
Old totals-only workouts remain unchanged. Map/place URLs bypass worker caching.

Verified both build paths, rendered-release checks, GPS/save/journal/worker/swipe
tests, real Photon city/state response, and external headless Chrome at 440×956:
recording, pause and gap separation, saved labels, reload and journal maps.
Inspected Today and journal screenshots; no horizontal overflow. Physical iPhone
GPS accuracy and background behavior still require device testing; tracking
continues to pause when the app is hidden. Commit `6055d50` deployed successfully
in GitHub Pages run `38099551872`. Live JS/CSS, worker and icons match the local
build; release `2026.10.10 2045` verified. Photon browser CORS headers verified.

## Current change — accurate month legend colors

Published `2026.10.10 2010`: removes the CSS-generated Skipped legend label;
month legend uses green check/red flag, and separate symbol spans keep completed
body-note days green checked with red flags. Stored statuses and history remain
unchanged. Both builds and 13 rendered tests pass; diff clean. External Chrome
iPhone 440×956 inspected; 30 completed fixture days retain checks, seven body
notes show red flags, no overflow. No storage or API changes. Commit `30e3303`
deployed in successful Pages run `38097565142`; live exact release, JS/CSS and
service worker verified over HTTPS.

## Current change — History Nutrition placement

Published `2026.10.10 2005`: Nutrition check-ins follows the calendar and arrows
in Weekly Details and Month. JSX and flex order agree; arrows remain in normal
content flow. External Chrome iPhone 440×956 inspected both views; geometry,
arrow navigation, check-in expand/collapse and no horizontal overflow verified.
Both builds and 13 rendered tests pass; diff clean. No storage, Nutrition
behavior or API changes. Commit `08d609a` deployed in successful Pages run
`38097318244`; live exact release, JS/CSS and service worker verified over HTTPS.

## Current change — separated Plan pictures

Published `2026.10.10 1954`: six-pixel ivory horizontal gaps separate Plan
landscape pictures, preserving the overall week height, artwork and date/status
labels. Both builds and 13 rendered tests pass; diff clean. External Chrome
440×956 iPhone inspected; all six gaps measure 6px, seven days/action fit without
scrolling or horizontal overflow, and List still shows seven days. No data or
API changes. Commit `c5588b6` deployed in successful Pages run `38096653932`;
live release, exact JS/CSS assets and service worker verified over HTTPS.

## Current change — Settings illustrations and swipe navigation

Published `2026.10.10 1949`: Settings uses Home-style line SVGs, blue with an
orange exercise-library accent; Future workout videos keeps its red YouTube icon.
Left/right touch swipes follow Home/Today/Plan/History/Progress/Settings, stop at
ends and preserve existing tap navigation. Guards exclude fields, horizontal
scrollers, videos, dialogs, journal and screen edges; vertical/slow/short gestures
and scrolling do not navigate. No storage or API changes. Commit `9940614` deployed successfully in Pages run
`38096363559`; live exact release, JS/CSS and service worker verified over HTTPS.
Both builds, 13 rendered and two gesture unit tests pass;
external Chrome iPhone 440×956 inspected icons and navigation/guard behavior,
including a native Chrome touch swipe.
Physical iPhone gesture feel remains for user confirmation.

## Current change — categorized release notes

Published `2026.10.10 1855`: What’s New shows ten recent releases, each with a
Major fix or Minor fix heading. Current ten are minor presentation/display fixes.
Both builds and 13 rendered tests pass; diff clean. External Chrome iPhone
17 Pro Max 440×956 inspected at top/bottom; ten headings, scrolling, close and
no horizontal overflow verified. No storage or API changes. Commit `d024908` deployed successfully in Pages run `38093227191`; live
release, exact JS/CSS assets and service worker verified over HTTPS. User now wants ten release groups.

## Current change — shared tab headers

Published `2026.10.10 1512`: all five entered tabs use matching page title
font, size and top/left alignment. Today gains Today’s workout page heading;
workout type remains within its hero as a section heading. Home stays unique.
Shared page width/padding and title rules replace tab-specific differences.
Both builds and 13 rendered tests pass; diff clean. External Chrome measured
all five titles at x14/y24, Georgia 29px/33.35px on iPhone 17 Pro Max 440×956.
Screenshots inspected; Plan week/action fits without scrolling; no overflow.
No storage or workout behavior changes.
Commit `eda9d4c` deployed in successful Pages run `38078935200`; live exact
release, JS/CSS assets and service worker verified over HTTPS.

## Previous release — complete History/Settings palette

Published `2026.10.10 1500`: Designly brand audit found remaining hardcoded
blue tiles, pastel Settings icons and open-panel controls. Scoped warm ivory,
navy and burnt-orange tokens now cover weekly/month History, Settings icons,
expanded forms, actions, video filters and backup controls. YouTube logo and
semantic completion/error colors retained. No storage or behavior changes.
Both builds and 13 rendered tests pass; diff clean. External Chrome iPhone 17
Pro Max (440 × 956) weekly/month History and closed/open Settings checked;
screenshots inspected, icon specificity corrected, no horizontal overflow.
Commit `64c3f92` deployed in Pages run `38078157661`; live exact release,
JS/CSS assets and service worker verified over HTTPS.

## Previous release — typography and hierarchy

Published `2026.10.10 1449`: approved Designly second pass applied. Shared serif
page titles, system sans card/section headings and GPS units; clear Settings and
Workout history headings; removed redundant Today/Progress copy; warm ivory
History/Settings cards with navy headings. Settings title precedes About.
Both builds and 13 rendered tests pass; diff clean. External Chrome checked all
tabs at phone/tablet/desktop sizes without horizontal overflow; screenshots
inspected and Settings ordering corrected. No workout storage changes.
Commit `62248e9` deployed in successful Pages run `38077616783`; live HTTPS
verified exact release, JS/CSS and service worker.
User now requests only iPhone 17 Pro Max (440 × 956) layout checks going forward.

## Previous release — cohesive training messaging

Published `2026.10.10 1412`: all approved Designly strategy wording applied.
Home uses Today’s workout/Your training and practical destination descriptions;
signature Relentless forward progress kept only on Home. Today mantra removed.
Plan uses Your week ahead, List/Landscape and Plan next week. Journal uses Workout
journal. Progress uses Your progress/Your training balance and days completed
(singular-aware), practical introduction and empty state. Weekly plan replaces
cadence; Body notes replaces Notables; AI Summary replaces Executive summary;
recovery uses same Finish Workout + Backup wording. Progress accessibility name
matches label. No storage, calculations, artwork or routing changes.
Both builds, 13 rendered and 6 journal/progress tests pass; diff clean. External
Chrome traversed Home/all five tabs at phone/tablet/desktop sizes, verified new
labels/accessibility and no overflow; Home/Plan/Progress screenshots inspected.
Commit `3594316` deployed in successful Pages run `38075144519`; HTTPS
verified exact release, JS/CSS assets and worker.

## Previous release — landscape-first figure scale

Published `2026.10.10 1028`: user-approved smaller lifter and jogger replace
strength/aerobic art through shared scene helper. New v2 filenames avoid stale
image caches; originals retained. Figures around half former height, landscapes
lead, natural woman physique and text-free 2:1 framing preserved. No data changes.
Both builds, 13 rendered and 4 scene tests pass; diff clean. External Chrome
verified both iPhone Today cards and phone/tablet/desktop Plan views, overrides
and mapping. Built-in edit prompts: halve figure dimensions including held stone,
keep full figures in landscape with original style/scenery/no lettering.
New assets: public/strength-boulder-v2.png and public/aerobic-jogger-v2.png.
Commit `26bfd5c` deployed in successful Pages run `38060046210`; HTTPS verified
exact release, JS/CSS, worker and both smaller images.

## Previous release — strength and easy aerobic activity artwork

Published `2026.10.10 1023`: built-in image generation finalized approved
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
landscapes with full figures and ivory edges. Commit `c633932` deployed in
successful Pages run `38059551645`; HTTPS verified exact release, JS/CSS, worker
and both new images.

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
- User grants standing permission to publish whenever they request an app change,
  reaffirmed October 10, 2026.
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
- What's New groups the **ten** most recent releases with major/minor headings by dated label.
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
