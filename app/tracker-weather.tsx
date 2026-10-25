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
 const temperature=weather?Math.round(unit==='mi'?weather.temperatureC*9/5+32:weather.temperatureC):null;
 return <div className="gps-weather" aria-label="Current weather">
  <div><span>Temperature</span><strong>{temperature===null?'—':`${temperature}°${unit==='mi'?'F':'C'}`}</strong></div>
  <div><span>Humidity</span><strong>{weather?`${Math.round(weather.humidity)}%`:'—'}</strong></div>
  <small>{status||<><a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> · {updated?.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}</>}</small>
 </div>;
}
