"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, FolderOpen, Search, Filter, ArrowRight, X, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatRelative, getRiskBadgeClass } from "@/lib/utils";
import type { Investigation } from "@/types";
import toast from "react-hot-toast";

const PRIORITIES = ["low", "medium", "high", "critical"] as const;

function CreateModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", description: "", priority: "medium" });

  const create = useMutation({
    mutationFn: (data: typeof form) => api.post("/api/v1/investigations", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["investigations"] });
      toast.success("Investigation created");
      onClose();
    },
    onError: () => toast.error("Failed to create investigation"),
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-lg card border-border/80"
        style={{ background: "var(--surface)" }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold" style={{ color: "var(--text)" }}>New Investigation</h2>
          <button onClick={onClose} className="text-muted hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); create.mutate(form); }}
          className="space-y-4"
        >
          <div>
            <label className="text-xs font-medium text-muted mb-1.5 block">Investigation Title *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Warehouse Incident — 2024-12-15"
              className="input-field"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted mb-1.5 block">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of the incident or investigation scope..."
              className="input-field resize-none h-24"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted mb-2 block">Priority Level</label>
            <div className="grid grid-cols-4 gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm({ ...form, priority: p })}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    form.priority === p
                      ? p === "critical" ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : p === "high" ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                        : p === "medium" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        : "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-surface-2 text-muted border border-border hover:border-border-strong"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={create.isPending} className="btn-primary flex-1">
              {create.isPending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Create Investigation"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function InvestigationsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["investigations", page],
    queryFn: () => api.get(`/api/v1/investigations?page=${page}&page_size=20`).then((r) => r.data),
  });

  const investigations: Investigation[] = data?.items || [];
  const filtered = investigations.filter(
    (inv) =>
      inv.title.toLowerCase().includes(search.toLowerCase()) ||
      inv.case_number?.includes(search)
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black" style={{ color: "var(--text)" }}>Investigation Center</h1>
          <p className="text-sm text-muted mt-1">
            {data?.total || 0} total · Manage all your cases and evidence files
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary gap-2">
          <Plus size={16} />
          New Investigation
        </button>
      </div>

      {/* Search & filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or case number..."
            className="input-field pl-9"
          />
        </div>
        <button className="btn-secondary gap-2 px-4">
          <Filter size={14} />
          Filter
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <FolderOpen size={28} className="text-primary-400" />
          </div>
          <h3 className="font-bold mb-2" style={{ color: "var(--text)" }}>
            {search ? "No matching investigations" : "No investigations yet"}
          </h3>
          <p className="text-sm text-muted mb-6 max-w-sm mx-auto">
            {search
              ? "Try a different search term or clear the filter."
              : "Create your first investigation to start analyzing video evidence."}
          </p>
          {!search && (
            <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
              Create Investigation →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inv, i) => (
            <motion.div
              key={inv.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link href={`/investigations/${inv.id}`}>
                <div className="flex items-center gap-5 p-5 rounded-2xl border border-border hover:border-primary/20 bg-surface/50 hover:bg-surface transition-all duration-200 group cursor-pointer">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <FolderOpen size={18} className="text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold truncate" style={{ color: "var(--text)" }}>{inv.title}</h3>
                      <span className={getRiskBadgeClass(inv.priority)}>{inv.priority}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted">
                      <span>{inv.case_number}</span>
                      <span>·</span>
                      <span className="capitalize">{inv.status}</span>
                      <span>·</span>
                      <span>{formatRelative(inv.updated_at)}</span>
                    </div>
                  </div>
                  {inv.incident_score !== undefined && inv.incident_score !== null && (
                    <div className="text-center flex-shrink-0">
                      <div className="text-xl font-black" style={{ color: "var(--text)" }}>{Math.round(inv.incident_score)}</div>
                      <div className="text-xs text-muted">/ 100</div>
                    </div>
                  )}
                  {inv.priority === "critical" && (
                    <AlertTriangle size={16} className="text-danger flex-shrink-0" />
                  )}
                  <ArrowRight size={16} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}
      </AnimatePresence>
    </div>
  );
}
