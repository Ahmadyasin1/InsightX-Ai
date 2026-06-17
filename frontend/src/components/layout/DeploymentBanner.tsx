"use client";

import { AlertTriangle } from "lucide-react";
import { isApiConfigured, isProductionDeploy } from "@/lib/env";

/** Shown on Vercel when NEXT_PUBLIC_API_URL was not set at build time. */
export function DeploymentBanner() {
  if (!isProductionDeploy || isApiConfigured) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-amber-500/30 bg-amber-950/95 px-4 py-3 text-sm text-amber-100 backdrop-blur"
    >
      <div className="mx-auto flex max-w-4xl items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        <p>
          <strong className="font-semibold text-amber-50">Backend not connected.</strong>{" "}
          Add <code className="rounded bg-amber-900/60 px-1">NEXT_PUBLIC_API_URL</code> in Vercel
          → Settings → Environment Variables (HTTPS URL of your InsightX FastAPI server), then
          redeploy. Login and uploads will not work until this is set.
        </p>
      </div>
    </div>
  );
}
