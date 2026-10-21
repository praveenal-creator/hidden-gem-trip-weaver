import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ClientOnly } from "@tanstack/react-router";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  ArrowLeft, Sunrise, Sun, Moon, Gem, ExternalLink, Star, Utensils, BedDouble, Bus, Lightbulb, Wand2, Share2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Weather } from "@/components/Weather";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { links, totalCost, tripDays, type Plan } from "@/lib/trip-types";
import { refineTrip } from "@/lib/trips.functions";
import type { Pin } from "@/components/TripMap";
import { cn } from "@/lib/utils";

const TripMap = lazy(() => import("@/components/TripMap"));

export const Route = createFileRoute("/_authenticated/trips/$id")({
  head: () => ({
    meta: [
      { title: "Your itinerary — Roamly" },
      { name: "description", content: "Day-by-day AI itinerary with map, weather, stays and costs." },
      { property: "og:title", content: "Your itinerary — Roamly" },
      { property: "og:description", content: "AI-planned trip details." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TripPage,
});

const TIME_ICON = { morning: Sunrise, afternoon: Sun, evening: Moon };
const COST_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function BookLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">
      {children} <ExternalLink className="h-3 w-3" />
    </a>
  );
}

function TripPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const refine = useServerFn(refineTrip);
  const [day, setDay] = useState(0);
  const [instruction, setInstruction] = useState("");
  const [refining, setRefining] = useState(false);

  const q = useQuery({
    queryKey: ["trip", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("trips").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const trip = q.data;
  const plan = trip?.plan as unknown as Plan | undefined;
  const center: [number, number] = [plan?.latitude ?? trip?.latitude ?? 0, plan?.longitude ?? trip?.longitude ?? 0];

  const dayPins = useMemo<Pin[]>(
    () =>
      plan?.days[day]?.segments.map((s) => ({
        lat: s.latitude, lng: s.longitude, label: s.place || s.title,
        kind: s.is_hidden_gem ? "gem" : s.category === "hotel" ? "hotel" : s.category,
        subtitle: `${s.time[0]!.toUpperCase()}${s.time.slice(1)} · Day ${day + 1}`,
        details: s.description,
      })) ?? [],
    [plan, day],
  );
  const route = useMemo(() => dayPins.map((p) => [p.lat, p.lng] as [number, number]), [dayPins]);
  const allPins = useMemo<Pin[]>(
    () =>
      plan
        ? [
            ...plan.hotels.map((h) => ({ lat: h.latitude, lng: h.longitude, label: h.name, kind: "hotel" as const, subtitle: `${h.type} · ${h.area}`, details: h.amenities.slice(0, 4).join(", ") })),
            ...plan.restaurants.map((r) => ({ lat: r.latitude, lng: r.longitude, label: r.name, kind: "food" as const, subtitle: `${r.cuisine} · ${r.price_level}`, details: r.description })),
            ...plan.hidden_gems.map((g) => ({ lat: g.latitude, lng: g.longitude, label: g.name, kind: "gem" as const, details: g.description })),
          ]
        : [],
    [plan],
  );

  async function doRefine(text: string) {
    if (text.trim().length < 3) return;
    setRefining(true);
    try {
      await refine({ data: { id, instruction: text } });
      await qc.invalidateQueries({ queryKey: ["trip", id] });
      setInstruction("");
      toast.success("Itinerary updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't refine");
    } finally {
      setRefining(false);
    }
  }

  if (q.isLoading)
    return (
      <div className="min-h-screen">
        <AppHeader />
        <div className="mx-auto max-w-6xl space-y-4 px-5 py-10">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  if (!trip || !plan)
    return (
      <div className="min-h-screen">
        <AppHeader />
        <p className="p-10 text-center text-muted-foreground">Trip not found.</p>
      </div>
    );

  const total = totalCost(plan.costs);
  const budget = Number(trip.budget);
  const over = total > budget;
  const costData = Object.entries(plan.costs).map(([name, value]) => ({ name, value }));
  const fmt = (n: number) => `${Math.round(n).toLocaleString()} ${trip.currency}`;
  const current = plan.days[day];

  return (
    <div className="min-h-screen pb-[env(safe-area-inset-bottom)]">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All trips
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold md:text-5xl">{trip.destination}</h1>
            <p className="mt-1 text-muted-foreground">
              {trip.start_date} → {trip.end_date} · {tripDays(trip.start_date, trip.end_date)} days · {trip.travelers} {trip.traveler_type}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(plan.summary + "\n\n" + plan.days.map((d) => `Day ${d.day}: ${d.title}\n` + d.segments.map((s) => ` • ${s.time}: ${s.title}`).join("\n")).join("\n\n")); toast.success("Itinerary copied"); }}>
            <Share2 /> Copy itinerary
          </Button>
        </div>
        <p className="mt-4 max-w-3xl text-lg">{plan.summary}</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            {/* Day tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {plan.days.map((d, i) => (
                <button key={i} onClick={() => setDay(i)} className={cn("shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition", i === day ? "bg-primary text-primary-foreground shadow-soft" : "bg-card hover:bg-secondary")}>
                  Day {d.day}
                </button>
              ))}
            </div>

            <div className="h-80 overflow-hidden rounded-2xl shadow-soft">
              <ClientOnly fallback={<Skeleton className="h-full w-full" />}>
                <Suspense fallback={<Skeleton className="h-full w-full" />}>
                  <TripMap pins={dayPins} route={route} center={center} />
                </Suspense>
              </ClientOnly>
            </div>

            {current && (
              <div key={day} className="animate-in fade-in rounded-2xl bg-card p-6 shadow-soft">
                <h2 className="text-2xl font-bold">Day {current.day}: {current.title}</h2>
                {current.weather_tip && <p className="mt-2 rounded-xl bg-warning/10 px-3 py-2 text-sm">🌦 {current.weather_tip}</p>}
                <ol className="mt-6 space-y-5">
                  {current.segments.map((s, i) => {
                    const I = TIME_ICON[s.time] ?? Sun;
                    return (
                      <li key={i} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary"><I className="h-5 w-5" /></span>
                          {i < current.segments.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
                        </div>
                        <div className="flex-1 pb-2">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.time}</p>
                          <h3 className="flex flex-wrap items-center gap-2 font-semibold">
                            {s.title}
                            {s.is_hidden_gem && <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent"><Gem className="h-3 w-3" /> Hidden gem</span>}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-4">
                            <span className="font-mono text-xs">{s.cost > 0 ? fmt(s.cost) : "Free"}</span>
                            <BookLink href={links.maps(`${s.place} ${trip.destination}`)}>Directions</BookLink>
                            {(s.category === "attraction" || s.category === "activity") && <BookLink href={links.getyourguide(`${s.place} ${trip.destination}`)}>Tickets</BookLink>}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            <div className="rounded-2xl bg-card p-6 shadow-soft">
              <h3 className="flex items-center gap-2 font-semibold"><Wand2 className="h-4 w-4 text-coral" /> Refine with AI</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Make it more budget-friendly", "Add more outdoor activities", "Slower pace, fewer stops", "More hidden gems"].map((p) => (
                  <button key={p} disabled={refining} onClick={() => doRefine(p)} className="rounded-full border px-3 py-1.5 text-xs hover:border-accent disabled:opacity-50">{p}</button>
                ))}
              </div>
              <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); doRefine(instruction); }}>
                <Input placeholder="Anything else? e.g. add a cooking class on day 2" value={instruction} onChange={(e) => setInstruction(e.target.value)} maxLength={500} />
                <Button type="submit" disabled={refining}>{refining ? "Updating…" : "Update"}</Button>
              </form>
            </div>

            <Tabs defaultValue="hotels" className="rounded-2xl bg-card p-6 shadow-soft">
              <TabsList className="flex-wrap">
                <TabsTrigger value="hotels"><BedDouble className="mr-1 h-4 w-4" />Stays</TabsTrigger>
                <TabsTrigger value="food"><Utensils className="mr-1 h-4 w-4" />Food</TabsTrigger>
                <TabsTrigger value="transport"><Bus className="mr-1 h-4 w-4" />Transport</TabsTrigger>
                <TabsTrigger value="gems"><Gem className="mr-1 h-4 w-4" />Hidden gems</TabsTrigger>
                <TabsTrigger value="map">Map</TabsTrigger>
              </TabsList>
              <TabsContent value="hotels" className="mt-4 grid gap-3 sm:grid-cols-2">
                {plan.hotels.map((h) => (
                  <div key={h.name} className="rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold">{h.name}</h4>
                      <span className="flex shrink-0 items-center text-warning">{Array.from({ length: Math.round(h.stars) }).map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{h.type} · {h.area}</p>
                    <p className="mt-2 font-mono text-sm">{fmt(h.nightly_cost)} / night</p>
                    <p className="mt-1 text-xs text-muted-foreground">{h.amenities.slice(0, 4).join(" · ")}</p>
                    <div className="mt-3 flex gap-4">
                      <BookLink href={links.booking(`${h.name} ${trip.destination}`)}>Booking.com</BookLink>
                      <BookLink href={links.airbnb(trip.destination)}>Airbnb</BookLink>
                    </div>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="food" className="mt-4 grid gap-3 sm:grid-cols-2">
                {plan.restaurants.map((r) => (
                  <div key={r.name} className="rounded-xl border p-4">
                    <h4 className="font-semibold">{r.name}</h4>
                    <p className="text-xs text-muted-foreground">{r.cuisine} · {r.price_level} · {r.meal}</p>
                    <p className="mt-2 text-sm">{r.description}</p>
                    {r.dietary.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{r.dietary.map((d) => <span key={d} className="rounded-full bg-success/15 px-2 py-0.5 text-[10px]">{d}</span>)}</div>}
                    <div className="mt-3 flex gap-4">
                      <BookLink href={links.maps(`${r.name} ${trip.destination}`)}>Map</BookLink>
                      <BookLink href={links.tripadvisor(`${r.name} ${trip.destination}`)}>Reviews & reserve</BookLink>
                    </div>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="transport" className="mt-4 space-y-3">
                {plan.transport.map((t, i) => (
                  <div key={i} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
                    <div>
                      <h4 className="font-semibold capitalize">{t.mode} · {t.route}</h4>
                      <p className="text-xs text-muted-foreground">{t.duration} · {t.tip}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-sm">{fmt(t.cost)}</span>
                      {/flight|plane|air/i.test(t.mode) ? <BookLink href={links.skyscanner()}>Skyscanner</BookLink> : <BookLink href={links.rome2rio(t.route)}>Rome2Rio</BookLink>}
                    </div>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="gems" className="mt-4 grid gap-3 sm:grid-cols-2">
                {plan.hidden_gems.map((g) => (
                  <div key={g.name} className="rounded-xl bg-accent/10 p-4">
                    <h4 className="flex items-center gap-1.5 font-semibold"><Gem className="h-4 w-4 text-accent" />{g.name}</h4>
                    <p className="mt-1 text-sm">{g.description}</p>
                    <div className="mt-2"><BookLink href={links.maps(`${g.name} ${trip.destination}`)}>Open in Maps</BookLink></div>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="map" className="mt-4">
                <div className="h-96 overflow-hidden rounded-xl">
                  <ClientOnly fallback={<Skeleton className="h-full w-full" />}>
                    <Suspense fallback={<Skeleton className="h-full w-full" />}>
                      <TripMap pins={allPins} center={center} />
                    </Suspense>
                  </ClientOnly>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">H = stays · 🍴 = food · ★ = hidden gems</p>
              </TabsContent>
            </Tabs>
          </div>

          <aside className="space-y-6">
            <Weather lat={center[0]} lng={center[1]} />

            <div className="rounded-2xl bg-card p-6 shadow-soft">
              <h3 className="font-semibold">Estimated cost</h3>
              <p className="mt-2 font-mono text-3xl font-medium">{fmt(total)}</p>
              <p className={cn("text-sm", over ? "text-destructive" : "text-success")}>
                {over ? `${fmt(total - budget)} over` : `${fmt(budget - total)} under`} your {fmt(budget)} budget
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full rounded-full", over ? "bg-destructive" : "bg-accent")} style={{ width: `${Math.min(100, (total / Math.max(1, budget)) * 100)}%` }} />
              </div>
              <div className="h-48">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={costData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
                      {costData.map((_, i) => <Cell key={i} fill={COST_COLORS[i % 5]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-1.5 text-sm">
                {costData.map((c, i) => (
                  <li key={c.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 capitalize"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COST_COLORS[i % 5] }} />{c.name}</span>
                    <span className="font-mono">{fmt(c.value)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-card p-6 shadow-soft">
              <h3 className="flex items-center gap-2 font-semibold"><Lightbulb className="h-4 w-4 text-warning" /> Local tips</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {plan.tips.map((t, i) => <li key={i} className="flex gap-2"><span className="text-coral">•</span>{t}</li>)}
              </ul>
            </div>
          </aside>
        </div>
      </main>
      {refining && (
        <div className="fixed inset-x-0 bottom-6 z-[2000] mx-auto w-fit rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground shadow-glow">
          Reworking your itinerary…
        </div>
      )}
    </div>
  );
}
