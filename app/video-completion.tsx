export function VideoCompletion({completed,onChange}:{completed?:boolean;onChange?:(completed:boolean)=>void}) {
 return onChange?<label className={`video-completion${completed===true?' completed':''}`}><input type="checkbox" checked={completed===true} onChange={event=>onChange(event.target.checked)}/><span>Video completed</span></label>:<p className={`video-completion video-completion-read${completed===true?' completed':''}`}>{completed===true?'✓ Video completed':'Video not marked complete'}</p>;
}
