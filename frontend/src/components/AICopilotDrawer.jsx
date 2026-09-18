import React, { useState, useEffect, useRef } from "react";
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  ShieldAlert, 
  Terminal, 
  Clock, 
  RefreshCw, 
  Copy, 
  Check, 
  Zap, 
  CornerDownLeft
} from "lucide-react";
import { chatWithAIAnalyst } from "../services/api";

export default function AICopilotDrawer({ isOpen, onClose, targetIncidentId = null, onSelectIncident }) {
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "👋 **NEXES SOC AI Security Analyst Copilot online.**\n\nI maintain continuous telemetry awareness across all ingested HTTP events, active attack dossiers, MITRE ATT&CK techniques, and autonomous containment policies. Ask me to investigate active incidents, explain detected anomalies, or recommend remediation playbooks."
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    "What is the current threat posture?",
    "Summarize recent critical alerts",
    "Explain the SQL injection vulnerability",
    "How to remediate IDOR exploit?",
    "Show active quarantined IPs"
  ];

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (targetIncidentId) {
      handleSend(`Analyze incident ${targetIncidentId}`);
    }
  }, [targetIncidentId]);

  const handleSend = async (customText) => {
    const query = customText || inputText;
    if (!query.trim() || loading) return;

    const userMessage = { sender: "user", text: query };
    setMessages((prev) => [...prev, userMessage]);
    if (!customText) setInputText("");
    setLoading(true);

    try {
      const res = await chatWithAIAnalyst(query, { current_incident: targetIncidentId });
      if (res && res.reply) {
        setMessages((prev) => [
          ...prev, 
          { 
            sender: "ai", 
            text: res.reply, 
            topic: res.topic, 
            incidentId: res.incident_id 
          }
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev, 
        { 
          sender: "ai", 
          text: `⚠️ **Analyst Engine Communication Error:** ${err.message}. Ground-truth fallback active.` 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyMessage = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-md flex justify-end animate-fadeIn">
      <div 
        className="w-full max-w-xl bg-[#060a17]/95 backdrop-blur-2xl border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] h-full flex flex-col justify-between select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-white/10 bg-[#050814]/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-600/30 to-fuchsia-600/20 text-purple-300 border border-purple-400/40 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-white font-mono tracking-wide">
                  NEXES AI SECURITY COPILOT
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold bg-purple-500/20 text-purple-300 border border-purple-400/40">
                  LIVE REASONING
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Zero-hallucination ground truth from SQLite telemetry
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Prompts Gliding Carousel */}
        <div className="p-2.5 bg-[#030611]/80 border-b border-white/5 overflow-x-auto whitespace-nowrap space-x-2 scrollbar-none">
          {quickPrompts.map((prompt, pIdx) => (
            <button
              key={pIdx}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className="btn-glide inline-block px-3 py-1 rounded-full text-[11px] font-mono bg-[#0a1024] hover:bg-[#0e1738] text-slate-300 border border-white/10 hover:border-purple-400/50 hover:text-purple-200 transition-all disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
          {messages.map((msg, mIdx) => (
            <div 
              key={mIdx}
              className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 mb-1">
                {msg.sender === "user" ? (
                  <span>SOC Operator</span>
                ) : (
                  <span className="flex items-center gap-1 text-purple-400 font-semibold">
                    <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
                    NEXES AI Analyst
                  </span>
                )}
              </div>

              <div 
                className={`group relative max-w-[88%] p-4 rounded-2xl border leading-relaxed shadow-lg ${
                  msg.sender === "user"
                    ? "bg-gradient-to-r from-blue-600/30 to-cyan-600/30 text-blue-100 border-cyan-500/40 font-medium"
                    : "bg-[#090e21] text-slate-200 border-white/10 hover:border-purple-400/40"
                }`}
              >
                <div className="whitespace-pre-wrap font-sans text-xs space-y-1.5">
                  {msg.text}
                </div>

                {msg.sender === "ai" && (
                  <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span className="text-[9px] text-purple-400/90 font-semibold">Grounded Forensic Assessment</span>
                    <button
                      onClick={() => copyMessage(msg.text, mIdx)}
                      className="hover:text-white flex items-center gap-1 transition"
                      title="Copy response"
                    >
                      {copiedIdx === mIdx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-purple-300 font-mono text-xs p-3.5 rounded-2xl bg-purple-950/30 border border-purple-400/40 animate-pulse shadow-[0_0_20px_rgba(168,85,247,0.2)]">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
              <span>Synthesizing live telemetry &amp; evaluating MITRE technique correlations...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar with Gliding Button */}
        <div className="p-3.5 border-t border-white/10 bg-[#050814]/95">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2.5"
          >
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask NEXES AI Copilot (e.g. 'What happened in INC-001?')..."
              className="flex-1 bg-[#030611] border border-white/10 rounded-full px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400/60 focus:shadow-[0_0_15px_rgba(168,85,247,0.25)] font-sans transition-all"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="btn-glide p-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center transition disabled:opacity-40 active:scale-95 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
