import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateAssessment, assessmentRevision, assessmentUrl } from '../app/assessment.ts';
const notice = { version: 1, fileId: '1vsWuDF-erzfb8C8AGkFwv0ARiTdsRYxylFTNd6nju68', modifiedAt: '2026-10-16T23:52:27.978Z', checkedAt: '2026-10-17T00:00:00Z' };
test('assessment notices reject malformed and injected document URLs', () => {
  assert.deepEqual(validateAssessment(notice), notice);
  for (const value of [null, {}, {...notice,version:2}, {...notice,fileId:'https://evil.example/test'}, {...notice,fileId:'../../other/file'}, {...notice,modifiedAt:'invalid'}, {...notice,checkedAt:null}]) assert.equal(validateAssessment(value),null);
  assert.equal(assessmentUrl(notice,true),`https://docs.google.com/document/d/${notice.fileId}/preview`);
});
test('edits to the same Drive document become unread again', () => {
  assert.notEqual(assessmentRevision(notice),assessmentRevision({...notice,modifiedAt:'2026-10-18T23:00:00Z'}));
  assert.equal(assessmentRevision(notice),assessmentRevision({...notice,checkedAt:'2026-10-18T23:00:00Z'}));
});
test('published notice contains metadata only and service worker bypasses private Google viewer', async () => {
  const data=JSON.parse(await readFile(new URL('../public/assessment-latest.json',import.meta.url),'utf8'));
  assert.deepEqual(Object.keys(data).sort(),['checkedAt','fileId','modifiedAt','version']); assert.ok(validateAssessment(data));
  const source=await readFile(new URL('../public/service-worker.js',import.meta.url),'utf8');
  assert.match(source,/assessment-latest\.json/); assert.match(source,/docs\.google\.com/);
});
