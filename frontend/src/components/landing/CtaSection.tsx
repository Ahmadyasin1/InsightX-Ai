"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";

export function CtaSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section className="py-32 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-glow-purple opacity-50" />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.2), transparent)" }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-8">
            <Zap size={14} className="text-primary-400" />
            <span className="text-sm text-primary-300 font-medium">Ready to Transform Your Investigations?</span>
          </div>

          <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
            Upload Any Video.<br />
            <span className="gradient-text">Get Intelligence Instantly.</span>
          </h2>

          <p className="text-xl text-muted mb-12 max-w-2xl mx-auto leading-relaxed">
            Join security teams, insurance companies, and investigation units using InsightX AI
            to turn hours of footage into minutes of intelligence.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth?mode=register" className="btn-primary px-10 py-4 text-base gap-2 w-full sm:w-auto justify-center">
              Start Free Investigation
              <ArrowRight size={18} />
            </Link>
            <a href="mailto:demo@insightx.ai" className="btn-secondary px-10 py-4 text-base w-full sm:w-auto justify-center">
              Schedule a Demo
            </a>
          </div>

          <p className="text-sm text-muted mt-6">
            No credit card required · Up and running in 60 seconds · Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
}
