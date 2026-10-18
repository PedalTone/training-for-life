export function ShareWorkoutButton({onClick}:{onClick:()=>void}) {
 return <button type="button" className="workout-share-action" onClick={onClick}>
  <span className="workout-share-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V3m-4 4 4-4 4 4M5 11v9h14v-9"/></svg></span>
  <span className="workout-share-copy"><strong>Share workout</strong><small>Image for Instagram · TikTok</small></span>
  <svg className="workout-share-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>
 </button>;
}
