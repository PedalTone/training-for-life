import {weatherKind} from './weather-kind.ts';
export function parseCurrentWeather(data:unknown) {
 const current=(data as {current?:Record<string,unknown>})?.current;
 if(!current||typeof current.temperature_2m!=='number'||!Number.isFinite(current.temperature_2m)||typeof current.relative_humidity_2m!=='number'||!Number.isFinite(current.relative_humidity_2m)||current.relative_humidity_2m<0||current.relative_humidity_2m>100)throw new Error('Weather unavailable');
 const kind=typeof current.weather_code==='number'&&typeof current.is_day==='number'?weatherKind(current.weather_code,current.is_day):null;
 return {temperatureC:current.temperature_2m,humidity:current.relative_humidity_2m,kind};
}
export async function fetchCurrentWeather(latitude:number,longitude:number,signal:AbortSignal) {
 const response=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude.toFixed(1)}&longitude=${longitude.toFixed(1)}&current=temperature_2m,relative_humidity_2m,weather_code,is_day`,{signal,cache:'no-store'});
 if(!response.ok)throw new Error('Weather unavailable');
 return parseCurrentWeather(await response.json());
}
