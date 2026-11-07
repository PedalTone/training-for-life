import {useEffect,useRef,useState} from 'react';
import {fetchCurrentWeather} from './current-weather';
import type {GpsPoint} from './gps-math';
export function TrackerWeather({position,unit}:{position:GpsPoint|null;unit:'mi'|'km'}) {
 const latest=useRef(position);latest.current=position;
 const [weather,setWeather]=useState<Awaited<ReturnType<typeof fetchCurrentWeather>>|null>(null);
 const [status,setStatus]=useState('Waiting for GPS'),[updated,setUpdated]=useState<Date|null>(null);
 const hasPosition=Boolean(position);
 useEffect(()=>{
  if(!hasPosition){setWeather(null);setUpdated(null);setStatus('Waiting for GPS');return;}
  let stopped=false,request:AbortController|undefined;
  const refresh=async()=>{
   const point=latest.current;if(!point)return;
   request?.abort();const controller=new AbortController();request=controller;
   const timeout=window.setTimeout(()=>controller.abort(),10000);
   setStatus('Checking weather…');
   try{const next=await fetchCurrentWeather(point.latitude,point.longitude,controller.signal);if(!stopped){setWeather(next);setUpdated(new Date());setStatus('');}}
   catch{if(!stopped){setWeather(null);setStatus('Weather unavailable');}}
   finally{window.clearTimeout(timeout);}
  };
  void refresh();const timer=window.setInterval(()=>void refresh(),900000);
  return()=>{stopped=true;request?.abort();window.clearInterval(timer);};
 },[hasPosition]);
 const windSpeed=weather?.windSpeed===null||weather?.windSpeed===undefined?null:(unit==='mi'?weather.windSpeed*0.621371:weather.windSpeed); const windDirection=weather?.windDirection===null||weather?.windDirection===undefined?null:weather.windDirection; const heading=position?.heading; const relative=heading!==undefined&&heading!==null&&windDirection!==null?((windDirection-(heading+180)+540)%360)-180:null; const windState=relative===null?'':Math.abs(relative)<=60?'tailwind':Math.abs(relative)>=120?'headwind':'crosswind'; const windLabel=relative===null?'':windState==='tailwind'?'Tailwind':windState==='headwind'?'Headwind':'Crosswind';
 const temperature=weather?Math.round(unit==='mi'?weather.temperatureC*9/5+32:weather.temperatureC):null;
 return <div className="gps-weather" aria-label="Current weather">
  <div className="gps-weather-cell gps-temperature"><span aria-hidden="true">☀️</span><strong>{temperature===null?'—':`${temperature}°${unit==='mi'?'F':'C'}`}</strong></div>
  <div className="gps-weather-cell"><span>Humidity</span><strong>{weather?`${Math.round(weather.humidity)}%`:'—'}</strong></div>
  <div className="gps-weather-cell gps-wind"><span aria-hidden="true" className="gps-wind-glyph">≋</span><strong>{windSpeed===null?'—':`${Math.round(windSpeed)} ${unit==='mi'?'mph':'km/h'}`}</strong><small>{windDirection===null?'':`${Math.round(windDirection)}° · ${windLabel||'Waiting for heading'}`}</small>{windLabel&&<i className={`wind-dot ${windState}`} aria-label={windLabel}/>}</div>
  <small className="gps-weather-source">{status||<><a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> · {updated?.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}</>}</small>
 </div>;
}
