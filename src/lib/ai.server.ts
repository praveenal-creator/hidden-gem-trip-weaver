import type { Plan, TripInput } from "./trip-types";

const num = { type: "number" };
const str = { type: "string" };
const obj = (properties: Record<string, unknown>) => ({
  type: "object",
  additionalProperties: false,
  properties,
  required: Object.keys(properties),
});
const arr = (items: unknown) => ({ type: "array", items });

export const planSchema = obj({
  summary: str,
  latitude: num,
  longitude: num,
  days: arr(
    obj({
      day: num,
      title: str,
      weather_tip: str,
      segments: arr(
        obj({
          time: { type: "string", enum: ["morning", "afternoon", "evening"] },
          title: str,
          description: str,
          place: str,
          latitude: num,
          longitude: num,
          cost: num,
          category: { type: "string", enum: ["attraction", "food", "transport", "activity", "hotel"] },
          is_hidden_gem: { type: "boolean" },
        }),
      ),
    }),
  ),
  hotels: arr(
    obj({ name: str, type: str, stars: num, nightly_cost: num, area: str, amenities: arr(str), latitude: num, longitude: num }),
  ),
  restaurants: arr(
    obj({ name: str, cuisine: str, price_level: str, dietary: arr(str), meal: str, description: str, latitude: num, longitude: num }),
  ),
  transport: arr(obj({ mode: str, route: str, duration: str, cost: num, tip: str })),
  hidden_gems: arr(obj({ name: str, description: str, latitude: num, longitude: num })),
  costs: obj({ accommodation: num, food: num, transport: num, activities: num, misc: num }),
  tips: arr(str),
});

const SYSTEM = `You are Roamly, an expert local travel planner. Produce realistic, specific, geographically sequenced itineraries using real, existing places with accurate coordinates. Every day has morning, afternoon and evening segments (3-5 segments total). Mix famous highlights with authentic hidden gems (mark is_hidden_gem). Respect budget, traveler type, interests and dietary needs. All costs are numbers in the trip currency, totals for the whole group. costs = estimated total trip spend by category. Give 4 hotels across price tiers fitting the budget, 6 restaurants, 4-6 transport options (getting there + getting around), 5 hidden gems, 5 practical tips. Weather tips should suggest indoor alternatives when relevant to the season.`;

export async function generatePlan(input: TripInput, refine?: { previous: Plan; instruction: string }): Promise<Plan> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured");

  const brief = `Destination: ${input.destination}
Dates: ${input.start_date} to ${input.end_date}
Travelers: ${input.travelers} (${input.traveler_type})
Total budget: ${input.budget} ${input.currency}
Interests: ${input.interests.join(", ") || "general"}
Dietary: ${input.dietary.join(", ") || "none"}
Notes: ${input.notes || "none"}`;

  const userContent = refine
    ? `${brief}\n\nCurrent plan JSON:\n${JSON.stringify(refine.previous)}\n\nRevise the whole plan with this request: ${refine.instruction}`
    : brief;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      Authorization: `Bearer ${key}`,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      instructions: SYSTEM,
      input: [{ role: "user", content: userContent }],
      text: { format: { type: "json_schema", name: "trip_plan", strict: true, schema: planSchema } },
    }),
  });

  if (!res.ok || !res.body) {
    const body = await res.text();
    if (res.status === 429) throw new Error("Too many requests right now — please try again in a minute.");
    if (res.status === 402) throw new Error("AI credits are exhausted. Please add credits to continue.");
    throw new Error(`AI request failed [${res.status}]: ${body.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let text = "";
  let done = "";
  for (;;) {
    const { value, done: end } = await reader.read();
    if (end) break;
    buf += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const ev = JSON.parse(data);
        if (ev.type === "response.output_text.delta") text += ev.delta;
        else if (ev.type === "response.output_text.done") done = ev.text;
        else if (ev.type === "response.failed" || ev.type === "error")
          throw new Error(ev.response?.error?.message ?? ev.message ?? "AI generation failed");
      } catch (e) {
        if (e instanceof Error && !(e instanceof SyntaxError)) throw e;
      }
    }
  }
  const out = done || text;
  try {
    return JSON.parse(out) as Plan;
  } catch {
    throw new Error("The AI returned an incomplete plan. Please try again.");
  }
}
