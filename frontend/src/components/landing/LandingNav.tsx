"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Zap, Menu, X, ChevronRight, Sun, Moon, Monitor } from "lucide-react";

const LINKS = [
  { label: "Features",  href: "#features" },
  { label: "Live Demo", href: "#live-demo" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "AI Brain",  href: "#neural" },
  { label: "Pricing",   href: "#pricing" },
];

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-8 h-8 rounded-xl" style={{ background: "var(--surface-2)" }} />;

  const options = [
    { value: "light",  icon: Sun,     label: "Light" },
    { value: "dark",   icon: Moon,    label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ];
  const current = options.find(o => o.value === theme) ?? options[0];
  const Icon = current.icon;

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
        <Icon size={13} style={{ color: "var(--text-muted)" }} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-10 z-50 w-36 rounded-xl overflow-hidden"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border-strong)",
                boxShadow: "var(--card-shadow-hover)",
              }}
            >
              {options.map(({ value, icon: Ico, label }) => (
                <button key={value} onClick={() => { setTheme(value); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium transition-colors text-left"
                  style={{
                    color: theme === value ? "var(--primary)" : "var(--text-muted)",
                    background: theme === value ? "var(--primary-glow)" : "transparent",
                  }}>
                  <Ico size={12} />
                  {label}
                  {theme === value && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "var(--primary)" }} />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    fn();
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={scrolled ? {
          background: "var(--acrylic-bg)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderBottom: "1px solid var(--border)",
          boxShadow: "0 2px 20px rgba(0,0,0,0.06)",
        } : undefined}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group select-none">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all group-hover:scale-105 group-hover:shadow-glow-sm"
                style={{ background: "var(--primary)", boxShadow: `0 0 16px var(--primary-glow)` }}>
                <Zap size={14} className="text-white" />
              </div>
              <span className="font-black text-sm tracking-tight" style={{ color: "var(--text)" }}>
                InsightX<span style={{ color: "var(--primary)" }}> AI</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-0.5">
              {LINKS.map((l) => (
                <a key={l.href} href={l.href}
                  className="px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 hover:bg-[var(--surface-2)]"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
                >
                  {l.label}
                </a>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-2">
              <ThemeToggle />
              <Link href="/auth"
                className="text-sm font-medium px-4 py-2 rounded-xl transition-all duration-150"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                Sign In
              </Link>
              <Link href="/auth?mode=register"
                className="btn-primary text-xs px-4 py-2.5 shadow-glow-sm">
                Get Started <ChevronRight size={12} />
              </Link>
            </div>

            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <button onClick={() => setMobileOpen(!mobileOpen)}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                {mobileOpen ? <X size={15} /> : <Menu size={15} />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="fixed top-16 inset-x-0 z-40 md:hidden"
            style={{
              background: "var(--acrylic-bg)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div className="max-w-7xl mx-auto px-5 py-4 space-y-1">
              {LINKS.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between py-3 px-3 rounded-xl text-sm font-medium transition-all"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "var(--surface-2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; }}
                >
                  {l.label}
                  <ChevronRight size={12} style={{ color: "var(--text-subtle)" }} />
                </a>
              ))}
              <div className="pt-3 border-t flex gap-2.5" style={{ borderColor: "var(--border)" }}>
                <Link href="/auth" onClick={() => setMobileOpen(false)} className="btn-secondary flex-1 py-2.5 text-sm justify-center">Sign In</Link>
                <Link href="/auth?mode=register" onClick={() => setMobileOpen(false)} className="btn-primary flex-1 py-2.5 text-sm justify-center">Get Started</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
