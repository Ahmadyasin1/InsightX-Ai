"use client";

import { useEffect, useState } from "react";
import { syncSupabaseSessionToStore } from "@/lib/auth-session";
import { isSupabaseEnabled, supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth";

/** Restores Supabase sessions into Zustand on load and keeps them in sync. */
export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const { _hydrated, setHydrated } = useAuthStore();
  const [ready, setReady] = useState(!isSupabaseEnabled);

  useEffect(() => {
    if (!_hydrated) setHydrated();
  }, [_hydrated, setHydrated]);

  useEffect(() => {
    if (!isSupabaseEnabled || !supabase) {
      setReady(true);
      return;
    }

    let cancelled = false;

    syncSupabaseSessionToStore().finally(() => {
      if (!cancelled) setReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN") await syncSupabaseSessionToStore();
      if (event === "SIGNED_OUT") useAuthStore.getState().logout();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  if (!_hydrated || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
