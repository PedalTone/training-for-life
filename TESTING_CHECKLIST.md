# Training for Life pre-ship testing checklist

Run this checklist before every patch and release. The goal is to verify the complete user journey, not just that the build succeeds.

## 1. Source and version

- [ ] Record the release decision in VERSIONING.md. Public releases use the America/New_York publication timestamp `YYYY.MM.DD HHmm`; internal changes retain the current label.
- [ ] Confirm the displayed release, release notes, tests, service-worker cache identifier, and deployed files match.
- [ ] Check `git diff --check` and confirm only intended files changed.

## 2. Automated checks

- [ ] Run `npm test`.
- [ ] Run `npm run build:pages`.
- [ ] Confirm all rendered HTML tests pass and no build errors are hidden by warnings.

## 3. Product journey

- [ ] Home: Today shows the resolved workout; all five destinations work; What’s New displays ten categorized release groups and its close button works.

- [ ] Today: the correct date and workout type appear; controls are readable; Finish + Backup has a clear saved/completed state; reopening the day preserves data.
- [ ] Plan: dates are chronological, today is obvious, schedule icons match the active mapping, and the compact intro does not crowd the calendar.
- [ ] History: 12 chronological weeks scroll with the current week initially visible; Earlier/Later move three weeks and load older windows at the edges; Back to this week and journal-return position work; prior schedule snapshots are used; blank/unassigned days do not show false Rest; icons and status marks remain readable.
- [ ] Progress: percentage bars use all completed days as the denominator, including labeled recovery; zero core/previously recorded types remain visible; 4/8/12 weeks update counts/order/observations; colors match History; completed add-ons expand and exclude uncompleted selections; comparisons and saved reports remain available.
- [ ] Settings: collapsible sections—including Future workout videos—start closed; mobility editing, reference photos, descriptions, schedule mapping, YouTube links, backup, and restore remain usable.

## 4. Persistence and regression checks

- [ ] Finish a workout, reload, and confirm status, notes, details, mobility, links, and injury data persist.
- [ ] Add mobility exercises, reload, and confirm the mobility section is collapsed while the loaded exercises remain present.
- [ ] Change the schedule mapping and confirm it affects future planning without rewriting prior history.
- [ ] Check History and Plan after changing the mapping; prior dates must retain their historical types.
- [ ] Verify backup filename includes date/time and restore does not erase unrelated data.

## 5. Responsive visual QA

- [ ] Inspect rendered iPhone-sized views and safe areas; no tablet or desktop visual testing is required.
- [ ] Look for small text, clipped labels, crowded rows, excessive blank space, horizontal scrolling, and bottom-nav overlap.
- [ ] Confirm buttons have clear labels and adequate touch targets; icons never carry meaning by color alone.

## 6. Live release verification

- [ ] Push the exact tested frontend commit to GitHub; confirm the Pages workflow succeeds for that commit.
- [ ] If worker/API code changed, separately deploy the verified source through the Sites hosting workflow. A Pages push does not update the worker.
- [ ] Wait for deployment success, then reload the live URL.
- [ ] Click Home, Today, Plan, History, Performance, and Settings on the live app and verify the release version and primary layout.
