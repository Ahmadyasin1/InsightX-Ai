"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Eye, EyeOff, ArrowRight, Shield, CheckCircle2,
  Fingerprint, Video, Brain, FileBarChart, ChevronRight,
  AlertCircle, Loader2,
} from "lucide-react";
import { supabase, isSupabaseEnabled } from "@/lib/supabase";
import { api } from "@/lib/api";
import { syncSupabaseSessionToStore } from "@/lib/auth-session";
import { useAuthStore } from "@/store/auth";
import toast from "react-hot-toast";

// ── Feature bullets ────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Video,       label: "Video Intelligence",    desc: "12 AI models analyze every frame" },
  { icon: Brain,       label: "AI Chat Investigator",  desc: "Ask questions in plain language" },
  { icon: FileBarChart,label: "Evidence Reports",      desc: "Professional PDF & JSON export" },
  { icon: Shield,      label: "Secure & Private",      desc: "All data on your infrastructure" },
];

// ── Field component ────────────────────────────────────────────────────────
interface FieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  rightSlot?: React.ReactNode;
  error?: string;
}
function Field({ label, type = "text", value, onChange, placeholder, required, autoComplete, rightSlot, error }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[#94A3B8] tracking-wide uppercase">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className={`input-field ${rightSlot ? "pr-11" : ""} ${error ? "border-danger-500/50 focus:border-danger-500" : ""}`}
        />
        {rightSlot && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>
        )}
      </div>
      {error && (
        <p className="flex items-center gap-1 text-xs text-danger-400">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

// ── Main content ──────────────────────────────────────────────────────────
function AuthPageContent() {
  const params = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">(
    params.get("mode") === "register" ? "register" : "login"
  );
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", organization: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { setAuth, isAuthenticated, _hydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const err = params.get("error");
    if (err) toast.error(decodeURIComponent(err));
  }, [params]);

  useEffect(() => {
    if (_hydrated && isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, _hydrated, router]);

  useEffect(() => {
    if (!isSupabaseEnabled || !supabase || isAuthenticated) return;
    syncSupabaseSessionToStore().then((ok) => {
      if (ok) router.replace("/dashboard");
    });
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isSupabaseEnabled || !supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        await syncSupabaseSessionToStore();
        router.replace("/dashboard");
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const validate = useCallback(() => {
    const e: Record<string, string> = {};
    if (!form.email) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "Minimum 8 characters";
    if (mode === "register" && !form.full_name.trim()) e.full_name = "Full name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      if (isSupabaseEnabled && supabase) {
        if (mode === "login") {
          const { error } = await supabase.auth.signInWithPassword({
            email: form.email,
            password: form.password,
          });
          if (!error) {
            await syncSupabaseSessionToStore();
            toast.success("Welcome back!");
            router.replace("/dashboard");
            return;
          }
          // Fall through to FastAPI for accounts created before Supabase was enabled
        } else {
          const { data, error } = await supabase.auth.signUp({
            email: form.email,
            password: form.password,
            options: {
              data: { full_name: form.full_name, organization: form.organization },
            },
          });
          if (error) throw new Error(error.message);
          if (data.session) {
            await syncSupabaseSessionToStore();
            toast.success("Account created!");
            router.replace("/dashboard");
            return;
          }
          toast.success("Account created! Check your email to verify, then sign in.");
          return;
        }
      }

      const endpoint = mode === "login" ? "/api/v1/auth/login" : "/api/v1/auth/register";
      const payload = mode === "login"
        ? { email: form.email, password: form.password }
        : { email: form.email, password: form.password, full_name: form.full_name, organization: form.organization || undefined };

      const { data } = await api.post(endpoint, payload);
      const { data: user } = await api.get("/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      setAuth(user, data.access_token, data.refresh_token);
      toast.success(mode === "login" ? "Welcome back!" : "Account created!");
      router.replace("/dashboard");

    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ||
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Authentication failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode((m) => (m === "login" ? "register" : "login"));
    setErrors({});
    setForm({ email: "", password: "", full_name: "", organization: "" });
  };

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* ── Background effects ────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px]"
          style={{ background: "radial-gradient(ellipse, var(--primary-glow), transparent 70%)", opacity: 0.4 }} />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px]"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.06), transparent)" }} />
        <div className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
            opacity: 0.3,
          }}
        />
      </div>

      {/* ── Left panel — branding ─────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-1/2 relative flex-col justify-between p-12 xl:p-16">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-glow-sm"
            style={{ background: "var(--primary)" }}>
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight" style={{ color: "var(--text)" }}>InsightX</span>
            <span className="font-bold text-lg tracking-tight" style={{ color: "var(--primary)" }}> AI</span>
          </div>
        </div>

        {/* Main copy */}
        <div className="max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8"
            style={{ border: "1px solid var(--primary-200)", background: "var(--primary-glow)" }}>
            <div className="dot-live" />
            <span className="text-xs font-medium" style={{ color: "var(--primary)" }}>AI-Powered Investigation Platform</span>
          </div>

          <h2 className="text-4xl xl:text-5xl font-black tracking-tight leading-[1.1] mb-5 text-balance"
            style={{ color: "var(--text)" }}>
            Turn Video Into<br />
            <span className="gradient-text">Actionable Intelligence</span>
          </h2>
          <p className="leading-relaxed mb-10 text-sm xl:text-base" style={{ color: "var(--text-muted)" }}>
            InsightX AI processes video evidence through 12 AI models simultaneously — detecting people,
            vehicles, events, anomalies, and generating forensic-grade reports in minutes.
          </p>

          {/* Feature list */}
          <div className="grid grid-cols-2 gap-4">
            {FEATURES.map(f => (
              <div key={f.label} className="ms-card flex items-start gap-3 p-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--primary-glow)", border: "1px solid var(--primary-200)" }}>
                  <f.icon size={14} style={{ color: "var(--primary)" }} />
                </div>
                <div>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--text)" }}>{f.label}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="ms-card p-5 max-w-md">
          <div className="flex items-center gap-1 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} className="w-3.5 h-3.5 fill-[#F59E0B]" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-muted)" }}>
            &ldquo;InsightX AI reduced our incident review time from 4 hours to under 12 minutes. The AI reasoning
            engine is exceptionally accurate.&rdquo;
          </p>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "var(--primary-glow)", color: "var(--primary)" }}>S</div>
            <div>
              <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>Sarah Mitchell</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Head of Corporate Security, Nexgen Corp</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel — auth form ──────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-5 py-12 relative">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-glow-sm"
              style={{ background: "var(--primary)" }}>
              <Zap size={15} className="text-white" />
            </div>
            <span className="font-bold" style={{ color: "var(--text)" }}>
              InsightX<span style={{ color: "var(--primary)" }}> AI</span>
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-black tracking-tight mb-2" style={{ color: "var(--text)" }}>
                  {mode === "login" ? "Welcome back" : "Create account"}
                </h1>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {mode === "login"
                    ? "Sign in to your investigation workspace."
                    : "Start your free investigation workspace today."}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {mode === "register" && (
                  <>
                    <Field
                      label="Full Name"
                      value={form.full_name}
                      onChange={(v) => setForm({ ...form, full_name: v })}
                      placeholder="Your full name"
                      required
                      autoComplete="name"
                      error={errors.full_name}
                    />
                    <Field
                      label="Organization"
                      value={form.organization}
                      onChange={(v) => setForm({ ...form, organization: v })}
                      placeholder="Company or department (optional)"
                      autoComplete="organization"
                    />
                  </>
                )}

                <Field
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={(v) => setForm({ ...form, email: v })}
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                  error={errors.email}
                />

                <Field
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(v) => setForm({ ...form, password: v })}
                  placeholder="Min. 8 characters"
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  error={errors.password}
                  rightSlot={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="transition-colors"
                      style={{ color: "var(--text-muted)" }}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                />

                {mode === "login" && (
                  <div className="flex justify-end">
                    <button type="button" className="text-xs transition-colors"
                      style={{ color: "var(--primary)" }}>
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3.5 text-sm mt-2 shadow-glow-sm"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      {mode === "login" ? "Sign In" : "Create Account"}
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>or</span>
                  <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                </div>

                {/* Google OAuth (Supabase only) */}
                <button
                  type="button"
                  disabled={!isSupabaseEnabled || loading}
                  onClick={async () => {
                    if (!supabase) return toast.error("Supabase not configured");
                    const { error } = await supabase.auth.signInWithOAuth({
                      provider: "google",
                      options: { redirectTo: `${window.location.origin}/auth/callback` },
                    });
                    if (error) toast.error(error.message);
                  }}
                  className="btn-secondary w-full py-3 text-sm relative"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                  {!isSupabaseEnabled && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px]"
                      style={{ color: "var(--text-subtle)" }}>requires Supabase</span>
                  )}
                </button>
              </form>

              {/* Trust indicators */}
              <div className="mt-8 flex items-center justify-center gap-5">
                {[
                  { icon: Shield, label: "SSL Encrypted" },
                  { icon: Fingerprint, label: "SOC 2 Ready" },
                  { icon: CheckCircle2, label: "GDPR Compliant" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <Icon size={11} style={{ color: "var(--text-subtle)" }} />
                    <span className="text-[10px]" style={{ color: "var(--text-subtle)" }}>{label}</span>
                  </div>
                ))}
              </div>

              {/* Mode switch */}
              <div className="mt-6 text-center">
                <button onClick={switchMode} className="text-sm transition-colors group"
                  style={{ color: "var(--text-muted)" }}>
                  {mode === "login"
                    ? <>Don&apos;t have an account?{" "}<span style={{ color: "var(--primary)" }}>Create one <ChevronRight className="inline w-3 h-3" /></span></>
                    : <>Already have an account?{" "}<span style={{ color: "var(--primary)" }}>Sign in <ChevronRight className="inline w-3 h-3" /></span></>}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <AuthPageContent />
    </Suspense>
  );
}
