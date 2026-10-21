import { Compass } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display text-xl font-extrabold", light ? "text-primary-foreground" : "text-primary", className)}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-hero text-primary-foreground shadow-soft">
        <Compass className="h-5 w-5" />
      </span>
      Roamly
    </span>
  );
}
