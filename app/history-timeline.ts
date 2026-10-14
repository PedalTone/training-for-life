export function mondayOf(date:Date) {
 const start=new Date(date);start.setHours(12,0,0,0);start.setDate(start.getDate()-((start.getDay()+6)%7));return start;
}
export function historyWeeks(cursor:Date,count=12) {
 const end=mondayOf(cursor);
 return Array.from({length:count},(_,week)=>Array.from({length:7},(_,day)=>{const date=new Date(end);date.setDate(end.getDate()-(count-1-week)*7+day);return date;}));
}
export function shiftHistoryWeeks(cursor:Date,direction:number,today:Date) {
 const date=mondayOf(cursor);date.setDate(date.getDate()+direction*21);
 const latest=mondayOf(today);return date>latest?latest:date;
}
export const historyWorkoutColors = {strength:'#a34e24',mobility:'#287c80',aerobic:'#315f9e',speed:'#77587c',endurance:'#526d91',rest:'#6d777e'};
export function historyWorkoutColor(key:string) {
 if(key.includes('strength'))return historyWorkoutColors.strength;
 if(['mobility','yoga','pilates'].includes(key))return historyWorkoutColors.mobility;
 if(key==='swimming')return historyWorkoutColors.aerobic;
 return historyWorkoutColors[key as keyof typeof historyWorkoutColors]||'#203449';
}
