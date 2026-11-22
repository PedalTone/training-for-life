import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {affectedFeatureIds,selectedReleaseTests} from './check-release-readiness.mjs';
const [inventory,report]=await Promise.all(['TESTING_CHECKLIST.md','RELEASE_VERIFICATION.md'].map(path=>readFile(new URL('../'+path,import.meta.url),'utf8')));
const selected=selectedReleaseTests({inventory,report});
console.log(`Affected features: ${affectedFeatureIds(report).join(', ')}; ${selected.node.length} Node test files.`);
const result=spawnSync(process.execPath,['--experimental-strip-types','--test',...selected.node],{stdio:'inherit'});
if(result.error)throw result.error;
if(result.status!==0)process.exit(result.status||1);
if(selected.captionsHelper){const captions=spawnSync('python3',['tests/video-caption-fallback.test.py'],{stdio:'inherit'});if(captions.error)throw captions.error;if(captions.status!==0)process.exit(captions.status||1);}
