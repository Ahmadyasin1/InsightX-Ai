"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Brain, Clock3, Network, MessageSquare, ChevronRight } from "lucide-react";

const SHOWCASE_TABS = [
  {
    id: "chat",
    icon: MessageSquare,
    label: "AI Chat",
    title: "Ask Your Evidence Anything",
    description: "Natural language interrogation of video evidence powered by Claude. Get precise, cited answers about persons, events, and timelines.",
    demo: {
      messages: [
        { role: "user", text: "Who was near the main entrance between 2:00 PM and 2:30 PM?" },
        { role: "ai", text: "Based on the evidence analysis: **Person #3 (Track ID: T-007)** was detected near the main entrance from 14:02:15 to 14:28:44. They wore a dark jacket and appeared to pace the area 6 times. **Person #11 (Track ID: T-019)** also passed through at 14:15:33, carrying a bag. No other persons were detected in this zone during the specified window." },
        { role: "user", text: "Was there any suspicious behavior detected?" },
        { role: "ai", text: "Yes — **2 anomalies** were flagged in that window:\n1. **Loitering (High severity)** at 14:02:15 — Person T-007 remained stationary for 26+ minutes without apparent purpose.\n2. **Tailgating (Medium)** at 14:17:22 — T-019 entered through a door immediately behind an authorized personnel." },
      ],
    },
  },
  {
    id: "timeline",
    icon: Clock3,
    label: "Timeline",
    title: "Automatic Event Reconstruction",
    description: "Every detected event is automatically timestamped and sequenced into a forensic-grade incident timeline.",
    demo: {
      events: [
        { time: "00:00:15", type: "Person Detected", desc: "Person #1 (T-001) enters frame", severity: "low" },
        { time: "00:02:33", type: "Vehicle Detected", desc: "Red sedan (T-V04) parks at entrance", severity: "low" },
        { time: "00:07:14", type: "Loitering Alert", desc: "T-001 stationary >5 min in restricted zone", severity: "high" },
        { time: "00:11:50", type: "Fight Detection", desc: "Physical altercation detected — 3 persons", severity: "critical" },
        { time: "00:13:02", type: "Audio Event", desc: "Screaming detected (89dB peak)", severity: "high" },
        { time: "00:15:47", type: "Crowd Dispersal", desc: "Scene clears — 4 persons exit rapidly", severity: "medium" },
      ],
    },
  },
  {
    id: "graph",
    icon: Network,
    label: "Evidence Graph",
    title: "Visual Relationship Mapping",
    description: "See how people, vehicles, objects and events connect across time and space in a visual evidence graph.",
    demo: {
      nodes: [
        { id: "p1", label: "Person #1", type: "person", x: 20, y: 30 },
        { id: "p2", label: "Person #2", type: "person", x: 70, y: 20 },
        { id: "v1", label: "Vehicle X", type: "vehicle", x: 50, y: 70 },
        { id: "e1", label: "Incident\n00:11:50", type: "event", x: 35, y: 55 },
        { id: "l1", label: "Entrance\nZone", type: "location", x: 80, y: 60 },
      ],
      edges: [
        { from: "p1", to: "e1" }, { from: "p2", to: "e1" },
        { from: "v1", to: "l1" }, { from: "p1", to: "l1" }, { from: "e1", to: "l1" },
      ],
    },
  },
  {
    id: "reasoning",
    icon: Brain,
    label: "AI Reasoning",
    title: "Executive Intelligence Brief",
    description: "AI synthesizes all evidence into a professional executive brief with threat assessment and recommendations.",
    demo: {
      brief: `EXECUTIVE INTELLIGENCE BRIEF
Case: IX-00847291 | Risk Level: HIGH | Incident Score: 78/100

EXECUTIVE SUMMARY
Analysis of the submitted 18-minute footage reveals a sequence of escalating events beginning at T+7:14. The primary incident — a physical altercation — appears premeditated based on the 7-minute loitering period prior to engagement.

KEY FINDINGS
• 3 persons directly involved in the altercation (T-001, T-008, T-012)
• 1 vehicle (Red sedan) arrived 2 min before incident onset
• Audio analysis confirms verbal confrontation began at T+9:45
• Scene cleared in under 4 minutes — suggests coordinated exit

RECOMMENDED ACTIONS
1. Cross-reference vehicle registration with parking records
2. Pull additional footage from Camera 3 (east corridor)
3. Interview witness T-015 who observed from 3m distance`,
    },
  },
];

const NODE_COLORS: Record<string, string> = {
  person: "#7C3AED",
  vehicle: "#06B6D4",
  event: "#EF4444",
  location: "#22C55E",
};

export function ShowcaseSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  const [activeTab, setActiveTab] = useState("chat");

  const tab = SHOWCASE_TABS.find((t) => t.id === activeTab)!;
  const Icon = tab.icon;

  return (
    <section id="interactive-demo" className="py-32 relative" ref={ref}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(180deg, transparent, rgba(124,58,237,0.03) 50%, transparent)" }} />

      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-primary-400 mb-4 tracking-widest uppercase">Platform Preview</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
            See InsightX AI<br />
            <span className="gradient-text">In Action</span>
          </h2>
          <p className="text-lg text-muted max-w-xl mx-auto">
            Explore the four flagship capabilities that make InsightX AI the most powerful
            video investigation platform available.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Tab selector */}
          <div className="space-y-2">
            {SHOWCASE_TABS.map((t) => {
              const TabIcon = t.icon;
              return (
                <motion.button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: SHOWCASE_TABS.findIndex((s) => s.id === t.id) * 0.1 }}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all duration-200 ${
                    activeTab === t.id
                      ? "bg-primary/15 border border-primary/30"
                      : "border border-border hover:border-border-strong hover:bg-white/4"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    activeTab === t.id ? "bg-primary text-white" : "bg-white/5 text-muted"
                  }`}>
                    <TabIcon size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.label}</div>
                    <div className="text-xs text-muted line-clamp-1">{t.description.slice(0, 50)}...</div>
                  </div>
                  {activeTab === t.id && (
                    <ChevronRight size={14} className="text-primary-400 ml-auto flex-shrink-0" />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Demo panel */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="card border-primary/10 h-full">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
                  <Icon size={17} className="text-primary-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{tab.title}</h3>
                  <p className="text-xs text-muted">{tab.description}</p>
                </div>
              </div>

              {/* Chat demo */}
              {activeTab === "chat" && tab.demo.messages && (
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {tab.demo.messages.map((msg, i) => (
                    <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        msg.role === "user" ? "bg-primary/20 text-primary-300" : "bg-secondary/15 text-secondary"
                      }`}>
                        {msg.role === "user" ? "U" : "AI"}
                      </div>
                      <div className={`max-w-[80%] px-4 py-3 rounded-xl text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary/10 border border-primary/15 text-white rounded-tr-sm"
                          : "bg-surface-3 border border-border text-muted rounded-tl-sm"
                      }`}>
                        <span className="whitespace-pre-line">{msg.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Timeline demo */}
              {activeTab === "timeline" && tab.demo.events && (
                <div className="relative space-y-3">
                  <div className="absolute left-14 top-0 bottom-0 w-px bg-border" />
                  {tab.demo.events.map((event, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <span className="text-xs font-mono text-muted w-12 pt-1.5 flex-shrink-0">{event.time}</span>
                      <div className="relative z-10 flex-shrink-0 mt-2">
                        <div className={`w-2.5 h-2.5 rounded-full border ${
                          event.severity === "critical" ? "bg-red-500/40 border-red-500" :
                          event.severity === "high" ? "bg-orange-500/40 border-orange-400" :
                          event.severity === "medium" ? "bg-yellow-500/40 border-yellow-400" :
                          "bg-green-500/40 border-green-400"
                        }`} />
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold text-white">{event.type}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            event.severity === "critical" ? "bg-red-500/10 text-red-400" :
                            event.severity === "high" ? "bg-orange-500/10 text-orange-400" :
                            event.severity === "medium" ? "bg-yellow-500/10 text-yellow-400" :
                            "bg-green-500/10 text-green-400"
                          }`}>{event.severity}</span>
                        </div>
                        <p className="text-xs text-muted">{event.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Graph demo */}
              {activeTab === "graph" && tab.demo.nodes && (
                <div className="relative h-64 bg-surface-3 rounded-xl overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Edges */}
                    {tab.demo.edges?.map((edge, i) => {
                      const from = tab.demo.nodes!.find((n) => n.id === edge.from)!;
                      const to = tab.demo.nodes!.find((n) => n.id === edge.to)!;
                      return (
                        <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                          stroke="rgba(124,58,237,0.2)" strokeWidth="0.5" />
                      );
                    })}
                    {/* Nodes */}
                    {tab.demo.nodes.map((node) => (
                      <g key={node.id}>
                        <circle cx={node.x} cy={node.y} r={5}
                          fill={`${NODE_COLORS[node.type] || "#94A3B8"}25`}
                          stroke={NODE_COLORS[node.type] || "#94A3B8"} strokeWidth="0.8" />
                        <text x={node.x} y={node.y + 9} textAnchor="middle"
                          fontSize="3.5" fill="#94A3B8">{node.label}</text>
                      </g>
                    ))}
                  </svg>
                  <div className="absolute bottom-3 left-3 flex gap-2 flex-wrap">
                    {Object.entries(NODE_COLORS).map(([type, color]) => (
                      <div key={type} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                        <span className="text-xs text-muted capitalize">{type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reasoning demo */}
              {activeTab === "reasoning" && tab.demo.brief && (
                <div className="bg-surface-3 rounded-xl p-4 text-xs text-muted font-mono leading-relaxed max-h-72 overflow-y-auto whitespace-pre-line">
                  {tab.demo.brief}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
