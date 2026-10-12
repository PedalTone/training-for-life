export const shareTextFonts={modern:'system-ui',classic:'Georgia',mono:'monospace'} as const;
export type ShareText={text:string;font:keyof typeof shareTextFonts;size:number;x:number;y:number};
export function textPosition(x:number,y:number){return {x:Math.max(0,Math.min(.28,x)),y:Math.max(0,Math.min(.78,y))};}
export function drawShareText(ctx:CanvasRenderingContext2D,w:number,h:number,box:ShareText){
 if(!box.text.trim())return;
 const {x,y}=textPosition(box.x,box.y),left=x*w,top=y*h,width=w*.72,height=h*.22;
 const size=Math.max(24,Math.min(96,box.size)),lineHeight=size*1.25;
 ctx.save();ctx.beginPath();ctx.roundRect(left,top,width,height,16);ctx.clip();ctx.shadowColor='rgba(13,31,48,.8)';ctx.shadowBlur=4;ctx.shadowOffsetY=2;
 ctx.fillStyle='#fffaf1';ctx.font=`600 ${size}px ${shareTextFonts[box.font]||shareTextFonts.modern}`;ctx.textBaseline='top';
 const lines:string[]=[];let line='';
 for(const paragraph of box.text.split('\n')){for(const word of paragraph.split(/\s+/)){const next=line?line+' '+word:word;if(ctx.measureText(next).width>width-40&&line){lines.push(line);line=word;}else line=next;}lines.push(line);line='';}
 const limit=Math.max(1,Math.floor((height-40)/lineHeight));
 lines.slice(0,limit).forEach((text,i)=>{let value=text;if(i===limit-1&&lines.length>limit)value+='…';while(ctx.measureText(value).width>width-40&&value.length>1)value=value.slice(0,-2)+'…';ctx.fillText(value,left+20,top+20+i*lineHeight);});ctx.restore();
}
