"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, Brain, Waves, Network, FileText, AlertTriangle,
  Users, Loader2, CheckCircle2, Sparkles, Activity,
} from "lucide-react";
import { useAnalysisProgress } from "@/hooks/useAnalysisProgress";

const STAGES = [
  { key: "initializing",    label: "Initializing AI Engine",      icon: Sparkles,      color: "#7C3AED" },
  { key: "loading_video",   label: "Loading Video",             icon: Activity,      color: "#0078D4" },
  { key: "object_detection",label: "Object Detection",          icon: Eye,           color: "#0078D4" },
  { key: "tracking",        label: "Multi-Object Tracking",     icon: Users,         color: "#6B46C1" },
  { key: "transcription",   label: "Speech Transcription",      icon: Waves,         color: "#06B6D4" },
  { key: "anomaly_detection",label: "Anomaly Detection",        icon: AlertTriangle, color: "#EF4444" },
  { key: "reasoning",       label: "AI Reasoning Engine",       icon: Brain,         color: "#7C3AED" },
  { key: "graph_generation",label: "Evidence Graph",            icon: Network,       color: "#10B981" },
  { key: "saving_results",  label: "Saving Results",            icon: FileText,      color: "#0078D4" },
  { key: "completed",       label: "Analysis Complete",         icon: CheckCircle2,  color: "#10B981" },
];

const STAGE_ALIASES: Record<string, string> = {
  initializing: "initializing",
  loading_detectra_engine: "initializing",
  loading_models: "initializing",
  loading_video: "loading_video",
  object_detection: "object_detection",
  perception: "object_detection",
  tracking: "tracking",
  transcription: "transcription",
  audio_transcription: "transcription",
  anomaly_detection: "anomaly_detection",
  reasoning: "reasoning",
  vlm_enhancement: "reasoning",
  graph_generation: "graph_generation",
  saving_results: "saving_results",
  completed: "completed",
  failed: "completed",
};

function stageIndex(stage: string) {
  const normalized = stage.toLowerCase().replace(/-/g, "_");
  const mapped = STAGE_ALIASES[normalized] ?? normalized;
  const idx = STAGES.findIndex(
    (s) => mapped.includes(s.key) || s.key.includes(mapped)
  );
  return idx >= 0 ? idx : 0;
}

interface LiveAnalysisPanelProps {
  jobId: string;
  filename?: string;
  onComplete?: () => void;
}

export function LiveAnalysisPanel({ jobId, filename, onComplete }: LiveAnalysisPanelProps) {
  const { progress, connected } = useAnalysisProgress(jobId);
  const [liveEvents, setLiveEvents] = useState<string[]>([]);
  const pct = progress?.progress ?? 0;
  const stage = progress?.stage ?? "initializing";
  const isDone = progress?.status === "completed";
  const isFailed = progress?.status === "failed";
  const currentIdx = stageIndex(stage);

  useEffect(() => {
    if (!progress?.stage) return;
    const label = STAGES.find(s => progress.stage.includes(s.key))?.label ?? progress.stage;
    setLiveEvents(prev => {
      const msg = `[${new Date().toLocaleTimeString()}] ${label} — ${pct}%`;
      if (prev[0] === msg) return prev;
      return [msg, ...prev].slice(0, 8);
    });
  }, [progress?.stage, pct]);

  useEffect(() => {
    if (isDone) onComplete?.();
  }, [isDone, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="ms-card overflow-hidden p-0"
      style={{ border: "1px solid var(--primary-200)" }}
    >
      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-3 border-b"
        style={{ borderColor: "var(--border)", background: "var(--primary-glow)" }}>
        <div className="relative">
          {!isDone && !isFailed && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-xl"
              style={{ border: "2px solid transparent", borderTopColor: "var(--primary)" }}
            />
          )}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "var(--primary)" }}>
            {isDone ? <CheckCircle2 size={18} className="text-white" /> :
             isFailed ? <AlertTriangle size={18} className="text-white" /> :
             <Loader2 size={18} className="text-white animate-spin" />}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold" style={{ color: "var(--text)" }}>
            {isDone ? "Analysis Complete" : isFailed ? "Analysis Failed" : "Live AI Analysis"}
          </p>
          <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>
            {filename ?? "Processing video evidence…"}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-[#10B981]" : "bg-[#F59E0B]"}`} />
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            {connected ? "Live" : "Connecting…"}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            {STAGES[currentIdx]?.label ?? stage}
          </span>
          <span className="text-sm font-black" style={{ color: "var(--primary)" }}>{pct}%</span>
        </div>
        <div className="progress-bar h-2">
          <motion.div
            className="progress-bar-fill h-full"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Stage pipeline */}
      <div className="px-5 py-4 grid grid-cols-3 sm:grid-cols-5 gap-2">
        {STAGES.slice(0, 9).map((s, i) => {
          const Icon = s.icon;
          const active = i === currentIdx;
          const done = i < currentIdx || isDone;
          return (
            <motion.div
              key={s.key}
              animate={active && !isDone ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 1.5, repeat: active && !isDone ? Infinity : 0 }}
              className="flex flex-col items-center gap-1 p-2 rounded-xl text-center transition-all"
              style={{
                background: active ? `${s.color}12` : done ? "rgba(16,185,129,0.06)" : "var(--surface-2)",
                border: `1px solid ${active ? s.color + "30" : done ? "rgba(16,185,129,0.15)" : "var(--border)"}`,
              }}
            >
              <Icon size={12} style={{ color: done ? "#10B981" : active ? s.color : "var(--text-subtle)" }} />
              <span className="text-[8px] font-medium leading-tight" style={{ color: active ? s.color : "var(--text-muted)" }}>
                {s.label.split(" ")[0]}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Processing note — real counts appear after analysis completes */}
      {!isDone && !isFailed && (
        <div className="px-5 pb-3">
          <p className="text-[10px] text-center py-2 rounded-xl" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
            Detectra AI v7 is processing frames · Progress updates every few seconds · Long videos may take several minutes
          </p>
        </div>
      )}

      {/* Live event feed */}
      <div className="px-5 pb-4">
        <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-subtle)" }}>
          Live Feed
        </p>
        <div className="space-y-1 max-h-24 overflow-y-auto no-scrollbar">
          <AnimatePresence>
            {liveEvents.map((ev, i) => (
              <motion.p key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                className="text-[10px] font-mono" style={{ color: i === 0 ? "var(--primary)" : "var(--text-muted)" }}>
                {ev}
              </motion.p>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
