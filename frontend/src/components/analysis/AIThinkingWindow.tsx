"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

interface AIThinkingWindowProps {
  reasoning?: Record<string, unknown> | string | null;
  executiveBrief?: string;
  isThinking?: boolean;
}

const THINKING_STEPS = [
  "Scanning video frames for visual patterns…",
  "Cross-referencing object detections with temporal data…",
  "Analyzing speech transcription for key phrases…",
  "Evaluating anomaly severity against baseline models…",
  "Building evidence relationship graph…",
  "Synthesizing forensic narrative from all signals…",
  "Calculating incident risk score…",
  "Generating executive brief…",
];

export function AIThinkingWindow({ reasoning, executiveBrief, isThinking }: AIThinkingWindowProps) {
  const [expanded, setExpanded] = useState(true);
  const [visibleSteps, setVisibleSteps] = useState<string[]>([]);
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    if (!isThinking) return;
    const interval = setInterval(() => {
      setStepIdx(i => {
        const next = (i + 1) % THINKING_STEPS.length;
        setVisibleSteps(prev => [THINKING_STEPS[next], ...prev].slice(0, 5));
        return next;
      });
    }, 1800);
    return () => clearInterval(interval);
  }, [isThinking]);

  const reasoningText = typeof reasoning === "string"
    ? reasoning
    : reasoning?.summary as string
      ?? reasoning?.narrative as string
      ?? (reasoning ? JSON.stringify(reasoning, null, 2) : null);

  return (
    <div className="ms-card p-0 overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-5 py-4 transition-all"
        style={{ background: "var(--primary-glow)" }}
      >
        <motion.div
          animate={isThinking ? { rotate: [0, 360] } : {}}
          transition={{ duration: 3, repeat: isThinking ? Infinity : 0, ease: "linear" }}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--primary)" }}
        >
          <Brain size={16} className="text-white" />
        </motion.div>
        <div className="flex-1 text-left">
          <p className="text-xs font-bold flex items-center gap-2" style={{ color: "var(--text)" }}>
            AI Thinking Window
            {isThinking && (
              <span className="flex items-center gap-1 text-[10px] font-normal text-[#10B981]">
                <Sparkles size={10} /> Reasoning…
              </span>
            )}
          </p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            Watch the AI reason through your evidence
          </p>
        </div>
        {expanded ? <ChevronUp size={14} style={{ color: "var(--text-muted)" }} /> :
                    <ChevronDown size={14} style={{ color: "var(--text-muted)" }} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-3">
              {isThinking && (
                <div className="space-y-1.5 p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
                  <AnimatePresence>
                    {visibleSteps.map((step, i) => (
                      <motion.p key={`${step}-${i}`}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1 - i * 0.2, x: 0 }}
                        className="text-[11px] flex items-start gap-2"
                        style={{ color: i === 0 ? "var(--primary)" : "var(--text-muted)" }}>
                        <Sparkles size={10} className="mt-0.5 flex-shrink-0" />
                        {step}
                      </motion.p>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {executiveBrief && (
                <div className="p-4 rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--primary)" }}>
                    Executive Brief
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{executiveBrief}</p>
                </div>
              )}

              {reasoningText && !isThinking && (
                <div className="p-4 rounded-xl code-block max-h-48 overflow-y-auto">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--primary)" }}>
                    Reasoning Chain
                  </p>
                  <pre className="text-[10px] whitespace-pre-wrap leading-relaxed">{reasoningText}</pre>
                </div>
              )}

              {!isThinking && !reasoningText && !executiveBrief && (
                <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>
                  AI reasoning will appear here after analysis completes.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
