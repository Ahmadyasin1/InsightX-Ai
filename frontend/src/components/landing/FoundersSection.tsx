"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import { Github, Linkedin, Mail } from "lucide-react";

const FOUNDERS = [
  {
    name: "Ahmad Yasin",
    role: "AI Engineer & Full-Stack Developer",
    bio: "Specializes in multimodal AI systems, computer vision pipelines, and building production-grade machine learning infrastructure. Led the design of the InsightX AI detection and reasoning engine.",
    image: "/ahmad-yasin.png",
    links: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      email: "mianahmadyasin3@gmail.com",
    },
    expertise: ["Computer Vision", "FastAPI", "PyTorch", "React", "System Design"],
  },
  {
    name: "Abdul Rehman",
    role: "AI Engineer & Software Developer",
    bio: "Expert in deep learning model training, video intelligence systems, and scalable backend architectures. Built the multimodal fusion engine and anomaly detection pipeline powering InsightX AI.",
    image: "/abdul-rehman.png",
    links: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      email: "contact@insightx.ai",
    },
    expertise: ["Deep Learning", "MLOps", "Video Analysis", "Python", "Docker"],
  },
];

export function FoundersSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="founders" className="py-32 relative" ref={ref}>
      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] opacity-10"
          style={{ background: "radial-gradient(ellipse, #7C3AED, transparent)" }}
        />
      </div>

      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-primary-400 mb-4 tracking-widest uppercase">
            Built By
          </p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
            The Team Behind{" "}
            <span className="gradient-text">InsightX AI</span>
          </h2>
          <p className="text-lg text-muted max-w-xl mx-auto">
            Built by engineers who are obsessed with AI, video intelligence, and creating
            tools that give investigators superhuman capabilities.
          </p>
        </motion.div>

        {/* Founder cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {FOUNDERS.map((founder, i) => (
            <motion.div
              key={founder.name}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="relative group"
            >
              {/* Card */}
              <div
                className="relative rounded-2xl p-8 overflow-hidden transition-all duration-500 group-hover:border-primary/30"
                style={{
                  background: "rgba(13,18,36,0.8)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  backdropFilter: "blur(20px)",
                }}
              >
                {/* Background glow on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.08), transparent 70%)" }}
                />

                {/* Profile */}
                <div className="flex items-start gap-5 mb-6 relative z-10">
                  <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300">
                      <Image
                        src={founder.image}
                        alt={founder.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                    {/* Online indicator */}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-accent border-2 border-background" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-black text-white mb-1">{founder.name}</h3>
                    <p className="text-sm font-medium text-primary-400 mb-2">{founder.role}</p>

                    {/* Social links */}
                    <div className="flex items-center gap-2">
                      {founder.links.github && (
                        <a
                          href={founder.links.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 rounded-lg bg-white/5 border border-border hover:bg-white/10 hover:border-primary/30 transition-all flex items-center justify-center"
                        >
                          <Github size={13} className="text-muted" />
                        </a>
                      )}
                      {founder.links.linkedin && (
                        <a
                          href={founder.links.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 rounded-lg bg-white/5 border border-border hover:bg-white/10 hover:border-primary/30 transition-all flex items-center justify-center"
                        >
                          <Linkedin size={13} className="text-muted" />
                        </a>
                      )}
                      {founder.links.email && (
                        <a
                          href={`mailto:${founder.links.email}`}
                          className="w-7 h-7 rounded-lg bg-white/5 border border-border hover:bg-white/10 hover:border-primary/30 transition-all flex items-center justify-center"
                        >
                          <Mail size={13} className="text-muted" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-sm text-muted leading-relaxed mb-6 relative z-10">
                  {founder.bio}
                </p>

                {/* Expertise chips */}
                <div className="flex flex-wrap gap-2 relative z-10">
                  {founder.expertise.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs font-medium px-2.5 py-1 rounded-lg border"
                      style={{
                        background: "rgba(124,58,237,0.08)",
                        borderColor: "rgba(124,58,237,0.2)",
                        color: "#c4b5fd",
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* University badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full border border-border bg-surface/50">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-sm text-muted">
              Developed at{" "}
              <span className="text-white font-medium">University of Central Punjab</span>
              {" "}· AI & Computer Vision Research
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
