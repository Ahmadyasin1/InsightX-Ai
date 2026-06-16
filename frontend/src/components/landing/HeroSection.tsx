"use client";

import { motion, useInView, useMotionValue, useSpring, animate } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  ArrowRight, Play, Zap, Shield, Brain, Activity,
  Eye, Clock, Users, ChevronRight, Check, Sparkles,
  Upload, BarChart3, MessageSquare, TrendingUp,
} from "lucide-react";

/* ── Animated particle canvas background ─────────────────── */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isLight = resolvedTheme === "light";
    const particleColor = isLight ? "rgba(0,120,212," : "rgba(124,58,237,";
    const lineColor = isLight ? "rgba(0,120,212," : "rgba(124,58,237,";

    let animId: number;
    const particles: Array<{
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number;
    }> = [];

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.4 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${particleColor}${p.opacity})`;
        ctx.fill();
      });
      // Draw lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `${lineColor}${0.15 * (1 - d / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, [resolvedTheme]);

  return (
    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
  );
}

/* ── Animated stat counter ── */
function StatCounter({ value, suffix = "" }: { value: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const num = parseFloat(value.replace(/[^0-9.]/g, ""));
  const prefix = value.replace(/[0-9.+%<>]/g, "");

  useEffect(() => {
    if (!inView || !ref.current || isNaN(num)) return;
    const controls = animate(0, num, {
      duration: 1.5, ease: "easeOut",
      onUpdate(v) {
        if (ref.current) ref.current.textContent = prefix + (Number.isInteger(num) ? Math.round(v).toString() : v.toFixed(1)) + suffix;
      },
    });
    return () => controls.stop();
  }, [inView, num, prefix, suffix]);

  return <span ref={ref}>{prefix}0{suffix}</span>;
}

/* ── Interactive Dashboard Preview ── */
function HeroDashboard() {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(0);

  const stages = ["Object Detection", "Person Tracking", "Speech Analysis", "Risk Scoring", "Report Generation"];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(timer);
          return 100;
        }
        return p + 0.8;
      });
    }, 60);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setStage(Math.floor((progress / 100) * stages.length));
  }, [progress]);

  return (
    <div className="relative rounded-2xl overflow-hidden border"
      style={{
        background: "rgba(8,15,30,0.95)",
        borderColor: "rgba(255,255,255,0.08)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)",
      }}>
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#28CA41]" />
        <div className="flex-1 mx-3 h-5 rounded-lg flex items-center px-2.5 text-[10px] text-[#334155]"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
          insightx.ai/investigations/INV-2847
        </div>
        <div className="flex items-center gap-1 text-[10px] text-[#10B981]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
          Live
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Stat mini cards */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { l: "Persons",   v: "7",   c: "#7C3AED" },
            { l: "Vehicles",  v: "2",   c: "#06B6D4" },
            { l: "Anomalies", v: "3",   c: "#EF4444" },
            { l: "Score",     v: "84",  c: "#F59E0B" },
          ].map(s => (
            <div key={s.l} className="rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="text-base font-black" style={{ color: s.c }}>{s.v}</div>
              <div className="text-[9px] text-[#334155] mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Analysis progress */}
        <div className="rounded-xl p-3 space-y-2.5" style={{ background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.12)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] animate-pulse" />
              <span className="text-[10px] font-semibold text-[#c4b5fd]">{stages[Math.min(stage, stages.length - 1)]}</span>
            </div>
            <span className="text-[10px] font-mono text-[#a78bfa]">{Math.round(progress)}%</span>
          </div>
          <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
            <motion.div className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #7C3AED, #06B6D4)", width: `${progress}%` }}
              transition={{ duration: 0.1 }} />
          </div>
          <div className="flex items-center justify-between text-[9px] text-[#334155]">
            <span>{stages.map((s, i) => (
              <span key={s} className={i <= stage ? "text-[#a78bfa]" : ""}>{i > 0 && " → "}{s.split(" ")[0]}</span>
            ))}</span>
          </div>
        </div>

        {/* Live event stream */}
        <div className="space-y-1.5">
          {[
            { time: "00:04:22", text: "Person T-007 — loitering detected (24min)", sev: "high" },
            { time: "00:11:50", text: "Fight detected — 3 persons involved",       sev: "critical" },
            { time: "00:13:02", text: "Audio: Screaming detected (91dB)",           sev: "high" },
          ].map((e, i) => (
            <motion.div key={e.time}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.3 }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
              style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${e.sev === "critical" ? "bg-red-500" : "bg-orange-400"}`} />
              <span className="text-[9px] font-mono text-[#334155]">{e.time}</span>
              <span className="text-[9px] text-[#475569] truncate">{e.text}</span>
              <span className={`ml-auto text-[9px] font-bold flex-shrink-0 ${e.sev === "critical" ? "text-red-400" : "text-orange-400"}`}>{e.sev.toUpperCase()}</span>
            </motion.div>
          ))}
        </div>

        {/* AI response */}
        <div className="rounded-xl p-3" style={{ background: "rgba(6,182,212,0.05)", border: "1px solid rgba(6,182,212,0.1)" }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-4 h-4 rounded-lg flex items-center justify-center" style={{ background: "rgba(6,182,212,0.15)" }}>
              <Brain size={9} className="text-[#06B6D4]" />
            </div>
            <span className="text-[9px] font-semibold text-[#22d3ee]">AI Investigator</span>
            <div className="ml-auto flex gap-0.5">
              {[0,1,2].map(i => (
                <motion.div key={i} className="w-1 h-1 rounded-full bg-[#06B6D4]"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
              ))}
            </div>
          </div>
          <p className="text-[9px] text-[#64748B] leading-relaxed">
            <span className="text-white font-medium">Person T-007</span> was loitering for 24 minutes before the altercation at T+11:50.
            Cross-referencing audio confirms <span className="text-[#a78bfa]">HIGH intent signal</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

const STATS = [
  { value: "12", suffix: "+", label: "AI Models" },
  { value: "94.2", suffix: "%", label: "Accuracy" },
  { value: "90", suffix: "s", label: "Analysis" },
  { value: "99.9", suffix: "%", label: "Uptime" },
];

const TRUST = [
  { icon: Shield,   label: "On-Premise" },
  { icon: Brain,    label: "12 AI Models" },
  { icon: Clock,    label: "<90s Analysis" },
];

export function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme !== "dark";

  return (
    <section ref={ref} className="relative min-h-screen flex items-center pt-20 pb-16 overflow-hidden">
      {/* Particle background */}
      <ParticleCanvas />

      {/* Gradient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        {isLight ? (
          <>
            <div className="absolute top-[-150px] left-1/2 -translate-x-1/4 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
              style={{ background: "radial-gradient(circle, #0078D4, transparent 70%)" }} />
            <div className="absolute bottom-0 right-[-100px] w-[400px] h-[400px] rounded-full opacity-10 blur-3xl"
              style={{ background: "radial-gradient(circle, #00BCF2, transparent 70%)" }} />
          </>
        ) : (
          <>
            <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full opacity-30 blur-3xl"
              style={{ background: "radial-gradient(circle, #7C3AED, transparent 70%)" }} />
            <div className="absolute bottom-0 right-[-80px] w-[400px] h-[400px] rounded-full opacity-20 blur-3xl"
              style={{ background: "radial-gradient(circle, #06B6D4, transparent 70%)" }} />
          </>
        )}
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 30%, black, transparent)",
        }} />

      <div className="container-max relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── Left copy ── */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2.5 mb-8"
            >
              <span className="section-label">
                <Sparkles size={10} />
                Next-Generation Forensic AI · 12 Models in Concert
                <ChevronRight size={10} />
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl lg:text-6xl xl:text-[4.5rem] font-black tracking-tight leading-[1.04] mb-6 text-balance"
              style={{ color: "var(--text)" }}
            >
              The AI That Sees{" "}
              <span className="gradient-text">What Others Miss</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base lg:text-lg leading-relaxed mb-8 max-w-lg"
              style={{ color: "var(--text-muted)" }}
            >
              InsightX AI processes video evidence through 12 parallel AI models —
              detecting persons, tracking movements, transcribing audio, and generating
              forensic-grade investigation reports in under 90 seconds.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-10"
            >
              <Link href="/auth?mode=register"
                className="btn-primary text-sm px-6 py-3.5 shadow-glow-md">
                Start Free Investigation
                <ArrowRight size={15} />
              </Link>
              <a href="#live-demo"
                className="flex items-center gap-2.5 text-sm font-medium group transition-all"
                style={{ color: "var(--text-muted)" }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-all group-hover:scale-105"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border-strong)" }}>
                  <Play size={13} style={{ color: "var(--primary)" }} />
                </div>
                <span className="group-hover:underline underline-offset-2">Watch live demo</span>
              </a>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex items-center gap-5 flex-wrap"
            >
              {TRUST.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-subtle)" }}>
                  <Icon size={12} style={{ color: "var(--text-muted)" }} />
                  {label}
                </div>
              ))}
              <div className="h-3 w-px hidden sm:block" style={{ background: "var(--border-strong)" }} />
              <div className="flex items-center gap-1.5 text-xs text-[#10B981]">
                <Check size={11} />
                Free to start
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="grid grid-cols-4 gap-4 mt-12 pt-8"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              {STATS.map((s) => (
                <div key={s.label}>
                  <div className="text-xl font-black mb-0.5" style={{ color: "var(--primary)" }}>
                    <StatCounter value={s.value} suffix={s.suffix} />
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-subtle)" }}>{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── Right: Dashboard preview ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, x: 24 }} animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="relative"
          >
            {/* Glow halo */}
            <div className="absolute inset-0 -z-10 blur-3xl opacity-25"
              style={{ background: "radial-gradient(ellipse, var(--primary), transparent 70%)" }} />

            {/* Floating badges */}
            <motion.div
              animate={{ y: [-4, 4, -4] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-5 -left-4 z-10 px-3 py-2 rounded-xl text-xs font-semibold shadow-elev-2"
              style={{ background: "#10B981", color: "#fff" }}>
              <div className="flex items-center gap-1.5">
                <Activity size={11} /> Analysis Complete
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [4, -4, 4] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-4 -right-4 z-10 px-3 py-2 rounded-xl text-xs font-semibold"
              style={{ background: "rgba(8,15,30,0.95)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
              <div className="flex items-center gap-1.5">
                <Brain size={11} className="text-[#a78bfa]" /> AI Reasoning Active
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [-3, 5, -3] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute top-1/3 -right-6 z-10 px-3 py-2 rounded-xl text-xs font-semibold hidden xl:block"
              style={{ background: "rgba(8,15,30,0.95)", border: "1px solid rgba(124,58,237,0.25)", color: "#fff" }}>
              <div className="flex items-center gap-1.5">
                <Eye size={11} className="text-[#06B6D4]" /> 7 Persons Tracked
              </div>
            </motion.div>

            <HeroDashboard />
          </motion.div>
        </div>

        {/* Bottom scroll hint */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="flex flex-col items-center gap-2 mt-16"
        >
          <span className="text-xs" style={{ color: "var(--text-subtle)" }}>Scroll to explore</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }}
            className="w-5 h-8 rounded-full border flex items-start justify-center pt-1.5"
            style={{ borderColor: "var(--border-strong)" }}>
            <div className="w-1 h-2 rounded-full" style={{ background: "var(--primary)" }} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
