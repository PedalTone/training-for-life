import { projectShareRoute } from './share-card-data';
import type { RouteCoordinate } from './gps-route';
// Only request tiles in the map the user is previewing. Browser HTTP caching is retained.
const tileImages = new Map<string, Promise<HTMLImageElement>>();
export function shareMapLayout(segments:RouteCoordinate[][],width:number,height:number) {
  const projected=projectShareRoute(segments),points=projected.flat();
  if(!points.length)return undefined;
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const zoom=Math.max(1,Math.min(17,Math.floor(Math.log2(Math.min((width-100)/Math.max(maxX-minX,1e-7),(height-100)/Math.max(maxY-minY,1e-7))/256))));
  const scale=256*2**zoom,left=(minX+maxX)/2*scale-width/2,top=(minY+maxY)/2*scale-height/2;
  const tiles:{url:string;x:number;y:number}[]=[];
  for(let x=Math.floor(left/256);x<=Math.floor((left+width)/256);x++)for(let y=Math.floor(top/256);y<=Math.floor((top+height)/256);y++)if(y>=0&&y<2**zoom)tiles.push({url:`https://tile.openstreetmap.org/${zoom}/${((x%2**zoom)+2**zoom)%2**zoom}/${y}.png`,x:x*256-left,y:y*256-top});
  return {tiles,segments:projected.map(segment=>segment.map(([x,y])=>[x*scale-left,y*scale-top] as RouteCoordinate))};
}
function tileImage(url:string) {
  let pending=tileImages.get(url);if(pending)return pending;
  pending=new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.crossOrigin='anonymous';const timer=setTimeout(()=>{image.src='';reject(new Error('Map loading timed out. Check your connection and retry.'));},12000);image.onload=()=>{clearTimeout(timer);resolve(image);};image.onerror=()=>{clearTimeout(timer);reject(new Error('Could not load the street map. Check your connection and retry.'));};image.src=url;});
  tileImages.set(url,pending);if(tileImages.size>80)tileImages.delete(tileImages.keys().next().value!);pending.catch(()=>tileImages.delete(url));return pending;
}
export async function drawShareRouteMap(ctx:CanvasRenderingContext2D,segments:RouteCoordinate[][],x:number,y:number,width:number,height:number) {
  const layout=shareMapLayout(segments,width,height);if(!layout)return false;
  const images=await Promise.all(layout.tiles.map(tile=>tileImage(tile.url)));
  ctx.save();ctx.beginPath();ctx.roundRect(x,y,width,height,24);ctx.clip();ctx.fillStyle='#ece8df';ctx.fillRect(x,y,width,height);
  layout.tiles.forEach((tile,i)=>ctx.drawImage(images[i],x+tile.x,y+tile.y,256,256));
  ctx.lineCap='round';ctx.lineJoin='round';
  for(const segment of layout.segments){for(const [color,lineWidth] of [['#fffaf1',18],['#bd4e17',10]] as const){ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.beginPath();segment.forEach(([px,py],i)=>{if(i)ctx.lineTo(x+px,y+py);else ctx.moveTo(x+px,y+py);});ctx.stroke();}}
  const start=layout.segments[0][0],end=layout.segments.at(-1)!.at(-1)!;
  ctx.fillStyle='#28754c';ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.beginPath();ctx.arc(x+start[0],y+start[1],10,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle='#203449';ctx.fillRect(x+end[0]-9,y+end[1]-9,18,18);ctx.strokeRect(x+end[0]-9,y+end[1]-9,18,18);
  ctx.fillStyle='#fffaf1';ctx.fillRect(x,y+height-40,width,40);ctx.fillStyle='#203449';ctx.font='400 23px system-ui';ctx.textBaseline='top';ctx.fillText('© OpenStreetMap contributors',x+12,y+height-32);ctx.restore();return true;
}
