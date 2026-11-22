import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const placeholder=/^(?:—|--|TODO\b|UNTESTED\b|UNVERIFIED\b|PENDING\b|NOT RUN\b|NONE\b|N\/A\b)/i;
const field=(text,name)=>text.match(new RegExp(`^${name}:\\s*(.+)$`,'m'))?.[1]?.trim().replace(/^`|`$/g,'')||'';
export const affectedFeatureIds=report=>field(report,'Affected features').match(/\bCF\d+\b/g)||[];
export function releaseScopeErrors({inventory,report}) {
 const known=[...inventory.matchAll(/^\|\s*(CF\d+)\s*\|/gm)].map(match=>match[1]);
 const affected=affectedFeatureIds(report),errors=[];
 if(!known.length)errors.push('Critical-feature inventory is missing.');
 if(new Set(known).size!==known.length)errors.push('Critical-feature inventory contains duplicate IDs.');
 if(!affected.length)errors.push('Affected features must identify the changed features and dependencies.');
 if(new Set(affected).size!==affected.length)errors.push('Affected features contains duplicate IDs.');
 for(const id of affected)if(!known.includes(id))errors.push(`${id}: affected feature is not in the inventory.`);
 if(!field(report,'Scope rationale')||placeholder.test(field(report,'Scope rationale')))errors.push('Scope rationale must explain the affected features and dependencies.');
 return errors;
}
export function selectedReleaseTests({inventory,report}) {
 const errors=releaseScopeErrors({inventory,report});if(errors.length)throw new Error(errors.join('\n'));
 const affected=new Set(affectedFeatureIds(report));
 const tests=new Set(['tests/design-standards.test.mjs','tests/release-readiness.test.mjs']);
 for(const match of inventory.matchAll(/^\|\s*(CF\d+)\s*\|(.+)$/gm)){
  if(!affected.has(match[1]))continue;
  for(const file of match[2].matchAll(/`(tests\/[\w.-]+\.mjs)`/g))tests.add(file[1]);
 }
 return {node:[...tests].sort(),captionsHelper:affected.has('CF38')};
}
// Evidence applies to the declared affected features. The full inventory remains
// the reference; unrelated features need no fresh sign-off or physical test.
export function releaseReadinessErrors({version,inventory,report}) {
 const errors=releaseScopeErrors({inventory,report});
 const known=[...inventory.matchAll(/^\|\s*(CF\d+)\s*\|/gm)].map(match=>match[1]);
 const affected=affectedFeatureIds(report);
 if(!version||field(report,'Candidate version')!==version)errors.push('Verification version must exactly match APP_VERSION.');
 if(field(report,'Overall decision')!=='PASS')errors.push('Overall decision must be PASS.');
 for(const name of ['Automated evidence','Browser evidence','Data/backup evidence']){
  const value=field(report,name);
  if(!value||placeholder.test(value))errors.push(`${name} is missing or unverified.`);
 }
 const deviceFollowUp=field(report,'Device follow-up');
 if(!deviceFollowUp||placeholder.test(deviceFollowUp))errors.push('Device follow-up must list post-deployment recommendations or dated device results.');
 const rows=[...report.matchAll(/^\|\s*(CF\d+)\s*\|\s*([^|]+?)\s*\|\s*([^|]*)\|\s*$/gm)],seen=new Set();
 for(const [,id,result,evidence] of rows){
  if(seen.has(id))errors.push(`${id}: duplicate verification row.`);
  seen.add(id);
  if(!known.includes(id))errors.push(`${id}: not in the critical-feature inventory.`);
  const valid=result.trim()==='PASS'||(!affected.includes(id)&&result.trim()==='NOT AFFECTED');
  if(!valid)errors.push(`${id}: ${result.trim()||'missing result'}; PASS is required for affected features.`);
  if(!evidence.trim()||placeholder.test(evidence.trim()))errors.push(`${id}: concrete test evidence is required.`);
 }
 for(const id of affected)if(!seen.has(id))errors.push(`${id}: verification row is missing.`);
 return errors;
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 const root=new URL('../',import.meta.url);
 const [page,inventory,report]=await Promise.all(['app/page.tsx','TESTING_CHECKLIST.md','RELEASE_VERIFICATION.md'].map(path=>readFile(new URL(path,root),'utf8')));
 const version=page.match(/const APP_VERSION = "([^"]+)"/)?.[1];
 const errors=releaseReadinessErrors({version,inventory,report});
 if(errors.length){console.error(`Release BLOCKED (${version||'unknown version'}):\n${errors.join('\n')}`);process.exitCode=1;}
 else console.log(`Release verification complete for ${version}; affected features ${affectedFeatureIds(report).join(', ')} are PASS.`);
}
