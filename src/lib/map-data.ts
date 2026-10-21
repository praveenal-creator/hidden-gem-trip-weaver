// Browser-safe map data types and helpers (no Leaflet imports here).
export type PinKind = "attraction" | "food" | "hotel" | "gem" | "transport" | "activity";

export type Pin = {
  lat: number;
  lng: number;
  label: string;
  kind: PinKind;
  /** Short secondary line, e.g. "Morning · Day 2" or "Seafood · $$" */
  subtitle?: string;
  /** Longer description shown in the popup */
  details?: string;
};

export const KIND_LABEL: Record<PinKind, string> = {
  attraction: "Attraction",
  activity: "Activity",
  food: "Food",
  hotel: "Stay",
  gem: "Hidden gem",
  transport: "Transport",
};

/** Drops pins with missing or (0,0) "null island" coordinates. */
export function validPins(pins: Pin[]): Pin[] {
  return pins.filter(
    (p) =>
      Number.isFinite(p.lat) && Number.isFinite(p.lng) &&
      Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180 &&
      (p.lat !== 0 || p.lng !== 0),
  );
}

// OpenStreetMap standard tiles — usage policy: https://operations.osmfoundation.org/policies/tiles/
// Visible attribution required, no bulk/offline prefetching, reasonable max zoom.
export const OSM_TILES = {
  url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
  maxZoom: 19,
} as const;
