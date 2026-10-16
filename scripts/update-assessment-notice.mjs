// Metadata only. Never put assessment text or workout data into this public file.
import { writeFile, readFile } from 'node:fs/promises';
import { validateAssessment } from '../app/assessment.ts';
const [fileId, modifiedAt] = process.argv.slice(2);
const notice = validateAssessment({ version: 1, fileId, modifiedAt, checkedAt: new Date().toISOString() });
if (!notice) throw new Error('Supply a verified native Google Doc file ID and its Drive modification timestamp.');
const path = new URL('../public/assessment-latest.json', import.meta.url);
const prior = validateAssessment(JSON.parse(await readFile(path, 'utf8').catch(() => 'null')));
if (prior && Date.parse(notice.modifiedAt) < Date.parse(prior.modifiedAt)) throw new Error('Refusing to replace the notice with an older assessment.');
await writeFile(path, JSON.stringify(notice, null, 2) + '\n');
console.log('Updated assessment notice metadata. Report contents remain private in Google Drive.');
