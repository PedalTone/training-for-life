import type { Session } from './page';
export type ProgressEntry = {session:Session;key:string;theme:string};
const day = (date:string) => Date.parse(`${date}T12:00:00Z`) / 86400000;
export function localProgress(entries:ProgressEntry[], today:string, weeks:number, library:string[]) {
 const past=entries.filter(e=>e.session.date<=today).sort((a,b)=>b.session.date.localeCompare(a.session.date));
 const period=past.filter(e=>day(today)-day(e.session.date)<weeks*7);
 const finished=period.filter(e=>e.session.status==='completed'||e.session.status==='rest');
 const counts=new Map<string,number>();
 for(const e of finished) counts.set(e.key,(counts.get(e.key)||0)+1);
 const supporting=period.filter(e=>(e.session.completedExercises||[]).length>0).length;
 const comparisons: {theme:string;latest:Session;prior:Session}[]=[];
 for(const e of period.filter(e=>e.session.status==='completed')) {
  if(comparisons.some(c=>c.theme===e.theme))continue;
  const activity=(s:Session)=>(s.activities?.length?s.activities:[s.activity]).filter(Boolean).map(a=>a.toLowerCase().trim()).sort().join('|');
  if(!activity(e.session))continue;
  const prior=period.find(p=>p.session.date<e.session.date&&p.theme===e.theme&&p.session.status==='completed'&&activity(p.session)===activity(e.session));
  if(prior)comparisons.push({theme:e.theme,latest:e.session,prior:prior.session});
 }
 const revisit=library.flatMap(name=>{
  const last=past.find(e=>(e.session.completedExercises||[]).includes(name));
  if(!last)return [];
  const days=Math.round(day(today)-day(last.session.date));
  return days>=14?[{name,days,date:last.session.date}]:[];
 }).sort((a,b)=>b.days-a.days||a.name.localeCompare(b.name)).slice(0,3);
 return {counts,supporting,finished,comparisons,revisit};
}
