"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { User, Lock, Shield, Cpu, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [activeSection, setActiveSection] = useState("profile");
  const [profile, setProfile] = useState({
    full_name: user?.full_name || "",
    organization: user?.organization || "",
  });
  const [passwords, setPasswords] = useState({
    current_password: "", new_password: "", confirm: ""
  });

  const updateProfile = useMutation({
    mutationFn: (data: typeof profile) => api.patch("/api/v1/settings/profile", data).then((r) => r.data),
    onSuccess: (data) => {
      updateUser(data);
      toast.success("Profile updated");
    },
    onError: () => toast.error("Failed to update profile"),
  });

  const changePassword = useMutation({
    mutationFn: (data: { current_password: string; new_password: string }) =>
      api.post("/api/v1/settings/change-password", data),
    onSuccess: () => {
      toast.success("Password changed");
      setPasswords({ current_password: "", new_password: "", confirm: "" });
    },
    onError: () => toast.error("Password change failed"),
  });

  const SECTIONS = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "ai", label: "AI Models", icon: Cpu },
    { id: "about", label: "About", icon: Shield },
  ];

  const AI_MODELS = [
    { label: "Object Detection", value: "YOLOv8s-seg · 44.9 mAP", status: "active" },
    { label: "Speech Recognition", value: "faster-whisper-medium", status: "active" },
    { label: "Audio Classification", value: "YAMNet (521 classes)", status: "active" },
    { label: "Pose Estimation", value: "YOLOv8n-pose", status: "active" },
    { label: "Scene Understanding", value: "CLIP ViT-B/32", status: "active" },
    { label: "Multi-Object Tracking", value: "ByteTrack", status: "active" },
    { label: "AI Reasoning", value: "Claude claude-sonnet-4-6", status: "key_required" },
    { label: "Multimodal Fusion", value: "CrossModal Transformer (256d)", status: "active" },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black" style={{ color: "var(--text)" }}>Settings</h1>
        <p className="text-sm text-muted mt-1">Manage your account and investigation preferences</p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Nav */}
        <div className="col-span-1 space-y-1">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const isActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: isActive ? "var(--primary-glow)" : "transparent",
                  border: isActive ? "1px solid var(--primary-200)" : "1px solid transparent",
                  color: isActive ? "var(--primary)" : "var(--text-muted)",
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "var(--text)"; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; } }}
              >
                <Icon size={15} />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="col-span-3">
          {activeSection === "profile" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
              <h2 className="font-semibold mb-6" style={{ color: "var(--text)" }}>Profile Information</h2>
              <form
                onSubmit={(e) => { e.preventDefault(); updateProfile.mutate(profile); }}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs font-medium text-muted mb-1.5 block">Email Address</label>
                  <input value={user?.email} disabled className="input-field opacity-50 cursor-not-allowed" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted mb-1.5 block">Full Name</label>
                  <input
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted mb-1.5 block">Organization</label>
                  <input
                    value={profile.organization}
                    onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
                    placeholder="Your organization or team"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted mb-1.5 block">Role</label>
                  <input value={user?.role} disabled className="input-field opacity-50 cursor-not-allowed capitalize" />
                </div>
                <button type="submit" disabled={updateProfile.isPending} className="btn-primary gap-2">
                  {updateProfile.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Changes
                </button>
              </form>
            </motion.div>
          )}

          {activeSection === "security" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
              <h2 className="font-semibold mb-6" style={{ color: "var(--text)" }}>Change Password</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (passwords.new_password !== passwords.confirm) {
                    toast.error("Passwords don't match");
                    return;
                  }
                  changePassword.mutate({
                    current_password: passwords.current_password,
                    new_password: passwords.new_password,
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs font-medium text-muted mb-1.5 block">Current Password</label>
                  <input
                    type="password"
                    value={passwords.current_password}
                    onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted mb-1.5 block">New Password</label>
                  <input
                    type="password"
                    value={passwords.new_password}
                    onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted mb-1.5 block">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className="input-field"
                  />
                </div>
                <button type="submit" disabled={changePassword.isPending} className="btn-primary gap-2">
                  {changePassword.isPending ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                  Change Password
                </button>
              </form>
            </motion.div>
          )}

          {activeSection === "ai" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold" style={{ color: "var(--text)" }}>AI Model Configuration</h2>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                  style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
                  <div className="dot-live" style={{ width: "6px", height: "6px" }} />
                  <span className="text-[10px] text-[#10B981] font-medium">All Systems Nominal</span>
                </div>
              </div>
              <div className="space-y-1">
                {AI_MODELS.map((model) => (
                  <div key={model.label}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                    style={{ borderColor: "var(--border)" }}>
                    <div>
                      <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{model.label}</div>
                      <div className="text-xs text-muted mt-0.5">{model.value}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {model.status === "active" ? (
                        <>
                          <CheckCircle2 size={13} className="text-[#10B981]" />
                          <span className="text-xs font-medium text-[#10B981]">Active</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={13} className="text-[#F59E0B]" />
                          <span className="text-xs font-medium text-[#F59E0B]">Requires API Key</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeSection === "about" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-3xl bg-gradient-purple flex items-center justify-center mx-auto mb-4">
                  <Shield size={28} className="text-white" />
                </div>
                <h2 className="text-xl font-black mb-1" style={{ color: "var(--text)" }}>InsightX AI</h2>
                <p className="text-sm text-muted mb-6">AI Investigation & Evidence Intelligence Platform</p>
                <div className="grid grid-cols-2 gap-4 text-left">
                  {[
                    { label: "Version", value: "1.0.0" },
                    { label: "Platform", value: "InsightX AI Enterprise" },
                    { label: "AI Engine", value: "InsightX Engine v1.0" },
                    { label: "Compliance", value: "SOC 2 Ready" },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl p-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                      <div className="text-xs text-muted">{label}</div>
                      <div className="text-sm font-medium mt-0.5" style={{ color: "var(--text)" }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
