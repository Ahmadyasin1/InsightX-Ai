"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { LogIn, FolderPlus, Upload, Cpu, Network, Clock3, BarChart3, MessageSquare, FileDown } from "lucide-react";

const STEPS = [
  { icon: LogIn, label: "Sign In", desc: "Secure enterprise authentication" },
  { icon: FolderPlus, label: "Create Case", desc: "Open an investigation" },
  { icon: Upload, label: "Upload Video", desc: "Any format, up to 4GB" },
  { icon: Cpu, label: "AI Analysis", desc: "12 models process in parallel" },
  { icon: Network, label: "Evidence Extraction", desc: "Entities, events, relationships" },
  { icon: Clock3, label: "Timeline Built", desc: "Chronological reconstruction" },
  { icon: BarChart3, label: "Risk Scored", desc: "Incident severity 0-100" },
  { icon: MessageSquare, label: "Ask AI", desc: "Natural language interrogation" },
  { icon: FileDown, label: "Export Report", desc: "PDF, JSON, CSV" },
];

export function WorkflowSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section id="how-it-works" className="py-32 relative" ref={ref}>
      {/* Subtle divider */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(180deg, transparent, rgba(124,58,237,0.03) 50%, transparent)" }} />

      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <p className="text-sm font-medium text-primary-400 mb-4 tracking-widest uppercase">How It Works</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
            9 Steps from Raw Footage<br />
            <span className="gradient-text">to Full Investigation</span>
          </h2>
          <p className="text-lg text-muted max-w-xl mx-auto">
            A complete intelligence workflow in under 2 minutes.
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection line */}
          <div className="absolute top-8 left-16 right-16 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent hidden lg:block" />

          <div className="grid grid-cols-3 md:grid-cols-9 gap-4 lg:gap-0">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: i * 0.07 }}
                  className="flex flex-col items-center text-center gap-3"
                >
                  <motion.div
                    className="relative z-10 w-16 h-16 rounded-2xl border flex items-center justify-center transition-all duration-300"
                    style={{
                      background: `rgba(124,58,237,${0.05 + i * 0.01})`,
                      borderColor: `rgba(124,58,237,${0.2 + i * 0.03})`,
                    }}
                    whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(124,58,237,0.3)" }}
                  >
                    <Icon size={22} className="text-primary-300" />
                    <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
                      {i + 1}
                    </div>
                  </motion.div>
                  <div>
                    <div className="text-xs font-semibold text-white">{step.label}</div>
                    <div className="text-xs text-muted mt-0.5">{step.desc}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
