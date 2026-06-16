"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Sparkles } from "lucide-react";

const WELCOME_KEY = "insightx-welcome-v1";

export function WelcomeExperience({ onComplete }: { onComplete?: () => void }) {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (localStorage.getItem(WELCOME_KEY)) return;
    setVisible(true);
    setPhase(1); // show content immediately — no blank wait
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timers = [
      setTimeout(() => setPhase(2), 600),
      setTimeout(() => setPhase(3), 1400),
      setTimeout(() => {
        localStorage.setItem(WELCOME_KEY, "1");
        setVisible(false);
        onComplete?.();
      }, 2800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [visible, onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-[9600] flex items-center justify-center overflow-hidden"
          style={{ background: "var(--bg)" }}
        >
          {/* Animated background orbs */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute w-[600px] h-[600px] rounded-full blur-3xl"
            style={{ background: "var(--primary-glow)", top: "-20%", left: "-10%" }}
          />
          <motion.div
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute w-[500px] h-[500px] rounded-full blur-3xl"
            style={{ background: "rgba(107,70,193,0.15)", bottom: "-20%", right: "-10%" }}
          />

          <div className="relative text-center px-6">
            {/* Logo reveal */}
            <AnimatePresence>
              {phase >= 1 && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8"
                  style={{ background: "var(--primary)", boxShadow: "0 0 60px var(--primary-glow)" }}
                >
                  <Zap size={36} className="text-white" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Title reveal */}
            <AnimatePresence>
              {phase >= 2 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}>
                  <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-3">
                    <span style={{ color: "var(--text)" }}>Insight</span>
                    <span style={{ color: "var(--primary)" }}>X</span>
                    <span style={{ color: "var(--text)" }}> AI</span>
                  </h1>
                  <p className="text-lg md:text-xl font-medium gradient-text">
                    World&apos;s Most Beautiful AI Video Intelligence Platform
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tagline reveal */}
            <AnimatePresence>
              {phase >= 3 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
                  className="mt-6 flex items-center justify-center gap-2">
                  <Sparkles size={14} style={{ color: "var(--primary)" }} />
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Initializing 12 AI models…
                  </p>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 rounded-full border-2 border-transparent"
                    style={{ borderTopColor: "var(--primary)" }} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
