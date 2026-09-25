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
  assert.match(html, /2026\.09\.24 1942/);
  assert.match(html, /What’s new\?/);
  assert.match(html, /aria-controls="splash-release-notes"/);
  assert.match(html, /Relentless forward progress/);
  assert.match(html, /Keep showing up/);
  assert.match(html, /Today/);
  assert.match(html, /Performance/);
  assert.doesNotMatch(html, /Primary navigation/);
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
