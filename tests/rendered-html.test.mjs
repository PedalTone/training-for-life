import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  return (await import(workerUrl.href)).default;
}

const env = {
  ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  OPENAI_API_KEY: "test-key",
  INSIGHTS_ACCESS_CODE: "test-code",
};
const ctx = { waitUntil() {}, passThroughOnException() {} };

test("server-renders the dated release and a discreet What’s new control", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), env, ctx);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /Training 4 Life/);
  assert.doesNotMatch(html, /class="brand-bar"/);
  assert.match(html, /2026\.10\.09 2059/);
  assert.match(html, /What’s new\?/);
  assert.match(html, /aria-controls="splash-release-notes"/);
  assert.match(html, /Move well, daily\.<\/span><span>Relentless forward progress\.<\/span>/);
  assert.doesNotMatch(html, /Keep showing up/);
  assert.match(html, /Today/);
  assert.match(html, /<strong>Progress<\/strong><small>How you’re doing<\/small>/);
  assert.doesNotMatch(html, /Primary navigation/);
});

test("splash uses the supplied textured background only on the opening screen", async () => {
  const [css, worker] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../public/service-worker.js", import.meta.url), "utf8"),
  ]);
  assert.match(css, /\.app-shell\.splash-shell \{[^}]*splash-training-texture\.jpg/);
  assert.match(worker, /\.\/splash-training-texture\.jpg/);
});

test("all entered tabs share the texture while Home buttons float", async () => {
  const [page, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(page, /app-shell textured-shell theme-/);
  assert.match(css, /\.app-shell\.textured-shell::before \{[^}]*splash-training-texture\.jpg/);
  assert.match(css, /\.splash-menu button \{[^}]*backdrop-filter: blur\(20px\)/);
  assert.match(css, /\.splash-menu button \{[^}]*0 18px 36px rgba\(20,38,64,\.24\)/);
  assert.match(css, /\.splash-today-button::after \{[^}]*var\(--brand-orange\)/);
  assert.match(page, /todayPlan\.theme/);
});

test("What’s new groups exactly five dated releases", async () => {
  const [page, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  const releaseBlock = page.match(/const RECENT_RELEASES = \[([\s\S]*?)\n\];/)?.[1] ?? "";
  assert.equal((releaseBlock.match(/\{ version:/g) ?? []).length, 5);
  assert.match(releaseBlock, /2026\.10\.06 2229/);
  assert.match(releaseBlock, /2026\.10\.06 2222/);
  assert.match(releaseBlock, /2026\.10\.09 1936/);
  assert.match(releaseBlock, /2026\.10\.09 1928/);
  assert.match(page, /What’s new in the last five releases/);
  assert.match(page, /RECENT_RELEASES\.map\(\(release\) => <div className="splash-release-group"/);
  assert.match(css, /\.splash-release-notes \{ box-sizing: border-box; max-height:/);
  assert.match(page, /aria-label="Close What’s new"/);
  assert.match(css, /\.splash-release-header button \{[^}]*44px/);
});

test("Plan shortcut opens weekly mapping and leaves room above navigation", async () => {
  const [page, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(page, /Make Plan for Next Week/);
  assert.match(page, /const makePlanForNextWeek = \(\) => \{ setOpenScheduleOnSettings\(true\); navigate\("more"\); \}/);
  assert.match(page, /mapping\.open = true/);
  assert.match(page, /Weekly workout mapping/);
  assert.match(css, /\.week-page \{ padding-bottom: 12px;/);
});

test("new home-screen icon is referenced by both iPhone and PWA metadata", async () => {
  const [manifest, html, layout, worker] = await Promise.all([
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/service-worker.js", import.meta.url), "utf8"),
  ]);
  assert.match(manifest, /icon-192-2026\.09\.28-0727\.png/);
  assert.match(manifest, /icon-512-2026\.09\.28-0727\.png/);
  assert.match(html, /apple-touch-icon-2026\.09\.28-0727\.png/);
  assert.match(layout, /apple-touch-icon-2026\.09\.28-0727\.png/);
  assert.match(worker, /apple-touch-icon-2026\.09\.28-0727\.png/);
});

test("Progress recommendations show their full text in auto-sizing cards", async () => {
  const [page, css, insightsWorker] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../worker/training-insights.ts", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(page, /conciseText\(concise\.recommendation,\s*18\)/);
  assert.match(css, /\.exercise-recommendation \{[^}]*height:\s*auto/);
  assert.match(css, /\.exercise-recommendation p \{[^}]*overflow-wrap:\s*anywhere/);
  assert.match(insightsWorker, /Do not choose decrease merely to be cautious/);
  assert.match(insightsWorker, /Never generalize one body concern across unrelated exercise types/);
});

test("protects screenshot extraction with the personal access code", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(new Request("http://localhost/api/workout-screenshot", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Training-Insights-Key": "wrong-code" },
    body: JSON.stringify({ imageData: "data:image/jpeg;base64,AA==" }),
  }), env, ctx);
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "The AI access code is incorrect." });
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("counts all seven History days and does not override completed Recovery styling", async () => {
  const [page, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(page, /days\.slice\(0,\s*6\).*complete/);
  assert.match(page, /\{days\.length\} complete/);
  assert.match(css, /button\.rest:not\(\.completed\).* i/);
  assert.doesNotMatch(css, /button\.rest i \{ background: #dce9dd/);
});

test("History labels only the actual current calendar week as This Week", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /dateKey\(days\[0\]\) === dateKey\(weekDates\(now\)\[0\]\) \? "THIS WEEK"/);
  assert.doesNotMatch(page, /index === weekBlocks\.length - 1 \? "THIS WEEK"/);
});

test("one-day workout changes are the authoritative Plan and History type", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /update\(\{ planOverride: true,[\s\S]*?\}, true\)/);
  assert.match(page, /setHistory\(\(items\) => \[next, \.\.\.items\.filter/);
  assert.match(page, /const chosen = loaded \? session : existing \|\| session/);
  assert.match(page, /function WeekView[\s\S]*?historicalPlan\(saved, scheduleForDate/);
  assert.match(page, /function HistoryView[\s\S]*?const plan = historicalPlan\(saved, scheduleForDate/);
  assert.match(page, /<span className="history-day-icon"[^>]*>\{plan\.icon\}<\/span>/);
});

test("Weekly workout mapping follows the app's Monday-through-Sunday order", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /\[1, 2, 3, 4, 5, 6, 0\]\.map\(\(index\) =>/);
  assert.doesNotMatch(page, /className="schedule-editor">\{schedule\.map/);
});

test("add-on exercise titles are explicitly editable and rename saved selections", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /Add-on exercise library/);
  assert.match(page, /Exercise title/);
  assert.match(page, /saveExerciseTitle/);
  assert.match(page, /const mobilityExercises = renameList/);
  assert.match(page, /const completedExercises = renameList/);
  assert.match(page, /Existing workout selections were updated/);
});
