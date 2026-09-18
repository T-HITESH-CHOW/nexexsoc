import React, { useState, useEffect, useRef } from "react";
import { 
  Bot, 
  Send, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  FileText, 
  RefreshCw,
  Terminal,
  Code,
  Lock,
  Layers,
  Zap,
  HelpCircle,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { 
  fetchIncidents, 
  analyzeIncidentWithAI, 
  chatWithAIAnalyst 
} from "../services/api";

export default function AISecurityAnalystPage({ initialIncidentId = null }) {
  const [incidents, setIncidents] = useState([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState(initialIncidentId);
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Chat state
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "👋 **Hello SOC Analyst.** I am your **Sentinel-X AI Security Analyst Copilot**.\n\nI have continuous telemetry visibility over all ingested events, detection rules, active threat incidents, and the containment gateway. Select an incident for an automated briefing or ask me anything about active attacks and remediation."
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef(null);

  // Load incidents list
  useEffect(() => {
    const loadInc = async () => {
      try {
        const res = await fetchIncidents(25);
        if (res && res.incidents && res.incidents.length > 0) {
          setIncidents(res.incidents);
          if (!selectedIncidentId) {
            setSelectedIncidentId(res.incidents[0].incident_id);
          }
        }
      } catch (err) {
        console.error("Failed to load incidents:", err);
      }
    };
    loadInc();
  }, []);

  // Fetch AI incident analysis when selectedIncidentId changes
  useEffect(() => {
    if (!selectedIncidentId) return;

    const runAnalysis = async () => {
      setAnalysisLoading(true);
      try {
        const data = await analyzeIncidentWithAI(selectedIncidentId);
        if (data && data.status === "success") {
          setAnalysis(data);
        }
      } catch (err) {
        console.error("AI analysis error:", err);
      } finally {
        setAnalysisLoading(false);
      }
    };

    runAnalysis();
  }, [selectedIncidentId]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  const handleSendMessage = async (customPrompt) => {
    const textToSend = customPrompt || inputText;
    if (!textToSend.trim() || chatLoading) return;

    const userMsg = { sender: "user", text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputText("");
    setChatLoading(true);

    try {
      const res = await chatWithAIAnalyst(textToSend, { current_incident: selectedIncidentId });
      if (res && res.reply) {
        setMessages((prev) => [...prev, { sender: "ai", text: res.reply }]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev, 
        { sender: "ai", text: `⚠️ Error contacting analyst engine: ${err.message}` }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const copyBriefing = () => {
    if (!analysis) return;
    const summary = analysis.ai_summary || {};
    const formatted = `=== SENTINEL-X AI SECURITY INCIDENT DOSSIER ===
Incident ID: ${analysis.incident_id}
Threat Vector: ${analysis.title}
Adversary IP: ${analysis.source_ip}
Severity: ${analysis.severity}
Generated At: ${analysis.generated_at}

1. WHAT HAPPENED:
${summary.what_happened || analysis.executive_summary}

2. ATTACK TYPE:
${summary.attack_type || analysis.attack_type}

3. WHAT WAS TARGETED:
${summary.what_was_targeted || "Insufficient telemetry to determine."}

4. HOW IT WAS DETECTED:
${summary.how_it_was_detected || "Heuristic pattern match."}

5. SEVERITY:
${summary.severity || analysis.severity}

6. ATTACK PROGRESSION:
${summary.attack_progression || "Insufficient telemetry to determine."}

7. POTENTIAL IMPACT:
${summary.potential_impact || "Confidentiality/Integrity exposure."}

8. RECOMMENDED RESPONSE:
${summary.recommended_response ? summary.recommended_response.join("\n") : "Enforce gateway quarantine and code patch."}
`;
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickPrompts = [
    "What is the current threat posture?",
    "Summarize the active incident",
    "Why was this attack detected?",
    "Explain the SQL injection vulnerability",
    "How do we remediate the IDOR exploit?",
    "Show active quarantined IPs",
    "What should an analyst investigate next?"
  ];

  const summary = analysis?.ai_summary || {};

  return (
    <div className="space-y-4 pb-12 select-none font-sans">
      {/* Header */}
      <div className="cyber-panel p-4 rounded-xl border border-soc-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <h1 className="text-base sm:text-lg font-black text-white tracking-wide font-sans flex items-center gap-2">
              AI SECURITY ANALYST & THREAT INTELLIGENCE WORKBENCH
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Automated cyber incident dossier synthesis, MITRE ATT&CK taxonomy classification, and real-time copilot assistance.
          </p>
        </div>

        {/* Incident selector */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-400 text-[11px]">Select Dossier:</span>
          <select
            value={selectedIncidentId || ""}
            onChange={(e) => setSelectedIncidentId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-cyan-300 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-purple-500 font-mono"
          >
            {incidents.length === 0 ? (
              <option value="">No incidents available</option>
            ) : (
              incidents.map((inc) => (
                <option key={inc.incident_id} value={inc.incident_id}>
                  {inc.incident_id} — {inc.attack_type} ({inc.severity})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Main Grid: Left = Incident Briefing, Right = Copilot Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Automated Incident Briefing (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-xl cyber-hud-card border border-soc-border shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-soc-border pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                <h2 className="text-xs sm:text-sm font-bold text-white font-sans">
                  Automated Security Incident Briefing (8-Part Analysis)
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={copyBriefing}
                  disabled={!analysis}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono flex items-center gap-1.5 transition disabled:opacity-50"
                  title="Copy full markdown report"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "Copied" : "Copy Brief"}</span>
                </button>
              </div>
            </div>

            {analysisLoading ? (
              <div className="py-16 text-center space-y-2 font-mono text-xs text-purple-400">
                <RefreshCw className="w-7 h-7 text-purple-400 animate-spin mx-auto" />
                <p>Synthesizing telemetry timeline, MITRE tactics, and blast radius...</p>
              </div>
            ) : !analysis ? (
              <div className="py-12 text-center text-slate-500 font-mono text-xs">
                Select an incident above to generate an automated executive briefing.
              </div>
            ) : (
              <div className="space-y-3.5 font-mono text-xs">
                {/* Meta Bar */}
                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Incident ID</span>
                    <span className="font-bold text-cyan-400">{analysis.incident_id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Threat Severity</span>
                    <span className={`font-bold ${analysis.severity === "CRITICAL" ? "text-red-400" : "text-orange-400"}`}>
                      {analysis.severity}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Adversary Source</span>
                    <span className="font-bold text-blue-400">{analysis.source_ip}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Correlated Events</span>
                    <span className="font-bold text-purple-300">{analysis.event_count} Events</span>
                  </div>
                </div>

                {/* 8 Structured Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-sans">
                  {/* 1. WHAT HAPPENED */}
                  <div className="p-3 rounded-xl bg-soc-panel border border-soc-border">
                    <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block font-mono mb-1">
                      1. WHAT HAPPENED
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {summary.what_happened || analysis.executive_summary || "Insufficient telemetry to determine."}
                    </p>
                  </div>

                  {/* 2. ATTACK TYPE */}
                  <div className="p-3 rounded-xl bg-soc-panel border border-soc-border">
                    <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider block font-mono mb-1">
                      2. ATTACK TYPE
                    </span>
                    <p className="text-xs font-mono font-bold text-white">
                      {summary.attack_type || analysis.title || "Insufficient telemetry to determine."}
                    </p>
                    <div className="mt-1.5 text-[11px] font-mono text-slate-400">
                      MITRE: {analysis.mitre_attack?.[0]?.technique_id} ({analysis.mitre_attack?.[0]?.technique_name})
                    </div>
                  </div>

                  {/* 3. WHAT WAS TARGETED */}
                  <div className="p-3 rounded-xl bg-soc-panel border border-soc-border">
                    <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider block font-mono mb-1">
                      3. WHAT WAS TARGETED
                    </span>
                    <p className="text-xs font-mono text-emerald-400">
                      {summary.what_was_targeted || "Insufficient telemetry to determine."}
                    </p>
                    <div className="mt-1 text-[11px] text-slate-400">
                      Assets: {analysis.blast_radius?.compromised_assets?.join(", ") || "User Accounts"}
                    </div>
                  </div>

                  {/* 4. HOW IT WAS DETECTED */}
                  <div className="p-3 rounded-xl bg-soc-panel border border-soc-border">
                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block font-mono mb-1">
                      4. HOW IT WAS DETECTED
                    </span>
                    <p className="text-xs font-mono text-slate-200 leading-relaxed">
                      {summary.how_it_was_detected || "Heuristic pattern match."}
                    </p>
                  </div>

                  {/* 5. SEVERITY */}
                  <div className="p-3 rounded-xl bg-soc-panel border border-soc-border">
                    <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider block font-mono mb-1">
                      5. SEVERITY CLASSIFICATION
                    </span>
                    <div className="text-xs text-slate-200 mt-1">
                      <strong className="text-orange-400 mr-1.5">{analysis.severity}</strong>
                      <span>{summary.severity || "Confirmed active exploitation"}</span>
                    </div>
                  </div>

                  {/* 6. ATTACK PROGRESSION */}
                  <div className="p-3 rounded-xl bg-soc-panel border border-soc-border">
                    <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block font-mono mb-1">
                      6. ATTACK PROGRESSION
                    </span>
                    <p className="text-xs font-mono text-slate-300 leading-relaxed">
                      {summary.attack_progression || "Insufficient telemetry to determine."}
                    </p>
                  </div>

                  {/* 7. POTENTIAL IMPACT */}
                  <div className="p-3 rounded-xl bg-soc-panel border border-soc-border col-span-1 md:col-span-2">
                    <span className="text-[10px] text-pink-400 font-bold uppercase tracking-wider block font-mono mb-1">
                      7. POTENTIAL IMPACT
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {summary.potential_impact || "Insufficient telemetry to determine."}
                    </p>
                  </div>

                  {/* 8. RECOMMENDED RESPONSE */}
                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 col-span-1 md:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider font-mono">
                        8. RECOMMENDED RESPONSE
                      </span>
                      <span className="text-[9px] font-mono text-emerald-400/80 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                        AI-generated recommendations
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-200 font-sans">
                      {summary.recommended_response ? (
                        summary.recommended_response.map((rec, rIdx) => (
                          <div key={rIdx} className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold">•</span>
                            <span>{rec}</span>
                          </div>
                        ))
                      ) : (
                        <p>1. Isolate offending source IP on application gateway blocklist.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section: Why Was This Detected? */}
                <div className="p-3.5 rounded-xl bg-soc-panel border border-soc-border space-y-1.5 font-sans">
                  <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold font-mono">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>WHY WAS THIS DETECTED? (TELEMETRY EXPLANATION)</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {analysis.technical_root_cause}
                  </p>
                </div>

                {/* MITRE ATT&CK Mapping */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    MITRE ATT&CK Framework Mapping
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {analysis.mitre_attack?.map((m, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-900/90 border border-purple-900/40 text-slate-300 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-bold flex items-center gap-1.5">
                            <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px]">
                              {m.technique_id}
                            </span>
                            {m.technique_name}
                          </span>
                          <span className="text-[10px] text-purple-400">{m.tactic}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">{m.cwe}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Remediation Plan & Code Fix */}
                <div className="space-y-2">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                    Prescriptive Code Hardening (Patch Verification)
                  </span>
                  {analysis.remediation_plan?.map((step) => (
                    <div key={step.step} className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white flex items-center gap-1.5 font-sans">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Step {step.step}: {step.action}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-bold">
                          {step.priority}
                        </span>
                      </div>
                      <p className="text-slate-300 font-sans text-xs">{step.detail}</p>
                      {step.code_patch && (
                        <pre className="p-2.5 rounded bg-black/80 border border-slate-800 text-emerald-400 overflow-x-auto text-[11px] mt-1 font-mono">
                          {step.code_patch}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Security Analyst Copilot Chat (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="p-4 rounded-xl cyber-hud-card border border-soc-border shadow-sm flex-1 flex flex-col h-[780px]">
            {/* Chat header */}
            <div className="flex items-center justify-between pb-3 border-b border-soc-border">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-xs sm:text-sm font-bold text-white font-sans">
                  AI Security Copilot Chat
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
                Ground Truth Aware
              </span>
            </div>

            {/* Quick Prompt Chips */}
            <div className="py-2.5 flex flex-wrap gap-1.5 border-b border-soc-border">
              {quickPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(p)}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[10px] font-mono transition text-left active:scale-95"
                >
                  + {p}
                </button>
              ))}
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-2 space-y-3 font-sans text-xs">
              {messages.map((m, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div 
                    className={`max-w-[90%] p-3 rounded-xl leading-relaxed whitespace-pre-wrap ${
                      m.sender === "user"
                        ? "bg-blue-600 text-white shadow-md rounded-br-none"
                        : "bg-slate-900/90 border border-slate-800 text-slate-200 shadow-sm rounded-bl-none font-mono text-[11px]"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex justify-start">
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 font-mono text-xs flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                    <span>Analyzing live telemetry & correlating MITRE techniques...</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="pt-3 border-t border-soc-border flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask analyst about attacks, WAF rules, or containment..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || chatLoading}
                className="p-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition active:scale-95 disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
