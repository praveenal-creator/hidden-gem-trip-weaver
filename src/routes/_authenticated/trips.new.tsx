import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Compass, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createTrip } from "@/lib/trips.functions";
import { tripDays } from "@/lib/trip-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/trips/new")({
  head: () => ({
    meta: [
      { title: "Plan a new trip — Roamly" },
      { name: "description", content: "Generate a personalized AI itinerary." },
      { property: "og:title", content: "Plan a new trip — Roamly" },
      { property: "og:description", content: "AI itinerary generator." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewTrip,
});

const POPULAR = ["Kyoto, Japan", "Lisbon, Portugal", "Bali, Indonesia", "Jaipur, India", "Mexico City", "Cape Town"];
const INTERESTS = ["Adventure", "Culture", "Food & Drink", "Nightlife", "Nature", "Beaches", "History", "Shopping", "Wellness"];
const DIETS = ["Vegetarian", "Vegan", "Halal", "Kosher", "Gluten-Free"];
const TYPES = ["solo", "couple", "family", "group", "business"];
const CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "AUD", "CAD"];
const STEPS = ["Destination", "Dates", "Travelers", "Budget", "Preferences"];
const MESSAGES = ["Finding hidden gems…", "Building your day-by-day plan…", "Calculating your budget…", "Picking places to stay…", "Checking local food spots…"];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium capitalize transition active:scale-95",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-accent",
      )}
    >
      {children}
    </button>
  );
}

function NewTrip() {
  const navigate = useNavigate();
  const create = useServerFn(createTrip);
  const today = new Date().toISOString().slice(0, 10);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(0);
  const [f, setF] = useState({
    destination: "",
    start_date: today,
    end_date: new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10),
    budget: 1500,
    currency: "USD",
    travelers: 2,
    traveler_type: "couple",
    interests: ["Culture", "Food & Drink"] as string[],
    dietary: [] as string[],
    notes: "",
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const toggle = (k: "interests" | "dietary", v: string) =>
    set(k, f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v]);

  const days = tripDays(f.start_date, f.end_date);
  const canNext = [f.destination.trim().length > 1, f.end_date >= f.start_date && days <= 21, f.travelers >= 1, f.budget > 0, true][step];

  async function generate() {
    setLoading(true);
    const iv = setInterval(() => setMsg((m) => (m + 1) % MESSAGES.length), 2500);
    try {
      const { id } = await create({ data: f });
      navigate({ to: "/trips/$id", params: { id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
      setLoading(false);
    } finally {
      clearInterval(iv);
    }
  }

  const tier = f.budget / Math.max(1, f.travelers * days);
  const tierLabel = tier < 80 ? "Budget" : tier < 250 ? "Mid-range" : "Luxury";

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-5 py-10">
        <h1 className="text-3xl font-bold">Plan a new trip</h1>
        <div className="mt-6 flex gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={cn("h-1.5 rounded-full transition", i <= step ? "bg-accent" : "bg-muted")} />
              <p className={cn("mt-1.5 hidden text-xs sm:block", i === step ? "font-medium text-foreground" : "text-muted-foreground")}>{s}</p>
            </div>
          ))}
        </div>

        <div key={step} className="mt-8 animate-in fade-in slide-in-from-right-4 rounded-2xl bg-card p-6 shadow-soft">
          {step === 0 && (
            <div className="space-y-4">
              <Label htmlFor="dest">Where are you going?</Label>
              <Input id="dest" placeholder="e.g. Kyoto, Japan" value={f.destination} onChange={(e) => set("destination", e.target.value)} autoFocus />
              <div className="flex flex-wrap gap-2">
                {POPULAR.map((p) => <Chip key={p} active={f.destination === p} onClick={() => set("destination", p)}>{p}</Chip>)}
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="s">Departure</Label>
                <Input id="s" type="date" value={f.start_date} min={today} onChange={(e) => set("start_date", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="e">Return</Label>
                <Input id="e" type="date" value={f.end_date} min={f.start_date} onChange={(e) => set("end_date", e.target.value)} />
              </div>
              <p className="sm:col-span-2 font-mono text-sm text-accent">{days} days{days > 21 ? " — max 21 days" : ""}</p>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <Label>Travelers</Label>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" onClick={() => set("travelers", Math.max(1, f.travelers - 1))}>−</Button>
                  <span className="w-6 text-center font-mono">{f.travelers}</span>
                  <Button variant="outline" size="icon" onClick={() => set("travelers", Math.min(30, f.travelers + 1))}>+</Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((t) => <Chip key={t} active={f.traveler_type === t} onClick={() => set("traveler_type", t)}>{t}</Chip>)}
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <Label htmlFor="b">Total budget</Label>
              <div className="flex gap-2">
                <Input id="b" type="number" min={1} value={f.budget} onChange={(e) => set("budget", Number(e.target.value))} className="font-mono" />
                <select value={f.currency} onChange={(e) => set("currency", e.target.value)} className="rounded-xl border bg-background px-3 text-sm">
                  {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <p className="text-sm text-muted-foreground">
                ≈ <span className="font-mono">{Math.round(tier)} {f.currency}</span> per person per day ·{" "}
                <span className="font-semibold text-coral">{tierLabel}</span>
              </p>
            </div>
          )}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <Label>Interests</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {INTERESTS.map((i) => <Chip key={i} active={f.interests.includes(i)} onClick={() => toggle("interests", i)}>{i}</Chip>)}
                </div>
              </div>
              <div>
                <Label>Dietary needs</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DIETS.map((i) => <Chip key={i} active={f.dietary.includes(i)} onClick={() => toggle("dietary", i)}>{i}</Chip>)}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="n">Must-sees or notes</Label>
                <Textarea id="n" maxLength={1000} value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="e.g. slow mornings, one fancy dinner, no hiking" />
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-between">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft /> Back</Button>
          {step < 4 ? (
            <Button disabled={!canNext} onClick={() => setStep(step + 1)}>Next <ArrowRight /></Button>
          ) : (
            <Button variant="sunset" size="lg" onClick={generate} disabled={loading}>Generate itinerary</Button>
          )}
        </div>
      </main>

      {loading && (
        <div className="fixed inset-0 z-[2000] grid place-items-center bg-background/70 backdrop-blur-md">
          <div className="text-center">
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-hero text-primary-foreground shadow-glow">
              <Compass className="h-10 w-10 animate-spin-slow" />
            </span>
            <p className="mt-6 text-lg font-semibold">Discovering the best of {f.destination}…</p>
            <p className="mt-1 text-muted-foreground">{MESSAGES[msg]}</p>
            <p className="mt-4 text-xs text-muted-foreground">This usually takes under a minute.</p>
          </div>
        </div>
      )}
    </div>
  );
}
