export function HistoryWorkoutIcon({workoutKey}:{workoutKey:string}) {
 const key=workoutKey.toLowerCase();
 const strength=<><path d="M9 9V6a3 3 0 0 1 6 0v3"/><path d="M8 9h8l3 10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Z"/></>;
 const runner=<><circle cx="15" cy="4" r="2"/><path d="m8 10 4-3 4 4 4-2M12 7l-2 7 5 3 1 5M10 14l-4 6H2M8 10l-3 4"/></>;
 const stopwatch=<><circle cx="12" cy="14" r="8"/><path d="M9 2h6M12 2v4m6 2 2-2M12 10v4l3 2"/></>;
 const shoe=<><path d="m4 5 5 3 2 5 6 2 4 3v3H3a2 2 0 0 1-2-2l1-6Z"/><path d="m9 10 3-1m-1 4 3-1M2 18h19"/></>;
 const stretch=<><circle cx="12" cy="4" r="2"/><path d="m5 7 7 2 6-5M12 9v6m0 0-6 7m6-7 6 7"/></>;
 const moon=<path d="M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12Z"/>;
 const swim=<><circle cx="16" cy="6" r="2"/><path d="m4 11 6-4 4 5m-4-5 2-4M2 17q3-3 6 0t6 0t8 0M2 21q3-3 6 0t6 0t8 0"/></>;
 const ball=<><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18M6 5q10 7 0 14M18 5q-10 7 0 14"/></>;
 const racket=<><ellipse cx="14" cy="9" rx="6" ry="7" transform="rotate(35 14 9)"/><path d="m10 14-7 8m9-17 7 5m-9-2 7 5"/></>;
 const content=key.includes('strength')?strength:key==='aerobic'?runner:key==='endurance'?stopwatch:key==='speed'?shoe:['mobility','yoga','pilates'].includes(key)?stretch:key==='rest'?moon:key==='swimming'?swim:key==='basketball'?ball:['tennis','pickleball'].includes(key)?racket:<><circle cx="12" cy="12" r="9"/><path d="m7 12 3 3 7-7"/></>;
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{content}</svg>;
}
