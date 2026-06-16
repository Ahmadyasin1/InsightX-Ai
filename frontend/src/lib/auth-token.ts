import { useAuthStore } from "@/store/auth";
import { supabase, isSupabaseEnabled } from "@/lib/supabase";

/** Resolve bearer token for backend API + WebSocket (Supabase or FastAPI JWT). */
export async function getAuthToken(): Promise<string | null> {
  if (isSupabaseEnabled && supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) return data.session.access_token;
  }

  return useAuthStore.getState().token;
}
