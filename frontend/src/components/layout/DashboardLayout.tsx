"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Search, FolderOpen, FileVideo, Clock,
  MessageSquare, BarChart3, Settings, LogOut, Zap, Bell,
  ChevronLeft, ChevronRight, Shield, Activity, Menu, X,
  Plus, Command,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { supabase, isSupabaseEnabled } from "@/lib/supabase";
import toast from "react-hot-toast";
import { AICopilot } from "@/components/copilot/AICopilot";
import { DashboardTour } from "@/components/onboarding/DashboardTour";

const NAV_GROUPS = [
  {
    group: "Overview",
    items: [
      { href: "/dashboard",      label: "Dashboard",       icon: LayoutDashboard },
      { href: "/investigations", label: "Investigations",  icon: FolderOpen },
      { href: "/evidence",       label: "Evidence",        icon: FileVideo },
    ],
  },
  {
    group: "Analysis",
    items: [
      { href: "/timeline",  label: "Timeline",        icon: Clock },
      { href: "/chat",      label: "AI Investigator", icon: MessageSquare },
      { href: "/reports",   label: "Reports",         icon: BarChart3 },
    ],
  },
  {
    group: "System",
    items: [
      { href: "/settings",  label: "Settings",        icon: Settings },
    ],
  },
];

function UserAvatar({ name }: { name: string }) {
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div className="relative flex-shrink-0">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white"
        style={{ background: "linear-gradient(135deg, var(--primary), #4F46E5)" }}>
        {initials || "U"}
      </div>
      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#10B981] border-2"
        style={{ borderColor: "var(--surface)" }} />
    </div>
  );
}

function SidebarInner({
  collapsed, setCollapsed, onLogout
}: { collapsed: boolean; setCollapsed: (v: boolean) => void; onLogout: () => void }) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center ${collapsed ? "justify-center px-3" : "justify-between px-4"} h-16 border-b flex-shrink-0`}
        style={{ borderColor: "var(--border)" }}>
        {!collapsed ? (
          <>
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "var(--primary)", boxShadow: "0 0 20px var(--primary-glow)" }}>
                <Zap size={14} className="text-white" />
              </div>
              <div>
                <span className="font-black text-sm tracking-tight" style={{ color: "var(--text)" }}>InsightX</span>
                <span className="font-black text-sm" style={{ color: "var(--primary)" }}> AI</span>
              </div>
            </Link>
            <button onClick={() => setCollapsed(true)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <ChevronLeft size={13} />
            </button>
          </>
        ) : (
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "var(--primary)" }}>
            <Zap size={14} className="text-white" />
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-5 no-scrollbar">
        {NAV_GROUPS.map(g => (
          <div key={g.group}>
            {!collapsed && (
              <p className="text-[10px] font-bold uppercase tracking-widest px-2 mb-1.5 select-none"
                style={{ color: "var(--text-subtle)" }}>
                {g.group}
              </p>
            )}
            <div className="space-y-0.5">
              {g.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link key={href} href={href} title={collapsed ? label : undefined}
                    className={`relative flex items-center rounded-xl transition-all duration-150 group select-none ${
                      collapsed ? "w-10 h-10 mx-auto justify-center" : "gap-3 px-3 py-2.5"
                    }`}
                    style={{ color: active ? "var(--primary)" : "var(--text-muted)" }}
                  >
                    {active && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background: "var(--primary-glow)",
                          border: "1px solid var(--primary-200)",
                        }}
                        transition={{ type: "spring", stiffness: 450, damping: 38 }}
                      />
                    )}
                    <Icon size={15} className="relative z-10 flex-shrink-0" />
                    {!collapsed && (
                      <span className="relative z-10 text-sm font-medium truncate">
                        {label}
                      </span>
                    )}
                    {active && !collapsed && (
                      <div className="relative z-10 ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: "var(--primary)" }} />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t p-2.5 space-y-1 flex-shrink-0" style={{ borderColor: "var(--border)" }}>
        {!collapsed && (
          <Link href="/investigations"
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
            style={{ background: "var(--primary-glow)", border: "1px solid var(--primary-200)", color: "var(--primary)" }}>
            <Plus size={13} />
            New Investigation
          </Link>
        )}

        {collapsed && (
          <button onClick={() => setCollapsed(false)}
            className="w-10 h-10 mx-auto flex items-center justify-center rounded-xl transition-all"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            <ChevronRight size={13} />
          </button>
        )}

        {!collapsed && (
          <div className="flex items-center gap-2 px-3 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[10px]" style={{ color: "var(--text-subtle)" }}>All systems operational</span>
          </div>
        )}

        <div className={`flex items-center gap-3 px-2 py-2 rounded-xl transition-all cursor-default ${collapsed ? "justify-center" : ""}`}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
          <UserAvatar name={user?.full_name ?? "User"} />
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>
                  {user?.full_name ?? "User"}
                </p>
                <p className="text-[10px] truncate" style={{ color: "var(--text-subtle)" }}>
                  {user?.email ?? ""}
                </p>
              </div>
              <button onClick={onLogout} title="Sign Out"
                className="w-6 h-6 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; }}>
                <LogOut size={12} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const router   = useRouter();
  const { logout } = useAuthStore();

  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
      if ((e.metaKey || e.ctrlKey) && e.key === "b") { e.preventDefault(); setCollapsed(c => !c); }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleLogout = async () => {
    if (isSupabaseEnabled && supabase) await supabase.auth.signOut();
    logout();
    toast.success("Signed out successfully");
    router.replace("/auth");
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ type: "spring", stiffness: 450, damping: 38 }}
        className="hidden lg:flex flex-col flex-shrink-0 border-r relative z-10"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        data-tour="sidebar"
      >
        <SidebarInner collapsed={collapsed} setCollapsed={setCollapsed} onLogout={handleLogout} />
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileOpen(false)} />
            <motion.aside initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: "spring", stiffness: 450, damping: 38 }}
              className="fixed inset-y-0 left-0 w-64 z-50 border-r lg:hidden"
              style={{
                background: "var(--acrylic-bg)",
                backdropFilter: "blur(24px) saturate(180%)",
                borderColor: "var(--border)",
              }}>
              <SidebarInner collapsed={false} setCollapsed={() => {}} onLogout={handleLogout} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="h-14 flex items-center gap-3 px-4 lg:px-5 border-b flex-shrink-0"
          style={{
            background: "var(--acrylic-bg)",
            backdropFilter: "blur(16px) saturate(180%)",
            borderColor: "var(--border)",
          }}>
          <button onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 -ml-1 rounded-xl transition-all"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            <Menu size={17} />
          </button>

          {/* Search trigger */}
          <button onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2.5 h-8 px-3 rounded-xl text-sm flex-1 max-w-xs transition-all"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-strong)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}>
            <Search size={12} className="flex-shrink-0" />
            <span className="flex-1 text-left text-xs">Search…</span>
            <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] border font-mono"
              style={{ borderColor: "var(--border)", color: "var(--text-subtle)" }}>
              <Command size={8} />K
            </kbd>
          </button>

          <div className="ml-auto flex items-center gap-2">
            {/* AI status */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
              style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)" }}>
              <Activity size={10} className="text-[#10B981]" />
              <span className="text-[10px] font-medium text-[#10B981]">AI Online</span>
            </div>

            {/* Notifications */}
            <button className="relative w-8 h-8 rounded-xl flex items-center justify-center transition-all"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "var(--text)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}>
              <Bell size={14} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--primary)" }} />
            </button>

            {/* Security indicator */}
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "var(--primary-glow)", border: "1px solid var(--primary-200)" }}>
              <Shield size={12} style={{ color: "var(--primary)" }} />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      <AICopilot />
      <DashboardTour />

      {/* Search modal */}
      <AnimatePresence>
        {searchOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
              onClick={() => setSearchOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ duration: 0.15 }}
              className="fixed top-[18%] left-1/2 -translate-x-1/2 w-full max-w-lg z-50 px-4"
            >
              <div className="rounded-2xl overflow-hidden"
                style={{
                  background: "var(--acrylic-bg)",
                  backdropFilter: "blur(40px) saturate(180%)",
                  border: "1px solid var(--border-strong)",
                  boxShadow: "0 32px 80px rgba(0,0,0,0.2)",
                }}>
                <div className="flex items-center gap-3 px-4 py-3.5 border-b" style={{ borderColor: "var(--border)" }}>
                  <Search size={14} className="flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                  <input autoFocus placeholder="Search investigations, evidence, reports…"
                    className="flex-1 bg-transparent text-sm outline-none"
                    style={{ color: "var(--text)" }} />
                  <button onClick={() => setSearchOpen(false)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <X size={13} />
                  </button>
                </div>
                <div className="p-3">
                  <p className="text-[10px] uppercase tracking-widest font-bold px-2 mb-2"
                    style={{ color: "var(--text-subtle)" }}>Quick Navigation</p>
                  {NAV_GROUPS.flatMap(g => g.items).map(({ href, label, icon: Icon }) => (
                    <Link key={href} href={href} onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm group"
                      style={{ color: "var(--text-muted)" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"; (e.currentTarget as HTMLElement).style.color = "var(--text)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}>
                      <Icon size={13} style={{ color: "var(--text-subtle)" }} />
                      {label}
                      <ChevronRight size={11} className="ml-auto" style={{ color: "var(--text-subtle)" }} />
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
