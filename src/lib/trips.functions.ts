import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Plan, TripInput } from "./trip-types";

const tripInput = z.object({
  destination: z.string().trim().min(2).max(120),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  budget: z.number().min(0).max(10_000_000),
  currency: z.string().min(3).max(3),
  travelers: z.number().int().min(1).max(30),
  traveler_type: z.string().max(20),
  interests: z.array(z.string().max(30)).max(15),
  dietary: z.array(z.string().max(30)).max(10),
  notes: z.string().max(1000),
});

export const createTrip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: TripInput) => tripInput.parse(d))
  .handler(async ({ data, context }) => {
    const days = (new Date(data.end_date).getTime() - new Date(data.start_date).getTime()) / 86400000 + 1;
    if (days < 1 || days > 21) throw new Error("Trips must be between 1 and 21 days.");
    const { generatePlan } = await import("./ai.server");
    const plan = await generatePlan(data);
    const { data: row, error } = await context.supabase
      .from("trips")
      .insert({
        user_id: context.userId,
        destination: data.destination,
        start_date: data.start_date,
        end_date: data.end_date,
        budget: data.budget,
        currency: data.currency,
        travelers: data.travelers,
        traveler_type: data.traveler_type,
        interests: data.interests,
        notes: data.notes,
        latitude: plan.latitude,
        longitude: plan.longitude,
        plan: plan as never,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const refineTrip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { id: string; instruction: string }) =>
    z.object({ id: z.string().uuid(), instruction: z.string().trim().min(3).max(500) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: trip, error } = await context.supabase.from("trips").select("*").eq("id", data.id).single();
    if (error || !trip) throw new Error("Trip not found");
    const { generatePlan } = await import("./ai.server");
    const plan = await generatePlan(
      {
        destination: trip.destination,
        start_date: trip.start_date,
        end_date: trip.end_date,
        budget: Number(trip.budget),
        currency: trip.currency,
        travelers: trip.travelers,
        traveler_type: trip.traveler_type,
        interests: trip.interests,
        dietary: [],
        notes: trip.notes ?? "",
      },
      { previous: trip.plan as unknown as Plan, instruction: data.instruction },
    );
    const { error: upErr } = await context.supabase
      .from("trips")
      .update({ plan: plan as never, latitude: plan.latitude, longitude: plan.longitude })
      .eq("id", data.id);
    if (upErr) throw new Error(upErr.message);
    return { ok: true };
  });
