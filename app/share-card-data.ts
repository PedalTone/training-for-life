import type { Session } from './page';
import { cleanRoute, mercator, type GpsRoute, type RouteCoordinate } from './gps-route';
import { gpsTime, gpsPace } from './gps-math';
export type ShareMetric = { id: string; label: string; value: string };
export type ShareCardData = { date: string; title: string; workoutKey: string; metrics: ShareMetric[]; photo?: string; route?: GpsRoute };
export type ShareCardTemplate = 'card' | 'photo' | 'route';
export type ShareCardFormat = 'story' | 'portrait' | 'square';
export const shareFormats = { story: { label: 'Story', width: 1080, height: 1920 }, portrait: { label: 'Portrait', width: 1080, height: 1350 }, square: { label: 'Square', width: 1080, height: 1080 } } as const;
export function toShareCardData(session: Session, plan: {key:string;theme:string}): ShareCardData {
  const gps = (session.gpsWorkouts || []).filter(w => Number.isFinite(w.meters) && w.meters >= 0 && Number.isFinite(w.seconds) && w.seconds >= 0);
  const meters = gps.reduce((n,w)=>n+w.meters,0), seconds = gps.reduce((n,w)=>n+w.seconds,0);
  const metrics: ShareMetric[] = [];
  const add = (id:string,label:string,value?:string) => { if(value?.trim() && !['—','-'].includes(value.trim()))metrics.push({id,label,value:value.trim()}); };
  add('distance','Distance',session.distance || (meters>0 ? `${(meters/1609.344).toFixed(2)} mi` : undefined));
  add('duration','Duration',session.duration || (seconds>0 ? gpsTime(seconds) : undefined));
  const runs=gps.filter(w=>w.activity==='Run'), bikes=gps.filter(w=>w.activity==='Bike');
  const runMeters=runs.reduce((n,w)=>n+w.meters,0),runSeconds=runs.reduce((n,w)=>n+w.seconds,0);
  add('pace',runs.length?'Average pace':'Pace',runMeters>0&&runSeconds>0?`${gpsPace(runMeters/runSeconds)} min/mi`:session.pace);
  add('calories','Calories',session.calories);
  const bikeMeters=bikes.reduce((n,w)=>n+w.meters,0),bikeSeconds=bikes.reduce((n,w)=>n+w.seconds,0);
  if(bikeMeters>0&&bikeSeconds>0)add('speed',runs.length?'Average bike speed':'Average speed',`${(bikeMeters/bikeSeconds*3600/1609.344).toFixed(1)} mph`);
  const exercises = new Set(session.completedExercises || []);
  if(exercises.size)add('exercises','Exercises completed',String(exercises.size));
  const routes = gps.map(w=>cleanRoute(w.route)).filter((r):r is GpsRoute=>Boolean(r));
  const segments = routes.flatMap(r=>r.segments).filter(s=>s.length>1);
  const labels = [...new Set(routes.map(r=>r.locationLabel).filter(Boolean))];
  return {date:session.date,title:session.activity.trim() || plan.theme,workoutKey:plan.key,metrics,photo:session.workoutPhoto,route:segments.length ? {segments,locationLabel:labels.join(' · ') || undefined} : undefined};
}
function metersBetween(a:RouteCoordinate,b:RouteCoordinate) {
  const rad=Math.PI/180; const h=Math.sin((a[1]-b[1])*rad/2)**2+Math.cos(a[1]*rad)*Math.cos(b[1]*rad)*Math.sin((a[0]-b[0])*rad/2)**2;
  return 6371000*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));
}
export function shareRouteSegments(route: GpsRoute | undefined, hideEnds=true): RouteCoordinate[][] {
  const segments=cleanRoute(route)?.segments || [];const points=segments.flat();if(!points.length)return [];
  if(!hideEnds)return segments.filter(s=>s.length>1);
  // Hide a radius around every recording's segment endpoints, including loop returns.
  // Never join across excluded points or across recording/pause boundaries.
  const endpoints=segments.flatMap(s=>[s[0],s[s.length-1]]);
  const output:RouteCoordinate[][]=[];
  for(const segment of segments){let run:RouteCoordinate[]=[];for(const point of segment){if(endpoints.some(end=>metersBetween(point,end)<200)){if(run.length>1)output.push(run);run=[];}else run.push(point);}if(run.length>1)output.push(run);}
  return output;
}
export function projectShareRoute(segments:RouteCoordinate[][]): RouteCoordinate[][] {
  const first=segments[0]?.[0];if(!first)return [];
  const origin=mercator(first)[0];
  return segments.map(s=>s.map(point=>{const [x,y]=mercator(point);return [x-Math.round(x-origin),y] as RouteCoordinate;}));
}
