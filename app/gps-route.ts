export type RouteCoordinate = [number, number];
export type GpsRoute = { segments: RouteCoordinate[][]; locationLabel?: string };
export function cleanRoute(value: unknown): GpsRoute | undefined {
 const route=value as GpsRoute | undefined;
 if(!Array.isArray(route?.segments))return undefined;
 const segments=route.segments.filter(Array.isArray).map(segment=>segment.filter(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90).map(p=>[p[0],p[1]] as RouteCoordinate)).filter(s=>s.length);
 return {segments,locationLabel:typeof route.locationLabel==='string'?route.locationLabel.slice(0,400):undefined};
}
export function appendRoute(route:GpsRoute|undefined, point:RouteCoordinate, newSegment:boolean):GpsRoute {
 const segments=(route?.segments||[]).map(s=>s.slice());
 if(newSegment||!segments.length)segments.push([point]);else segments[segments.length-1].push(point);
 if(segments.reduce((n,s)=>n+s.length,0)>10000) for(let i=0;i<segments.length;i++)segments[i]=segments[i].filter((_,j,s)=>j===0||j===s.length-1||j%2===0);
 return {...route,segments};
}
export function mercator([lon,lat]:RouteCoordinate):RouteCoordinate {const y=Math.max(-85.0511,Math.min(85.0511,lat))*Math.PI/180;return [(lon+180)/360,(1-Math.log(Math.tan(y)+1/Math.cos(y))/Math.PI)/2];}
export function routeSamples(route:GpsRoute):RouteCoordinate[] {const points=route.segments.flat();if(!points.length)return [];return Array.from({length:Math.min(8,points.length)},(_,i)=>points[Math.round(i*(points.length-1)/Math.max(1,Math.min(8,points.length)-1))]);}
export async function locateRoute(route:GpsRoute):Promise<GpsRoute> {
 const labels:string[]=[];
 for(const [lon,lat] of routeSamples(route)) {
  const key=`t4l:place:${lon.toFixed(3)},${lat.toFixed(3)}`;
  try {let label=localStorage.getItem(key);if(!label){const response=await fetch(`https://photon.komoot.io/reverse?lon=${lon}&lat=${lat}&limit=1&lang=en`,{signal:AbortSignal.timeout(2000)});if(!response.ok)continue;const json=await response.json();const p=json.features?.[0]?.properties;label=[p?.city||p?.town||p?.village||p?.county,p?.state,p?.countrycode==='US'?undefined:p?.country].filter(Boolean).join(', ');if(label)localStorage.setItem(key,label);await new Promise(resolve=>setTimeout(resolve,1000));}if(label&&labels.at(-1)!==label)labels.push(label);}catch{/* Maps and saving work without place lookup. */}
 }
 return {...route,locationLabel:labels.join(' → ')||undefined};
}
