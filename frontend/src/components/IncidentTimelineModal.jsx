import React, { useState, useEffect } from "react";
import { 
  X, 
  ArrowDown, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Unlock,
  Terminal, 
  Eye, 
  ExternalLink, 
  ShieldCheck,
  Bot,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  FileText,
  Clock,
  Layers,
  ChevronDown,
  ChevronRight,
  Code
} from "lucide-react";
import { analyzeIncidentWithAI, manualContain, manualUnblock, fetchContainmentStatus } from "../services/api";

export default function IncidentTimelineModal({ incident, onClose, onSelectEvent, onLaunchAiWithIncident }) {
  const [activeTab, setActiveTab] = useState("timeline"); // "timeline", "ai_summary", "detection_cause", "recommendations"
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [containmentLoading, setContainmentLoading] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState({});

  if (!incident) return null;

  const timeline = incident.timeline || [];
  const sourceIp = incident.source_ip || "Unknown";

  useEffect(() => {
    // Check if source IP is currently contained
    fetchContainmentStatus()
      .then((res) => {
        if (res && res.active_blocks) {
          const blocked = res.active_blocks.some(b => b.source_ip === sourceIp);
          setIsBlocked(blocked);
        }
      })
      .catch((err) => console.error(err));
  }, [sourceIp]);

  const handleGenerateAISummary = async () => {
    setAiLoading(true);
    try {
      const res = await analyzeIncidentWithAI(incident.incident_id);
      if (res && res.status === "success") {
        setAiAnalysis(res);
        setActiveTab("ai_summary");
      }
    } catch (err) {
      console.error("AI Analysis error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleToggleContainment = async () => {
    setContainmentLoading(true);
    try {
      if (isBlocked) {
        await manualUnblock(sourceIp, "Analyst override from Incident Dossier");
        setIsBlocked(false);
      } else {
        await manualContain(sourceIp, `Quarantine triggered from Incident ${incident.incident_id}`, 60);
        setIsBlocked(true);
      }
    } catch (err) {
      console.error("Containment toggle error:", err);
    } finally {
      setContainmentLoading(false);
    }
  };

  const toggleExpand = (eventId) => {
    setExpandedEvents((prev) => ({ ...prev, [eventId]: !prev[eventId] }));
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

  const getPhaseColor = (phase) => {
    if (!phase) return "border-slate-700 bg-slate-800/80 text-slate-300";
    if (phase.includes("Exploitation")) return "border-red-500/50 bg-red-950/40 text-red-300";
    if (phase.includes("Privilege") || phase.includes("Exfiltration")) return "border-orange-500/50 bg-orange-950/40 text-orange-300";
    if (phase.includes("Containment") || phase.includes("Mitigation")) return "border-emerald-500/50 bg-emerald-950/40 text-emerald-300";
    return "border-blue-500/50 bg-blue-950/40 text-blue-300";
  };

  const copyBriefing = () => {
    if (!aiAnalysis) return;
    const text = JSON.stringify(aiAnalysis, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none animate-fadeIn">
      <div 
        className="w-full max-w-5xl bg-soc-card border border-soc-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-soc-border flex items-center justify-between bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-red-400 px-2 py-0.5 bg-red-500/10 rounded border border-red-500/30">
                  {incident.incident_id}
                </span>
                <h2 className="text-sm sm:text-base font-bold text-white font-sans">{incident.title}</h2>
                <span className={`text-[11px] px-2 py-0.5 rounded border ${getSeverityBadge(incident.severity)}`}>
                  {incident.severity}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800 font-bold">
                  {incident.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400 mt-1 font-mono flex-wrap">
                <span>Adversary IP: <strong className="text-cyan-400">{sourceIp}</strong></span>
                <span>Correlated Events: <strong className="text-purple-300">{incident.event_count}</strong></span>
                <span>Time Span: <span className="text-slate-300">{incident.start_time?.slice(11, 19)} → {incident.last_time?.slice(11, 19)}</span></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 1-Click Containment Button */}
            <button
              onClick={handleToggleContainment}
              disabled={containmentLoading}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition active:scale-95 ${
                isBlocked 
                  ? "bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30" 
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
              }`}
              title={isBlocked ? "Release IP from Gateway Quarantine" : "Isolate IP on Gateway Blocklist"}
            >
              {isBlocked ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                  <span>CONTAINED (403)</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ISOLATE SOURCE</span>
                </>
              )}
            </button>

            {/* AI Summary Action */}
            <button
              onClick={handleGenerateAISummary}
              disabled={aiLoading}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm shadow-purple-600/30 active:scale-95 disabled:opacity-50"
            >
              <Bot className={`w-3.5 h-3.5 ${aiLoading ? "animate-spin" : ""}`} />
              <span>{aiLoading ? "Generating AI Summary..." : "Generate AI Summary"}</span>
            </button>

            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-5 border-b border-soc-border bg-slate-950/80 flex items-center gap-2 overflow-x-auto text-xs font-mono">
          <button
            onClick={() => setActiveTab("timeline")}
            className={`py-2.5 px-3 border-b-2 font-semibold transition ${
              activeTab === "timeline"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Chronological Attack Timeline ({timeline.length})
          </button>
          <button
            onClick={() => {
              if (!aiAnalysis) handleGenerateAISummary();
              else setActiveTab("ai_summary");
            }}
            className={`py-2.5 px-3 border-b-2 font-semibold transition flex items-center gap-1.5 ${
              activeTab === "ai_summary"
                ? "border-purple-400 text-purple-300"
                : "border-transparent text-slate-400 hover:text-purple-300"
            }`}
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>AI Incident Briefing</span>
          </button>
          <button
            onClick={() => {
              if (!aiAnalysis) handleGenerateAISummary();
              else setActiveTab("detection_cause");
            }}
            className={`py-2.5 px-3 border-b-2 font-semibold transition ${
              activeTab === "detection_cause"
                ? "border-blue-400 text-blue-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Why Was This Detected?
          </button>
          <button
            onClick={() => {
              if (!aiAnalysis) handleGenerateAISummary();
              else setActiveTab("recommendations");
            }}
            className={`py-2.5 px-3 border-b-2 font-semibold transition ${
              activeTab === "recommendations"
                ? "border-emerald-400 text-emerald-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            AI Recommended Response
          </button>
        </div>

        {/* Modal Content Stage */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* TAB 1: ATTACK TIMELINE */}
          {activeTab === "timeline" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Forensic Vector Reconstruction (RFC 3339 Chronological Order)</span>
                <span className="text-cyan-400 font-semibold">{timeline.length} Ingested Events</span>
              </div>

              <div className="relative pl-6 space-y-4 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-red-500 before:via-orange-500 before:to-emerald-500">
                {timeline.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 font-mono text-xs">
                    No timeline steps correlated for this incident dossier yet.
                  </div>
                ) : (
                  timeline.map((step, idx) => {
                    const isExpanded = expandedEvents[step.event_id];
                    const isContainment = step.event_type === "CONTAINMENT_ENFORCED";

                    return (
                      <div key={step.event_id || idx} className="relative group">
                        {/* Node marker */}
                        <div className={`absolute -left-6 top-3 w-3 h-3 rounded-full border-2 bg-soc-card transition-transform group-hover:scale-125 ${
                          isContainment ? "border-emerald-400 bg-emerald-400/20" : "border-red-400 bg-red-400/20"
                        }`} />

                        <div className={`cyber-hud-card p-3.5 rounded-xl border transition ${
                          isContainment ? "border-emerald-500/40" : "border-slate-800 hover:border-slate-700"
                        }`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-700 font-bold">
                                {step.timestamp?.slice(11, 19) || "00:00:00"}
                              </span>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getSeverityBadge(step.severity)}`}>
                                {step.severity}
                              </span>
                              <span className="text-xs font-mono font-bold text-white">
                                {step.event_type}
                              </span>
                              {step.kill_chain_phase && (
                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getPhaseColor(step.kill_chain_phase)}`}>
                                  {step.kill_chain_phase}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {step.path && (
                                <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 truncate max-w-[220px]">
                                  <strong className="text-emerald-400 mr-1">{step.method}</strong>{step.path}
                                </span>
                              )}
                              <button
                                onClick={() => toggleExpand(step.event_id)}
                                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
                                title="Expand payload details"
                              >
                                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-slate-300 mt-2 font-sans">
                            {step.description}
                          </p>

                          {step.alert_reason && (
                            <div className="mt-2 text-[11px] font-mono text-red-400 bg-red-950/30 p-2 rounded border border-red-900/60">
                              <strong>Detection Signature:</strong> {step.alert_reason}
                            </div>
                          )}

                          {/* Expandable Payload & Telemetry Inspector */}
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 animate-fadeIn font-mono text-xs">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                                <div className="p-2 rounded bg-black/50 border border-slate-800">
                                  <span className="text-slate-500 block">EVENT ID</span>
                                  <span className="text-white font-bold">{step.event_id}</span>
                                </div>
                                <div className="p-2 rounded bg-black/50 border border-slate-800">
                                  <span className="text-slate-500 block">SOURCE IP</span>
                                  <span className="text-cyan-400">{step.source_ip}</span>
                                </div>
                                <div className="p-2 rounded bg-black/50 border border-slate-800">
                                  <span className="text-slate-500 block">AUTH USER</span>
                                  <span className="text-yellow-400">{step.user || "anonymous"}</span>
                                </div>
                                <div className="p-2 rounded bg-black/50 border border-slate-800">
                                  <span className="text-slate-500 block">STATUS</span>
                                  <span className="text-emerald-400">{step.status}</span>
                                </div>
                              </div>

                              {step.payload && (
                                <div className="p-2 rounded bg-black/60 border border-slate-800 text-[11px] text-slate-300 overflow-x-auto">
                                  <div className="text-[10px] text-slate-500 mb-1">INSPECTED RAW PAYLOAD:</div>
                                  <pre className="text-slate-300">
                                    {typeof step.payload === "object" ? JSON.stringify(step.payload, null, 2) : String(step.payload)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: AI INCIDENT BRIEFING (8 Structured Sections) */}
          {activeTab === "ai_summary" && (
            <div className="space-y-4">
              {!aiAnalysis && !aiLoading ? (
                <div className="text-center py-12 cyber-panel rounded-xl p-6">
                  <Bot className="w-10 h-10 text-purple-400 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-white">AI Incident Briefing Not Yet Generated</h3>
                  <p className="text-xs text-slate-400 font-mono mt-1 mb-4">
                    Analyze the correlated telemetry events, attack progression, and MITRE tactics with the Sentinel-X AI Analyst.
                  </p>
                  <button
                    onClick={handleGenerateAISummary}
                    className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold inline-flex items-center gap-2 transition"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Generate AI Incident Summary</span>
                  </button>
                </div>
              ) : aiLoading ? (
                <div className="text-center py-12 space-y-3 font-mono text-xs text-purple-400">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-500" />
                  <div>Synthesizing telemetry across {incident.event_count} events...</div>
                  <div className="text-slate-500 text-[11px]">Correlating MITRE techniques and calculating blast radius</div>
                </div>
              ) : (
                <div className="space-y-4 animate-fadeIn">
                  {/* Briefing Header Card */}
                  <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-600/30 rounded-lg text-purple-300">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">
                          Automated AI Security Briefing
                        </div>
                        <div className="text-xs text-purple-300/80 font-mono mt-0.5">
                          Analyst Confidence: {(aiAnalysis.analyst_confidence * 100).toFixed(0)}% • Model: Sentinel-X Expert Heuristic
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={copyBriefing}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? "Copied" : "Copy Dossier"}</span>
                    </button>
                  </div>

                  {/* 8 Structured Sections Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 font-sans">
                    {/* 1. WHAT HAPPENED */}
                    <div className="p-3.5 rounded-xl bg-soc-panel border border-soc-border flex flex-col justify-between">
                      <div>
                        <div className="text-[10px] font-mono font-bold text-cyan-400 tracking-wider uppercase mb-1">
                          1. WHAT HAPPENED
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          {aiAnalysis.ai_summary?.what_happened || aiAnalysis.executive_summary || "Insufficient telemetry to determine."}
                        </p>
                      </div>
                    </div>

                    {/* 2. ATTACK TYPE */}
                    <div className="p-3.5 rounded-xl bg-soc-panel border border-soc-border flex flex-col justify-between">
                      <div>
                        <div className="text-[10px] font-mono font-bold text-red-400 tracking-wider uppercase mb-1">
                          2. ATTACK TYPE
                        </div>
                        <p className="text-xs font-mono font-bold text-white">
                          {aiAnalysis.ai_summary?.attack_type || incident.attack_type || "Insufficient telemetry to determine."}
                        </p>
                        <div className="mt-2 text-[11px] font-mono text-slate-400">
                          Primary MITRE: {aiAnalysis.mitre_attack?.[0]?.technique_id} ({aiAnalysis.mitre_attack?.[0]?.technique_name})
                        </div>
                      </div>
                    </div>

                    {/* 3. WHAT WAS TARGETED */}
                    <div className="p-3.5 rounded-xl bg-soc-panel border border-soc-border flex flex-col justify-between">
                      <div>
                        <div className="text-[10px] font-mono font-bold text-yellow-400 tracking-wider uppercase mb-1">
                          3. WHAT WAS TARGETED
                        </div>
                        <p className="text-xs font-mono text-emerald-400">
                          {aiAnalysis.ai_summary?.what_was_targeted || "Insufficient telemetry to determine."}
                        </p>
                        <div className="mt-1 text-[11px] text-slate-400">
                          Assets: {aiAnalysis.blast_radius?.compromised_assets?.join(", ") || "User Accounts"}
                        </div>
                      </div>
                    </div>

                    {/* 4. HOW IT WAS DETECTED */}
                    <div className="p-3.5 rounded-xl bg-soc-panel border border-soc-border flex flex-col justify-between">
                      <div>
                        <div className="text-[10px] font-mono font-bold text-blue-400 tracking-wider uppercase mb-1">
                          4. HOW IT WAS DETECTED
                        </div>
                        <p className="text-xs font-mono text-slate-200 leading-relaxed">
                          {aiAnalysis.ai_summary?.how_it_was_detected || "Insufficient telemetry to determine."}
                        </p>
                      </div>
                    </div>

                    {/* 5. SEVERITY */}
                    <div className="p-3.5 rounded-xl bg-soc-panel border border-soc-border flex flex-col justify-between">
                      <div>
                        <div className="text-[10px] font-mono font-bold text-orange-400 tracking-wider uppercase mb-1">
                          5. SEVERITY CLASSIFICATION
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${getSeverityBadge(incident.severity)}`}>
                            {incident.severity}
                          </span>
                          <span className="text-xs text-slate-300">
                            {aiAnalysis.ai_summary?.severity || "Active threat detected."}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 6. ATTACK PROGRESSION */}
                    <div className="p-3.5 rounded-xl bg-soc-panel border border-soc-border flex flex-col justify-between">
                      <div>
                        <div className="text-[10px] font-mono font-bold text-purple-400 tracking-wider uppercase mb-1">
                          6. ATTACK PROGRESSION
                        </div>
                        <p className="text-xs font-mono text-slate-300 leading-relaxed">
                          {aiAnalysis.ai_summary?.attack_progression || "Insufficient telemetry to determine."}
                        </p>
                      </div>
                    </div>

                    {/* 7. POTENTIAL IMPACT */}
                    <div className="p-3.5 rounded-xl bg-soc-panel border border-soc-border col-span-1 md:col-span-2">
                      <div className="text-[10px] font-mono font-bold text-pink-400 tracking-wider uppercase mb-1">
                        7. POTENTIAL IMPACT & BLAST RADIUS
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {aiAnalysis.ai_summary?.potential_impact || "Insufficient telemetry to determine."}
                      </p>
                    </div>

                    {/* 8. RECOMMENDED RESPONSE */}
                    <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 col-span-1 md:col-span-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider uppercase">
                          8. RECOMMENDED RESPONSE
                        </div>
                        <span className="text-[9px] font-mono text-emerald-400/80 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                          AI-generated recommendations
                        </span>
                      </div>
                      <div className="space-y-1.5 text-xs text-slate-200">
                        {aiAnalysis.ai_summary?.recommended_response?.map((rec, rIdx) => (
                          <div key={rIdx} className="flex items-start gap-2">
                            <span className="text-emerald-400 mt-0.5">•</span>
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WHY WAS THIS DETECTED? */}
          {activeTab === "detection_cause" && (
            <div className="space-y-4 font-sans text-xs">
              <div className="p-4 rounded-xl bg-soc-panel border border-soc-border space-y-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white font-sans">
                    Technical Root Cause Analysis
                  </h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {aiAnalysis?.technical_root_cause || (
                    "The Sentinel-X detection engine parsed incoming HTTP requests and matched predefined heuristic syntax patterns against user-controlled parameters."
                  )}
                </p>

                {aiAnalysis?.mitre_attack && aiAnalysis.mitre_attack.length > 0 && (
                  <div className="mt-3 p-3 rounded-lg bg-black/60 border border-slate-800 space-y-1.5 font-mono text-[11px]">
                    <div className="text-purple-400 font-bold">MITRE ATT&CK FRAMEWORK MAPPING:</div>
                    {aiAnalysis.mitre_attack.map((m, mIdx) => (
                      <div key={mIdx} className="text-slate-300">
                        • <strong className="text-white">{m.technique_id}</strong> - {m.technique_name} ({m.tactic}) | <span className="text-slate-400">{m.cwe}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: RECOMMENDED RESPONSE & CODE PATCHES */}
          {activeTab === "recommendations" && (
            <div className="space-y-3 font-sans text-xs">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-mono text-slate-400">
                  Prioritized Remediation Matrix
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  AI-generated recommendations
                </span>
              </div>

              {aiAnalysis?.remediation_plan?.map((step) => (
                <div key={step.step} className="p-4 rounded-xl bg-soc-panel border border-soc-border space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold">
                        {step.step}
                      </span>
                      <span className="text-xs font-bold text-white">{step.action}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {step.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{step.detail}</p>
                  {step.code_patch && (
                    <div className="p-3 rounded-lg bg-black/80 border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                      <div className="text-[10px] text-slate-500 mb-1 flex items-center gap-1">
                        <Code className="w-3 h-3" />
                        <span>Recommended Secure Code Implementation:</span>
                      </div>
                      <pre>{step.code_patch}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
