"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, X, Send, Sparkles, ChevronDown,
  MessageSquare, Minimize2, Maximize2, Zap,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const STARTER_SUGGESTIONS = [
  "What can InsightX AI detect?",
  "How do I start an investigation?",
  "What video formats are supported?",
  "How accurate is the AI analysis?",
];

const QUICK_ANSWERS: Record<string, string> = {
  "what can insightx ai detect": "InsightX AI detects persons, vehicles, 80+ object types, 12 anomaly classes (fights, loitering, falls, etc.), plus transcribes all audio and identifies specific sounds like screaming, gunshots, and glass breaking.",
  "how do i start an investigation": "Click 'New Investigation', give it a title and case number, upload your video evidence, and click Analyze. The AI starts processing immediately — you'll see live progress updates.",
  "what video formats are supported": "MP4, AVI, MOV, MKV, WebM, and 3GPP. Files up to 4GB in size. Both SD and up to 4K resolution are supported.",
  "how accurate is the ai analysis": "InsightX AI uses Detectra v7 with YOLOv8 segmentation, ByteTrack, faster-whisper, and multi-provider AI reasoning. Accuracy depends on video quality, lighting, and scene complexity — upload evidence to see results on your footage.",
};

function getAutoReply(text: string): string {
  const lower = text.toLowerCase();
  for (const [key, ans] of Object.entries(QUICK_ANSWERS)) {
    if (lower.includes(key.split(" ")[0]) || lower.includes(key.split(" ")[1] || "")) return ans;
  }
  return "That's a great question! For the most accurate answer, I'd recommend starting a free investigation to see InsightX AI in action. You can also check our documentation or contact our team at mianahmadyasin3@gmail.com. Is there anything specific about the platform I can clarify?";
}

export function AICopilot() {
  const [open, setOpen]         = useState(false);
  const [minimized, setMin]     = useState(false);
  const [input, setInput]       = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "👋 Hi! I'm the InsightX AI Copilot. I can answer questions about the platform, help you get started, or guide you through features. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);
    await new Promise(r => setTimeout(r, 300));
    const reply = getAutoReply(text);
    setTyping(false);
    setMessages(prev => [...prev, { role: "assistant", content: reply, timestamp: new Date() }]);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      {/* Floating trigger button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-[800] w-14 h-14 rounded-2xl flex items-center justify-center shadow-glow-md"
            data-tour="copilot"
            style={{ background: "var(--primary)", boxShadow: `0 8px 32px var(--primary-glow), 0 0 0 4px var(--surface)` }}
          >
            <Brain size={22} className="text-white" />
            <motion.span
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#10B981] border-2"
              style={{ borderColor: "var(--surface)" }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="fixed bottom-6 right-6 z-[800] w-[360px] flex flex-col overflow-hidden"
            style={{
              height: minimized ? "56px" : "500px",
              maxHeight: "calc(100vh - 80px)",
              borderRadius: "20px",
              background: "var(--surface)",
              border: "1px solid var(--border-strong)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.05)",
              transition: "height 0.25s cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b flex-shrink-0"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "var(--primary)", boxShadow: "0 4px 12px var(--primary-glow)" }}>
                <Brain size={15} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold" style={{ color: "var(--text)" }}>InsightX Copilot</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Always available</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setMin(!minimized)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  {minimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
                </button>
                <button onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <X size={13} />
                </button>
              </div>
            </div>

            {!minimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                      {m.role === "assistant" && (
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: "var(--primary)", minWidth: "24px" }}>
                          <Sparkles size={11} className="text-white" />
                        </div>
                      )}
                      <div className={`max-w-[80%]`}>
                        <div className="copilot-bubble text-xs leading-relaxed"
                          style={m.role === "user" ? {
                            background: "var(--primary)",
                            color: "#fff",
                            border: "none",
                          } : {}}>
                          {m.content}
                        </div>
                        <p className="text-[9px] mt-1 px-1" style={{ color: "var(--text-subtle)" }}>
                          {formatTime(m.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {typing && (
                    <div className="flex gap-2.5">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "var(--primary)" }}>
                        <Sparkles size={11} className="text-white" />
                      </div>
                      <div className="copilot-bubble flex items-center gap-1 px-3 py-2.5">
                        {[0,1,2].map(i => (
                          <motion.div key={i} className="w-1.5 h-1.5 rounded-full"
                            style={{ background: "var(--text-muted)" }}
                            animate={{ y: [-2, 2, -2] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Suggestions */}
                {messages.length === 1 && (
                  <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                    {STARTER_SUGGESTIONS.map(s => (
                      <button key={s} onClick={() => send(s)}
                        className="text-[10px] px-2.5 py-1.5 rounded-lg transition-all"
                        style={{
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                          color: "var(--text-muted)",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.color = "var(--primary)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div className="p-3 border-t flex-shrink-0" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-end gap-2">
                    <textarea
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKey}
                      placeholder="Ask me anything about InsightX AI…"
                      rows={1}
                      className="flex-1 resize-none text-xs py-2.5 px-3 rounded-xl outline-none transition-all no-scrollbar"
                      style={{
                        background: "var(--surface-2)",
                        border: "1px solid var(--border-strong)",
                        color: "var(--text)",
                        fontFamily: "inherit",
                        lineHeight: "1.5",
                        maxHeight: "80px",
                      }}
                    />
                    <button onClick={() => send(input)} disabled={!input.trim()}
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-40"
                      style={{ background: "var(--primary)", color: "#fff" }}>
                      <Send size={13} />
                    </button>
                  </div>
                  <p className="text-[9px] mt-1.5 text-center" style={{ color: "var(--text-subtle)" }}>
                    InsightX AI Copilot · Powered by AI
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
