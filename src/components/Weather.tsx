import { useQuery } from "@tanstack/react-query";
import { Cloud, CloudRain, CloudSnow, CloudSun, Sun, CloudLightning, CloudFog } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function icon(code: number) {
  if (code === 0) return Sun;
  if (code <= 2) return CloudSun;
  if (code === 3) return Cloud;
  if (code <= 48) return CloudFog;
  if (code <= 67 || (code >= 80 && code <= 82)) return CloudRain;
  if (code <= 77 || code === 85 || code === 86) return CloudSnow;
  return CloudLightning;
}
const label = (c: number) =>
  c === 0 ? "Clear" : c <= 2 ? "Partly cloudy" : c === 3 ? "Overcast" : c <= 48 ? "Fog" : c <= 67 ? "Rain" : c <= 77 ? "Snow" : c <= 82 ? "Showers" : "Storms";

export function Weather({ lat, lng }: { lat: number; lng: number }) {
  const q = useQuery({
    queryKey: ["weather", lat, lng],
    queryFn: async () => {
      const r = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=7`,
      );
      if (!r.ok) throw new Error("Weather unavailable");
      return r.json();
    },
    staleTime: 10 * 60 * 1000,
  });

  if (q.isLoading) return <Skeleton className="h-48 rounded-2xl" />;
  if (!q.data) return <div className="rounded-2xl bg-card p-6 text-sm text-muted-foreground shadow-soft">Weather unavailable right now.</div>;
  const c = q.data.current;
  const d = q.data.daily;
  const Now = icon(c.weather_code);
  return (
    <div className="rounded-2xl bg-hero p-6 text-primary-foreground shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-80">Right now</p>
          <p className="font-display text-5xl font-extrabold">{Math.round(c.temperature_2m)}°</p>
          <p className="text-sm opacity-90">{label(c.weather_code)} · wind {Math.round(c.wind_speed_10m)} km/h</p>
        </div>
        <Now className="h-16 w-16 opacity-90" />
      </div>
      <div className="mt-6 grid grid-cols-7 gap-1 text-center text-xs">
        {d.time.map((t: string, i: number) => {
          const I = icon(d.weather_code[i]);
          return (
            <div key={t} className="rounded-xl bg-background/10 py-2">
              <p className="opacity-80">{new Date(t).toLocaleDateString(undefined, { weekday: "short" })}</p>
              <I className="mx-auto my-1 h-4 w-4" />
              <p className="font-mono">{Math.round(d.temperature_2m_max[i])}°</p>
              <p className="font-mono opacity-70">{Math.round(d.temperature_2m_min[i])}°</p>
              {d.precipitation_probability_max[i] > 50 && <p className="text-[10px] opacity-90">☔{d.precipitation_probability_max[i]}%</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
