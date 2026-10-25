'use client';
import {memo,useEffect,useRef,useState,type PointerEvent as ReactPointerEvent} from 'react';
import {clampZoom,dragCenter,pinchCamera,type MapCamera,type MapPoint} from './gps-map-camera';
import type {GpsPoint} from './gps-math';
import {cleanRoute,mercator,type GpsRoute} from './gps-route';
function RouteMap({route,onLabel,showPlace=true,height:requestedHeight,live=false,position}:{route?:GpsRoute;onLabel?:(label:string)=>void;showPlace?:boolean;height?:number;live?:boolean;position?:GpsPoint|null}) {
 const host=useRef<HTMLDivElement>(null);const [width,setWidth]=useState(360);const [camera,setCamera]=useState<MapCamera>({mode:live?'follow':'fit',center:[.5,.5],zoom:16});const [failed,setFailed]=useState(false);const [editing,setEditing]=useState(false);const [label,setLabel]=useState(route?.locationLabel||'');
 const pointers=useRef(new Map<number,MapPoint>());
 const view=useRef<{center:MapPoint;zoom:number;following:boolean}>({center:[.5,.5],zoom:16,following:live});
 const gesture=useRef<{center:MapPoint;zoom:number;following:boolean;mid:MapPoint;span:number}|null>(null);
 useEffect(()=>{setCamera({mode:live?'follow':'fit',center:[.5,.5],zoom:16});},[live]);
 const rebase=()=>{
  const points=Array.from(pointers.current.values());if(!points.length){gesture.current=null;return;}
  const a=points[0],b=points[1]||a;
  gesture.current={...view.current,mid:[(a[0]+b[0])/2,(a[1]+b[1])/2],span:points.length>1?Math.hypot(b[0]-a[0],b[1]-a[1]):0};
 };
 const down=(event:ReactPointerEvent<HTMLDivElement>)=>{
  if((event.target as HTMLElement).closest('button,a,input')||event.button!==0)return;
  event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);
  pointers.current.set(event.pointerId,[event.clientX,event.clientY]);rebase();
 };
 const move=(event:ReactPointerEvent<HTMLDivElement>)=>{
  if(!pointers.current.has(event.pointerId)||!gesture.current)return;
  event.preventDefault();pointers.current.set(event.pointerId,[event.clientX,event.clientY]);
  const points=Array.from(pointers.current.values()),base=gesture.current,a=points[0],b=points[1];
  if(b&&base.span>0){
   const rect=event.currentTarget.getBoundingClientRect();
   const anchor:MapPoint=[base.mid[0]-rect.left-rect.width/2,base.mid[1]-rect.top-rect.height/2];
   const next=pinchCamera(base.center,base.zoom,Math.hypot(b[0]-a[0],b[1]-a[1])/base.span,anchor,base.following);
   const center=base.following?view.current.center:dragCenter(next.center,(a[0]+b[0])/2-base.mid[0],(a[1]+b[1])/2-base.mid[1],next.zoom);
   setCamera({mode:base.following?'follow':'free',zoom:next.zoom,center});
  }else if(!b){
   const dx=a[0]-base.mid[0],dy=a[1]-base.mid[1];
   if(Math.hypot(dx,dy)<3)return;
   setCamera({mode:'free',zoom:base.zoom,center:dragCenter(base.center,dx,dy,base.zoom)});
  }
 };
 const up=(event:ReactPointerEvent<HTMLDivElement>)=>{pointers.current.delete(event.pointerId);rebase();};
 const zoomBy=(amount:number)=>setCamera({mode:view.current.following?'follow':'free',center:view.current.center,zoom:clampZoom(view.current.zoom+amount)});
 useEffect(()=>{setLabel(route?.locationLabel||'');},[route?.locationLabel]);
 useEffect(()=>{if(!host.current)return;const observer=new ResizeObserver(([entry])=>{if(entry.contentRect.width>0)setWidth(Math.max(80,entry.contentRect.width));});observer.observe(host.current);return()=>observer.disconnect();},[Boolean(route?.segments?.length)]);
 const clean=cleanRoute(route);const segments=clean?.segments||[];const points=segments.flat();
 if(!points.length)return <p className="gps-caption">Route unavailable for this workout. New GPS recordings save their route.</p>;
 const origin=mercator(points[0])[0];const project=(point:[number,number])=>{const [x,y]=mercator(point);return [x-Math.round(x-origin),y];};
 const projected=points.map(project);const xs=projected.map(p=>p[0]),ys=projected.map(p=>p[1]);const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);const height=requestedHeight??Math.max(340,200+Math.ceil((showPlace?route?.locationLabel?.length||0:0)/30)*20);
 const fit=clampZoom(Math.min(17,Math.floor(Math.log2(Math.min((width-70)/Math.max(maxX-minX,1e-7),(height-(showPlace?150:70))/Math.max(maxY-minY,1e-7))/256))));
 const following=live&&camera.mode==='follow';
 const currentPoint=live&&position?[position.longitude,position.latitude] as [number,number]:points.at(-1)!;
 const center=(following?project(currentPoint):camera.mode==='fit'?[(minX+maxX)/2,(minY+maxY)/2]:camera.center) as MapPoint;
 const zoom=camera.mode==='fit'?fit:camera.zoom;view.current={center,zoom,following};
 const scale=256*2**zoom,left=center[0]*scale-width/2,top=center[1]*scale-height/2;
 const screen=(p:[number,number])=>{const [x,y]=project(p);return [x*scale-left,y*scale-top];};
 // Integer tile requests with fractional display scale give continuous pinch zoom.
 const tileZoom=Math.floor(zoom),tileScale=2**(zoom-tileZoom),tileSize=256*tileScale;
 const tiles=[];for(let x=Math.floor(left/tileSize);x<=Math.floor((left+width)/tileSize);x++)for(let y=Math.floor(top/tileSize);y<=Math.floor((top+height)/tileSize);y++)if(y>=0&&y<2**tileZoom)tiles.push({x,y,url:`https://tile.openstreetmap.org/${tileZoom}/${((x%2**tileZoom)+2**tileZoom)%2**tileZoom}/${y}.png`});
 const start=screen(points[0]),end=screen(points.at(-1)!),current=screen(currentPoint);
 return <div className="gps-route-block"><div ref={host} className="gps-route-map" style={{height,touchAction:"none"}} data-zoom={zoom.toFixed(3)} data-following={following} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={up} aria-label={`Workout route: ${route?.locationLabel||'place names unavailable'}`}>
 {tiles.map(tile=><img key={tile.url} src={tile.url} alt="" draggable={false} loading="lazy" onError={()=>setFailed(true)} style={{left:tile.x*tileSize-left,top:tile.y*tileSize-top,width:tileSize+0.5,height:tileSize+0.5}}/>)}
 <svg viewBox={`0 0 ${width} ${height}`} aria-label="Recorded route; breaks indicate pauses or lost GPS"><g fill="none" strokeLinecap="round" strokeLinejoin="round">{segments.map((segment,i)=><g key={i}><polyline points={segment.map(p=>screen(p).join(',')).join(' ')} stroke="#fffaf1" strokeWidth="8"/><polyline points={segment.map(p=>screen(p).join(',')).join(' ')} stroke="#bf4e12" strokeWidth="4"/></g>)}</g><circle cx={start[0]} cy={start[1]} r="7" fill="#28754c" stroke="white" strokeWidth="3"/><rect x={end[0]-6} y={end[1]-6} width="12" height="12" fill="#20364b" stroke="white" strokeWidth="3"/>{live&&<circle className="gps-current-location" aria-label="Latest GPS location" cx={current[0]} cy={current[1]} r="8" fill="#145dcc" stroke="white" strokeWidth="3"/>}</svg>
 {showPlace&&<div className="gps-route-place"><strong>{route?.locationLabel||'City / state unavailable'}</strong>{!route?.locationLabel&&<small>{points[0][1].toFixed(4)}, {points[0][0].toFixed(4)} · start coordinates</small>}<small>● Start · ■ Finish · gaps show pauses</small></div>}
 <div className="gps-route-controls"><button type="button" aria-label="Zoom in" disabled={zoom>=18} onClick={()=>zoomBy(1)}>+</button><button type="button" aria-label="Zoom out" disabled={zoom<=1} onClick={()=>zoomBy(-1)}>−</button>{live&&<button type="button" className="gps-follow" aria-pressed={following} onClick={()=>setCamera({mode:following?'free':'follow',center:view.current.center,zoom:following?zoom:16})}>{following?'Following':'Follow me'}</button>}<button type="button" onClick={()=>setCamera({...camera,mode:'fit'})}>Fit route</button></div>
 <a className="gps-route-attribution" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a></div>
 {failed&&<p className="gps-caption">{showPlace?'Street map unavailable. Your recorded route and place label are still shown.':'Street map unavailable. Your recorded route is still shown.'}</p>}
 {showPlace&&onLabel&&<><button className="gps-place-edit" onClick={()=>setEditing(!editing)}>Edit city / state label</button>{editing&&<div className="gps-place-editor"><label>Places along this route<input value={label} maxLength={400} placeholder="City, State → City, State" onChange={e=>setLabel(e.target.value)}/></label><p>Include every city and state you want shown, including crossings and the return trip. Automatic names use sampled GPS points.</p><button onClick={()=>{onLabel(label.trim());setEditing(false);}}>Save map label</button></div>}</>}
 </div>;
}

export const GpsRouteMap=memo(RouteMap);
