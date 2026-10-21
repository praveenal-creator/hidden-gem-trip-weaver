import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, MapPin, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { tripDays, totalCost, type Plan } from "@/lib/trip-types";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My trips — Roamly" },
      { name: "description", content: "All your AI-planned trips in one place." },
      { property: "og:title", content: "My trips — Roamly" },
      { property: "og:description", content: "Your saved itineraries." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function Dashboard() {
  const qc = useQueryClient();
  const { user } = Route.useRouteContext();
  const profile = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => (await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()).data,
  });
  const trips = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const { data, error } = await supabase.from("trips").select("*").order("start_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("trips").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Trip deleted");
      qc.invalidateQueries({ queryKey: ["trips"] });
    },
  });

  const name = profile.data?.full_name?.split(" ")[0] ?? "traveler";

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="text-3xl font-bold md:text-4xl">{greeting()}, {name} 👋</h1>
        <p className="mt-1 text-muted-foreground">Where to next?</p>

        <div className="mt-8 rounded-3xl bg-hero p-8 text-primary-foreground shadow-soft">
          <Sparkles className="h-6 w-6" />
          <h2 className="mt-3 text-2xl font-bold">Plan a new adventure</h2>
          <p className="mt-1 max-w-md opacity-90">Pick a destination, dates and budget — Roamly builds the rest.</p>
          <Button asChild variant="sunset" className="mt-6">
            <Link to="/trips/new">Generate itinerary</Link>
          </Button>
        </div>

        <h2 className="mt-12 text-xl font-semibold">Your trips</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {trips.isLoading &&
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
          {trips.data?.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
              No trips yet. Plan your first one above.
            </div>
          )}
          {trips.data?.map((t) => {
            const plan = t.plan as unknown as Plan | null;
            const until = Math.ceil((new Date(t.start_date).getTime() - Date.now()) / 86400000);
            return (
              <div key={t.id} className="group relative rounded-2xl bg-card p-6 shadow-soft transition hover:-translate-y-0.5">
                <Link to="/trips/$id" params={{ id: t.id }} className="block">
                  <div className="flex items-center gap-2 text-sm text-accent">
                    <MapPin className="h-4 w-4" /> {tripDays(t.start_date, t.end_date)} days
                  </div>
                  <h3 className="mt-2 text-xl font-bold">{t.destination}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" /> {t.start_date} → {t.end_date}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="font-mono">
                      {plan ? `${Math.round(totalCost(plan.costs)).toLocaleString()} ${t.currency}` : "—"}
                    </span>
                    <span className="rounded-full bg-coral/15 px-2.5 py-0.5 text-xs font-medium text-coral">
                      {until > 0 ? `in ${until} days` : until > -tripDays(t.start_date, t.end_date) ? "Ongoing" : "Past"}
                    </span>
                  </div>
                </Link>
                <button
                  aria-label="Delete trip"
                  onClick={() => confirm("Delete this trip?") && del.mutate(t.id)}
                  className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
