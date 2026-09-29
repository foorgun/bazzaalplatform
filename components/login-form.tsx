"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { HOME_FOR_ROLE } from "@/lib/roles";
import type { Role } from "@/lib/types";

const SETUP_ERRORS: Record<string, string> = {
  "no-profile": "This account has no profile row yet. Run 04_demo_users.sql in Supabase.",
  "not-configured":
    "Supabase is not configured. Fill in .env.local and restart the dev server.",
};

const DEMO_ACCOUNTS = [
  { label: "Agency", email: "admin@bazzaal.demo" },
  { label: "Brand", email: "brand@mixsoon.demo" },
  { label: "Creator", email: "creator@bazzaal.demo" },
];

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    SETUP_ERRORS[params.get("error") ?? ""] ?? null
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setError("Supabase is not configured. Fill in .env.local and restart the dev server.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError || !data.user) {
      setError(signInError?.message ?? "Sign in failed.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const destination = HOME_FOR_ROLE[profile?.role as Role] ?? "/dashboard";
    router.replace(destination);
    router.refresh();
  }

  return (
    <div className="w-full max-w-[380px]">
      <div className="mb-7 text-center">
        <h1 className="text-[22px] font-semibold tracking-tight text-ink">BAZZAAL Platform</h1>
        <p className="mt-1 text-[13px] text-ink-muted">Sign in to your workspace</p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-lg border border-hairline bg-surface p-6 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset]"
      >
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="rounded-md border border-danger/25 bg-danger/[0.07] px-3 py-2 text-[13px] text-danger">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>

        <div className="border-t border-hairline pt-4">
          <p className="mb-2 flex items-center gap-1.5 text-2xs uppercase tracking-wider text-ink-faint">
            <LockKeyhole className="h-3 w-3" /> Demo accounts
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => {
                  setEmail(account.email);
                  setPassword("bazzaal2026");
                }}
                className="rounded-md border border-hairline px-2 py-1.5 text-[12px] text-ink-muted transition-colors hover:border-accent-line hover:text-accent"
              >
                {account.label}
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
