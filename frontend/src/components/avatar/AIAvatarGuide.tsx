"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, X, ChevronRight, Sparkles } from "lucide-react";

const AVATAR_SCRIPT = [
  {
    text: "Hello! I'm Ahmad Yasin, co-founder of InsightX AI. Welcome to the world's most advanced AI video intelligence platform.",
    duration: 6000,
  },
  {
    text: "In just 90 seconds, we transform any video into forensic-grade intelligence — object detection, person tracking, speech transcription, and AI-powered investigation reports.",
    duration: 7000,
  },
  {
    text: "Let me guide you through the platform. Upload any video evidence, watch 12 AI models work in real time, and chat with your evidence using natural language.",
    duration: 7000,
  },
  {
    text: "Ready to experience the future of video intelligence? Let's begin your investigation!",
    duration: 5000,
  },
];

const AVATAR_KEY = "insightx-avatar-v1";

export function AIAvatarGuide() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const seen = localStorage.getItem(AVATAR_KEY);
    if (!seen) {
      const t = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (muted || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.startsWith("en") && v.name.includes("Male"))
      ?? voices.find(v => v.lang.startsWith("en"));
    if (preferred) utterance.voice = preferred;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [muted]);

  useEffect(() => {
    if (!visible || muted) return;
    speak(AVATAR_SCRIPT[step].text);
    return () => window.speechSynthesis?.cancel();
  }, [visible, step, muted, speak]);

  const dismiss = () => {
    window.speechSynthesis?.cancel();
    localStorage.setItem(AVATAR_KEY, "1");
    setVisible(false);
  };

  const next = () => {
    if (step < AVATAR_SCRIPT.length - 1) setStep(s => s + 1);
    else dismiss();
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9500] flex items-end sm:items-center justify-center p-4 sm:p-6"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full max-w-lg glass-strong rounded-3xl overflow-hidden"
          style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)" }}
        >
          {/* Avatar header */}
          <div className="relative h-48 overflow-hidden"
            style={{ background: "linear-gradient(135deg, var(--primary) 0%, #4F46E5 50%, #6B46C1 100%)" }}>
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: "radial-gradient(circle at 30% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2">
              <div className="relative">
                {/* Speaking pulse rings */}
                {speaking && (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full border-2 border-white/40"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.25], opacity: [0.4, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
                      className="absolute inset-0 rounded-full border-2 border-white/30"
                    />
                  </>
                )}
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white/30 shadow-2xl relative">
                  <Image
                    src="/ahmad-yasin.png"
                    alt="Ahmad Yasin — Co-founder of InsightX AI"
                    fill
                    className="object-cover"
                    priority
                  />
                  {/* Lip sync overlay */}
                  {speaking && (
                    <motion.div
                      animate={{ scaleY: [0.3, 1, 0.5, 0.8, 0.3] }}
                      transition={{ duration: 0.4, repeat: Infinity }}
                      className="absolute bottom-6 left-1/2 -translate-x-1/2 w-8 h-3 rounded-full bg-white/20"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="absolute top-4 right-4 flex gap-2">
              <button onClick={() => { setMuted(m => !m); window.speechSynthesis?.cancel(); setSpeaking(false); }}
                className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all">
                {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
              <button onClick={dismiss}
                className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all">
                <X size={14} />
              </button>
            </div>

            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm">
              <Sparkles size={11} className="text-white" />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">AI Guide</span>
            </div>
          </div>

          {/* Content */}
          <div className="pt-10 px-6 pb-6">
            <div className="text-center mb-4">
              <p className="text-sm font-black" style={{ color: "var(--text)" }}>Ahmad Yasin</p>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Co-founder & Lead AI Engineer</p>
            </div>

            <motion.p
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm leading-relaxed text-center mb-5 min-h-[60px]"
              style={{ color: "var(--text-muted)" }}
            >
              {AVATAR_SCRIPT[step].text}
            </motion.p>

            {/* Step dots */}
            <div className="flex justify-center gap-1.5 mb-5">
              {AVATAR_SCRIPT.map((_, i) => (
                <div key={i} className="rounded-full transition-all duration-300"
                  style={{
                    width: i === step ? 20 : 6, height: 6,
                    background: i === step ? "var(--primary)" : i < step ? "var(--primary)" + "60" : "var(--surface-3)",
                  }} />
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button onClick={dismiss} className="text-xs" style={{ color: "var(--text-subtle)" }}>
                Skip introduction
              </button>
              <button onClick={next} className="btn-primary text-xs px-5 py-2.5 gap-2">
                {step === AVATAR_SCRIPT.length - 1 ? "Start Exploring" : "Continue"}
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function resetAvatarGuide() {
  localStorage.removeItem(AVATAR_KEY);
}
