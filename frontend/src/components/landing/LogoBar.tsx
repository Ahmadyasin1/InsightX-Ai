"use client";

import { motion } from "framer-motion";

const CLIENTS = [
  "Fortune 500 Security Teams", "Insurance Investigators",
  "Smart City Operations", "University Safety", "Retail Analytics",
  "Corporate Compliance", "Law Enforcement Support", "Healthcare Security",
];

export function LogoBar() {
  return (
    <section className="py-16 border-y border-border overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <p className="text-center text-xs font-medium text-muted uppercase tracking-widest">
          Trusted by teams in
        </p>
      </div>
      <div className="relative">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="flex gap-12 whitespace-nowrap"
        >
          {[...CLIENTS, ...CLIENTS].map((client, i) => (
            <div key={i} className="flex items-center gap-3 flex-shrink-0">
              <div className="w-5 h-5 rounded-md bg-primary/20 border border-primary/20" />
              <span className="text-sm font-medium text-muted">{client}</span>
            </div>
          ))}
        </motion.div>
        <div className="absolute left-0 top-0 bottom-0 w-24 pointer-events-none"
          style={{ background: "linear-gradient(to right, #050816, transparent)" }} />
        <div className="absolute right-0 top-0 bottom-0 w-24 pointer-events-none"
          style={{ background: "linear-gradient(to left, #050816, transparent)" }} />
      </div>
    </section>
  );
}
