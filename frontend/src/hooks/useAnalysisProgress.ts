"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-token";

export interface AnalysisProgress {
  job_id: string;
  status: "running" | "completed" | "failed" | "cancelled" | string;
  progress: number;
  stage: string;
  updated_at?: string;
}

const WS_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_WS_URL ||
        (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
          .replace(/^https/, "wss")
          .replace(/^http/, "ws"))
    : "ws://localhost:8000";

async function resolveAuthToken(): Promise<string | null> {
  return getAuthToken();
}

function mapJobResponse(data: {
  id: string;
  status: string;
  progress: number;
  current_stage?: string | null;
}): AnalysisProgress {
  return {
    job_id: data.id,
    status: data.status,
    progress: data.progress ?? 0,
    stage: data.current_stage || "initializing",
  };
}

export function useAnalysisProgress(jobId: string | null | undefined) {
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const applyProgress = useCallback((data: AnalysisProgress) => {
    setProgress(data);
    if (["completed", "failed", "cancelled"].includes(data.status)) {
      wsRef.current?.close();
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
  }, []);

  const pollOnce = useCallback(async () => {
    if (!jobId) return;
    try {
      const { data } = await api.get(`/api/v1/analysis/jobs/${jobId}/progress`);
      applyProgress({
        job_id: data.job_id || jobId,
        status: data.status || "running",
        progress: data.progress ?? 0,
        stage: data.stage || data.current_stage || "initializing",
      });
    } catch {
      try {
        const { data } = await api.get(`/api/v1/analysis/jobs/${jobId}`);
        applyProgress(mapJobResponse(data));
      } catch {
        /* job may not exist yet */
      }
    }
  }, [jobId, applyProgress]);

  useEffect(() => {
    if (!jobId) return;

    let cancelled = false;

    pollOnce();
    pollRef.current = setInterval(pollOnce, 2500);

    (async () => {
      const token = await resolveAuthToken();
      if (cancelled || !token) return;

      const url = `${WS_BASE}/api/v1/analysis/ws/${jobId}?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data) as AnalysisProgress;
          if (data.job_id || data.progress !== undefined) {
            applyProgress({
              job_id: data.job_id || jobId,
              status: data.status || "running",
              progress: data.progress ?? 0,
              stage: data.stage || "initializing",
              updated_at: data.updated_at,
            });
          }
        } catch { /* ignore malformed */ }
      };
      ws.onerror = () => setConnected(false);
      ws.onclose = () => setConnected(false);
    })();

    return () => {
      cancelled = true;
      wsRef.current?.close();
      wsRef.current = null;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [jobId, applyProgress, pollOnce]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setConnected(false);
  }, []);

  return { progress, connected, disconnect };
}
