import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";

export function AppHeader() {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-[1000] border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link to="/dashboard"><Logo /></Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="sunset" size="sm">
            <Link to="/trips/new"><Plus /> New trip</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/" });
            }}
          >
            <LogOut />
          </Button>
        </div>
      </div>
    </header>
  );
}
