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

// Workout type and GPS activity are different: a Run can belong to Speed,
// Easy aerobic or Endurance. Only infer a genuinely additional type for older
// records without an explicit second-workout selection.
export function historyWorkoutKeys(saved: {secondaryPlanKey?:string; activities?:string[]; activity?:string; gpsWorkouts?:{activity:string}[]} | undefined, plannedKey:string) {
 const keys=[plannedKey];
 if(saved?.secondaryPlanKey && saved.secondaryPlanKey!==plannedKey) return [...keys,saved.secondaryPlanKey];
 const values=[...(saved?.activities||[]),...(saved?.gpsWorkouts||[]).map(workout=>workout.activity),saved?.activity||''].join(' ').toLowerCase();
 if(/\b(strength|kettlebells?|dumbbells?|weights?|gym|bodyweight|press|lifting)\b/.test(values) && !keys.some(key=>key.includes('strength')))keys.push('strength');
 const hasRunningType=()=>keys.some(key=>['aerobic','speed','endurance'].includes(key));
 if(/\b(track|tempo|intervals?|hills?|speed)\b/.test(values) && !hasRunningType())keys.push('speed');
 if(/\b(run|running|walk|walking|bike|biking|cycling|hike|hiking|swim|swimming|endurance|aerobic|peloton)\b/.test(values) && !hasRunningType() && !keys.includes('swimming'))keys.push('endurance');
 return keys.slice(0,2);
}
export const historyWorkoutLabels:Record<string,string>={strength:'Strength',mobility:'Mobility',aerobic:'Easy aerobic',speed:'Speed / intervals',endurance:'Endurance',rest:'Recovery',yoga:'Yoga',pilates:'Pilates',swimming:'Swimming',pickleball:'Pickleball',tennis:'Tennis',basketball:'Basketball'};
export function historyWorkoutLabel(key:string) {
 if(key.includes('strength'))return 'Strength';
 if(key.startsWith('custom:')){try{return decodeURIComponent(key.slice(7));}catch{return 'Custom workout';}}
 return historyWorkoutLabels[key]||'Workout';
}
