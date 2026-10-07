"use client";
import { useEffect, useState } from "react";
import { weatherKind, type WeatherKind } from "./weather-kind";
const labels: Record<WeatherKind,string> = {sun:"Clear skies",moon:"Clear night",cloud:"Cloudy",rain:"Rain",snow:"Snow",fog:"Fog",storm:"Thunderstorms"};
const preference = "t4l:local-weather-enabled";
export function useLocalWeather() {
  const [enabled,setEnabled] = useState(false);
  const [kind,setKind] = useState<WeatherKind|null>(null);
  const [status,setStatus] = useState("");
  useEffect(() => { try { setEnabled(localStorage.getItem(preference) === "yes"); } catch {} }, []);
  useEffect(() => {
    if (!enabled) { setKind(null); setStatus(""); return; }
    let stopped = false;
    const controller = new AbortController();
    const refresh = () => {
      setKind(null); setStatus("Checking local weather…");
      if (!navigator.geolocation) { setStatus("Location is unavailable. The sun is decorative."); return; }
      navigator.geolocation.getCurrentPosition(async position => {
        if (stopped) return;
        // Only send approximate coordinates; never persist device coordinates.
        const latitude = position.coords.latitude.toFixed(1);
        const longitude = position.coords.longitude.toFixed(1);
        const request = new AbortController();
        const stopRequest = () => request.abort();
        controller.signal.addEventListener("abort",stopRequest,{once:true});
        const timeout = window.setTimeout(stopRequest,10000);
        try {
          const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=weather_code,is_day`, {signal:request.signal,cache:"no-store"});
          if (!response.ok) throw new Error("Weather unavailable");
          const data = await response.json();
          const current = data.current;
          if (!current || !Number.isInteger(current.weather_code) || ![0,1].includes(current.is_day)) throw new Error("Invalid weather");
          const next = weatherKind(current.weather_code,current.is_day);
          if (!next) throw new Error("Unknown weather");
          if (!stopped) { setKind(next); setStatus(labels[next]); }
        } catch { if (!stopped) { setKind(null); setStatus("Weather unavailable. The sun is decorative."); } }
        finally { window.clearTimeout(timeout); controller.signal.removeEventListener("abort",stopRequest); }
      }, () => { if (!stopped) { setKind(null); setStatus("Location unavailable. The sun is decorative."); } }, {enableHighAccuracy:false,timeout:10000,maximumAge:1800000});
    };
    refresh();
    const timer = window.setInterval(refresh,1800000);
    return () => { stopped = true; controller.abort(); window.clearInterval(timer); };
  }, [enabled]);
  const toggle = () => { const next = !enabled; try { if (next) localStorage.setItem(preference,"yes"); else localStorage.removeItem(preference); } catch {} setEnabled(next); };
  return {enabled,kind,status,toggle};
}
export function WeatherGraphic({kind}: {kind:WeatherKind}) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === "sun" ? <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></>
    : kind === "moon" ? <path d="M20 15a9 9 0 0 1-11-11 9 9 0 1 0 11 11Z"/>
    : <><path d="M6 15a4 4 0 1 1 1-7 5 5 0 0 1 10 1 3 3 0 1 1 1 6H6Z"/>
      {kind === "rain" && <path d="m7 18-1 3m6-3-1 3m6-3-1 3"/>}
      {kind === "snow" && <path d="M7 18v4m-2-2h4m6-2v4m-2-2h4"/>}
      {kind === "fog" && <path d="M4 18h16M6 21h12"/>}
      {kind === "storm" && <path d="m13 16-3 4h4l-3 3"/>}
    </>}
  </svg>;
}
