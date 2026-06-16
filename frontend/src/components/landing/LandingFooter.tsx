"use client";

import Link from "next/link";
import { Zap, Github, Twitter, Linkedin, Mail, Shield, Lock, Globe } from "lucide-react";

const FOOTER_LINKS = [
  {
    heading: "Product",
    links: [
      { label: "Features",      href: "#features" },
      { label: "How It Works",  href: "#how-it-works" },
      { label: "Pricing",       href: "#pricing" },
      { label: "Changelog",     href: "#" },
      { label: "Roadmap",       href: "#" },
    ],
  },
  {
    heading: "Platform",
    links: [
      { label: "Dashboard",         href: "/dashboard" },
      { label: "Investigations",    href: "/investigations" },
      { label: "AI Investigator",   href: "/chat" },
      { label: "Evidence Library",  href: "/evidence" },
      { label: "Reports",           href: "/reports" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About",      href: "#founders" },
      { label: "Blog",       href: "#" },
      { label: "Careers",    href: "#" },
      { label: "Contact",    href: "mailto:mianahmadyasin3@gmail.com" },
      { label: "Press Kit",  href: "#" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy",   href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Security",         href: "#" },
      { label: "GDPR",             href: "#" },
      { label: "Cookie Policy",    href: "#" },
    ],
  },
];

const SOCIAL = [
  { icon: Github,   href: "https://github.com",   label: "GitHub" },
  { icon: Twitter,  href: "https://twitter.com",  label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
  { icon: Mail,     href: "mailto:mianahmadyasin3@gmail.com", label: "Email" },
];

const TRUST_BADGES = [
  { icon: Shield, label: "SOC 2 Ready" },
  { icon: Lock,   label: "256-bit Encryption" },
  { icon: Globe,  label: "GDPR Compliant" },
];

export function LandingFooter() {
  return (
    <footer className="relative border-t overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
      {/* Subtle top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.5), transparent)" }} />

      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-16">
          {/* Brand column */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-5 group w-fit">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)", boxShadow: "0 0 20px rgba(124,58,237,0.4)" }}>
                <Zap size={15} className="text-white" />
              </div>
              <div>
                <span className="font-black text-base tracking-tight text-white">InsightX</span>
                <span className="font-black text-base text-primary-400"> AI</span>
              </div>
            </Link>
            <p className="text-sm text-[#475569] leading-relaxed mb-6 max-w-xs">
              Production-grade AI video intelligence platform. Turn raw footage into forensic-quality investigation reports in minutes.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-2">
              {SOCIAL.map(({ icon: Icon, href, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-[#334155] hover:text-white transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,58,237,0.3)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.08)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                  }}
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_LINKS.map((col) => (
            <div key={col.heading}>
              <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">{col.heading}</h4>
              <ul className="space-y-2.5">
                {col.links.map(({ label, href }) => (
                  <li key={label}>
                    <a href={href}
                      className="text-sm text-[#475569] hover:text-white transition-colors duration-150">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px mb-8" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07) 50%, transparent)" }} />

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#334155]">
            © {new Date().getFullYear()} InsightX AI. Built by{" "}
            <a href="mailto:mianahmadyasin3@gmail.com" className="text-[#475569] hover:text-white transition-colors">Ahmad Yasin</a>
            {" "}&amp;{" "}
            <span className="text-[#475569]">Abdul Rehman</span>
            {" "}· University of Central Punjab
          </p>

          <div className="flex items-center gap-4">
            {TRUST_BADGES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-[#334155]">
                <Icon size={11} className="text-[#1e3a5f]" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
