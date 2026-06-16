"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import {
  Eye, Users, Car, AudioLines, Brain, FileSearch,
  GitBranch, MessageSquare, Shield, Map, BarChart3, Zap
} from "lucide-react";

const FEATURES = [
  {
    icon: Eye,
    title: "Multi-Object Detection",
    description: "YOLOv8s-seg identifies and tracks persons, vehicles, and 80+ object classes with 99.2% accuracy.",
    color: "#7C3AED",
    category: "Detection",
  },
  {
    icon: Users,
    title: "Person Re-Identification",
    description: "Track the same individual across camera cuts, time gaps, and appearance changes using deep embeddings.",
    color: "#06B6D4",
    category: "Tracking",
  },
  {
    icon: Brain,
    title: "Anomaly Intelligence",
    description: "12-class anomaly detection — fights, falls, loitering, crowd formation, tailgating, and more.",
    color: "#EF4444",
    category: "AI",
  },
  {
    icon: AudioLines,
    title: "Audio Transcription",
    description: "faster-whisper with Silero VAD transcribes speech, detects screams, gunshots, and critical audio events.",
    color: "#22C55E",
    category: "Audio",
  },
  {
    icon: GitBranch,
    title: "Evidence Timeline",
    description: "Automatic chronological reconstruction of events with timestamps, entities, and severity scores.",
    color: "#F59E0B",
    category: "Intelligence",
  },
  {
    icon: FileSearch,
    title: "Evidence Graph",
    description: "Visual relationship map between persons, vehicles, objects, locations, and events across time.",
    color: "#7C3AED",
    category: "Visualization",
  },
  {
    icon: MessageSquare,
    title: "AI Chat Investigator",
    description: "Ask natural language questions about your evidence. Get precise, cited answers powered by Claude.",
    color: "#06B6D4",
    category: "AI",
  },
  {
    icon: BarChart3,
    title: "Risk Scoring",
    description: "Automated incident severity scoring with risk classification — from routine to critical priority.",
    color: "#EF4444",
    category: "Intelligence",
  },
  {
    icon: Shield,
    title: "Executive Reports",
    description: "AI-generated PDF reports with executive brief, evidence timeline, and actionable recommendations.",
    color: "#22C55E",
    category: "Reports",
  },
  {
    icon: Map,
    title: "Scene Understanding",
    description: "CLIP-powered scene context classification to understand environment and activity patterns.",
    color: "#F59E0B",
    category: "Detection",
  },
  {
    icon: Car,
    title: "Vehicle Intelligence",
    description: "Vehicle detection, tracking, and identification with color, type, and movement analysis.",
    color: "#7C3AED",
    category: "Tracking",
  },
  {
    icon: Zap,
    title: "Real-Time Processing",
    description: "WebSocket-powered live progress updates. Sub-2-minute analysis for standard-length footage.",
    color: "#06B6D4",
    category: "Performance",
  },
];

export function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section id="features" className="py-32 relative" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <span className="text-xs font-medium text-primary-300">12 AI Models Working Together</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
            Every Capability You Need<br />
            <span className="gradient-text">Built Into One Platform</span>
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            From detection to reporting, InsightX AI handles the entire investigation workflow
            with state-of-the-art AI models working in concert.
          </p>
        </motion.div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="card-hover group relative overflow-hidden"
              >
                {/* Background glow */}
                <div
                  className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
                  style={{ background: `radial-gradient(circle, ${feature.color}20, transparent)` }}
                />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${feature.color}15`, border: `1px solid ${feature.color}30` }}
                    >
                      <Icon size={18} style={{ color: feature.color }} />
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-md bg-white/5 text-muted">
                      {feature.category}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
