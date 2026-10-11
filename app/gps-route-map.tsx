'use client';
import {useEffect,useRef,useState} from 'react';
import {cleanRoute,mercator,type GpsRoute} from './gps-route';
export function GpsRouteMap({route,onLabel}:{route?:GpsRoute;onLabel?:(label:string)=>void}) {
 const host=useRef<HTMLDivElement>(null);const [width,setWidth]=useState(360);const [zoomOffset,setZoomOffset]=useState(0);const [failed,setFailed]=useState(false);const [editing,setEditing]=useState(false);const [label,setLabel]=useState(route?.locationLabel||'');
 useEffect(()=>{setLabel(route?.locationLabel||'');},[route?.locationLabel]);
 useEffect(()=>{if(!host.current)return;const observer=new ResizeObserver(([entry])=>setWidth(entry.contentRect.width));observer.observe(host.current);return()=>observer.disconnect();},[Boolean(route?.segments?.length)]);
 const clean=cleanRoute(route);const segments=clean?.segments||[];const points=segments.flat();
 if(!points.length)return <p className="gps-caption">Route unavailable for this workout. New GPS recordings save their route.</p>;
 const origin=mercator(points[0])[0];const project=(point:[number,number])=>{const [x,y]=mercator(point);return [x-Math.round(x-origin),y];};
 const projected=points.map(project);const xs=projected.map(p=>p[0]),ys=projected.map(p=>p[1]);const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);const height=Math.max(340,200+Math.ceil((route?.locationLabel?.length||0)/30)*20);
 const fit=Math.max(1,Math.min(17,Math.floor(Math.log2(Math.min((width-70)/Math.max(maxX-minX,1e-7),(height-150)/Math.max(maxY-minY,1e-7))/256))));const zoom=Math.max(1,Math.min(18,fit+zoomOffset));const scale=256*2**zoom;const centerX=(minX+maxX)/2,centerY=(minY+maxY)/2;const left=centerX*scale-width/2,top=centerY*scale-height/2;
 const screen=(p:[number,number])=>{const [x,y]=project(p);return [x*scale-left,y*scale-top];};const tiles=[];for(let x=Math.floor(left/256);x<=Math.floor((left+width)/256);x++)for(let y=Math.floor(top/256);y<=Math.floor((top+height)/256);y++)if(y>=0&&y<2**zoom)tiles.push({x,y,url:`https://tile.openstreetmap.org/${zoom}/${((x%2**zoom)+2**zoom)%2**zoom}/${y}.png`});
 const start=screen(points[0]),end=screen(points.at(-1)!);
 return <div className="gps-route-block"><div ref={host} className="gps-route-map" style={{height}} aria-label={`Workout route: ${route?.locationLabel||'place names unavailable'}`}>
 {tiles.map(tile=><img key={tile.url} src={tile.url} alt="" loading="lazy" onError={()=>setFailed(true)} style={{left:tile.x*256-left,top:tile.y*256-top}}/>)}
 <svg viewBox={`0 0 ${width} ${height}`} aria-label="Recorded route; breaks indicate pauses or lost GPS"><g fill="none" strokeLinecap="round" strokeLinejoin="round">{segments.map((segment,i)=><g key={i}><polyline points={segment.map(p=>screen(p).join(',')).join(' ')} stroke="#fffaf1" strokeWidth="8"/><polyline points={segment.map(p=>screen(p).join(',')).join(' ')} stroke="#bf4e12" strokeWidth="4"/></g>)}</g><circle cx={start[0]} cy={start[1]} r="7" fill="#28754c" stroke="white" strokeWidth="3"/><rect x={end[0]-6} y={end[1]-6} width="12" height="12" fill="#20364b" stroke="white" strokeWidth="3"/></svg>
 <div className="gps-route-place"><strong>{route?.locationLabel||'City / state unavailable'}</strong>{!route?.locationLabel&&<small>{points[0][1].toFixed(4)}, {points[0][0].toFixed(4)} · start coordinates</small>}<small>● Start · ■ Finish · gaps show pauses</small></div>
 <div className="gps-route-controls"><button aria-label="Zoom in" onClick={()=>setZoomOffset(v=>v+1)}>+</button><button aria-label="Zoom out" onClick={()=>setZoomOffset(v=>v-1)}>−</button><button onClick={()=>setZoomOffset(0)}>Fit</button></div>
 <a className="gps-route-attribution" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a></div>
 {failed&&<p className="gps-caption">Street map unavailable. Your recorded route and place label are still shown.</p>}
 {onLabel&&<><button className="gps-place-edit" onClick={()=>setEditing(!editing)}>Edit city / state label</button>{editing&&<div className="gps-place-editor"><label>Places along this route<input value={label} maxLength={400} placeholder="City, State → City, State" onChange={e=>setLabel(e.target.value)}/></label><p>Include every city and state you want shown, including crossings and the return trip. Automatic names use sampled GPS points.</p><button onClick={()=>{onLabel(label.trim());setEditing(false);}}>Save map label</button></div>}</>}
 </div>;
}
