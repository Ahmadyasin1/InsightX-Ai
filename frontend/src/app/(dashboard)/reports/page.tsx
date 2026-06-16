"use client";

import { useState, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { FileText, Download, FileJson, FileSpreadsheet, Loader2, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";
import type { Investigation } from "@/types";
import { formatDate, getRiskBadgeClass } from "@/lib/utils";
import toast from "react-hot-toast";

async function parseApiError(err: unknown): Promise<string> {
  const ax = err as { response?: { data?: unknown; status?: number } };
  const data = ax.response?.data;
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const parsed = JSON.parse(text) as { detail?: string };
      return parsed.detail || "Export failed";
    } catch {
      return "Export failed";
    }
  }
  if (data && typeof data === "object" && "detail" in data) {
    return String((data as { detail: string }).detail);
  }
  return "Export failed";
}

async function downloadFile(url: string, filename: string) {
  const response = await api.get(url, { responseType: "blob" });
  if (response.data.type === "application/json") {
    const text = await (response.data as Blob).text();
    const parsed = JSON.parse(text) as { detail?: string };
    throw new Error(parsed.detail || "Export failed");
  }
  const href = URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(href);
}

function ReportsPageContent() {
  const params = useSearchParams();
  const [selectedInv, setSelectedInv] = useState(params.get("investigation") || "");
  const [downloading, setDownloading] = useState<string | null>(null);

  const { data: investigations } = useQuery<{ items: Investigation[] }>({
    queryKey: ["investigations-list"],
    queryFn: () => api.get("/api/v1/investigations?page_size=50").then((r) => r.data),
  });

  const { data: inv } = useQuery<Investigation>({
    queryKey: ["investigation", selectedInv],
    queryFn: () => api.get(`/api/v1/investigations/${selectedInv}`).then((r) => r.data),
    enabled: !!selectedInv,
  });

  const { data: analysisResults } = useQuery<{ length: number }>({
    queryKey: ["analysis-count", selectedInv],
    queryFn: () => api.get(`/api/v1/analysis/investigations/${selectedInv}/results`).then((r) => r.data),
    enabled: !!selectedInv,
    select: (data) => ({ length: Array.isArray(data) ? data.length : 0 }),
  });

  const hasResults = (analysisResults?.length ?? 0) > 0;

  const handleExport = async (format: "pdf" | "json" | "csv") => {
    if (!selectedInv || !inv) return;
    if (!hasResults) {
      toast.error("No analysis results yet. Upload and analyze evidence first.");
      return;
    }
    setDownloading(format);
    try {
      const ext = format;
      await downloadFile(
        `/api/v1/reports/investigations/${selectedInv}/${format}`,
        `insightx-${inv.case_number}.${ext}`
      );
      toast.success(`${format.toUpperCase()} report downloaded`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : await parseApiError(err);
      toast.error(msg || `Failed to download ${format} report`);
    } finally {
      setDownloading(null);
    }
  };

  const EXPORT_OPTIONS = [
    {
      format: "pdf" as const,
      label: "PDF Report",
      description: "Full investigation report with executive brief, timeline, and anomaly analysis",
      icon: FileText,
      color: "#EF4444",
    },
    {
      format: "json" as const,
      label: "JSON Export",
      description: "Machine-readable full analysis data including all detections and metadata",
      icon: FileJson,
      color: "#06B6D4",
    },
    {
      format: "csv" as const,
      label: "CSV Export",
      description: "Spreadsheet-compatible evidence summary for further analysis",
      icon: FileSpreadsheet,
      color: "#22C55E",
    },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black mb-1" style={{ color: "var(--text)" }}>Reports Center</h1>
        <p className="text-sm text-muted">Generate and export AI investigation reports</p>
      </div>

      {/* Investigation selector */}
      <div className="card mb-8">
        <h2 className="font-semibold mb-4 text-sm" style={{ color: "var(--text)" }}>Select Investigation</h2>
        <select
          value={selectedInv}
          onChange={(e) => setSelectedInv(e.target.value)}
          className="input-field max-w-lg"
        >
          <option value="">— Choose an investigation —</option>
          {investigations?.items.map((i) => (
            <option key={i.id} value={i.id}>{i.case_number} · {i.title}</option>
          ))}
        </select>

        {inv && (
          <div className="mt-4 p-4 rounded-xl bg-surface-3 border border-border">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold" style={{ color: "var(--text)" }}>{inv.title}</h3>
                <p className="text-xs text-muted mt-1">
                  {inv.case_number} · Created {formatDate(inv.created_at)}
                </p>
                {!hasResults && (
                  <p className="text-xs text-orange-400 mt-2">
                    No analysis data yet — upload evidence and run AI analysis to generate reports.
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={getRiskBadgeClass(inv.priority)}>{inv.priority}</span>
                {inv.incident_score !== null && inv.incident_score !== undefined && (
                  <span className="text-sm font-bold" style={{ color: "var(--text)" }}>
                    {Math.round(inv.incident_score)}/100
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export options */}
      <h2 className="font-semibold mb-4" style={{ color: "var(--text)" }}>Export Format</h2>
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {EXPORT_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isDownloading = downloading === opt.format;
          return (
            <motion.div
              key={opt.format}
              whileHover={selectedInv && hasResults ? { scale: 1.02 } : {}}
              className={`card group transition-all duration-200 ${
                selectedInv && hasResults ? "hover:border-primary/30 cursor-pointer" : "opacity-50 cursor-not-allowed"
              }`}
              onClick={() => selectedInv && hasResults && handleExport(opt.format)}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${opt.color}15`, border: `1px solid ${opt.color}25` }}
              >
                {isDownloading ? (
                  <Loader2 size={20} className="animate-spin" style={{ color: opt.color }} />
                ) : (
                  <Icon size={20} style={{ color: opt.color }} />
                )}
              </div>
              <h3 className="font-semibold mb-2" style={{ color: "var(--text)" }}>{opt.label}</h3>
              <p className="text-xs text-muted leading-relaxed mb-4">{opt.description}</p>
              <div className="flex items-center gap-2 text-xs font-medium" style={{ color: opt.color }}>
                {isDownloading ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download size={12} />
                    Export {opt.format.toUpperCase()}
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Recent reports */}
      <div className="card">
        <h2 className="font-semibold mb-4" style={{ color: "var(--text)" }}>Report Contents</h2>
        <div className="space-y-3">
          {[
            "Executive Intelligence Brief",
            "Incident Score & Risk Classification",
            "Detected Persons, Vehicles & Objects",
            "Anomaly Detection Results (12 classes)",
            "Chronological Event Timeline",
            "Audio Transcription & Sound Events",
            "Evidence Graph (entity relationships)",
            "AI Reasoning & Recommendations",
            "Evidence Chain of Custody",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
              <CheckCircle size={14} className="text-accent flex-shrink-0" />
              <span className="text-sm text-muted">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted">Loading...</div>}>
      <ReportsPageContent />
    </Suspense>
  );
}
