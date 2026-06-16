"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";
import { AlertTriangle, Activity, Radio } from "lucide-react";
import { api } from "@/lib/api";

interface Alert {
  id: string;
  type: string;
  severity: string;
  description: string;
  timestamp: number;
  investigation_title?: string;
  confidence?: number;
}

const PIPELINE_MODULES = [
  { subject: "Detection", A: 100 },
  { subject: "Tracking", A: 100 },
  { subject: "Speech", A: 100 },
  { subject: "Anomaly", A: 100 },
  { subject: "Reasoning", A: 100 },
  { subject: "Reports", A: 100 },
];

export function ActivityChart({ stats }: { stats: { total_investigations: number; total_evidence: number; total_alerts: number } }) {
  const data = [
    { label: "Cases", value: stats.total_investigations, fill: "#0078D4" },
    { label: "Evidence", value: stats.total_evidence, fill: "#7C3AED" },
    { label: "Alerts", value: stats.total_alerts, fill: "#EF4444" },
  ];

  return (
    <div className="ms-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          Portfolio Totals
        </h3>
        <Activity size={13} style={{ color: "var(--primary)" }} />
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="totGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0078D4" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#0078D4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
          <YAxis hide allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 12, fontSize: 11,
            }}
          />
          <Area type="monotone" dataKey="value" stroke="#0078D4" fill="url(#totGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AIModelRadar() {
  return (
    <div className="ms-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          Pipeline Modules
        </h3>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <RadarChart data={PIPELINE_MODULES}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: "var(--text-muted)" }} />
          <Radar dataKey="A" stroke="#0078D4" fill="#0078D4" fillOpacity={0.15} strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
      <p className="text-[9px] text-center mt-1" style={{ color: "var(--text-muted)" }}>
        Active when evidence is analyzed
      </p>
    </div>
  );
}

export function LiveAlertFeed() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/v1/alerts/dashboard?limit=5")
      .then(r => setAlerts(r.data.alerts ?? []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  const severityColor: Record<string, string> = {
    critical: "#EF4444", high: "#F97316", medium: "#F59E0B", low: "#10B981",
  };

  return (
    <div className="ms-card p-4" data-tour="alerts">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          Live Alert Feed
        </h3>
        <div className="flex items-center gap-1.5">
          <Radio size={10} className="text-[#EF4444]" />
          <span className="text-[10px] text-[#EF4444] font-medium">Live</span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="shimmer h-12 rounded-xl" />)}
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-8">
          <AlertTriangle size={20} className="mx-auto mb-2" style={{ color: "var(--text-subtle)" }} />
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>No active alerts — all clear</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <motion.div key={alert.id}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-start gap-3 p-3 rounded-xl transition-all hover:scale-[1.01]"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                style={{ background: severityColor[alert.severity] ?? "#F59E0B" }} />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold truncate" style={{ color: "var(--text)" }}>
                  {alert.type ?? "Anomaly Detected"}
                </p>
                <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>
                  {alert.description}
                </p>
                {alert.investigation_title && (
                  <p className="text-[9px] mt-0.5" style={{ color: "var(--text-subtle)" }}>
                    {alert.investigation_title}
                  </p>
                )}
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded badge-${alert.severity}`}>
                {alert.severity}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AgentStatusGrid() {
  const agents = [
    { name: "Video Analysis",   status: "ready", task: "Detectra v7 on upload" },
    { name: "Report Export",    status: "ready", task: "PDF · JSON · CSV" },
    { name: "AI Investigator", status: "ready", task: "Groq · Gemini · HuggingFace" },
    { name: "Alert Engine",     status: "ready", task: "High/critical anomaly surfacing" },
  ];

  return (
    <div className="ms-card p-4">
      <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
        Agentic AI Layer
      </h3>
      <div className="grid grid-cols-1 gap-2">
        {agents.map((agent, i) => (
          <motion.div key={agent.name}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
            className="flex items-center gap-3 p-2.5 rounded-xl"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <div className={`w-1.5 h-1.5 rounded-full`}
              style={{ background: "#10B981" }} />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold" style={{ color: "var(--text)" }}>{agent.name}</p>
              <p className="text-[9px]" style={{ color: "var(--text-muted)" }}>{agent.task}</p>
            </div>
            <span className="text-[9px] font-medium capitalize px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(16,185,129,0.1)",
                color: "#10B981",
              }}>
              {agent.status}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
