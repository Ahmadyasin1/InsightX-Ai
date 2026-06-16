"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import { Network, Users, Car, AlertTriangle, Clock, ChevronRight, Maximize2 } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";

/* ── D3-style force-directed graph using Canvas ── */
type GNode = {
  id: string; label: string; type: "person" | "vehicle" | "event" | "location" | "anomaly";
  x: number; y: number; vx: number; vy: number; r: number;
};
type GEdge = { source: string; target: string; label: string; strength: number };

const GRAPH_NODES: Omit<GNode, "x" | "y" | "vx" | "vy">[] = [
  { id: "p1", label: "Person T-007", type: "person",   r: 24 },
  { id: "p2", label: "Person T-012", type: "person",   r: 20 },
  { id: "p3", label: "Person T-019", type: "person",   r: 18 },
  { id: "v1", label: "Vehicle #3",   type: "vehicle",  r: 20 },
  { id: "e1", label: "Fight T+11:50",type: "anomaly",  r: 26 },
  { id: "e2", label: "Loitering",    type: "anomaly",  r: 22 },
  { id: "l1", label: "Entrance",     type: "location", r: 20 },
  { id: "l2", label: "Parking Lot",  type: "location", r: 18 },
  { id: "t1", label: "11:50:00",     type: "event",    r: 16 },
  { id: "t2", label: "07:14:00",     type: "event",    r: 15 },
];

const GRAPH_EDGES: GEdge[] = [
  { source: "p1", target: "e1", label: "involved in", strength: 0.9 },
  { source: "p2", target: "e1", label: "involved in", strength: 0.9 },
  { source: "p3", target: "e1", label: "witnessed",   strength: 0.5 },
  { source: "p1", target: "e2", label: "flagged",     strength: 0.8 },
  { source: "e1", target: "t1", label: "at time",     strength: 0.7 },
  { source: "e2", target: "t2", label: "at time",     strength: 0.7 },
  { source: "p1", target: "l1", label: "at location", strength: 0.6 },
  { source: "v1", target: "l2", label: "spotted at",  strength: 0.5 },
  { source: "p3", target: "v1", label: "arrived in",  strength: 0.4 },
  { source: "l1", target: "e1", label: "scene of",    strength: 0.6 },
];

const TYPE_COLORS: Record<GNode["type"], string> = {
  person:   "#7C3AED",
  vehicle:  "#0078D4",
  event:    "#F59E0B",
  location: "#10B981",
  anomaly:  "#EF4444",
};

const TYPE_ICONS = {
  person:   "👤",
  vehicle:  "🚗",
  event:    "⏱",
  location: "📍",
  anomaly:  "⚠️",
};

function KnowledgeCanvas({ isLight }: { isLight: boolean }) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const nodesRef   = useRef<GNode[]>([]);
  const animRef    = useRef<number>(0);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width  = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;

    // Initialize nodes with random positions
    nodesRef.current = GRAPH_NODES.map(n => ({
      ...n,
      x: W / 2 + (Math.random() - 0.5) * W * 0.5,
      y: H / 2 + (Math.random() - 0.5) * H * 0.5,
      vx: 0, vy: 0,
    }));

    const getNode = (id: string) => nodesRef.current.find(n => n.id === id);

    const tick = () => {
      const nodes = nodesRef.current;

      // Force simulation
      nodes.forEach(n => {
        // Gravity to center
        n.vx += (W / 2 - n.x) * 0.003;
        n.vy += (H / 2 - n.y) * 0.003;

        // Repulsion between nodes
        nodes.forEach(m => {
          if (m === n) return;
          const dx = n.x - m.x, dy = n.y - m.y;
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 1200 / (d * d);
          n.vx += (dx / d) * force;
          n.vy += (dy / d) * force;
        });

        n.vx *= 0.85; n.vy *= 0.85;
        n.x  += n.vx;  n.y  += n.vy;
        n.x = Math.max(n.r + 10, Math.min(W - n.r - 10, n.x));
        n.y = Math.max(n.r + 10, Math.min(H - n.r - 10, n.y));
      });

      // Edge spring forces
      GRAPH_EDGES.forEach(e => {
        const src = getNode(e.source), tgt = getNode(e.target);
        if (!src || !tgt) return;
        const dx = tgt.x - src.x, dy = tgt.y - src.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const target = 120, diff = (d - target) * 0.05 * e.strength;
        src.vx += (dx / d) * diff; src.vy += (dy / d) * diff;
        tgt.vx -= (dx / d) * diff; tgt.vy -= (dy / d) * diff;
      });

      ctx.clearRect(0, 0, W, H);

      // Draw edges
      GRAPH_EDGES.forEach(e => {
        const src = getNode(e.source), tgt = getNode(e.target);
        if (!src || !tgt) return;
        const isHovEdge = hovered === e.source || hovered === e.target;
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.strokeStyle = isHovEdge
          ? `rgba(${isLight ? "0,120,212" : "124,58,237"},0.6)`
          : `rgba(${isLight ? "0,0,0" : "255,255,255"},0.1)`;
        ctx.lineWidth = isHovEdge ? 1.5 : 0.8;
        ctx.stroke();

        // Edge label at midpoint
        if (isHovEdge) {
          const mx = (src.x + tgt.x) / 2, my = (src.y + tgt.y) / 2;
          ctx.font = "9px Inter, sans-serif";
          ctx.fillStyle = isLight ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.4)";
          ctx.textAlign = "center";
          ctx.fillText(e.label, mx, my - 4);
        }
      });

      // Draw nodes
      nodes.forEach(n => {
        const color = TYPE_COLORS[n.type];
        const isHov = hovered === n.id;
        const r = isHov ? n.r * 1.15 : n.r;

        // Glow
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 2.5);
        grd.addColorStop(0, color + (isHov ? "35" : "15"));
        grd.addColorStop(1, color + "00");
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Node circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = isLight
          ? (isHov ? color + "20" : "rgba(255,255,255,0.9)")
          : (isHov ? color + "20" : "rgba(8,15,30,0.9)");
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = isHov ? 2.5 : 1.5;
        ctx.stroke();

        // Emoji icon
        ctx.font = `${r * 0.7}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(TYPE_ICONS[n.type], n.x, n.y - 2);

        // Label below
        ctx.font = "bold 9px Inter, sans-serif";
        ctx.fillStyle = isLight ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.7)";
        ctx.textBaseline = "top";
        ctx.fillText(n.label, n.x, n.y + r + 4);
      });

      animRef.current = requestAnimationFrame(tick);
    };

    tick();
    return () => cancelAnimationFrame(animRef.current);
  }, [isLight, hovered]);

  const handleMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hit = nodesRef.current.find(n => {
      const dx = n.x - mx, dy = n.y - my;
      return Math.sqrt(dx * dx + dy * dy) < n.r + 4;
    });
    setHovered(hit?.id ?? null);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-crosshair"
      onMouseMove={handleMove}
      onMouseLeave={() => setHovered(null)}
    />
  );
}

export function KnowledgeGraphSection() {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";

  const LEGEND = Object.entries(TYPE_COLORS).map(([type, color]) => ({
    type, color, label: type.charAt(0).toUpperCase() + type.slice(1),
    count: GRAPH_NODES.filter(n => n.type === type).length,
  }));

  return (
    <section id="knowledge-graph" ref={ref} className="section-padding relative overflow-hidden">
      <div className="container-max">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          {/* Left text */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="lg:col-span-5"
          >
            <span className="section-label mb-5 inline-flex"><Network size={10} /> Evidence Intelligence Graph</span>
            <h2 className="section-heading mt-4 mb-5">
              See How Events{" "}
              <span className="gradient-text">Connect</span>
            </h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: "var(--text-muted)" }}>
              InsightX AI automatically builds a knowledge graph linking every person, vehicle, event, and location.
              See hidden relationships that human review would miss.
            </p>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2.5 mb-8">
              {LEGEND.map(({ type, color, label, count }) => (
                <div key={type} className="ms-card p-3 flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: color + "15", border: `1px solid ${color}25` }}>
                    <span className="text-xs">{TYPE_ICONS[type as GNode["type"]]}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>{label}</p>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{count} detected</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Link href="/auth?mode=register" className="btn-primary px-5 py-2.5 gap-2 shadow-glow-sm">
                Explore Evidence Graph <ChevronRight size={13} />
              </Link>
            </div>
          </motion.div>

          {/* Right: interactive graph */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="lg:col-span-7"
          >
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="dot-live" />
                  <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>
                    Case INV-2847 — Evidence Graph
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-[10px]" style={{ color: "var(--text-muted)" }}>
                  <span className="flex items-center gap-1">
                    <Users size={10} /> {GRAPH_NODES.length} Entities
                  </span>
                  <span className="flex items-center gap-1">
                    <Network size={10} /> {GRAPH_EDGES.length} Relations
                  </span>
                </div>
              </div>
              <div className="relative rounded-xl overflow-hidden" style={{ height: "380px", background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                <KnowledgeCanvas isLight={isLight} />
                <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg text-[10px]"
                  style={{ background: "var(--acrylic-bg)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                  Hover nodes to explore relationships
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2 mt-3">
                {LEGEND.map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--text-muted)" }}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
