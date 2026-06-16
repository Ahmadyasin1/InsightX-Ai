"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Clock, Eye, FileX, AlertTriangle } from "lucide-react";

const PROBLEMS = [
  {
    icon: Clock,
    title: "Investigators waste 40+ hours per case",
    description: "Manually reviewing hours of footage to find seconds of critical evidence is unsustainable.",
    stat: "40+ hrs",
  },
  {
    icon: Eye,
    title: "Human reviewers miss 30% of incidents",
    description: "Fatigue, blind spots, and volume make manual review unreliable for security-critical operations.",
    stat: "30% missed",
  },
  {
    icon: FileX,
    title: "Evidence is scattered across siloed systems",
    description: "Video, audio, reports, and timelines live in disconnected tools with no unified intelligence layer.",
    stat: "5+ tools",
  },
  {
    icon: AlertTriangle,
    title: "Reports take days to generate manually",
    description: "Building incident reports from raw footage requires expertise, time, and is prone to human error.",
    stat: "3-5 days",
  },
];

export function ProblemSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section className="py-32 relative" ref={ref}>
      {/* Divider line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-transparent to-border" />

      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-danger mb-4 tracking-widest uppercase">The Problem</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
            Video Intelligence Is Broken
          </h2>
          <p className="text-lg text-muted max-w-xl mx-auto">
            Traditional video review is slow, expensive, inconsistent, and leaves too much intelligence on the table.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PROBLEMS.map((problem, i) => {
            const Icon = problem.icon;
            return (
              <motion.div
                key={problem.title}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="flex gap-5 p-6 rounded-2xl border border-border/50 bg-danger/5 hover:bg-danger/8 transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-danger/10 border border-danger/20 flex items-center justify-center flex-shrink-0">
                  <Icon size={20} className="text-danger" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-white text-sm">{problem.title}</h3>
                    <span className="text-xs font-bold text-danger bg-danger/10 px-2 py-0.5 rounded-md">
                      {problem.stat}
                    </span>
                  </div>
                  <p className="text-sm text-muted leading-relaxed">{problem.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
