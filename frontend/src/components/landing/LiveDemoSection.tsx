"use client";

import { motion, AnimatePresence, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import {
  Eye, Users, Brain, AudioLines, BarChart3, FileText,
  Play, Pause, RotateCcw, CheckCircle2, Clock, Zap,
  Activity, AlertTriangle, ChevronRight, Cpu,
} from "lucide-react";

/* ── Analysis pipeline stages ── */
const PIPELINE = [
  { id: "upload",     icon: Zap,        label: "File Ingested",      color: "#0078D4", duration: 400  },
  { id: "detect",     icon: Eye,        label: "Object Detection",   color: "#7C3AED", duration: 2200 },
  { id: "track",      icon: Users,      label: "Person Tracking",    color: "#06B6D4", duration: 1800 },
  { id: "audio",      icon: AudioLines, label: "Audio Transcription",color: "#10B981", duration: 2400 },
  { id: "anomaly",    icon: AlertTriangle,label: "Anomaly Detection",color: "#EF4444", duration: 1600 },
  { id: "reasoning",  icon: Brain,      label: "AI Reasoning",       color: "#F59E0B", duration: 3000 },
  { id: "report",     icon: FileText,   label: "Report Generation",  color: "#8B5CF6", duration: 1200 },
];

/* ── Timeline events generated during analysis ── */
const TIMELINE_EVENTS = [
  { time: "00:02:14", label: "Person T-001 enters frame", severity: "info", delay: 2 },
  { time: "00:04:33", label: "Vehicle stopped at entrance", severity: "info", delay: 3.5 },
  { time: "00:07:14", label: "Loitering detected — Person T-007", severity: "high", delay: 5 },
  { time: "00:09:51", label: "Crowd formation — 8 persons", severity: "medium", delay: 7 },
  { time: "00:11:50", label: "FIGHT DETECTED — 3 persons", severity: "critical", delay: 8.5 },
  { time: "00:13:02", label: "Audio: Screaming (91dB peak)", severity: "high", delay: 10 },
  { time: "00:15:28", label: "Persons disperse — area clear", severity: "info", delay: 11.5 },
];

const SEV_STYLES: Record<string, { dot: string; text: string; bg: string }> = {
  critical: { dot: "#EF4444", text: "#f87171", bg: "rgba(239,68,68,0.08)" },
  high:     { dot: "#F97316", text: "#fb923c", bg: "rgba(249,115,22,0.08)" },
  medium:   { dot: "#F59E0B", text: "#fbbf24", bg: "rgba(245,158,11,0.08)" },
  info:     { dot: "#06B6D4", text: "#22d3ee", bg: "rgba(6,182,212,0.06)"  },
};

/* ── Transcript stream ── */
const TRANSCRIPT_CHUNKS = [
  "Hey! What are you doing here?",
  " Get away from me!",
  " Someone call security!",
  " Stop, stop!",
  " I'm calling the police!",
];

/* ── AI Reasoning stream ── */
const REASONING_TEXT = `Analysis of evidence footage INV-2847:

**Timeline Reconstruction:** Person T-007 entered the monitored zone at T+04:33 and remained stationary near the entrance for 24 minutes (T+04:33 to T+07:14), exhibiting classic loitering behavior.

**Escalation Pattern:** At T+11:50, a physical altercation was detected involving 3 individuals. Audio confirms verbal aggression beginning at T+10:55, suggesting a premeditated confrontation.

**Incident Score: 84/100 — HIGH PRIORITY**

*Recommended Actions:* Issue BOLO for Person T-007 · Preserve footage T+04:00 to T+16:00 · Cross-reference with access control logs.`;

function useCountUp(target: number, active: boolean, duration = 1500) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = target / (duration / 16);
    const t = setInterval(() => {
      start = Math.min(start + step, target);
      setCount(Math.round(start));
      if (start >= target) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [target, active, duration]);
  return count;
}

function PipelineStep({ step, active, done, index }: {
  step: typeof PIPELINE[0]; active: boolean; done: boolean; index: number;
}) {
  const Icon = step.icon;
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3 p-3 rounded-xl transition-all duration-300"
      style={{
        background: active ? `${step.color}12` : done ? "var(--surface-2)" : "transparent",
        border: `1px solid ${active ? step.color + "30" : done ? "var(--border)" : "transparent"}`,
      }}
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
        style={{
          background: active || done ? `${step.color}15` : "var(--surface-2)",
          border: `1px solid ${active || done ? step.color + "25" : "var(--border)"}`,
        }}>
        {done
          ? <CheckCircle2 size={14} style={{ color: step.color }} />
          : <Icon size={14} style={{ color: active ? step.color : "var(--text-subtle)" }} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate" style={{ color: active || done ? "var(--text)" : "var(--text-subtle)" }}>
          {step.label}
        </p>
        {active && (
          <motion.div className="h-0.5 rounded-full mt-1.5 overflow-hidden" style={{ background: "var(--border)" }}>
            <motion.div className="h-full rounded-full"
              style={{ background: step.color }}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: step.duration / 1000, ease: "linear" }}
            />
          </motion.div>
        )}
      </div>
      {active && (
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Cpu size={11} style={{ color: step.color }} />
        </motion.div>
      )}
      {done && <span className="text-[10px] font-medium" style={{ color: step.color }}>Done</span>}
    </motion.div>
  );
}

export function LiveDemoSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const [running, setRunning] = useState(false);
  const [currentStage, setCurrentStage] = useState(-1);
  const [visibleEvents, setVisibleEvents] = useState<number[]>([]);
  const [transcript, setTranscript] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [done, setDone] = useState(false);

  const personCount = useCountUp(7,  currentStage >= 1);
  const vehicleCount = useCountUp(2,  currentStage >= 2);
  const anomalyCount = useCountUp(3,  currentStage >= 4);
  const scoreCount   = useCountUp(84, currentStage >= 5);

  const resetAll = () => {
    setRunning(false); setCurrentStage(-1); setVisibleEvents([]); setTranscript(""); setReasoning(""); setDone(false);
  };

  // Timeline events
  useEffect(() => {
    if (!running) return;
    const timers = TIMELINE_EVENTS.map((e, i) =>
      setTimeout(() => setVisibleEvents(prev => [...prev, i]), e.delay * 1000)
    );
    return () => timers.forEach(clearTimeout);
  }, [running]);

  // Transcript streaming
  useEffect(() => {
    if (currentStage < 3) return;
    let i = 0, full = "";
    const addChunk = () => {
      if (i >= TRANSCRIPT_CHUNKS.length) return;
      full += TRANSCRIPT_CHUNKS[i++];
      setTranscript(full);
      if (i < TRANSCRIPT_CHUNKS.length) setTimeout(addChunk, 600);
    };
    const t = setTimeout(addChunk, 500);
    return () => clearTimeout(t);
  }, [currentStage]);

  // Reasoning streaming (character by character)
  useEffect(() => {
    if (currentStage < 5) return;
    let i = 0;
    const tick = setInterval(() => {
      if (i >= REASONING_TEXT.length) { clearInterval(tick); return; }
      setReasoning(REASONING_TEXT.slice(0, ++i));
    }, 18);
    return () => clearInterval(tick);
  }, [currentStage]);

  // Pipeline driver
  useEffect(() => {
    if (!running) return;
    setCurrentStage(0);
    let stage = 0;
    const advance = () => {
      if (stage >= PIPELINE.length) { setDone(true); return; }
      setCurrentStage(stage);
      const t = setTimeout(() => { stage++; advance(); }, PIPELINE[stage].duration);
      return t;
    };
    advance();
  }, [running]);

  return (
    <section id="live-demo" ref={ref} className="section-padding relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(180deg, transparent, var(--surface-2) 50%, transparent)" }} />

      <div className="container-max">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }} className="text-center mb-14">
          <span className="section-label mb-5 inline-flex">
            <Activity size={10} /> Live AI Pipeline Demonstration
          </span>
          <h2 className="section-heading mt-4 mb-5">
            Watch the AI Think in{" "}
            <span className="gradient-text">Real Time</span>
          </h2>
          <p className="text-base max-w-2xl mx-auto" style={{ color: "var(--text-muted)" }}>
            Every second of this simulation mirrors the actual InsightX AI pipeline.
            Click Run to watch 12 AI models process evidence simultaneously.
          </p>
        </motion.div>

        {/* Demo controls */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <button
            onClick={() => setRunning(true)}
            disabled={running}
            className="btn-primary px-6 py-3 gap-2 shadow-glow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play size={14} />
            {running ? "Analysis Running…" : done ? "View Results" : "Run Live Demo"}
          </button>
          <button onClick={resetAll} className="btn-secondary px-4 py-3 gap-2">
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        {/* Main demo grid */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid lg:grid-cols-12 gap-5"
        >
          {/* Pipeline column */}
          <div className="lg:col-span-4 card p-4 space-y-1.5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                AI Pipeline
              </h3>
              <div className="flex items-center gap-1.5">
                {running && !done && (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                    <span className="text-[10px] text-[#10B981] font-medium">Processing</span>
                  </>
                )}
                {done && <span className="badge-low text-[10px]">Complete</span>}
              </div>
            </div>
            {PIPELINE.map((step, i) => (
              <PipelineStep key={step.id} step={step} index={i}
                active={currentStage === i && !done}
                done={done || currentStage > i} />
            ))}
            {/* Overall progress */}
            <div className="pt-3 border-t" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between text-[10px] mb-1.5" style={{ color: "var(--text-muted)" }}>
                <span>Overall Progress</span>
                <span className="font-mono">
                  {done ? "100" : currentStage < 0 ? "0" : Math.round((currentStage / PIPELINE.length) * 100)}%
                </span>
              </div>
              <div className="progress-bar">
                <motion.div className="progress-bar-fill"
                  animate={{ width: done ? "100%" : currentStage < 0 ? "0%" : `${(currentStage / PIPELINE.length) * 100}%` }}
                  transition={{ duration: 0.5 }} />
              </div>
            </div>
          </div>

          {/* Right panels */}
          <div className="lg:col-span-8 space-y-5">
            {/* Stats row */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { l: "Persons Detected",  v: personCount,  c: "#7C3AED", icon: Users },
                { l: "Vehicles",          v: vehicleCount, c: "#0078D4", icon: Zap },
                { l: "Anomalies",         v: anomalyCount, c: "#EF4444", icon: AlertTriangle },
                { l: "Incident Score",    v: scoreCount,   c: "#F59E0B", icon: BarChart3 },
              ].map(s => (
                <div key={s.l} className="card p-4">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2.5"
                    style={{ background: `${s.c}12`, border: `1px solid ${s.c}20` }}>
                    <s.icon size={13} style={{ color: s.c }} />
                  </div>
                  <div className="text-2xl font-black" style={{ color: s.c }}>{s.v}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Timeline + Transcript side by side */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Event timeline */}
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                    Event Timeline
                  </h3>
                  <Clock size={12} style={{ color: "var(--text-subtle)" }} />
                </div>
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto no-scrollbar">
                  <AnimatePresence>
                    {visibleEvents.map(i => {
                      const e = TIMELINE_EVENTS[i];
                      const s = SEV_STYLES[e.severity];
                      return (
                        <motion.div key={i}
                          initial={{ opacity: 0, x: -8, height: 0 }}
                          animate={{ opacity: 1, x: 0, height: "auto" }}
                          className="flex items-start gap-2 px-2.5 py-2 rounded-lg"
                          style={{ background: s.bg }}>
                          <div className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" style={{ background: s.dot }} />
                          <div className="min-w-0">
                            <span className="text-[9px] font-mono" style={{ color: "var(--text-subtle)" }}>{e.time}</span>
                            <p className="text-[10px] font-medium leading-snug" style={{ color: "var(--text)" }}>{e.label}</p>
                          </div>
                          <span className="text-[9px] font-bold ml-auto flex-shrink-0" style={{ color: s.text }}>
                            {e.severity.toUpperCase()}
                          </span>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  {visibleEvents.length === 0 && (
                    <p className="text-[10px] text-center py-8" style={{ color: "var(--text-subtle)" }}>
                      Events will appear here during analysis…
                    </p>
                  )}
                </div>
              </div>

              {/* Audio transcription */}
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                    Live Transcription
                  </h3>
                  <AudioLines size={12} style={{ color: "var(--text-subtle)" }} />
                </div>
                <div className="min-h-[180px] rounded-xl p-3 font-mono text-[10px] leading-relaxed relative"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}>
                  {transcript || (
                    <span style={{ color: "var(--text-subtle)" }}>Whisper transcription will stream here…</span>
                  )}
                  {currentStage >= 3 && !done && (
                    <span className="inline-block w-0.5 h-3 ml-0.5 animate-pulse align-middle" style={{ background: "var(--primary)" }} />
                  )}
                </div>
              </div>
            </div>

            {/* AI Reasoning */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)" }}>
                    <Brain size={11} style={{ color: "#a78bfa" }} />
                  </div>
                  <h3 className="text-xs font-bold" style={{ color: "var(--text)" }}>AI Investigator Reasoning</h3>
                </div>
                {currentStage >= 5 && !done && (
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <motion.div key={i} className="w-1 h-1 rounded-full"
                        style={{ background: "var(--primary)" }}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded-xl p-3.5 min-h-[100px] font-mono text-[11px] leading-relaxed whitespace-pre-wrap"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}>
                {reasoning || (
                  <span style={{ color: "var(--text-subtle)" }}>
                    AI reasoning will appear here when the analysis reaches the reasoning stage…
                  </span>
                )}
                {currentStage >= 5 && !done && (
                  <span className="inline-block w-0.5 h-3 ml-0.5 animate-pulse align-middle" style={{ background: "var(--primary)" }} />
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center mt-10">
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            This simulation mirrors the actual InsightX AI pipeline. Try it on your own footage.
          </p>
          <Link href="/auth?mode=register"
            className="btn-primary px-8 py-3.5 shadow-glow-md inline-flex items-center gap-2">
            Start Analyzing Real Evidence <ChevronRight size={14} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
