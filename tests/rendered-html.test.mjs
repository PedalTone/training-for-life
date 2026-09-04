import assert from "node:assert/strict";
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

test("server-renders Training for Life v1.41 with the app home screen", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), env, ctx);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /Training 4 Life/);
  assert.doesNotMatch(html, /class="brand-bar"/);
  assert.match(html, /v1\.41/);
  assert.match(html, /Relentless forward progress/);
  assert.match(html, /Keep showing up/);
  assert.match(html, /Today/);
  assert.match(html, /Performance/);
  assert.doesNotMatch(html, /Primary navigation/);
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
