import { drawShareRouteMap } from './share-route-map';
import { adventureBackgroundFor } from './adventure-scenes';
import { shareFormats, shareRouteSegments, type ShareCardData, type ShareCardFormat, type ShareCardTemplate } from './share-card-data';
export type ShareCardOptions = { template:ShareCardTemplate; format:ShareCardFormat; metricIds:string[]; background:'artwork'|'navy'|'photo'; photo?:string; hideRouteEnds:boolean; showLocation:boolean; locationLabel?:string };
async function loadImage(src:string) { const image=new Image();image.src=src;await image.decode();return image; }
function cover(ctx:CanvasRenderingContext2D,image:HTMLImageElement|HTMLCanvasElement,x:number,y:number,w:number,h:number) {const scale=Math.max(w/image.width,h/image.height);ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.drawImage(image,x+(w-image.width*scale)/2,y+(h-image.height*scale)/2,image.width*scale,image.height*scale);ctx.restore();}
function fitText(ctx:CanvasRenderingContext2D,text:string,maxWidth:number,size:number,min:number,font='system-ui',weight='700') { while(size>min){ctx.font=`${weight} ${size}px ${font}`;if(ctx.measureText(text).width<=maxWidth)break;size-=2;}ctx.font=`${weight} ${size}px ${font}`;let result=text;if(ctx.measureText(result).width>maxWidth){while(result.length && ctx.measureText(result+'…').width>maxWidth)result=result.slice(0,-1);result+='…';}return result; }
function lines(ctx:CanvasRenderingContext2D,text:string,maxWidth:number,count:number,size=64,font='Georgia',min=40) {const words=text.split(/\s+/);const output:string[]=[];let current='';for(const word of words){const next=current?current+' '+word:word;if(current&&ctx.measureText(next).width>maxWidth){output.push(current);current=word;if(output.length===count-1)break;}else current=next;}if(output.length<count){const consumed=output.join(' ').split(/\s+/).filter(Boolean).length;output.push(words.slice(consumed).join(' '));}return output.slice(0,count).map(line=>fitText(ctx,line,maxWidth,size,min,font));}
export async function renderShareCard(data:ShareCardData,options:ShareCardOptions):Promise<Blob> {
  const {width:w,height:h}=shareFormats[options.format];const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Image rendering is unavailable.');
  const selectedCount=options.metricIds.filter(id=>data.metrics.some(m=>m.id===id)).length;
  const artHeight=selectedCount?Math.min(w/2,h*.32):h*.6;
  const pad=84;const dark=options.template!=='card';const metrics=options.metricIds.map(id=>data.metrics.find(m=>m.id===id)).filter((m):m is NonNullable<typeof m>=>Boolean(m)).slice(0,4);
  ctx.fillStyle=dark?'#203449':'#fffaf1';ctx.fillRect(0,0,w,h);
  const photo=options.photo || data.photo;
  if(options.template==='photo' && !photo)throw new Error('Choose a photo for this template.');
  if(options.template==='photo' || (options.template==='route'&&options.background==='photo')){if(!photo)throw new Error('Choose a background photo.');cover(ctx,await loadImage(photo),0,0,w,h);}
  if(options.template==='card' || (options.template==='route'&&options.background==='artwork')){
    const style=adventureBackgroundFor(data.workoutKey);const source=style.backgroundImage.match(/url\((.*?)\)/)?.[1];if(!source)throw new Error('Workout artwork is unavailable.');const image=await loadImage(source);
    if(style.backgroundSize==='cover')cover(ctx,image,0,0,w,options.template==='card'?artHeight:h);
    else{const sceneW=image.width/2,sceneH=image.height/3;const [xp,yp]=style.backgroundPosition.split(' ').map(parseFloat);const sx=(xp/100)*(image.width-sceneW),sy=(yp/100)*(image.height-sceneH);const scene=document.createElement('canvas');scene.width=sceneW;scene.height=sceneH;scene.getContext('2d')!.drawImage(image,sx,sy,sceneW,sceneH,0,0,sceneW,sceneH);cover(ctx,scene,0,0,w,options.template==='card'?artHeight:h);}
  }
  if(dark){const gradient=ctx.createLinearGradient(0,0,0,h);gradient.addColorStop(0,'rgba(13,31,48,.65)');gradient.addColorStop(.4,'rgba(13,31,48,.55)');gradient.addColorStop(1,'rgba(13,31,48,.95)');ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);}
  ctx.textBaseline='top';ctx.fillStyle=dark?'#fffaf1':'#203449';
  const titleY=options.template==='card'?artHeight+45:pad;
  ctx.font='700 64px Georgia';const titleLines=lines(ctx,data.title,w-pad*2,2);titleLines.forEach((line,i)=>{ctx.font='700 64px Georgia';ctx.fillText(fitText(ctx,line,w-pad*2,64,40,'Georgia'),pad,titleY+i*72);});
  ctx.font='400 30px system-ui';const date=/^\d{4}-\d{2}-\d{2}$/.test(data.date)?new Date(data.date+'T12:00:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}):data.date;ctx.fillText(date,pad,titleY+titleLines.length*72+12);
  const metricHeight=metrics.length>2?250:130;const startY=Math.max(options.template==='card'?titleY+titleLines.length*72+90:0,h-pad-80-metricHeight);const cols=metrics.length===1?1:2;const cellW=(w-pad*2)/cols;
  if(options.template==='route') {
    const segments=shareRouteSegments(data.route,options.hideRouteEnds);const top=titleY+titleLines.length*72+84;
    const location=options.locationLabel??data.route?.locationLabel;
    ctx.font='500 30px system-ui';const locationLines=options.showLocation?lines(ctx,location||'City / state not recorded',w-pad*2,3,30,'system-ui',26):[];const labelLines=locationLines.length;
    const labelHeight=labelLines?labelLines*36+20:0;const bottom=startY-45-labelHeight;
    const boxHeight=Math.max(160,bottom-top);
    if(!await drawShareRouteMap(ctx,segments,pad,top,w-pad*2,boxHeight)){ctx.fillStyle='#fffaf1';ctx.font='400 30px system-ui';ctx.fillText('Route hidden for privacy',pad,top+boxHeight/2);}
    if(options.showLocation){ctx.fillStyle='#fffaf1';ctx.font='500 30px system-ui';locationLines.forEach((line,i)=>{ctx.fillText(fitText(ctx,line,w-pad*2,30,26,'system-ui','500'),pad,top+boxHeight+14+i*36);});}

  }
  metrics.forEach((m,i)=>{const x=pad+(i%cols)*cellW,y=startY+Math.floor(i/cols)*125;ctx.fillStyle=dark?'#fffaf1':'#203449';ctx.fillText(fitText(ctx,m.value,cellW-24,metrics.length===1?100:72,30),x,y);ctx.fillStyle=dark?'#efd7b9':'#62717c';ctx.font='400 32px system-ui';ctx.fillText(m.label,x,y+82);});

  ctx.fillStyle=dark?'#fffaf1':'#62717c';ctx.font='600 25px system-ui';ctx.fillText('TRAINING FOR LIFE',pad,h-pad);ctx.fillStyle='#c05319';ctx.fillRect(w-pad-110,h-pad+8,110,5);
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Could not generate an image.')),'image/png'));
}
