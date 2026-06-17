import { api } from "@/lib/api";
import { supabase, isSupabaseEnabled } from "@/lib/supabase";
import { useAuthStore, type AuthUser } from "@/store/auth";

function userFromSupabase(session: { user: { id: string; email?: string | null; user_metadata?: Record<string, string> } }): AuthUser {
  const u = session.user;
  return {
    id: u.id,
    email: u.email ?? "",
    full_name: u.user_metadata?.full_name ?? u.email?.split("@")[0] ?? "User",
    avatar_url: u.user_metadata?.avatar_url,
    organization: u.user_metadata?.organization,
    role: "analyst",
  };
}

/** Copy Supabase session into Zustand and verify the backend accepts the JWT. */
export async function syncSupabaseSessionToStore(): Promise<boolean> {
  if (!isSupabaseEnabled || !supabase) return false;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return false;

  const token = session.access_token;
  const refresh = session.refresh_token ?? "";

  try {
    const { data: user } = await api.get<AuthUser>("/api/v1/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    useAuthStore.getState().setAuth(user, token, refresh);
    return true;
  } catch {
    useAuthStore.getState().setAuth(userFromSupabase(session), token, refresh);
    return true;
  }
}
