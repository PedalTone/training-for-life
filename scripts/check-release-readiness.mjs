import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const placeholder=/^(?:—|--|TODO\b|UNTESTED\b|UNVERIFIED\b|PENDING\b|NOT RUN\b|NONE\b|N\/A\b)/i;
const field=(text,name)=>text.match(new RegExp(`^${name}:\\s*(.+)$`,'m'))?.[1]?.trim().replace(/^`|`$/g,'')||'';

// This validates the sign-off, not the truth of human-entered evidence. Automated
// regression results and honest browser/device checks are independently required.
export function releaseReadinessErrors({version,inventory,report}) {
 const errors=[];
 const ids=[...inventory.matchAll(/^\|\s*(CF\d+)\s*\|/gm)].map(match=>match[1]);
 if(!ids.length)errors.push('Critical-feature inventory is missing.');
 if(new Set(ids).size!==ids.length)errors.push('Critical-feature inventory contains duplicate IDs.');
 if(!version||field(report,'Candidate version')!==version)errors.push('Verification version must exactly match APP_VERSION.');
 if(field(report,'Overall decision')!=='PASS')errors.push('Overall decision must be PASS.');
 for(const name of ['Automated evidence','Browser evidence','Device evidence','Data/backup evidence']){
  const value=field(report,name);
  if(!value||placeholder.test(value))errors.push(`${name} is missing or unverified.`);
 }
 const rows=[...report.matchAll(/^\|\s*(CF\d+)\s*\|\s*([^|]+?)\s*\|\s*([^|]*)\|\s*$/gm)];
 const seen=new Set();
 for(const [,id,result,evidence] of rows){
  if(seen.has(id))errors.push(`${id}: duplicate verification row.`);
  seen.add(id);
  if(!ids.includes(id))errors.push(`${id}: not in the critical-feature inventory.`);
  if(result.trim()!=='PASS')errors.push(`${id}: ${result.trim()||'missing result'}; PASS is required.`);
  if(!evidence.trim()||placeholder.test(evidence.trim()))errors.push(`${id}: concrete test evidence is required.`);
 }
 for(const id of ids)if(!seen.has(id))errors.push(`${id}: verification row is missing.`);
 return errors;
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 const root=new URL('../',import.meta.url);
 const [page,inventory,report]=await Promise.all(['app/page.tsx','TESTING_CHECKLIST.md','RELEASE_VERIFICATION.md'].map(path=>readFile(new URL(path,root),'utf8')));
 const version=page.match(/const APP_VERSION = "([^"]+)"/)?.[1];
 const errors=releaseReadinessErrors({version,inventory,report});
 if(errors.length){
  console.error(`Release BLOCKED (${version||'unknown version'}):\n${errors.join('\n')}`);
  process.exitCode=1;
 }else console.log(`Release verification complete for ${version}; all critical-feature sign-offs are PASS.`);
}
