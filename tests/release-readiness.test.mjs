import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {releaseReadinessErrors,affectedFeatureIds,selectedReleaseTests} from '../scripts/check-release-readiness.mjs';

const version='2026.11.10 0900';
const inventory='| CF01 | Dates |\n| CF02 | Navigation |';
const report=`Candidate version: ${version}
Overall decision: PASS
Affected features: CF01, CF02
Scope rationale: Dates and navigation changed; check both and their shared state.
Automated evidence: Candidate run log and successful build recorded.
Browser evidence: Candidate phone screenshots and workflow results recorded.
Device follow-up: After deployment, recommend physical iPhone touch, GPS and installed-update checks; not claimed tested.
Data/backup evidence: Candidate saved JSON compared before/after isolated restore.
| CF01 | PASS | Fake-clock rollover and saved-date payload comparison passed; report/date.log. |
| CF02 | PASS | All six sections and center touch targets passed; report/navigation.log. |`;
const errors=(patch={})=>releaseReadinessErrors({version,inventory,report,...patch});

test('complete version-matched feature evidence permits pre-publication sign-off',()=>assert.deepEqual(errors(),[]));
test('missing/duplicate feature rows and an empty inventory block publication',()=>{
 assert.match(errors({report:report.replace(/^\| CF02.*$/m,'')}).join('\n'),/CF02: verification row is missing/);
 assert.match(errors({report:report+'\n| CF01 | PASS | Repeated evidence. |'}).join('\n'),/CF01: duplicate/);
 assert.match(errors({inventory:''}).join('\n'),/inventory is missing/);
});
test('failed, blocked, untested or unchanged critical features cannot pass as N/A',()=>{
 for(const result of ['FAIL','BLOCKED','UNTESTED','N/A','UNCHANGED'])
  assert.match(errors({report:report.replace('| CF01 | PASS |',`| CF01 | ${result} |`)}).join('\n'),/CF01: .*PASS is required/);
});
test('stale candidate version and missing overall approval block publication',()=>{
 assert.match(errors({version:'2026.11.11 1000'}).join('\n'),/exactly match APP_VERSION/);
 assert.match(errors({report:report.replace('Overall decision: PASS','Overall decision: BLOCKED')}).join('\n'),/Overall decision must be PASS/);
});
test('placeholder or absent automated/browser/backup evidence blocks publication',()=>{
 for(const name of ['Automated evidence','Browser evidence','Data/backup evidence']){
  assert.match(errors({report:report.replace(new RegExp(`^${name}:.*$`,'m'),`${name}: UNTESTED`)}).join('\n'),/missing or unverified/);
 }
 assert.match(errors({report:report.replace(/\| CF01 \| PASS \|.*$/m,'| CF01 | PASS | TODO |')}).join('\n'),/CF01: concrete test evidence/);
});

test('physical-only checks are recorded recommendations rather than release blockers',()=>{
 assert.deepEqual(errors({report:report+'\nDevice evidence: UNTESTED on physical iPhone.'}),[]);
 assert.match(errors({report:report.replace(/^Device follow-up:.*$/m,'')}).join('\n'),/Device follow-up must list/);
});

test('the full feature inventory stays intact while verification covers the declared scope',async()=>{
 const checklist=await readFile(new URL('../TESTING_CHECKLIST.md',import.meta.url),'utf8');
 const initial=await readFile(new URL('../RELEASE_VERIFICATION.md',import.meta.url),'utf8');
 const ids=[...checklist.matchAll(/^\|\s*(CF\d+)\s*\|/gm)].map(match=>match[1]);
 assert.equal(ids.length,new Set(ids).size);
 for(let number=1;number<=48;number++)assert.ok(ids.includes(`CF${String(number).padStart(2,'0')}`));
 for(const id of affectedFeatureIds(initial))assert.match(initial,new RegExp(`^\\| ${id} \\|`,'m'),`${id} needs a sign-off row`);
 for(const match of checklist.matchAll(/`((?:tests|scripts)\/[\w.-]+\.(?:mjs|py))`/g))await access(new URL('../'+match[1],import.meta.url));
 assert.ok(releaseReadinessErrors({version:'2026.11.09 0758',inventory:checklist,report:initial}).length,'Initial incomplete inventory must not silently certify the live release');
});


test('unaffected features need no fresh verification, while affected gaps still block',()=>{
 const scoped=report.replace('CF01, CF02','CF01').replace(/^\| CF02.*$/m,'');
 assert.deepEqual(errors({report:scoped}),[]);
 assert.match(errors({report:scoped.replace('CF01','CF99')}).join('\n'),/not in the inventory/);
 assert.match(errors({report:scoped.replace(/^Affected features:.*$/m,'')}).join('\n'),/Affected features must identify/);
 assert.match(errors({report:scoped.replace(/^Scope rationale:.*$/m,'')}).join('\n'),/Scope rationale must explain/);
 assert.match(errors({report:report.replace('| CF01 | PASS |','| CF01 | NOT AFFECTED |')}).join('\n'),/PASS is required/);
});
test('release tests follow affected feature coverage rather than running the full inventory',()=>{
 const coverage='| CF01 | Dates | `tests/history-timeline.test.mjs` |\n| CF02 | Videos | `tests/video-captions.test.mjs` |\n| CF38 | Captions | `tests/video-captions.test.mjs` |';
 const scoped=report.replace('CF01, CF02','CF01');
 const selected=selectedReleaseTests({inventory:coverage,report:scoped});
 assert.ok(selected.node.includes('tests/history-timeline.test.mjs'));
 assert.ok(!selected.node.includes('tests/video-captions.test.mjs'));
 assert.equal(selected.captionsHelper,false);
 assert.equal(selectedReleaseTests({inventory:coverage,report:scoped.replace('Affected features: CF01','Affected features: CF38')}).captionsHelper,true);
});
