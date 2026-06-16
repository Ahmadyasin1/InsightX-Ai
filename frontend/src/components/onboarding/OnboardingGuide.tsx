"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Eye, Brain, BarChart3, MessageSquare, ChevronRight,
  ChevronLeft, X, Play, CheckCircle2, Sparkles,
} from "lucide-react";

interface GuideStep {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  highlight?: string;      // CSS selector to spotlight
  position?: "center" | "top-right" | "bottom-left";
  action?: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    title: "Welcome to InsightX AI",
    description: "The world's most advanced AI video intelligence platform. In just 90 seconds, transform any video into a full forensic investigation report. Let me show you around!",
    icon: Sparkles,
    color: "var(--primary)",
    position: "center",
  },
  {
    title: "Upload Any Video Evidence",
    description: "Drag & drop any MP4, MOV, AVI or MKV file up to 4GB. InsightX AI accepts footage from any camera — phones, CCTV, body cameras, or drones.",
    icon: Play,
    color: "#10B981",
    position: "center",
    action: "Try uploading a sample video",
  },
  {
    title: "12 AI Models Activate",
    description: "The moment you upload, 12 specialized AI models begin working in parallel — detecting persons, tracking movements, transcribing audio, and detecting 12 classes of anomalies.",
    icon: Brain,
    color: "#7C3AED",
    position: "center",
  },
  {
    title: "Live Analysis Dashboard",
    description: "Watch every detection happen in real time. Persons get unique Track IDs, events are timestamped, and the AI builds a complete evidence timeline automatically.",
    icon: Eye,
    color: "#0078D4",
    position: "center",
  },
  {
    title: "AI Chat Investigator",
    description: "Ask natural language questions about your evidence. 'Who was near the entrance at 2pm?' 'Was there suspicious behavior?' Get precise, cited answers instantly.",
    icon: MessageSquare,
    color: "#F59E0B",
    position: "center",
    action: "Try asking a question",
  },
  {
    title: "Forensic-Grade Reports",
    description: "Generate professional PDF, JSON, or CSV reports with executive briefs, evidence timelines, risk scores, and actionable recommendations — ready for legal proceedings.",
    icon: BarChart3,
    color: "#EF4444",
    position: "center",
  },
  {
    title: "You're Ready to Investigate",
    description: "Create your first investigation now. Start free — no credit card required. Your first 5 investigations are completely free.",
    icon: CheckCircle2,
    color: "#10B981",
    position: "center",
    action: "Create First Investigation",
  },
];

const GUIDE_KEY = "insightx-guide-v2";

export function OnboardingGuide() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const tryShow = () => {
      const seen = localStorage.getItem(GUIDE_KEY);
      const avatarDone = localStorage.getItem("insightx-avatar-v1");
      const welcomeDone = localStorage.getItem("insightx-welcome-v1");
      if (!seen && (avatarDone || welcomeDone)) setVisible(true);
    };
    const interval = setInterval(tryShow, 800);
    const fallback = setTimeout(tryShow, 8000);
    return () => { clearInterval(interval); clearTimeout(fallback); };
  }, []);

  const dismiss = () => {
    setVisible(false);
    if (typeof window !== "undefined") localStorage.setItem(GUIDE_KEY, "1");
  };

  const next = () => {
    if (step < GUIDE_STEPS.length - 1) setStep(s => s + 1);
    else dismiss();
  };
  const prev = () => setStep(s => Math.max(0, s - 1));

  if (!visible) return null;

  const current = GUIDE_STEPS[step];
  const Icon = current.icon;
  const progress = ((step + 1) / GUIDE_STEPS.length) * 100;

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9000] pointer-events-none"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          />

          {/* Guide card */}
          <div className="fixed inset-0 z-[9001] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key={step}
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -16 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="pointer-events-auto w-full max-w-md"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border-strong)",
                borderRadius: "20px",
                boxShadow: "0 32px 80px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.05)",
                overflow: "hidden",
              }}
            >
              {/* Progress bar */}
              <div className="h-0.5" style={{ background: "var(--surface-3)" }}>
                <motion.div className="h-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                  style={{ background: current.color }}
                />
              </div>

              <div className="p-7">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ background: `${current.color}14`, border: `1.5px solid ${current.color}28` }}>
                      <Icon size={22} style={{ color: current.color }} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                        Step {step + 1} of {GUIDE_STEPS.length}
                      </p>
                      <h3 className="text-base font-black" style={{ color: "var(--text)" }}>
                        {current.title}
                      </h3>
                    </div>
                  </div>
                  <button onClick={dismiss}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                    style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
                    <X size={14} />
                  </button>
                </div>

                {/* Description */}
                <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--text-muted)" }}>
                  {current.description}
                </p>

                {/* Step dots */}
                <div className="flex items-center gap-1.5 mb-6">
                  {GUIDE_STEPS.map((_, i) => (
                    <button key={i} onClick={() => setStep(i)}
                      className="rounded-full transition-all duration-200"
                      style={{
                        width: i === step ? "20px" : "6px",
                        height: "6px",
                        background: i === step ? current.color : i < step ? current.color + "60" : "var(--surface-3)",
                      }}
                    />
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {step > 0 && (
                      <button onClick={prev} className="btn-ghost px-3 py-2 gap-1.5 text-xs">
                        <ChevronLeft size={13} /> Back
                      </button>
                    )}
                    <button onClick={dismiss} className="text-xs" style={{ color: "var(--text-subtle)" }}>
                      Skip tour
                    </button>
                  </div>
                  <button onClick={next} className="btn-primary px-5 py-2.5 gap-2 text-sm"
                    style={{ background: current.color }}>
                    {step === GUIDE_STEPS.length - 1 ? (
                      <><CheckCircle2 size={14} /> Get Started</>
                    ) : (
                      <>Next <ChevronRight size={13} /></>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Trigger button for re-opening guide ── */
export function GuideTriggerButton() {
  const restart = () => {
    localStorage.removeItem(GUIDE_KEY);
    window.location.reload();
  };
  return (
    <button onClick={restart}
      className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-all"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
      <Zap size={11} /> Take the Tour
    </button>
  );
}
