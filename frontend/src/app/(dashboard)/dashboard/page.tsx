"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, animate } from "framer-motion";
import {
  FolderOpen, FileVideo, AlertTriangle, BarChart3,
  ArrowRight, Zap, Brain, Activity, TrendingUp, TrendingDown,
  Clock, Shield, CheckCircle2, Plus, ChevronRight,
  Play, Cpu, Waves, Eye, RefreshCcw, Sparkles,
  Network, Users, Target, Globe,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import { formatRelative } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  ActivityChart, AIModelRadar, LiveAlertFeed, AgentStatusGrid,
} from "@/components/dashboard/MissionControlWidgets";

interface Investigation {
  id: string; title: string; case_number: string;
  status: string; priority: string; incident_score?: number; updated_at: string;
}

/* ── Animated counter ── */
function AnimatedNumber({ to, prefix = "", suffix = "" }: { to: number; prefix?: string; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const c = animate(0, to, {
      duration: 1.2, ease: "easeOut",
      onUpdate: v => setVal(Math.round(v)),
    });
    return () => c.stop();
  }, [to]);
  return <span>{prefix}{val}{suffix}</span>;
}

/* ── Stat card with trend ── */
function StatCard({ label, value, icon: Icon, color, trend, delay = 0 }: {
  label: string; value: number; icon: React.ElementType; color: string; trend?: number; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
      className="ms-card group cursor-default"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110"
          style={{ background: `${color}12`, border: `1px solid ${color}22` }}>
          <Icon size={17} style={{ color }} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}>
            {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-black tracking-tight mb-0.5" style={{ color: "var(--text)" }}>
        <AnimatedNumber to={value} />
      </div>
      <div className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label}</div>
    </motion.div>
  );
}

/* ── Priority badge ── */
function PriorityBadge({ p }: { p: string }) {
  const cls: Record<string, string> = {
    critical: "badge-critical", high: "badge-high", medium: "badge-medium", low: "badge-low",
  };
  return <span className={cls[p] ?? "badge-info"}>{p}</span>;
}

/* ── AI Models list ── */
const AI_MODELS = [
  { name: "Groq Llama 3.3",  task: "Primary AI Chat",       icon: Brain,          status: "active" },
  { name: "Gemini Flash",    task: "Chat Fallback",         icon: Sparkles,       status: "active" },
  { name: "HuggingFace",     task: "VLM + Chat Fallback",   icon: Globe,          status: "active" },
  { name: "faster-whisper",  task: "Speech Recognition",    icon: Waves,          status: "active" },
  { name: "YOLOv8s-seg",     task: "Object Detection",      icon: Eye,            status: "active" },
  { name: "ByteTrack",       task: "Multi-Object Tracking", icon: Users,          status: "active" },
];

/* ── Quick action card ── */
function QuickAction({ label, href, icon: Icon, color, desc }: {
  label: string; href: string; icon: React.ElementType; color: string; desc: string;
}) {
  return (
    <Link href={href}
      className="ms-card p-4 flex items-start gap-3 group hover:!border-[color:var(--primary)] transition-all cursor-pointer">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110"
        style={{ background: `${color}12`, border: `1px solid ${color}22` }}>
        <Icon size={15} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--text)" }}>{label}</p>
        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{desc}</p>
      </div>
      <ArrowRight size={12} className="ml-auto mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all"
        style={{ color: "var(--primary)" }} />
    </Link>
  );
}

interface DashboardStats {
  total_investigations: number;
  total_evidence: number;
  total_alerts: number;
  total_reports: number;
  total_analyses?: number;
}

export default function DashboardPage() {
  const { user, _hydrated, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ total_investigations: 0, total_evidence: 0, total_alerts: 0, total_reports: 0 });
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [fetchError, setFetchError]   = useState<string | null>(null);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.replace("/auth");
  }, [_hydrated, isAuthenticated, router]);

  const fetchData = async () => {
    if (!isAuthenticated) return;
    setRefreshing(true);
    setFetchError(null);
    try {
      const [invRes, statsRes] = await Promise.all([
        api.get("/api/v1/investigations?page=1&page_size=6"),
        api.get("/api/v1/dashboard/stats"),
      ]);
      setInvestigations(invRes.data.items ?? []);
      setStats(statsRes.data);
    } catch {
      setFetchError("Could not load dashboard data. Check that the backend is running.");
      toast.error("Failed to load dashboard data");
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, [isAuthenticated]);

  const firstName = user?.full_name?.split(" ")[0] ?? "Investigator";
  const h = new Date().getHours();
  const greeting = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";

  if (_hydrated && !isAuthenticated) return null;

  return (
    <div className="p-5 lg:p-7 space-y-6 max-w-[1400px] mx-auto">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="flex items-center justify-between">
        <div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {greeting}, <span className="font-semibold" style={{ color: "var(--text)" }}>{firstName}</span>
          </p>
          <h1 className="text-xl font-black tracking-tight mt-0.5" style={{ color: "var(--text)" }}>
            Mission Control
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} disabled={refreshing}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
            <motion.div animate={refreshing ? { rotate: 360 } : {}}
              transition={{ duration: 1, repeat: refreshing ? Infinity : 0, ease: "linear" }}>
              <RefreshCcw size={13} />
            </motion.div>
          </button>
          <Link href="/investigations" className="btn-primary text-xs px-3.5 py-2 gap-1.5 shadow-glow-sm">
            <Plus size={12} /> New Investigation
          </Link>
        </div>
      </motion.div>

      {/* ── System status banner ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="flex items-center gap-3 px-4 py-3 rounded-2xl"
        style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
        <div className="dot-live" />
        <p className="text-xs font-medium text-[#10B981]">InsightX AI engine ready · Detectra v7 pipeline active</p>
        <div className="ml-auto flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
          <Clock size={11} /> Last sync: just now
        </div>
      </motion.div>

      {fetchError && (
        <div className="px-4 py-3 rounded-2xl text-xs"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444" }}>
          {fetchError}
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5" data-tour="stats">
        <StatCard label="Investigations" value={stats.total_investigations} icon={FolderOpen}     color="#7C3AED" delay={0}    />
        <StatCard label="Evidence Files" value={stats.total_evidence}       icon={FileVideo}      color="#0078D4" delay={0.06} />
        <StatCard label="Active Alerts"  value={stats.total_alerts}         icon={AlertTriangle}  color="#EF4444" delay={0.12} />
        <StatCard label="Analyses Done"  value={stats.total_analyses ?? stats.total_reports} icon={BarChart3} color="#10B981" delay={0.18} />
      </div>

      {/* ── Main grid ── */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Investigations list */}
        <div className="lg:col-span-2 space-y-3" data-tour="investigations">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold" style={{ color: "var(--text)" }}>Recent Investigations</h2>
            <Link href="/investigations" className="text-xs flex items-center gap-1 transition-colors"
              style={{ color: "var(--primary)" }}>
              View all <ChevronRight size={11} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="ms-card shimmer h-[72px]" />
              ))}
            </div>
          ) : investigations.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ms-card flex flex-col items-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "var(--primary-glow)", border: "1px solid var(--primary-200)" }}>
                <FolderOpen size={22} style={{ color: "var(--primary)" }} />
              </div>
              <p className="text-sm font-bold mb-1" style={{ color: "var(--text)" }}>No investigations yet</p>
              <p className="text-xs mb-5 max-w-xs" style={{ color: "var(--text-muted)" }}>
                Create your first investigation to start analyzing video evidence with 12 AI models.
              </p>
              <Link href="/investigations" className="btn-primary text-xs px-4 py-2 gap-1.5 shadow-glow-sm">
                <Plus size={12} /> Create First Investigation
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {investigations.map((inv, i) => (
                <motion.div key={inv.id}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.05 }}>
                  <Link href={`/investigations/${inv.id}`}
                    className="ms-card flex items-center gap-3.5 p-4 group cursor-pointer">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "var(--primary-glow)", border: "1px solid var(--primary-200)" }}>
                      <FolderOpen size={14} style={{ color: "var(--primary)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>{inv.title}</p>
                        <PriorityBadge p={inv.priority} />
                      </div>
                      <div className="flex items-center gap-2.5 text-[10px]" style={{ color: "var(--text-subtle)" }}>
                        <span className="font-mono">{inv.case_number}</span>
                        <span>·</span>
                        <span className="capitalize">{inv.status}</span>
                        <span>·</span>
                        <span>{formatRelative(inv.updated_at)}</span>
                      </div>
                    </div>
                    {inv.incident_score != null && (
                      <div className="text-right flex-shrink-0">
                        <span className="text-sm font-black"
                          style={{ color: inv.incident_score > 70 ? "#EF4444" : inv.incident_score > 40 ? "#F59E0B" : "#10B981" }}>
                          {Math.round(inv.incident_score)}
                        </span>
                        <p className="text-[9px]" style={{ color: "var(--text-subtle)" }}>score</p>
                      </div>
                    )}
                    <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                      style={{ color: "var(--primary)" }} />
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* Platform metrics */}
          <div className="grid grid-cols-4 gap-2.5 pt-2">
            {[["Detectra v7", "Video Engine", "#7C3AED"], ["Multi-AI", "Chat Providers", "#0078D4"], ["YOLOv8", "Detection", "#10B981"], ["Whisper", "Transcription", "#F59E0B"]].map(([v, l, c]) => (
              <div key={l} className="ms-card p-3 text-center">
                <p className="text-lg font-black" style={{ color: c }}>{v}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{l}</p>
              </div>
            ))}
          </div>
          {/* Intelligence charts row */}
          <div className="grid sm:grid-cols-2 gap-3 pt-2">
            <ActivityChart stats={stats} />
            <AIModelRadar />
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <LiveAlertFeed />

          {/* AI Engine status */}
          <div className="ms-card p-4" data-tour="ai-engine">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>AI Engine</h3>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
                <div className="dot-live" style={{ width: "6px", height: "6px" }} />
                <span className="text-[10px] text-[#10B981] font-medium">All Online</span>
              </div>
            </div>
            <div className="space-y-2.5">
              {AI_MODELS.map((m, i) => (
                <motion.div key={m.name}
                  initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.06 }}
                  className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                    <m.icon size={11} style={{ color: "var(--primary)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold truncate" style={{ color: "var(--text)" }}>{m.name}</p>
                    <p className="text-[9px] truncate" style={{ color: "var(--text-muted)" }}>{m.task}</p>
                  </div>
                  <CheckCircle2 size={11} className="text-[#10B981] flex-shrink-0" />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div data-tour="quick-actions">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Quick Actions</h3>
            <div className="space-y-2">
              <QuickAction label="Upload Evidence"     href="/evidence"    icon={FileVideo}     color="#0078D4" desc="Add video footage to analyze" />
              <QuickAction label="Ask AI Investigator" href="/chat"        icon={Brain}         color="#7C3AED" desc="Chat with your evidence" />
              <QuickAction label="Generate Report"     href="/reports"     icon={BarChart3}     color="#10B981" desc="Export forensic report" />
              <QuickAction label="Evidence Timeline"   href="/timeline"    icon={Clock}         color="#F59E0B" desc="View chronological events" />
            </div>
          </div>

          <AgentStatusGrid />

          {/* Security */}
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
            style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.12)" }}>
            <Shield size={15} className="text-[#10B981] flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>Secure Session Active</p>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>All data encrypted · Private deployment</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
