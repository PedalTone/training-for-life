# Training for Life pre-ship testing checklist

Run this checklist before every patch and release. The goal is to verify the complete user journey, not just that the build succeeds.

## 1. Source and version

- [ ] Confirm the version matches the change: patch (`1.39.1`) for fixes/polish, minor (`1.40`) for a backward-compatible feature, major (`2.0`) only after explicit agreement.
- [ ] Confirm the version is visible in the Today header.
- [ ] Check `git diff --check` and confirm only intended files changed.

## 2. Automated checks

- [ ] Run `npm test`.
- [ ] Run `npm run build:pages`.
- [ ] Confirm both rendered HTML tests pass and no build errors are hidden by warnings.

## 3. Four-tab product journey

- [ ] Today: the correct date and workout type appear; controls are readable; Finish + Backup has a clear saved/completed state; reopening the day preserves data.
- [ ] Week: dates are chronological, today is obvious, schedule icons match the active mapping, and the compact intro does not crowd the calendar.
- [ ] History: Weekly Details shows three chronological weeks with the current week at the bottom; previous/next navigation works; prior schedule snapshots are used; blank/unassigned days do not show false Rest; icons and status marks remain readable.
- [ ] Performance: rhythm, streak, consistency, weekly completion, injuries, goals context, and AI insights are separate from History.
- [ ] Config: collapsible sections—including Future workout videos—start closed; mobility editing, reference photos, descriptions, schedule mapping, YouTube links, backup, and restore remain usable.

## 4. Persistence and regression checks

- [ ] Finish a workout, reload, and confirm status, notes, details, mobility, links, and injury data persist.
- [ ] Add mobility exercises, reload, and confirm the mobility section is collapsed while the loaded exercises remain present.
- [ ] Change the schedule mapping and confirm it affects future planning without rewriting prior history.
- [ ] Check History and Week after changing the mapping; prior dates must retain their historical types.
- [ ] Verify backup filename includes date/time and restore does not erase unrelated data.

## 5. Responsive visual QA

- [ ] Inspect rendered desktop, tablet, and iPhone-sized views.
- [ ] Look for small text, clipped labels, crowded rows, excessive blank space, horizontal scrolling, and bottom-nav overlap.
- [ ] Confirm buttons have clear labels and adequate touch targets; icons never carry meaning by color alone.

## 6. Live release verification

- [ ] Push the exact tested commit to GitHub and Sites source.
- [ ] Save and deploy only that commit/archive.
- [ ] Wait for deployment success, then reload the live URL.
- [ ] Click Today, Week, History, Performance, and Config on the live app and verify the release version and primary layout.
