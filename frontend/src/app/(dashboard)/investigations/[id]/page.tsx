"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
  FolderOpen, Upload, PlaySquare, Clock3, Brain, FileText,
  AlertTriangle, Users, Car, ArrowLeft, Loader2
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatRelative, formatFileSize, formatDuration, getRiskBadgeClass, getIncidentScoreColor } from "@/lib/utils";
import { LiveAnalysisPanel } from "@/components/analysis/LiveAnalysisPanel";
import { AIThinkingWindow } from "@/components/analysis/AIThinkingWindow";
import type { Investigation, Evidence, AnalysisResult } from "@/types";
import toast from "react-hot-toast";

function UploadZone({ investigationId, onUpload }: { investigationId: string; onUpload: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setUploading(true);
    setProgress(0);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("investigation_id", investigationId);
    fd.append("auto_analyze", "true");
    try {
      await api.post<Evidence>("/api/v1/evidence/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 600_000,
        onUploadProgress: (e) => setProgress(Math.round((e.loaded / (e.total || 1)) * 100)),
      });
      toast.success("Evidence uploaded — AI analysis started!");
      onUpload();
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }, [investigationId, onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, multiple: false,
    accept: { "video/*": [".mp4", ".avi", ".mov", ".mkv", ".webm"] }
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? "border-primary bg-primary/10 scale-[1.02]"
            : "border-border hover:border-primary/40 hover:bg-primary/5"
        }`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="space-y-4">
            <Loader2 size={36} className="text-primary-400 animate-spin mx-auto" />
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Uploading... {progress}%</p>
            <div className="w-48 mx-auto h-1.5 rounded-full bg-surface-3">
              <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <Upload size={24} className="text-primary-400" />
            </div>
            <h3 className="font-semibold mb-2" style={{ color: "var(--text)" }}>
              {isDragActive ? "Drop video here" : "Upload Evidence Video"}
            </h3>
            <p className="text-sm text-muted mb-4">
              Drag & drop or click to select · MP4, AVI, MOV, MKV, WebM · Up to 4GB
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
              <Brain size={12} className="text-primary-400" />
              <span className="text-xs text-primary-300 font-medium">AI analysis starts automatically</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EvidenceCard({ ev, result }: { ev: Evidence; result?: AnalysisResult }) {
  const scoreColor = result ? getIncidentScoreColor(result.incident_score || 0) : "#94A3B8";

  return (
    <div className="card group">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center">
          <PlaySquare size={18} className="text-secondary" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate" style={{ color: "var(--text)" }}>{ev.original_filename}</h4>
          <p className="text-xs text-muted mt-0.5">
            {formatFileSize(ev.file_size)} · {ev.duration_seconds ? formatDuration(ev.duration_seconds) : "—"} · {ev.width && ev.height ? `${ev.width}×${ev.height}` : "—"}
          </p>
        </div>
        <div className={`text-xs font-medium px-2 py-1 rounded-md ${
          ev.status === "analyzed" ? "bg-accent/10 text-accent" :
          ev.status === "processing" ? "bg-yellow-500/10 text-yellow-400" :
          ev.status === "failed" ? "bg-danger/10 text-danger" :
          "bg-muted/10 text-muted"
        }`}>
          {ev.status}
        </div>
      </div>

      {result && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-surface-3 rounded-xl p-3">
            <div className="text-xs text-muted mb-1">Incident Score</div>
            <div className="text-xl font-black" style={{ color: scoreColor }}>
              {Math.round(result.incident_score || 0)}
              <span className="text-sm font-normal text-muted">/100</span>
            </div>
          </div>
          <div className="bg-surface-3 rounded-xl p-3">
            <div className="text-xs text-muted mb-1">Risk Level</div>
            <div className="mt-1"><span className={getRiskBadgeClass(result.risk_level)}>{result.risk_level || "—"}</span></div>
          </div>
        </div>
      )}

      {result && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-surface-3 rounded-lg py-2">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users size={12} className="text-primary-400" />
            </div>
            <div className="text-sm font-bold" style={{ color: "var(--text)" }}>{result.person_count}</div>
            <div className="text-xs text-muted">Persons</div>
          </div>
          <div className="bg-surface-3 rounded-lg py-2">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Car size={12} className="text-secondary" />
            </div>
            <div className="text-sm font-bold" style={{ color: "var(--text)" }}>{result.vehicle_count}</div>
            <div className="text-xs text-muted">Vehicles</div>
          </div>
          <div className="bg-surface-3 rounded-lg py-2">
            <div className="flex items-center justify-center gap-1 mb-1">
              <AlertTriangle size={12} className="text-warning" />
            </div>
            <div className="text-sm font-bold" style={{ color: "var(--text)" }}>{result.anomaly_count}</div>
            <div className="text-xs text-muted">Anomalies</div>
          </div>
        </div>
      )}

      {result?.executive_brief && (
        <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/10">
          <p className="text-xs text-muted leading-relaxed line-clamp-3">{result.executive_brief}</p>
        </div>
      )}

      {ev.status === "processing" && (
        <div className="mt-4 flex items-center gap-2">
          <Loader2 size={14} className="text-yellow-400 animate-spin" />
          <span className="text-xs text-yellow-400">AI analysis in progress...</span>
        </div>
      )}
    </div>
  );
}

export default function InvestigationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<"overview" | "evidence" | "timeline" | "chat">("overview");

  const { data: inv, isLoading: invLoading, refetch: refetchInv } = useQuery<Investigation>({
    queryKey: ["investigation", id],
    queryFn: () => api.get(`/api/v1/investigations/${id}`).then((r) => r.data),
  });

  const { data: evidenceList, refetch: refetchEvidence } = useQuery<Evidence[]>({
    queryKey: ["evidence", id],
    queryFn: () => api.get(`/api/v1/evidence/investigation/${id}`).then((r) => r.data),
    enabled: !!id,
    refetchInterval: (query) => {
      const hasProcessing = query.state.data?.some((e) => e.status === "processing");
      return hasProcessing ? 3000 : false;
    },
  });

  const { data: results, refetch: refetchResults } = useQuery<AnalysisResult[]>({
    queryKey: ["results", id],
    queryFn: () => api.get(`/api/v1/analysis/investigations/${id}/results`).then((r) => r.data),
    enabled: !!id,
    refetchInterval: 10000,
  });

  const resultMap = new Map(
    [...(results ?? [])]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((r) => [r.evidence_id, r])
  );
  const latestResult = results?.[0];
  const processingEv = evidenceList?.find(e => e.status === "processing" && e.analysis_job_id);

  const handleAnalysisComplete = () => {
    refetchEvidence();
    refetchResults();
    refetchInv();
  };

  if (invLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <Loader2 className="animate-spin text-primary-400" size={28} />
      </div>
    );
  }

  if (!inv) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted">Investigation not found</p>
        <Link href="/investigations" className="btn-primary mt-4 text-sm">Back to Investigations</Link>
      </div>
    );
  }

  const TABS = [
    { id: "overview", label: "Overview", icon: FolderOpen },
    { id: "evidence", label: `Evidence (${evidenceList?.length || 0})`, icon: PlaySquare },
    { id: "timeline", label: "Timeline", icon: Clock3 },
    { id: "chat", label: "AI Chat", icon: Brain },
  ] as const;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/investigations" className="text-muted hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft size={14} />
          Investigations
        </Link>
        <span className="text-border-strong">/</span>
        <span className="font-medium" style={{ color: "var(--text)" }}>{inv.case_number}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-black" style={{ color: "var(--text)" }}>{inv.title}</h1>
            <span className={getRiskBadgeClass(inv.priority)}>{inv.priority}</span>
          </div>
          <p className="text-sm text-muted">
            {inv.case_number} · {inv.status} · Updated {formatRelative(inv.updated_at)}
          </p>
          {inv.description && <p className="text-sm text-muted mt-2 max-w-2xl">{inv.description}</p>}
        </div>
        <Link href={`/reports?investigation=${id}`} className="btn-secondary text-xs gap-2">
          <FileText size={14} />
          Export Report
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-surface-2 p-1 rounded-xl w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === t.id ? "bg-primary text-white" : "text-muted hover:text-foreground"
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Single live analysis panel — driven by evidence status, not upload local state */}
      {processingEv?.analysis_job_id && (
        <div className="mb-8">
          <LiveAnalysisPanel
            jobId={processingEv.analysis_job_id}
            filename={processingEv.original_filename}
            onComplete={handleAnalysisComplete}
          />
        </div>
      )}

      {/* Tab content */}
      {tab === "overview" && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <UploadZone investigationId={id} onUpload={refetchEvidence} />
            <AIThinkingWindow
              reasoning={latestResult?.reasoning}
              executiveBrief={latestResult?.executive_brief}
              isThinking={!!processingEv}
            />
            {inv.incident_score !== null && inv.incident_score !== undefined && (
              <div className="card">
                <h3 className="font-semibold mb-4" style={{ color: "var(--text)" }}>Incident Summary</h3>
                <div className="flex items-center gap-6">
                  <div className="relative w-24 h-24">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="40" fill="none"
                        stroke={getIncidentScoreColor(inv.incident_score)}
                        strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 40 * (inv.incident_score / 100)} ${2 * Math.PI * 40}`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-black" style={{ color: "var(--text)" }}>{Math.round(inv.incident_score)}</span>
                      <span className="text-xs text-muted">/ 100</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Incident Score</div>
                    <div className="mb-3">
                      <span className={getRiskBadgeClass(latestResult?.risk_level ?? inv.priority)}>
                        {(latestResult?.risk_level ?? inv.priority)} risk
                      </span>
                    </div>
                    <p className="text-xs text-muted max-w-xs">
                      Score calculated from detected anomalies, entity counts, and AI reasoning across all evidence.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="card">
              <h3 className="font-semibold mb-4 text-sm" style={{ color: "var(--text)" }}>Case Details</h3>
              <dl className="space-y-3">
                {[
                  { label: "Case Number", value: inv.case_number },
                  { label: "Status", value: inv.status },
                  { label: "Priority", value: inv.priority },
                  { label: "Evidence Files", value: evidenceList?.length || 0 },
                  { label: "Created", value: formatRelative(inv.created_at) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center text-xs">
                    <dt className="text-muted">{label}</dt>
                    <dd className="font-medium capitalize" style={{ color: "var(--text)" }}>{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <Link href={`/chat?investigation=${id}`} className="card block hover:border-primary/30 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Brain size={16} className="text-primary-400" />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text)" }}>AI Investigator</p>
                  <p className="text-xs text-muted">Ask questions about this case</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      )}

      {tab === "evidence" && (
        <div className="space-y-4">
          <UploadZone investigationId={id} onUpload={refetchEvidence} />
          {evidenceList && evidenceList.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {evidenceList.map((ev) => (
                <EvidenceCard key={ev.id} ev={ev} result={resultMap.get(ev.id)} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "timeline" && (
        <div>
          <Link href={`/timeline?investigation=${id}`} className="btn-primary mb-6 inline-flex">
            Open Full Timeline →
          </Link>
        </div>
      )}

      {tab === "chat" && (
        <div>
          <Link href={`/chat?investigation=${id}`} className="btn-primary mb-6 inline-flex">
            Open AI Investigator →
          </Link>
        </div>
      )}
    </div>
  );
}
