import React, { useState, useEffect } from "react";
import { 
  X, 
  Copy, 
  Check, 
  Terminal, 
  Shield, 
  AlertTriangle, 
  Clock, 
  Hash, 
  Globe, 
  User,
  Bot,
  RefreshCw,
  Zap,
  Code
} from "lucide-react";
import { explainEventWithAI } from "../services/api";

export default function EventDrawer({ event, onClose }) {
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState("parsed"); // "parsed", "ai", "raw"
  const [aiExplanation, setAiExplanation] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (activeView === "ai" && !aiExplanation && event) {
      setAiLoading(true);
      explainEventWithAI(event)
        .then((res) => {
          if (res && res.status === "success") {
            setAiExplanation(res);
          }
        })
        .catch((err) => console.error("AI Event explanation failed:", err))
        .finally(() => setAiLoading(false));
    }
  }, [activeView, event]);

  if (!event) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(event, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case "CRITICAL":
        return "bg-red-500/20 text-red-400 border-red-500/40 font-bold glow-critical";
      case "HIGH":
        return "bg-orange-500/20 text-orange-400 border-orange-500/40 font-bold";
      case "MEDIUM":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
      case "LOW":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
      default:
        return "bg-slate-700/50 text-slate-300 border-slate-600";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div 
        className="w-full max-w-2xl bg-soc-card border-l border-soc-border shadow-2xl h-full flex flex-col p-6 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-soc-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-cyan-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-mono">{event.event_id}</h2>
                <span className={`px-2 py-0.5 rounded text-[11px] border ${getSeverityBadge(event.severity)}`}>
                  {event.severity}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 font-mono border border-slate-700">
                  {event.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">{event.event_type}</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Toggle & Copy */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex rounded-lg bg-slate-900/90 p-0.5 border border-slate-700 text-xs font-mono">
            <button
              onClick={() => setActiveView("parsed")}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                activeView === "parsed" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              Structured Analysis
            </button>
            <button
              onClick={() => setActiveView("ai")}
              className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1 ${
                activeView === "ai" ? "bg-purple-600 text-white shadow" : "text-purple-400 hover:text-purple-300"
              }`}
            >
              <Bot className="w-3 h-3" />
              <span>AI Explanation</span>
            </button>
            <button
              onClick={() => setActiveView("raw")}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                activeView === "raw" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              Raw JSON
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 transition font-mono"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy JSON"}</span>
          </button>
        </div>

        {/* Content Body: View 1 (Parsed) */}
        {activeView === "parsed" && (
          <div className="mt-5 space-y-4 text-xs font-mono">
            {/* Description Banner */}
            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-1">Description</span>
              <p className="text-slate-200 font-sans text-sm">{event.description}</p>
            </div>

            {/* Core Telemetry Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-900/70 rounded border border-slate-800">
                <span className="text-slate-400 text-[10px] block mb-0.5">Timestamp (UTC)</span>
                <span className="text-slate-200 font-semibold">{event.timestamp}</span>
              </div>
              <div className="p-3 bg-slate-900/70 rounded border border-slate-800">
                <span className="text-slate-400 text-[10px] block mb-0.5">Source IP Address</span>
                <span className="text-cyan-400 font-bold">{event.source_ip}</span>
              </div>
              <div className="p-3 bg-slate-900/70 rounded border border-slate-800">
                <span className="text-slate-400 text-[10px] block mb-0.5">HTTP Method & Path</span>
                <span className="text-emerald-400 font-bold">{event.method} {event.path}</span>
              </div>
              <div className="p-3 bg-slate-900/70 rounded border border-slate-800">
                <span className="text-slate-400 text-[10px] block mb-0.5">User Context</span>
                <span className="text-yellow-400 font-semibold">{event.user || "anonymous"}</span>
              </div>
              <div className="p-3 bg-slate-900/70 rounded border border-slate-800">
                <span className="text-slate-400 text-[10px] block mb-0.5">Request Correlation ID</span>
                <span className="text-slate-300">{event.request_id}</span>
              </div>
              <div className="p-3 bg-slate-900/70 rounded border border-slate-800">
                <span className="text-slate-400 text-[10px] block mb-0.5">Detection Rule</span>
                <span className="text-purple-400 font-semibold">{event.event_type} Engine</span>
              </div>
            </div>

            {/* Extracted Ingestion Payload */}
            {event.payload && (
              <div className="mt-4">
                <span className="text-slate-400 text-[10px] uppercase tracking-wider block mb-1.5">
                  Extracted Request / Ingestion Payload
                </span>
                <pre className="p-3.5 rounded-lg bg-black/80 border border-slate-800 text-emerald-400 overflow-x-auto text-[11px] leading-relaxed">
                  {typeof event.payload === "object" ? JSON.stringify(event.payload, null, 2) : event.payload}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Content Body: View 2 (AI Explanation) */}
        {activeView === "ai" && (
          <div className="mt-5 space-y-4 font-mono text-xs">
            {aiLoading ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 text-purple-400 animate-spin mx-auto" />
                <p>Synthesizing AI payload explanation...</p>
              </div>
            ) : aiExplanation ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-300 flex items-center gap-1.5 text-sm">
                      <Bot className="w-4 h-4 text-purple-400" />
                      AI Payload Analysis
                    </span>
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px]">
                      {aiExplanation.mitre_technique}
                    </span>
                  </div>
                  <p className="text-slate-200 font-sans text-xs leading-relaxed pt-1">
                    {aiExplanation.explanation}
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 block uppercase">CWE Classification</span>
                  <span className="text-slate-200 font-semibold">{aiExplanation.cwe}</span>
                </div>

                {event.payload && (
                  <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 block uppercase">Observed Input String</span>
                    <pre className="text-emerald-400 text-[11px] overflow-x-auto bg-black/60 p-2.5 rounded border border-slate-800">
                      {JSON.stringify(event.payload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-10 text-center text-slate-500">
                Click AI Explanation to load automated analysis.
              </div>
            )}
          </div>
        )}

        {/* Content Body: View 3 (Raw JSON) */}
        {activeView === "raw" && (
          <div className="mt-5 flex-1">
            <pre className="p-4 rounded-lg bg-black/80 border border-slate-800 text-emerald-400 overflow-x-auto text-[11px] leading-relaxed font-mono h-full">
              {JSON.stringify(event, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
