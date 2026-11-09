import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');

test('design report links remain valid and project guidance requires its review',async()=>{
 const report=await read('DESIGN_STANDARDS.md');
 for(const match of report.matchAll(/\]\(([^)]+)\)/g)){
  const target=match[1];if(/^https?:/.test(target))continue;
  await access(new URL(target.split('#')[0],root));
 }
 for(const path of ['AGENTS.md','README.md','TESTING_CHECKLIST.md','DESIGN_STANDARDS.md']){
  const text=await read(path);
  if(path!=='DESIGN_STANDARDS.md')assert.match(text,/\]\(DESIGN_STANDARDS\.md\)/,`${path} must link the design report`);
  assert.match(text,/Review DESIGN_STANDARDS\.md for every app change/,`${path} must require review for every app change`);
 }
 for(const path of ['AGENTS.md','DESIGN_STANDARDS.md','TESTING_CHECKLIST.md'])assert.match(await read(path),/Review duplicate functions and buttons for every app change\./,`${path} must require duplicate functionality review`);
 const checklist=await read('TESTING_CHECKLIST.md');
 assert.match(checklist,/D01[–-]D12/);
 assert.match(checklist,/PASS.*FAIL.*N\/A/);
});

test('design documentation checks run in both npm test and GitHub release checks',async()=>{
 const {scripts}=JSON.parse(await read('package.json'));
 assert.equal(scripts['test:design'],'node --test tests/design-standards.test.mjs');
 assert.equal(scripts['test:regression'],'node --experimental-strip-types --test tests/*.test.mjs');
 assert.match(scripts.test,/npm run build\s*&&\s*npm run test:regression/);
 assert.match(scripts.test,/npm run test:captions-helper/);
 assert.equal(scripts['test:captions-helper'],'python3 tests/video-caption-fallback.test.py');
 assert.equal(scripts['verify:release'],'node scripts/check-release-readiness.mjs');
 for(const path of ['AGENTS.md','README.md','TESTING_CHECKLIST.md','DESIGN_STANDARDS.md']){
  const text=await read(path);
  assert.match(text,/RELEASE_VERIFICATION\.md/,`${path} must retain the critical-feature evidence gate`);
 }
 const workflow=await read('.github/workflows/deploy-pages.yml');
 assert.match(workflow,/run: npm test/);
 assert.match(workflow,/run: npm run verify:release/);
 assert.ok(workflow.indexOf('run: npm test')<workflow.indexOf('run: npm run build:pages'));
 assert.ok(workflow.indexOf('run: npm run verify:release')<workflow.indexOf('uses: actions/upload-pages-artifact'));
});
