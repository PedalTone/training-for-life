import {isIllnessRest,type Illness} from "./illness.ts";
type WorkoutRecord = {date:string;status?:string;completedAt?:string;illness?:Illness};
export function workoutIsLocked(record:WorkoutRecord|undefined, editingDate:string|null=null) {
 return Boolean(record && (record.status==='completed'||record.completedAt||(isIllnessRest(record)&&record.illness?.savedAt)) && editingDate!==record.date);
}
