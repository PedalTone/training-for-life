import type {GpsWorkout} from './gps-math';
export function gpsEditDistance(workout:GpsWorkout,unit:'mi'|'km') {return (workout.meters/(unit==='mi'?1609.344:1000)).toFixed(3);}
export function editGpsWorkout(workout:GpsWorkout,values:{activity:'Run'|'Bike';distance:string;duration:string},unit:'mi'|'km'):GpsWorkout {
 if(!['Run','Bike'].includes(values.activity))throw new Error('Choose Run or Bike.');
 const distance=Number(values.distance.trim());
 if(!values.distance.trim()||!Number.isFinite(distance)||distance<0||distance>100000)throw new Error('Enter a distance of 0 or more.');
 const parts=values.duration.trim().split(':');
 if(parts.length<2||parts.length>3||parts.some(part=>!/^\d{1,3}$/.test(part))||Number(parts.at(-1))>=60||(parts.length===3&&Number(parts[1])>=60))throw new Error('Enter duration as hh:mm:ss, for example 00:25:30.');
 const seconds=parts.reduce((total,part)=>total*60+Number(part),0);
 const initialDuration=(()=>{const s=Math.floor(workout.seconds);return `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor(s%3600/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;})();
 return {...workout,activity:values.activity,meters:values.distance.trim()===gpsEditDistance(workout,unit)?workout.meters:distance*(unit==='mi'?1609.344:1000),seconds:values.duration.trim()===initialDuration?workout.seconds:seconds};
}
export function correctedGpsActivities(activity:string,activities:string[]|undefined,before:GpsWorkout[],after:GpsWorkout[]) {
 const oldTypes=new Set(before.map(item=>item.activity));const nextTypes=[...new Set(after.map(item=>item.activity))];
 const original=activities?.length?activities:activity?[activity]:[];
 const next=[...original.filter(item=>!oldTypes.has(item as 'Run'|'Bike')||nextTypes.includes(item as 'Run'|'Bike'))];
 for(const type of nextTypes)if(!next.includes(type))next.push(type);
 return {activities:next,activity:!activity||activity===original.join(' + ')?next.join(' + '):activity};
}
