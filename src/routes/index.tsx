import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Map, CloudSun, Wallet, Gem, Hotel } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Roamly — AI Travel Assistant & Itinerary Planner" },
      { name: "description", content: "Personalized day-by-day itineraries, hidden gems, hotels, restaurants, live weather and trip costs — planned by AI in seconds." },
      { property: "og:title", content: "Roamly — AI Travel Assistant" },
      { property: "og:description", content: "Plan smarter, travel better. AI itineraries, maps, weather and budgets in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const features = [
  { icon: Sparkles, title: "Day-wise AI itineraries", text: "Morning, afternoon and evening plans that flow geographically." },
  { icon: Gem, title: "Hidden gems", text: "Local spots most guidebooks miss, woven into every day." },
  { icon: Map, title: "Interactive maps", text: "Every stop, hotel and restaurant pinned and routed." },
  { icon: CloudSun, title: "Live weather", text: "7-day forecast for your destination, right on the trip." },
  { icon: Wallet, title: "Cost estimates", text: "Clear breakdown versus your budget before you go." },
  { icon: Hotel, title: "Booking links", text: "Jump straight to hotels, transport and experiences." },
];

function Index() {
  return (
    <div className="min-h-screen">
      <section className="relative min-h-[92vh] overflow-hidden">
        <img src={hero} alt="Clifftop village above a turquoise cove at sunset" width={1920} height={1088} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-scrim" />
        <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Logo light />
          <Button asChild variant="glass">
            <Link to="/auth">Sign in</Link>
          </Button>
        </header>
        <div className="relative z-10 mx-auto flex max-w-6xl flex-col px-5 pt-[14vh] pb-24 text-primary-foreground">
          <p className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-background/15 px-3 py-1 text-sm backdrop-blur">
            <Sparkles className="h-4 w-4" /> Your world, your way.
          </p>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-[1.05] md:text-7xl">
            Plan the trip <span className="text-gradient-sunset">you'll actually love.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg opacity-90">
            Tell Roamly where, when and how much. Get a full itinerary with hidden gems, stays, food, transport, weather and costs — in seconds.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild variant="sunset" size="lg">
              <Link to="/auth">Start planning free</Link>
            </Button>
            <Button asChild variant="glass" size="lg">
              <a href="#features">See what's inside</a>
            </Button>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-5 py-24">
        <h2 className="text-3xl font-bold text-primary md:text-4xl">Everything for the journey, in one place</h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl bg-card p-6 shadow-soft">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/15 text-accent">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mb-20 max-w-6xl px-5">
        <div className="rounded-3xl bg-hero p-10 text-center text-primary-foreground md:p-16">
          <h2 className="text-3xl font-bold md:text-4xl">Where to next?</h2>
          <p className="mx-auto mt-3 max-w-lg opacity-90">Your first itinerary is a couple of minutes away.</p>
          <Button asChild variant="sunset" size="lg" className="mt-8">
            <Link to="/auth">Create my account</Link>
          </Button>
        </div>
      </section>
      <footer className="pb-10 text-center text-sm text-muted-foreground">© {new Date().getFullYear()} Roamly</footer>
    </div>
  );
}
