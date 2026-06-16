"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase, isSupabaseEnabled } from "@/lib/supabase";
import { syncSupabaseSessionToStore } from "@/lib/auth-session";
import { Loader2 } from "lucide-react";

/** Client-side OAuth callback — exchanges PKCE code and stores session in browser. */
function AuthCallbackContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [message, setMessage] = useState("Completing sign in…");

  useEffect(() => {
    if (!isSupabaseEnabled || !supabase) {
      router.replace("/auth?error=supabase_not_configured");
      return;
    }

    const code = params.get("code");
    const err = params.get("error_description") || params.get("error");

    if (err) {
      router.replace(`/auth?error=${encodeURIComponent(err)}`);
      return;
    }

    if (!code) {
      router.replace("/auth?error=missing_oauth_code");
      return;
    }

    (async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        router.replace(`/auth?error=${encodeURIComponent(error.message)}`);
        return;
      }
      await syncSupabaseSessionToStore();
      router.replace("/dashboard");
    })().catch(() => {
      setMessage("Sign in failed. Redirecting…");
      router.replace("/auth?error=oauth_callback_failed");
    });
  }, [params, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: "var(--bg)" }}>
      <Loader2 className="animate-spin text-primary" size={28} />
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
