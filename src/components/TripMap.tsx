import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer, ZoomControl, useMap } from "react-leaflet";
import { KIND_LABEL, OSM_TILES, validPins, type Pin } from "@/lib/map-data";

export type { Pin } from "@/lib/map-data";

const COLORS: Record<Pin["kind"], string> = {
  attraction: "var(--primary)",
  activity: "var(--primary)",
  food: "var(--coral)",
  hotel: "var(--chart-5)",
  gem: "var(--accent)",
  transport: "var(--warning)",
};

const GLYPH: Record<Pin["kind"], string> = { gem: "★", hotel: "H", food: "🍴", attraction: "•", activity: "•", transport: "•" };

function icon(p: Pin, n?: number) {
  return L.divIcon({
    className: "",
    html: `<div style="background:${COLORS[p.kind]};color:var(--primary-foreground);width:30px;height:30px;border-radius:9999px;display:grid;place-items:center;font:600 12px var(--font-sans);border:2px solid var(--background);box-shadow:0 4px 10px rgba(0,0,0,.25)">${n ?? GLYPH[p.kind]}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -14],
  });
}

function FitBounds({ pins, center }: { pins: Pin[]; center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (pins.length > 1) map.fitBounds(L.latLngBounds(pins.map((p) => [p.lat, p.lng])), { padding: [40, 40], maxZoom: 15 });
    else if (pins[0]) map.setView([pins[0].lat, pins[0].lng], 14);
    else map.setView(center, 12);
  }, [map, pins, center]);
  return null;
}

export default function TripMap({ pins, route, center }: { pins: Pin[]; route?: [number, number][]; center: [number, number] }) {
  const valid = useMemo(() => validPins(pins), [pins]);
  const line = useMemo(() => (route ? valid.map((p) => [p.lat, p.lng] as [number, number]) : []), [route, valid]);

  return (
    <div className="relative h-full w-full" role="region" aria-label="Trip map">
      <MapContainer
        center={center}
        zoom={12}
        zoomControl={false}
        scrollWheelZoom={false}
        touchZoom
        dragging
        className="h-full w-full"
      >
        <TileLayer url={OSM_TILES.url} attribution={OSM_TILES.attribution} maxZoom={OSM_TILES.maxZoom} />
        <ZoomControl position="topright" />
        {valid.map((p, i) => (
          <Marker key={`${p.label}-${i}`} position={[p.lat, p.lng]} icon={icon(p, route ? i + 1 : undefined)} title={p.label}>
            <Popup maxWidth={260}>
              <div className="space-y-1">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{KIND_LABEL[p.kind]}</div>
                <div className="text-sm font-semibold text-foreground">{p.label}</div>
                {p.subtitle && <div className="text-xs text-muted-foreground">{p.subtitle}</div>}
                {p.details && <p className="!m-0 text-xs leading-snug text-foreground/80">{p.details}</p>}
                <div className="pt-1 text-[10px] text-muted-foreground">Approximate location</div>
              </div>
            </Popup>
          </Marker>
        ))}
        {line.length > 1 && <Polyline positions={line} pathOptions={{ color: "var(--accent)", weight: 3, dashArray: "6 8" }} />}
        <FitBounds pins={valid} center={center} />
      </MapContainer>
      {route && line.length > 1 && (
        <div className="pointer-events-none absolute bottom-2 left-2 z-[400] rounded-md bg-background/90 px-2 py-1 text-[10px] text-muted-foreground shadow">
          Dashed line shows visit order, not directions
        </div>
      )}
      {valid.length === 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-3 z-[400] mx-auto w-fit rounded-md bg-background/90 px-3 py-1 text-xs text-muted-foreground shadow">
          No mapped places yet
        </div>
      )}
    </div>
  );
}
