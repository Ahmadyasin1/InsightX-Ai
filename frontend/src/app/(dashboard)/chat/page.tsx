"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Brain, Send, Loader2, User, Zap } from "lucide-react";
import { api } from "@/lib/api";
import type { Investigation, ChatMessage } from "@/types";
import { formatRelative } from "@/lib/utils";

const STARTERS = [
  "What were the most critical incidents detected?",
  "Summarize all detected persons and their movements",
  "What is the timeline of events in this investigation?",
  "Are there any suspicious patterns I should be aware of?",
  "Generate an executive brief for this investigation",
];

const PROVIDER_LABELS: Record<string, string> = {
  groq: "Groq Llama 3.3",
  gemini: "Google Gemini",
  huggingface: "HuggingFace",
  anthropic: "Claude",
};

function sanitizeAssistantContent(content: string): string {
  if (content.startsWith("Analysis failed:") || content.includes("invalid_request_error")) {
    return "I couldn't generate a response from the primary AI. Please try again — backup providers will be used automatically.";
  }
  if (content.includes("Error code: 400") && content.includes("credit balance")) {
    return "The primary AI provider has insufficient credits. Backup AI (Groq/Gemini) is now handling your requests — please try again.";
  }
  return content;
}

function MessageBubble({ msg, timeTick }: { msg: ChatMessage; timeTick: number }) {
  const isUser = msg.role === "user";
  const displayContent = isUser ? msg.content : sanitizeAssistantContent(msg.content);
  const relativeTime = formatRelative(msg.created_at);
  void timeTick; // re-render when tick updates
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isUser ? "bg-primary/20 border border-primary/30" : "bg-surface-3 border border-border"
      }`}>
        {isUser ? <User size={14} className="text-primary-400" /> : <Zap size={14} className="text-secondary" />}
      </div>
      <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-primary/15 border border-primary/20 rounded-tr-sm"
              : "bg-surface-2 border border-border text-muted rounded-tl-sm"
          }`}
          style={isUser ? { color: "var(--text)" } : undefined}
        >
          {isUser ? (
            displayContent
          ) : (
            <div className="prose prose-sm max-w-none whitespace-pre-wrap dark:prose-invert">
              {displayContent}
            </div>
          )}
        </div>
        {!isUser && msg.provider && (
          <span className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ background: "var(--primary-glow)", color: "var(--primary)" }}>
            via {PROVIDER_LABELS[msg.provider] ?? msg.provider}
          </span>
        )}
        <span className="text-xs text-muted/60">{relativeTime}</span>
      </div>
    </motion.div>
  );
}

function ChatInterface() {
  const params = useSearchParams();
  const investigationId = params.get("investigation") || "";
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [selectedInv, setSelectedInv] = useState(investigationId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [timeTick, setTimeTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTimeTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const { data: investigations } = useQuery<{ items: Investigation[] }>({
    queryKey: ["investigations-list"],
    queryFn: () => api.get("/api/v1/investigations?page_size=50").then((r) => r.data),
  });

  const { data: inv } = useQuery<Investigation>({
    queryKey: ["investigation", selectedInv],
    queryFn: () => api.get(`/api/v1/investigations/${selectedInv}`).then((r) => r.data),
    enabled: !!selectedInv,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !selectedInv || sending) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(), role: "user", content: text,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const { data } = await api.post("/api/v1/chat", {
        message: text, investigation_id: selectedInv,
      }, { timeout: 120_000 });
      setMessages((prev) => [...prev, { ...data, created_at: data.created_at || new Date().toISOString() }]);
      if (data.provider) setActiveProvider(data.provider);
    } catch {
      setMessages((prev) => [...prev, {
        id: Date.now().toString(), role: "assistant",
        content: "Sorry, I couldn't process your request. The system will retry using backup AI providers — please try again.",
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] flex">
      {/* Sidebar — investigation selector */}
      <div className="w-72 border-r border-border flex flex-col bg-surface/30">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-sm mb-3" style={{ color: "var(--text)" }}>Select Investigation</h2>
          <select
            value={selectedInv}
            onChange={(e) => { setSelectedInv(e.target.value); setMessages([]); }}
            className="input-field text-xs py-2"
          >
            <option value="">— Choose Investigation —</option>
            {investigations?.items.map((i) => (
              <option key={i.id} value={i.id}>{i.case_number} · {i.title}</option>
            ))}
          </select>
        </div>

        {inv && (
          <div className="p-4 border-b border-border">
            <div className="text-xs text-muted mb-1">Active Case</div>
            <div className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{inv.title}</div>
            <div className="text-xs text-muted mt-0.5">{inv.case_number}</div>
          </div>
        )}

        {/* Starters */}
        {selectedInv && (
          <div className="p-4 flex-1 overflow-y-auto">
            <p className="text-xs text-muted mb-3 font-medium">Suggested Questions</p>
            <div className="space-y-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="w-full text-left text-xs text-muted hover:text-foreground px-3 py-2.5 rounded-lg transition-colors border border-border hover:border-border-strong hover:bg-surface-2"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-14 border-b border-border flex items-center gap-3 px-6">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Brain size={16} className="text-primary-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold" style={{ color: "var(--text)" }}>AI Investigator</h1>
            <p className="text-xs text-muted">
              Multi-provider AI · {activeProvider ? `Active: ${PROVIDER_LABELS[activeProvider] ?? activeProvider}` : "Groq · Gemini · HuggingFace"}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!selectedInv && (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Brain size={28} className="text-primary-400" />
              </div>
              <h3 className="font-bold mb-2" style={{ color: "var(--text)" }}>Select an Investigation</h3>
              <p className="text-sm text-muted max-w-xs mx-auto">
                Choose an investigation from the sidebar to start asking AI-powered questions about your evidence.
              </p>
            </div>
          )}

          {selectedInv && messages.length === 0 && !sending && (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-3xl bg-gradient-purple flex items-center justify-center mx-auto mb-4">
                <Zap size={24} className="text-white" />
              </div>
              <h3 className="font-bold mb-2" style={{ color: "var(--text)" }}>InsightX AI Investigator</h3>
              <p className="text-sm text-muted max-w-sm mx-auto">
                Ask any question about your evidence. I have full access to detected events, entities, anomalies, and timelines.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} timeTick={timeTick} />
          ))}

          {sending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-surface-3 border border-border flex items-center justify-center">
                <Zap size={14} className="text-secondary" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-surface-2 border border-border">
                <div className="flex gap-1.5">
                  {[0, 0.2, 0.4].map((d) => (
                    <motion.div
                      key={d}
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: d }}
                      className="w-1.5 h-1.5 rounded-full bg-muted"
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
            className="flex gap-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={selectedInv ? "Ask anything about this investigation..." : "Select an investigation first"}
              disabled={!selectedInv || sending}
              className="input-field flex-1"
            />
            <button
              type="submit"
              disabled={!input.trim() || !selectedInv || sending}
              className="btn-primary px-4 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
          <p className="text-xs text-muted mt-2">
            AI answers are grounded in your analysis data · Auto-failover across Groq, Gemini & HuggingFace
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted">Loading...</div>}>
      <ChatInterface />
    </Suspense>
  );
}
