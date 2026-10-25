export type MapPoint=[number,number];
export type MapCamera={mode:'fit'|'follow'|'free';center:MapPoint;zoom:number};
export const clampZoom=(zoom:number)=>Math.max(1,Math.min(18,zoom));
export function dragCenter(center:MapPoint,dx:number,dy:number,zoom:number):MapPoint {
 const scale=256*2**zoom;
 return [center[0]-dx/scale,Math.max(0,Math.min(1,center[1]-dy/scale))];
}
export function pinchCamera(center:MapPoint,zoom:number,ratio:number,anchor:MapPoint,following:boolean):{center:MapPoint;zoom:number} {
 const next=clampZoom(zoom+Math.log2(Math.max(.01,ratio)));
 if(following)return {center,zoom:next};
 const before=256*2**zoom,after=256*2**next;
 return {zoom:next,center:[center[0]+anchor[0]/before-anchor[0]/after,Math.max(0,Math.min(1,center[1]+anchor[1]/before-anchor[1]/after))]};
}
