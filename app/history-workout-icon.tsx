export function HistoryWorkoutIcon({workoutKey}:{workoutKey:string}) {
 const key=workoutKey.toLowerCase();
 const strength=<><rect x="4" y="5" width="4" height="14" rx="1"/><rect x="16" y="5" width="4" height="14" rx="1"/><path d="M8 10h8v4H8M2 9v6m20-6v6"/></>;
 const runner=<><circle cx="15" cy="4" r="2"/><path d="m8 10 4-3 4 4 4-2M12 7l-2 7 5 3 1 5M10 14l-4 6H2M8 10l-3 4"/></>;
 const stopwatch=<><circle cx="12" cy="14" r="8"/><path d="M9 2h6M12 2v4m6 2 2-2M12 10v4l3 2"/></>;
 const speedRunner=<><circle cx="16" cy="4" r="2"/><path d="m11 9 3-2 4 4 4-2m-8-2-2 7 5 3 1 5m-6-8-4 6H5M1 8h5M1 12h4M2 16h3"/></>;
 const stretch=<><circle cx="9" cy="6" r="2" fill="currentColor" stroke="none"/><path d="M12 10c-2-2-4-2-5-1l-2 5 2 1 2-4 3 5 3-1Z" fill="currentColor" stroke="none"/><path d="M11 10C13 5 11 2 6 2M7 10l-3 5M12 16l-4 6m5-6 6 6" strokeWidth="2.2"/><path d="M6 22h3m9 0h3"/></>;
 const moon=<path d="M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12Z"/>;
 const swim=<><circle cx="16" cy="6" r="2"/><path d="m4 11 6-4 4 5m-4-5 2-4M2 17q3-3 6 0t6 0t8 0M2 21q3-3 6 0t6 0t8 0"/></>;
 const ball=<><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18M6 5q10 7 0 14M18 5q-10 7 0 14"/></>;
 const racket=<><ellipse cx="14" cy="9" rx="6" ry="7" transform="rotate(35 14 9)"/><path d="m10 14-7 8m9-17 7 5m-9-2 7 5"/></>;
 const content=key.includes('strength')?strength:key==='aerobic'?runner:key==='endurance'?stopwatch:key==='speed'?speedRunner:['mobility','yoga','pilates'].includes(key)?stretch:key==='rest'?moon:key==='swimming'?swim:key==='basketball'?ball:['tennis','pickleball'].includes(key)?racket:<><circle cx="12" cy="12" r="9"/><path d="m7 12 3 3 7-7"/></>;
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{content}</svg>;
}
