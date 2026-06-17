/** Shared public env helpers (safe for client + server). */

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL?.replace(/\/$/, "") ||
  (API_URL
    ? API_URL.replace(/^https:/, "wss:").replace(/^http:/, "ws:")
    : "");

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";

export const isApiConfigured = Boolean(API_URL);

/** Axios base URL: direct API when configured, else same-origin rewrites (dev). */
export function getClientApiBase(): string {
  if (API_URL) return API_URL;
  if (typeof window !== "undefined") return "";
  return process.env.NODE_ENV === "development" ? "http://localhost:8000" : "";
}

export function getClientWsBase(): string {
  if (WS_URL) return WS_URL;
  if (typeof window !== "undefined") return "";
  return process.env.NODE_ENV === "development" ? "ws://localhost:8000" : "";
}

export const isProductionDeploy =
  process.env.NODE_ENV === "production" && process.env.VERCEL === "1";
