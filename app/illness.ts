export type Illness={reported:boolean;rested:boolean;note:string;savedAt?:string};
export function normalizeIllness(value:unknown):Illness|undefined {
 if(!value||typeof value!=='object')return;
 const raw=value as Partial<Illness>;
 return {reported:raw.reported===true,rested:raw.reported===true&&raw.rested===true,note:typeof raw.note==='string'?raw.note.slice(0,3000):'',savedAt:typeof raw.savedAt==='string'?raw.savedAt:undefined};
}
export function isIllnessRest(record:{illness?:Illness}|undefined){return record?.illness?.reported===true&&record.illness.rested===true;}
export function finalizedDay<T extends {illness?:Illness}>(record:T,now:string){
 return isIllnessRest(record)?{...record,status:'rest' as const,completedAt:undefined,updatedAt:now,illness:{...record.illness!,savedAt:now}}:{...record,status:'completed' as const,completedAt:now,updatedAt:now};
}
