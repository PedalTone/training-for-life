export type WeatherKind = "sun" | "moon" | "cloud" | "rain" | "snow" | "fog" | "storm";
export function weatherKind(code: number, isDay: number): WeatherKind | null {
  if (code === 0 || code === 1) return isDay === 1 ? "sun" : "moon";
  if (code === 2 || code === 3) return "cloud";
  if (code === 45 || code === 48) return "fog";
  if ([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code)) return "rain";
  if ([71,73,75,77,85,86].includes(code)) return "snow";
  if ([95,96,99].includes(code)) return "storm";
  return null;
}
