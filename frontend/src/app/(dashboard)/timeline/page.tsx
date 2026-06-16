"use client";

import { useState, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Clock3, AlertTriangle, ChevronRight, Filter, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Investigation, TimelineEvent } from "@/types";
import { formatDuration, getRiskBadgeClass } from "@/lib/utils";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#EF4444",
  high: "#F97316",
  medium: "#EAB308",
  low: "#22C55E",
};

function TimelinePageContent() {
  const params = useSearchParams();
  const [selectedInv, setSelectedInv] = useState(params.get("investigation") || "");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");

  const { data: investigations } = useQuery<{ items: Investigation[] }>({
    queryKey: ["investigations-list"],
    queryFn: () => api.get("/api/v1/investigations?page_size=50").then((r) => r.data),
  });

  const { data: timeline, isLoading } = useQuery<{ events: TimelineEvent[]; total_events: number }>({
    queryKey: ["timeline", selectedInv],
    queryFn: () => api.get(`/api/v1/timeline/investigations/${selectedInv}`).then((r) => r.data),
    enabled: !!selectedInv,
  });

  const events = (timeline?.events || []).filter(
    (e) => filterSeverity === "all" || e.severity === filterSeverity
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black" style={{ color: "var(--text)" }}>Evidence Timeline</h1>
          <p className="text-sm text-muted mt-1">Chronological reconstruction of all detected events</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-8">
        <select
          value={selectedInv}
          onChange={(e) => setSelectedInv(e.target.value)}
          className="input-field flex-1 max-w-sm"
        >
          <option value="">— Select Investigation —</option>
          {investigations?.items.map((i) => (
            <option key={i.id} value={i.id}>{i.case_number} · {i.title}</option>
          ))}
        </select>
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="input-field w-40"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {!selectedInv && (
        <div className="text-center py-24">
          <div className="w-14 h-14 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Clock3 size={24} className="text-primary-400" />
          </div>
          <h3 className="font-bold mb-2" style={{ color: "var(--text)" }}>Select an Investigation</h3>
          <p className="text-sm text-muted">Choose an investigation to view its evidence timeline.</p>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary-400" size={28} />
        </div>
      )}

      {selectedInv && !isLoading && events.length === 0 && (
        <div className="text-center py-20">
          <p className="text-muted">No timeline events found for this investigation.</p>
        </div>
      )}

      {events.length > 0 && (
        <div className="relative">
          {/* Center line */}
          <div className="absolute left-16 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-4">
            {events.map((event, i) => {
              const color = SEVERITY_COLORS[event.severity || "low"] || "#94A3B8";
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex gap-6"
                >
                  {/* Timestamp */}
                  <div className="w-12 text-right flex-shrink-0 pt-3">
                    <span className="text-xs font-mono text-muted">
                      {formatDuration(event.timestamp)}
                    </span>
                  </div>

                  {/* Dot */}
                  <div className="relative flex-shrink-0 flex items-start pt-3.5">
                    <div
                      className="w-3 h-3 rounded-full border-2 z-10"
                      style={{ backgroundColor: `${color}30`, borderColor: color }}
                    />
                    {event.severity === "critical" && (
                      <div
                        className="absolute w-3 h-3 rounded-full animate-ping"
                        style={{ backgroundColor: color, opacity: 0.4 }}
                      />
                    )}
                  </div>

                  {/* Card */}
                  <div className="flex-1 pb-4">
                    <div className="card group hover:border-white/10 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-mono text-muted">{event.type?.replace(/_/g, " ")}</span>
                            {event.severity && (
                              <span className={getRiskBadgeClass(event.severity)}>{event.severity}</span>
                            )}
                          </div>
                          <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{event.description}</p>
                          {event.confidence !== undefined && (
                            <p className="text-xs text-muted mt-1">
                              Confidence: {Math.round(event.confidence * 100)}%
                            </p>
                          )}
                        </div>
                        {event.severity === "critical" && (
                          <AlertTriangle size={16} className="text-danger flex-shrink-0 mt-0.5" />
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TimelinePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted">Loading...</div>}>
      <TimelinePageContent />
    </Suspense>
  );
}
