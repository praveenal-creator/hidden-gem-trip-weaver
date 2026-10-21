import { useEffect, useRef } from "react";
import L from "leaflet";

export type Pin = { lat: number; lng: number; label: string; kind: "attraction" | "food" | "hotel" | "gem" | "transport" | "activity" };

const COLORS: Record<Pin["kind"], string> = {
  attraction: "var(--primary)",
  activity: "var(--primary)",
  food: "var(--coral)",
  hotel: "var(--chart-5)",
  gem: "var(--accent)",
  transport: "var(--warning)",
};

export default function TripMap({ pins, route, center }: { pins: Pin[]; route?: [number, number][]; center: [number, number] }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current, { scrollWheelZoom: false }).setView(center, 12);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: "© OpenStreetMap © CARTO",
      maxZoom: 19,
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => {
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = map.current;
    const g = layer.current;
    if (!m || !g) return;
    g.clearLayers();
    const valid = pins.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && (p.lat !== 0 || p.lng !== 0));
    valid.forEach((p, i) => {
      const icon = L.divIcon({
        className: "",
        html: `<div style="background:${COLORS[p.kind]};color:white;width:28px;height:28px;border-radius:9999px;display:grid;place-items:center;font:600 12px Inter;border:2px solid white;box-shadow:0 4px 10px rgba(0,0,0,.25)">${route ? i + 1 : p.kind === "gem" ? "★" : p.kind === "hotel" ? "H" : p.kind === "food" ? "🍴" : "•"}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker([p.lat, p.lng], { icon }).bindPopup(`<strong>${p.label.replace(/</g, "&lt;")}</strong>`).addTo(g);
    });
    if (route && route.length > 1) {
      L.polyline(route, { color: "#2CBFAE", weight: 4, dashArray: "6 8" }).addTo(g);
    }
    if (valid.length) m.fitBounds(L.latLngBounds(valid.map((p) => [p.lat, p.lng])), { padding: [40, 40], maxZoom: 14 });
    else m.setView(center, 12);
  }, [pins, route, center]);

  return <div ref={el} className="h-full w-full" role="region" aria-label="Trip map" />;
}
