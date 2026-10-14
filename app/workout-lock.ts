type WorkoutRecord = {date:string;status?:string;completedAt?:string};
export function workoutIsLocked(record:WorkoutRecord|undefined, editingDate:string|null=null) {
 return Boolean(record && (record.status==='completed'||record.completedAt) && editingDate!==record.date);
}
