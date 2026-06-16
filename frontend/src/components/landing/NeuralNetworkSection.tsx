"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useTheme } from "next-themes";
import { Brain, Zap, Eye, AudioLines, BarChart3, Shield, Activity, ChevronRight, Users } from "lucide-react";
import Link from "next/link";

/* ── Canvas-based animated neural network ── */
function NeuralCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isLight = resolvedTheme === "light";
    const primaryColor = isLight ? "#0078D4" : "#7C3AED";
    const secondaryColor = isLight ? "#00BCF2" : "#06B6D4";
    const activeColor = isLight ? "#0078D4" : "#a78bfa";
    const bgOpacity = isLight ? 0.04 : 0.08;

    let animId: number;
    let t = 0;

    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const W = canvas.width;
    const H = canvas.height;

    // Layer configuration
    const layers = [
      { nodes: 3, x: W * 0.12, label: "Input" },
      { nodes: 5, x: W * 0.28, label: "Conv1" },
      { nodes: 5, x: W * 0.44, label: "Conv2" },
      { nodes: 4, x: W * 0.60, label: "LSTM" },
      { nodes: 3, x: W * 0.76, label: "Dense" },
      { nodes: 2, x: W * 0.90, label: "Output" },
    ];

    type Node = { x: number; y: number; layer: number; index: number; pulse: number };
    const nodes: Node[] = [];

    layers.forEach((layer, li) => {
      const spacing = H / (layer.nodes + 1);
      for (let i = 0; i < layer.nodes; i++) {
        nodes.push({
          x: layer.x,
          y: spacing * (i + 1),
          layer: li,
          index: i,
          pulse: Math.random() * Math.PI * 2,
        });
      }
    });

    // Active signal travelling through the network
    type Signal = {
      fromNode: Node; toNode: Node;
      progress: number; speed: number; opacity: number;
    };
    const signals: Signal[] = [];

    const addSignals = () => {
      const fromLayer = Math.floor(Math.random() * (layers.length - 1));
      const fromLayerNodes = nodes.filter(n => n.layer === fromLayer);
      const toLayerNodes   = nodes.filter(n => n.layer === fromLayer + 1);
      if (!fromLayerNodes.length || !toLayerNodes.length) return;
      const from = fromLayerNodes[Math.floor(Math.random() * fromLayerNodes.length)];
      const to   = toLayerNodes[Math.floor(Math.random() * toLayerNodes.length)];
      signals.push({ fromNode: from, toNode: to, progress: 0, speed: 0.008 + Math.random() * 0.006, opacity: 0.8 });
    };

    let signalTimer = 0;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.015;
      signalTimer++;
      if (signalTimer % 20 === 0) addSignals();

      // Draw connections
      for (let li = 0; li < layers.length - 1; li++) {
        const fromNodes = nodes.filter(n => n.layer === li);
        const toNodes   = nodes.filter(n => n.layer === li + 1);
        fromNodes.forEach(fn => {
          toNodes.forEach(tn => {
            ctx.beginPath();
            ctx.moveTo(fn.x, fn.y);
            ctx.lineTo(tn.x, tn.y);
            ctx.strokeStyle = `rgba(${isLight ? "0,120,212" : "124,58,237"},${bgOpacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          });
        });
      }

      // Draw travelling signals
      for (let i = signals.length - 1; i >= 0; i--) {
        const sig = signals[i];
        sig.progress += sig.speed;
        if (sig.progress > 1) { signals.splice(i, 1); continue; }

        const x = sig.fromNode.x + (sig.toNode.x - sig.fromNode.x) * sig.progress;
        const y = sig.fromNode.y + (sig.toNode.y - sig.fromNode.y) * sig.progress;

        // Signal trail
        const grd = ctx.createRadialGradient(x, y, 0, x, y, 12);
        grd.addColorStop(0, `rgba(${isLight ? "0,120,212" : "167,139,250"},${sig.opacity})`);
        grd.addColorStop(1, `rgba(${isLight ? "0,120,212" : "124,58,237"},0)`);
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Signal dot
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = activeColor;
        ctx.fill();
      }

      // Draw nodes
      nodes.forEach(node => {
        const pulse = Math.sin(t * 1.5 + node.pulse) * 0.3 + 0.7;
        const r = 7 + pulse * 2;
        const isActive = signals.some(s =>
          (s.fromNode === node || s.toNode === node) && s.progress > 0.4
        );
        const color = isActive ? activeColor : primaryColor;

        // Outer glow
        const grd = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 3);
        grd.addColorStop(0, `rgba(${isLight ? "0,120,212" : "124,58,237"},${isActive ? 0.35 : 0.15})`);
        grd.addColorStop(1, `rgba(${isLight ? "0,120,212" : "124,58,237"},0)`);
        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 3, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Node body
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${isLight ? "255,255,255" : "8,15,30"},0.95)`;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = isActive ? 2.5 : 1.5;
        ctx.stroke();

        // Inner dot
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      });

      // Draw layer labels
      layers.forEach((layer, li) => {
        ctx.fillStyle = `rgba(${isLight ? "107,114,128" : "100,116,139"},0.7)`;
        ctx.font = "10px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(layer.label, layer.x, H - 12);
      });

      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, [resolvedTheme]);

  return (
    <canvas ref={canvasRef} className="w-full h-full" />
  );
}

const AI_MODELS = [
  { icon: Eye,        name: "YOLOv8s-seg",        role: "Object Detection",      accuracy: "99.2%", color: "#7C3AED" },
  { icon: Users,      name: "ByteTrack",           role: "Person Re-ID",          accuracy: "97.8%", color: "#0078D4" },
  { icon: AudioLines, name: "Faster-Whisper",      role: "Speech Recognition",    accuracy: "96.1%", color: "#10B981" },
  { icon: Brain,      name: "Claude Sonnet 4.6",   role: "Reasoning & Chat",      accuracy: "GPT-4+", color: "#F59E0B" },
  { icon: BarChart3,  name: "YAMNet",              role: "Audio Event Detection", accuracy: "94.5%", color: "#EF4444" },
  { icon: Shield,     name: "Custom Anomaly CNN",  role: "12-Class Detection",    accuracy: "93.7%", color: "#06B6D4" },
];

export function NeuralNetworkSection() {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const [activeModel, setActiveModel] = useState<number | null>(null);

  return (
    <section id="neural" ref={ref} className="section-padding relative overflow-hidden">
      {/* Subtle bg */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "var(--surface-2)", opacity: 0.5 }} />

      <div className="container-max relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left: neural network canvas */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                    style={{ background: "var(--primary-glow)", border: "1px solid var(--border)" }}>
                    <Brain size={13} style={{ color: "var(--primary)" }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold" style={{ color: "var(--text)" }}>Neural Architecture</p>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Real-time inference · 12 models</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="dot-live" />
                  <span className="text-[10px] font-medium text-[#10B981]">Active</span>
                </div>
              </div>
              <div className="h-64 relative">
                <NeuralCanvas />
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-4">
                  {[
                    { label: "Throughput", value: "4.2 fps" },
                    { label: "Latency",    value: "12ms" },
                    { label: "GPU Util",   value: "78%" },
                  ].map(s => (
                    <div key={s.label}>
                      <p className="text-[9px]" style={{ color: "var(--text-subtle)" }}>{s.label}</p>
                      <p className="text-xs font-bold" style={{ color: "var(--primary)" }}>{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                  <Activity size={11} className="animate-pulse" /> Signals flowing
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: model grid */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <span className="section-label mb-5 inline-flex"><Zap size={10} /> AI Intelligence Stack</span>
            <h2 className="section-heading mt-4 mb-4">
              12 Models,{" "}
              <span className="gradient-text">One Intelligence</span>
            </h2>
            <p className="text-base mb-8 leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Each model is an expert in its domain. Together they form a reasoning chain that
              understands video the way a trained investigator would.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {AI_MODELS.map((m, i) => (
                <motion.div
                  key={m.name}
                  initial={{ opacity: 0, y: 16 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.07 }}
                  className="card p-3.5 cursor-pointer group transition-all duration-200"
                  onMouseEnter={() => setActiveModel(i)}
                  onMouseLeave={() => setActiveModel(null)}
                  style={activeModel === i ? {
                    borderColor: m.color + "40",
                    boxShadow: `0 8px 24px ${m.color}15`,
                  } : {}}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                      style={{
                        background: activeModel === i ? `${m.color}15` : "var(--surface-2)",
                        border: `1px solid ${activeModel === i ? m.color + "30" : "var(--border)"}`,
                      }}>
                      <m.icon size={13} style={{ color: activeModel === i ? m.color : "var(--text-muted)" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>{m.name}</p>
                      <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>{m.role}</p>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="text-[10px]" style={{ color: "var(--text-subtle)" }}>Accuracy</span>
                    <span className="text-[10px] font-bold" style={{ color: m.color }}>{m.accuracy}</span>
                  </div>
                  <div className="progress-bar mt-1.5" style={{ height: "3px" }}>
                    <div className="progress-bar-fill" style={{
                      width: m.accuracy.includes("%") ? m.accuracy : "100%",
                      background: m.color,
                      height: "100%",
                    }} />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-4">
              <Link href="/auth?mode=register" className="btn-primary px-5 py-2.5 gap-2 shadow-glow-sm">
                Access All Models <ChevronRight size={13} />
              </Link>
              <a href="#features" className="btn-ghost px-4 py-2.5 gap-2">
                View All Features →
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
