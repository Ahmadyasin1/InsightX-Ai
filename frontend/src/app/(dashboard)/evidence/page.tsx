"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { PlaySquare, Clock, AlertTriangle, Users, Car, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatFileSize, formatDuration, formatRelative, getRiskBadgeClass } from "@/lib/utils";
import type { Investigation, Evidence, AnalysisResult } from "@/types";

export default function EvidencePage() {
  const { data: investigations } = useQuery<{ items: Investigation[] }>({
    queryKey: ["investigations-list"],
    queryFn: () => api.get("/api/v1/investigations?page_size=50").then((r) => r.data),
  });

  const invs = investigations?.items || [];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black" style={{ color: "var(--text)" }}>Evidence Explorer</h1>
        <p className="text-sm text-muted mt-1">Browse and manage all video evidence across investigations</p>
      </div>

      {invs.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-14 h-14 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <PlaySquare size={24} className="text-primary-400" />
          </div>
          <h3 className="font-bold mb-2" style={{ color: "var(--text)" }}>No Evidence Yet</h3>
          <p className="text-sm text-muted mb-6 max-w-xs mx-auto">
            Create an investigation and upload video evidence to get started.
          </p>
          <Link href="/investigations" className="btn-primary text-sm">
            Create Investigation →
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {invs.map((inv) => (
            <EvidenceGroup key={inv.id} investigation={inv} />
          ))}
        </div>
      )}
    </div>
  );
}

function EvidenceGroup({ investigation }: { investigation: Investigation }) {
  const { data: evidence, isLoading } = useQuery<Evidence[]>({
    queryKey: ["evidence", investigation.id],
    queryFn: () => api.get(`/api/v1/evidence/investigation/${investigation.id}`).then((r) => r.data),
  });

  const { data: results } = useQuery<AnalysisResult[]>({
    queryKey: ["results", investigation.id],
    queryFn: () => api.get(`/api/v1/analysis/investigations/${investigation.id}/results`).then((r) => r.data),
    enabled: !!investigation.id,
  });

  const resultMap = new Map(results?.map((r) => [r.evidence_id, r]) || []);

  if (isLoading) return null;
  if (!evidence || evidence.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Link
          href={`/investigations/${investigation.id}`}
          className="text-sm font-semibold hover:text-primary-300 transition-colors flex items-center gap-1" style={{ color: "var(--text)" }}
        >
          {investigation.case_number} — {investigation.title}
          <ArrowRight size={12} />
        </Link>
        <span className={getRiskBadgeClass(investigation.priority)}>{investigation.priority}</span>
        <span className="text-xs text-muted">{evidence.length} file{evidence.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {evidence.map((ev, i) => {
          const result = resultMap.get(ev.id);
          return (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card group"
            >
              {/* Video thumbnail placeholder */}
              <div className="aspect-video rounded-xl bg-surface-3 border border-border mb-4 flex items-center justify-center relative overflow-hidden">
                <PlaySquare size={32} className="text-muted/40" />
                <div className="absolute bottom-2 right-2 text-xs font-mono text-muted bg-black/50 px-1.5 py-0.5 rounded">
                  {ev.duration_seconds ? formatDuration(ev.duration_seconds) : "—"}
                </div>
                <div className={`absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded-md ${
                  ev.status === "analyzed" ? "bg-accent/10 text-accent" :
                  ev.status === "processing" ? "bg-yellow-500/10 text-yellow-400" :
                  ev.status === "failed" ? "bg-danger/10 text-danger" :
                  "bg-surface-3 text-muted"
                }`}>
                  {ev.status === "processing" && <Loader2 size={10} className="inline animate-spin mr-1" />}
                  {ev.status}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{ev.original_filename}</h4>
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span>{formatFileSize(ev.file_size)}</span>
                  <span>·</span>
                  {ev.width && ev.height && <span>{ev.width}×{ev.height}</span>}
                  <span>·</span>
                  <span>{formatRelative(ev.created_at)}</span>
                </div>

                {result && (
                  <div className="flex items-center gap-3 pt-1">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Users size={11} className="text-primary-400" />
                      <span className="font-medium" style={{ color: "var(--text)" }}>{result.person_count}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <Car size={11} className="text-secondary" />
                      <span className="font-medium" style={{ color: "var(--text)" }}>{result.vehicle_count}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <AlertTriangle size={11} className="text-warning" />
                      <span className="font-medium" style={{ color: "var(--text)" }}>{result.anomaly_count}</span>
                    </div>
                    <div className="ml-auto flex items-center gap-1 text-xs">
                      <Clock size={10} className="text-muted" />
                      <span className="font-bold" style={{ color: "var(--text)" }}>{result.incident_score?.toFixed(0)}</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
