// Run against an isolated external Chrome started with --remote-debugging-port=9223.
// Every viewport uses a disposable browser context; no existing browser data is read.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";

const endpoint = await (await fetch(`${process.env.CHROME_CDP_URL || "http://127.0.0.1:9223"}/json/version`)).json();
const socket = new WebSocket(endpoint.webSocketDebuggerUrl);
await new Promise(resolve => socket.addEventListener("open", resolve, { once: true }));
let nextId = 0;
const pending = new Map();
socket.addEventListener("message", event => {
  const message = JSON.parse(event.data), request = pending.get(message.id);
  if (!request) return;
  pending.delete(message.id);
  if (message.error) request.reject(new Error(JSON.stringify(message.error)));
  else request.resolve(message.result);
});
const call = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
  const id = ++nextId;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params, sessionId }));
});
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function check(width, height) {
  const { browserContextId } = await call("Target.createBrowserContext");
  try {
    const { targetId } = await call("Target.createTarget", { url: "about:blank", browserContextId });
    const { sessionId } = await call("Target.attachToTarget", { targetId, flatten: true });
    const cdp = (method, params = {}) => call(method, params, sessionId);
    const evaluate = async expression => {
      const result = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
      return result.result.value;
    };
    const wait = async expression => {
      for (let i = 0; i < 100; i++) {
        if (await evaluate(expression)) return;
        await delay(50);
      }
      throw new Error(`Timed out: ${expression}`);
    };
    const tap = async selector => {
      const point = await evaluate(`(() => {
        const element = document.querySelector(${JSON.stringify(selector)});
        if (!element) throw new Error('Missing ' + ${JSON.stringify(selector)});
        element.scrollIntoView({ block: 'center', behavior: 'instant' });
        const r = element.getBoundingClientRect(), x = r.x + r.width / 2, y = r.y + r.height / 2;
        if (!element.contains(document.elementFromPoint(x, y))) throw new Error('Obscured ' + ${JSON.stringify(selector)});
        return { x, y };
      })()`);
      await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...point, radiusX: 8, radiusY: 8 }] });
      await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await delay(120);
    };
    const visible = selector => evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)}), r = element.getBoundingClientRect();
      const main = document.querySelector('main').getBoundingClientRect(), nav = document.querySelector('.bottom-nav').getBoundingClientRect();
      return r.top >= main.top && r.bottom <= nav.top && r.left >= 0 && r.right <= innerWidth;
    })()`);
    const screenshot = async name => {
      await writeFile(`/private/tmp/t4l-today-${width}-${name}.png`, Buffer.from((await cdp("Page.captureScreenshot", { format: "png" })).data, "base64"));
    };
    const primary = ".day-workout-override label:first-child select";
    const secondary = ".day-workout-override label:nth-child(2) select";
    const checkDestination = async selector => {
      await wait("document.querySelector('.activity-card').open && !document.querySelector('#today-panel-workout').hidden");
      await delay(550);
      assert.equal(await visible(selector), true, `Destination visible at ${width}: ${selector}`);
      assert.equal(await evaluate(`document.activeElement === document.querySelector(${JSON.stringify(selector)})`), true, "Destination receives focus");
    };
    await cdp("Page.enable");
    await cdp("Runtime.enable");
    await cdp("Emulation.setTimezoneOverride", { timezoneId: "America/New_York" });
    await cdp("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: true });
    await cdp("Emulation.setTouchEmulationEnabled", { enabled: true });
    await cdp("Page.addScriptToEvaluateOnNewDocument", { source: `
      sessionStorage.setItem('t4l:entered-app', '1');
      window.__todayTestDocument = crypto.randomUUID();
      window.showSaveFilePicker = async () => ({ createWritable: async () => ({
        write: async blob => { window.__backup = JSON.parse(await blob.text()); }, close: async () => {}
      }) });
    ` });
    await cdp("Page.navigate", { url: process.env.APP_URL || "http://127.0.0.1:5174/training-for-life/app/" });
    await wait("document.querySelector('.today-save-state')?.textContent === 'Saved on this device'");
    assert.equal(await evaluate("[...document.querySelectorAll('.today-workout-summary button')].every(e => { const r=e.getBoundingClientRect(); return r.width>=44 && r.height>=44; })"), true, "Summary buttons have 44px touch targets");
    await evaluate("document.querySelector('main').scrollTo({ top: 0, behavior: 'instant' })");
    await screenshot("fresh");
    await tap(".today-workout-summary-heading button");
    await checkDestination(primary);
    await screenshot("manage");
    // Repeat while already open, and after switching away to Log/Check-ins.
    await tap(".today-workout-summary-heading button");
    await checkDestination(primary);
    await tap("#today-tab-log");
    await tap(".today-workout-card.primary button");
    await checkDestination(primary);
    await tap(".activity-card > summary");
    await tap(".today-add-major");
    await checkDestination(secondary);
    await evaluate(`(() => { const select = document.querySelector(${JSON.stringify(secondary)}); select.value = 'strength'; select.dispatchEvent(new Event('change', { bubbles: true })); })()`);
    await wait("Boolean(document.querySelector('.today-workout-card.secondary'))");
    await tap("#today-tab-check-ins");
    await tap(".today-workout-card.secondary button");
    await checkDestination(secondary);
    await tap("#today-tab-log");
    await tap(".today-note-label textarea");
    await cdp("Input.insertText", { text: "Today button regression: retain this note." });
    await tap(".finish-button");
    await wait("Boolean(document.querySelector('.workout-lock-banner')) && !document.querySelector('.finish-button')");
    assert.equal(await evaluate("document.querySelector('.today-hero').nextElementSibling.classList.contains('workout-lock-banner')"), true, "Edit directly beneath picture");
    assert.equal(await evaluate("document.querySelectorAll('.workout-lock-banner').length"), 1, "Single saved/Edit banner");
    assert.equal(await evaluate("Boolean(document.querySelector('.today-workout-summary-heading button') || document.querySelector('.today-add-major'))"), false, "Locked day shows Edit instead of unavailable management actions");
    const backup = await evaluate("window.__backup");
    assert.match(JSON.stringify(backup), /Today button regression: retain this note/);
    assert.match(JSON.stringify(backup), /secondaryPlanKey/);
    await evaluate("document.querySelector('main').scrollTo({ top: 0, behavior: 'instant' })");
    await screenshot("saved");
    await tap(".today-workout-card.primary button");
    await checkDestination("#today-workout-details");
    assert.equal(await evaluate("document.querySelector('.workout-edit-fields').disabled"), true, "Viewing retains lock");
    await tap(".workout-lock-banner button");
    await wait("!document.querySelector('.workout-lock-banner') && Boolean(document.querySelector('.workout-editing-note'))");
    await tap(".today-workout-summary-heading button");
    await checkDestination(primary);
    assert.equal(await evaluate("document.querySelector('.workout-edit-fields').disabled"), false, "Edit unlocks controls");
    // Cancelled optional backup must still leave the changed day saved and locked.
    await evaluate("window.showSaveFilePicker = async () => { throw new DOMException('Cancelled', 'AbortError'); }");
    await tap(".finish-button");
    await wait("Boolean(document.querySelector('.workout-lock-banner')) && !document.querySelector('.finish-button')");
    const previousDocument = await evaluate("window.__todayTestDocument");
    await cdp("Page.reload", { ignoreCache: true });
    await wait(`window.__todayTestDocument !== ${JSON.stringify(previousDocument)} && Boolean(document.querySelector('.workout-lock-banner'))`);
    assert.equal(await evaluate("document.querySelector('.today-hero').nextElementSibling.classList.contains('workout-lock-banner')"), true);
    await tap(".workout-lock-banner button");
    await tap("#today-tab-log");
    assert.equal(await evaluate("document.querySelector('.today-note-label textarea').value"), "Today button regression: retain this note.");
    // Shared navigation remains usable after the changed workflow.
    for (const name of ["Plan", "History", "Progress", "Settings", "Today"]) {
      const selector = await evaluate(`(() => {const buttons = [...document.querySelectorAll('.bottom-nav button')]; return '.bottom-nav button:nth-child(' + (buttons.findIndex(e => e.textContent.trim() === ${JSON.stringify(name)}) + 1) + ')';})()`);
      await tap(selector);
      assert.equal(await evaluate(`document.querySelector(${JSON.stringify(selector)}).getAttribute('aria-current')`), "page");
    }
    assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth"), true, "No horizontal overflow");
    await tap(".bottom-nav .home-nav");
    await wait("Boolean(document.querySelector('.splash-version'))");
    console.log(`Release ${await evaluate("document.querySelector('.splash-version span').textContent")}`);
    console.log(`PASS ${width}×${height}: native center taps, Manage/Open/Add, focus/scroll, saved Edit order, view lock, edit/re-save/reload, backup, navigation.`);
  } finally {
    await call("Target.disposeBrowserContext", { browserContextId });
  }
}
try {
  for (const [width, height] of [[375, 667], [393, 852], [440, 956]]) await check(width, height);
} finally { socket.close(); }
