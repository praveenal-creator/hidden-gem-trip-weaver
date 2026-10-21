import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Roamly" },
      { name: "description", content: "Sign in or create your Roamly account to plan AI-powered trips." },
      { property: "og:title", content: "Sign in — Roamly" },
      { property: "og:description", content: "Access your AI travel plans." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/dashboard" });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotice(null);
    try {
      if (mode === "signup") {
        if (password.length < 8) throw new Error("Password must be at least 8 characters.");
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: name } },
        });
        if (error) throw error;
        setNotice("Check your email to confirm your account, then sign in.");
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        setNotice("If that email exists, a reset link is on its way.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (result.error) toast.error(result.error.message);
  }

  const title = mode === "signup" ? "Create your account" : mode === "signin" ? "Welcome back" : "Reset password";

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-scrim" />
        <div className="absolute bottom-12 left-12 max-w-md text-primary-foreground">
          <h2 className="text-4xl font-extrabold">Plan smarter, travel better.</h2>
          <p className="mt-3 opacity-90">Hidden gems, stays, food and costs — tailored to you.</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <Link to="/"><Logo /></Link>
          <h1 className="mt-10 text-3xl font-bold">{title}</h1>
          <p className="mt-1 text-muted-foreground">
            {mode === "forgot" ? "We'll email you a secure link." : "Your next adventure starts here."}
          </p>

          {notice ? (
            <div className="mt-8 rounded-2xl bg-accent/10 p-4 text-sm">{notice}</div>
          ) : null}

          <form onSubmit={submit} className="mt-8 space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "signin" && (
                    <button type="button" className="text-xs text-primary hover:underline" onClick={() => setMode("forgot")}>
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            )}
            <Button type="submit" variant="sunset" className="w-full" size="lg" disabled={loading}>
              {loading ? "Please wait…" : mode === "signup" ? "Sign up" : mode === "signin" ? "Log in" : "Send reset link"}
            </Button>
          </form>

          {mode !== "forgot" && (
            <>
              <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or continue with <span className="h-px flex-1 bg-border" />
              </div>
              <Button variant="outline" className="w-full" size="lg" onClick={google}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden><path fill="currentColor" d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.66 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.95S8.78 6.28 12 6.28c1.83 0 3.06.78 3.76 1.45l2.57-2.47C16.7 3.74 14.56 2.8 12 2.8 6.92 2.8 2.8 6.92 2.8 12s4.12 9.2 9.2 9.2c5.31 0 8.83-3.73 8.83-8.99 0-.6-.07-1.06-.15-1.51z"/></svg>
                Google
              </Button>
            </>
          )}

          <p className="mt-8 text-center text-sm text-muted-foreground">
            {mode === "signup" ? (
              <>Already have an account? <button className="font-medium text-primary hover:underline" onClick={() => setMode("signin")}>Log in</button></>
            ) : mode === "signin" ? (
              <>New to Roamly? <button className="font-medium text-primary hover:underline" onClick={() => setMode("signup")}>Sign up</button></>
            ) : (
              <button className="font-medium text-primary hover:underline" onClick={() => setMode("signin")}>Back to login</button>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
