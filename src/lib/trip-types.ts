export type Segment = {
  time: "morning" | "afternoon" | "evening";
  title: string;
  description: string;
  place: string;
  latitude: number;
  longitude: number;
  cost: number;
  category: "attraction" | "food" | "transport" | "activity" | "hotel";
  is_hidden_gem: boolean;
};
export type Day = { day: number; title: string; weather_tip: string; segments: Segment[] };
export type Hotel = {
  name: string; type: string; stars: number; nightly_cost: number; area: string;
  amenities: string[]; latitude: number; longitude: number;
};
export type Restaurant = {
  name: string; cuisine: string; price_level: string; dietary: string[]; meal: string;
  description: string; latitude: number; longitude: number;
};
export type Transport = { mode: string; route: string; duration: string; cost: number; tip: string };
export type Gem = { name: string; description: string; latitude: number; longitude: number };
export type Costs = { accommodation: number; food: number; transport: number; activities: number; misc: number };
export type Plan = {
  summary: string;
  latitude: number;
  longitude: number;
  days: Day[];
  hotels: Hotel[];
  restaurants: Restaurant[];
  transport: Transport[];
  hidden_gems: Gem[];
  costs: Costs;
  tips: string[];
};

export type TripInput = {
  destination: string;
  start_date: string;
  end_date: string;
  budget: number;
  currency: string;
  travelers: number;
  traveler_type: string;
  interests: string[];
  dietary: string[];
  notes: string;
};

export function totalCost(c: Costs) {
  return c.accommodation + c.food + c.transport + c.activities + c.misc;
}

export function tripDays(start: string, end: string) {
  const d = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;
  return Math.max(1, d);
}

export const links = {
  maps: (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`,
  booking: (q: string) => `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(q)}`,
  airbnb: (city: string) => `https://www.airbnb.com/s/${encodeURIComponent(city)}/homes`,
  skyscanner: () => `https://www.skyscanner.com/`,
  rome2rio: (route: string) => `https://www.rome2rio.com/s/${encodeURIComponent(route.split(/→|->| to /)[0]?.trim() ?? route)}/${encodeURIComponent(route.split(/→|->| to /)[1]?.trim() ?? "")}`,
  tripadvisor: (q: string) => `https://www.tripadvisor.com/Search?q=${encodeURIComponent(q)}`,
  getyourguide: (q: string) => `https://www.getyourguide.com/s/?q=${encodeURIComponent(q)}`,
};
