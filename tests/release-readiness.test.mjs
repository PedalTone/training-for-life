import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {releaseReadinessErrors} from '../scripts/check-release-readiness.mjs';

const version='2026.11.10 0900';
const inventory='| CF01 | Dates |\n| CF02 | Navigation |';
const report=`Candidate version: ${version}
Overall decision: PASS
Automated evidence: Candidate run log and successful build recorded.
Browser evidence: Candidate phone screenshots and workflow results recorded.
Device evidence: Dated device confirmations and any justified carry-forward are recorded.
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
test('placeholder or absent browser/device/backup evidence is not certification',()=>{
 for(const name of ['Automated evidence','Browser evidence','Device evidence','Data/backup evidence']){
  assert.match(errors({report:report.replace(new RegExp(`^${name}:.*$`,'m'),`${name}: UNTESTED`)}).join('\n'),/missing or unverified/);
 }
 assert.match(errors({report:report.replace(/\| CF01 \| PASS \|.*$/m,'| CF01 | PASS | TODO |')}).join('\n'),/CF01: concrete test evidence/);
});
test('all established critical features have unique inventory and verification entries',async()=>{
 const checklist=await readFile(new URL('../TESTING_CHECKLIST.md',import.meta.url),'utf8');
 const initial=await readFile(new URL('../RELEASE_VERIFICATION.md',import.meta.url),'utf8');
 const ids=[...checklist.matchAll(/^\|\s*(CF\d+)\s*\|/gm)].map(match=>match[1]);
 assert.equal(ids.length,new Set(ids).size);
 for(let number=1;number<=48;number++)assert.ok(ids.includes(`CF${String(number).padStart(2,'0')}`));
 for(const id of ids)assert.match(initial,new RegExp(`^\\| ${id} \\|`,'m'),`${id} needs a sign-off row`);
 for(const match of checklist.matchAll(/`((?:tests|scripts)\/[\w.-]+\.(?:mjs|py))`/g))await access(new URL('../'+match[1],import.meta.url));
 assert.ok(releaseReadinessErrors({version:'2026.11.09 0758',inventory:checklist,report:initial}).length,'Initial incomplete inventory must not silently certify the live release');
});
