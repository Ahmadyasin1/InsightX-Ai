"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "What video formats does InsightX AI support?",
    a: "InsightX AI supports all major video formats including MP4, AVI, MOV, MKV, WebM, and 3GPP. Files can be up to 4GB in size. Both standard definition and up to 4K resolution are supported.",
  },
  {
    q: "How long does video analysis take?",
    a: "Analysis time depends on video length and content complexity. Typically: ~12 seconds for 1-minute videos, ~90 seconds for 10-minute videos, and ~8 minutes for 1-hour recordings. GPU-accelerated deployments run 4-6x faster.",
  },
  {
    q: "Do I need an internet connection for analysis?",
    a: "No. InsightX AI runs entirely on-premise. All AI models (YOLOv8, faster-whisper, YAMNet, etc.) are self-hosted. Only the AI Chat Investigator feature requires an Anthropic API key. Everything else is 100% offline.",
  },
  {
    q: "What AI models power InsightX AI?",
    a: "InsightX AI uses 12+ AI models: YOLOv8s-seg (object detection), ByteTrack (multi-object tracking), YOLOv8n-pose + cadence FFT (action recognition), faster-whisper (speech transcription), YAMNet (audio events), CLIP (scene understanding), and a custom CrossModalTransformer for multimodal fusion.",
  },
  {
    q: "Can I analyze multiple camera feeds for one incident?",
    a: "Yes — multi-camera reconstruction is a core feature. Create an investigation and upload multiple videos from different angles. InsightX AI will analyze each independently and synthesize a unified incident narrative with a single timeline and incident score.",
  },
  {
    q: "How is my evidence data secured?",
    a: "All data is stored on your infrastructure — nothing is sent to external servers (except the AI Chat feature which sends only text context, not video). Authentication uses JWT tokens, all API endpoints are authenticated, and data is stored in PostgreSQL with role-based access.",
  },
  {
    q: "Can I export reports for legal or insurance use?",
    a: "Yes. InsightX AI generates professional-grade PDF reports with executive brief, evidence timeline, anomaly details, entity counts, and chain-of-custody metadata. JSON and CSV exports are also available for integration with other systems.",
  },
  {
    q: "Is on-premise deployment available?",
    a: "Absolutely. InsightX AI is designed for on-premise first. Use Docker Compose to spin up the full stack in minutes on any Linux server. GPU-accelerated deployment is supported via NVIDIA CUDA for maximum throughput.",
  },
];

function FaqItem({ faq, index }: { faq: typeof FAQS[0]; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border-b border-border last:border-0"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-4 py-5 text-left group"
      >
        <span className="text-sm font-semibold text-white group-hover:text-primary-300 transition-colors">
          {faq.q}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 mt-0.5"
        >
          <ChevronDown size={16} className="text-muted" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="text-sm text-muted leading-relaxed pb-5">{faq.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FaqSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section id="faq" className="py-32 relative" ref={ref}>
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-primary-400 mb-4 tracking-widest uppercase">FAQ</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
            Questions & Answers
          </h2>
          <p className="text-lg text-muted">
            Everything you need to know about InsightX AI.
          </p>
        </motion.div>

        <div className="card">
          {inView && FAQS.map((faq, i) => (
            <FaqItem key={i} faq={faq} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
