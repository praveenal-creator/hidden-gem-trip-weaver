// Location search abstraction, kept separate from map rendering.
// No provider is configured yet; plug one in (e.g. Nominatim via a server
// function with a proper User-Agent, or a paid service) by implementing Geocoder.

export type GeocodeResult = { name: string; lat: number; lng: number; country?: string };

export interface Geocoder {
  readonly id: string;
  readonly available: boolean;
  search(query: string, opts?: { limit?: number; signal?: AbortSignal }): Promise<GeocodeResult[]>;
}

export const noGeocoder: Geocoder = {
  id: "none",
  available: false,
  async search() {
    return [];
  },
};

let current: Geocoder = noGeocoder;
export const getGeocoder = () => current;
export const setGeocoder = (g: Geocoder) => {
  current = g;
};
