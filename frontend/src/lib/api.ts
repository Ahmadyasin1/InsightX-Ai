import axios, { AxiosError } from "axios";
import { useAuthStore } from "@/store/auth";
import { supabase, isSupabaseEnabled } from "@/lib/supabase";
import { getAuthToken } from "@/lib/auth-token";
import { getClientApiBase } from "@/lib/env";

const BASE_URL = getClientApiBase();

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

// ── Attach auth token on every request ──────────────────────────────────────
api.interceptors.request.use(async (config) => {
  const token = await getAuthToken();

  if (token && isSupabaseEnabled && supabase && !useAuthStore.getState().token) {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (user) {
      useAuthStore.getState().setAuth(
        {
          id: user.id,
          email: user.email ?? "",
          full_name: user.user_metadata?.full_name ?? user.email ?? "",
          avatar_url: user.user_metadata?.avatar_url,
          organization: user.user_metadata?.organization,
          role: "analyst",
        },
        token
      );
    }
  }

  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Handle 401: clear session ────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (isSupabaseEnabled && supabase) {
        await supabase.auth.signOut();
      }
      useAuthStore.getState().logout();
      if (typeof window !== "undefined") window.location.href = "/auth";
    }
    return Promise.reject(error);
  }
);

// ── Typed helpers ─────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string; full_name: string; organization?: string }) =>
    api.post<{ access_token: string; refresh_token: string; expires_in: number }>("/api/v1/auth/register", data),

  login: (data: { email: string; password: string }) =>
    api.post<{ access_token: string; refresh_token: string; expires_in: number }>("/api/v1/auth/login", data),

  me: () => api.get("/api/v1/auth/me"),
};
