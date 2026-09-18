import React, { useState, useEffect } from "react";
import { 
  AlertTriangle, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  Bot, 
  Sparkles, 
  RefreshCw, 
  Copy, 
  Check, 
  FileText, 
  Terminal, 
  Code, 
  ArrowRight,
  ChevronRight,
  Eye,
  Activity,
  Zap,
  Target
} from "lucide-react";
import { 
  fetchIncidents, 
  fetchIncidentDetails, 
  analyzeIncidentWithAI, 
  manualContain, 
  manualUnblock, 
  fetchContainmentStatus 
} from "../services/api";

export default function InvestigationWorkspacePage({ 
  preselectedIncidentId = null,
  onSelectEvent,
  onOpenAICopilot 
}) {
  const [incidents, setIncidents] = useState([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState(preselectedIncidentId);
  const [incidentData, setIncidentData] = useState(null);
  const [selectedTimelineEvent, setSelectedTimelineEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load incidents list
  useEffect(() => {
    fetchIncidents(25)
      .then((res) => {
        if (res && res.incidents && res.incidents.length > 0) {
          setIncidents(res.incidents);
          if (!selectedIncidentId) {
            setSelectedIncidentId(res.incidents[0].incident_id);
          }
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // Fetch incident details when selected
  useEffect(() => {
    if (!selectedIncidentId) return;
    setLoading(true);
    fetchIncidentDetails(selectedIncidentId)
      .then((res) => {
        if (res && res.incident) {
          setIncidentData(res.incident);
          if (res.incident.timeline && res.incident.timeline.length > 0) {
            setSelectedTimelineEvent(res.incident.timeline[0]);
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    // Auto-fetch AI summary
    analyzeIncidentWithAI(selectedIncidentId)
      .then((data) => {
        if (data && data.status === "success") {
          setAiAnalysis(data);
        }
      })
      .catch((err) => console.error(err));
  }, [selectedIncidentId]);

  // Check containment
  useEffect(() => {
    if (!incidentData?.source_ip) return;
    fetchContainmentStatus()
      .then((res) => {
        if (res && res.active_blocks) {
          setIsBlocked(res.active_blocks.some(b => b.source_ip === incidentData.source_ip));
        }
      })
      .catch((err) => console.error(err));
  }, [incidentData?.source_ip]);

  const handleToggleContainment = async () => {
    if (!incidentData?.source_ip) return;
    try {
      if (isBlocked) {
        await manualUnblock(incidentData.source_ip, "Manual release from NEXES Forensics Workspace");
        setIsBlocked(false);
      } else {
        await manualContain(incidentData.source_ip, `Quarantine triggered from ${incidentData.incident_id}`, 60);
        setIsBlocked(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyEvent = () => {
    if (!selectedTimelineEvent) return;
    navigator.clipboard.writeText(JSON.stringify(selectedTimelineEvent, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const timeline = incidentData?.timeline || [];
  const summary = aiAnalysis?.summary || {};

  return (
    <div className="space-y-4 pb-12 select-none animate-glideIn font-sans">
      {/* Header Bar with Gliding Selectors */}
      <div className="cyber-panel p-4 sm:p-5 rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-300">
              <Activity className="w-4 h-4" />
            </div>
            <h1 className="text-base font-extrabold text-white font-mono tracking-wide">
              NEXES DIGITAL FORENSICS &amp; INCIDENT WORKSPACE
            </h1>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
            Interactive multi-panel event reconstruction, 8-part AI briefing, and edge containment control.
          </p>
        </div>

        {/* Dossier Switcher & Actions */}
        <div className="flex items-center gap-2.5 font-mono text-xs flex-wrap">
          <span className="text-slate-400 text-[11px] font-bold">Dossier:</span>
          <select
            value={selectedIncidentId || ""}
            onChange={(e) => setSelectedIncidentId(e.target.value)}
            className="bg-[#030611] border border-white/10 text-cyan-300 rounded-full px-3.5 py-1.5 text-xs focus:outline-none focus:border-cyan-400/60 font-mono shadow-sm"
          >
            {incidents.map((inc) => (
              <option key={inc.incident_id} value={inc.incident_id}>
                {inc.incident_id} — {inc.attack_type} ({inc.severity})
              </option>
            ))}
          </select>

          {/* Containment Toggle Button */}
          <button
            onClick={handleToggleContainment}
            className={`btn-glide px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 active:scale-95 shadow-md ${
              isBlocked 
                ? "bg-red-500/20 text-red-300 border border-red-500/60 hover:bg-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.3)]" 
                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 hover:bg-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            }`}
          >
            {isBlocked ? <Lock className="w-3.5 h-3.5 text-red-400 animate-pulse" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>{isBlocked ? "ISOLATED (HTTP 403)" : "ISOLATE IP"}</span>
          </button>
        </div>
      </div>

      {/* Main 3-Panel Forensics Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* PANEL 1: ATTACK PATH & TIMELINE (3 cols) */}
        <div className="lg:col-span-3 cyber-hud-card p-4 rounded-2xl border border-white/10 space-y-3 flex flex-col h-[720px] shadow-lg">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5 font-mono">
            <span className="text-[11px] font-extrabold text-slate-200 uppercase tracking-wider">
              ATTACK PATH NODES
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-bold">
              {timeline.length} Steps
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono">
            {timeline.map((step, idx) => {
              const isSelected = selectedTimelineEvent?.event_id === step.event_id;
              const isContainment = step.event_type === "CONTAINMENT_ENFORCED";

              return (
                <div
                  key={step.event_id || idx}
                  onClick={() => setSelectedTimelineEvent(step)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-2.5 ${
                    isSelected
                      ? "bg-cyan-950/50 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-[1.01]"
                      : "bg-[#030611]/80 border-white/5 text-slate-300 hover:border-white/20"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    isContainment ? "bg-emerald-400" : isSelected ? "bg-cyan-400 animate-ping" : "bg-red-400"
                  }`} />

                  <div className="space-y-0.5 truncate flex-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-cyan-400">{step.timestamp?.slice(11, 19)}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                        step.severity === "CRITICAL" ? "bg-red-500/20 text-red-400" : "bg-orange-500/20 text-orange-400"
                      }`}>
                        {step.severity}
                      </span>
                    </div>
                    <div className="font-bold text-white text-[11px] truncate">{step.event_type}</div>
                    <div className="text-[10px] text-slate-400 truncate">{step.path || step.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PANEL 2: EVENT INVESTIGATION & AI BRIEFING (5 cols) */}
        <div className="lg:col-span-5 space-y-4 flex flex-col h-[720px]">
          {/* Incident Dossier Meta Banner */}
          {incidentData && (
            <div className="cyber-hud-card p-3.5 rounded-2xl border border-white/10 flex items-center justify-between text-[11px] font-mono">
              <div>
                <span className="text-slate-500 block text-[9px]">TARGET DOSSIER</span>
                <span className="font-bold text-white text-xs">{incidentData.incident_id}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px]">ADVERSARY</span>
                <span className="font-bold text-cyan-400">{incidentData.source_ip}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px]">ATTACK CLASS</span>
                <span className="font-bold text-purple-300">{incidentData.attack_type}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px]">SEVERITY</span>
                <span className="font-bold text-red-400">{incidentData.severity}</span>
              </div>
            </div>
          )}

          {/* AI Briefing Card (8-Part Analysis) */}
          <div className="cyber-hud-card p-4 rounded-2xl border border-white/10 flex-1 overflow-y-auto space-y-3 font-sans shadow-lg">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5 font-mono">
              <div className="flex items-center gap-1.5 text-purple-300 font-extrabold text-xs">
                <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                <span>NEXES AI INCIDENT BRIEFING (8-PART SYNTHESIS)</span>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold">
                Ground Truth
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-[#030611] border border-white/5">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase block">1. WHAT HAPPENED</span>
                <p className="text-slate-200 mt-1 leading-relaxed">
                  {summary.what_happened || incidentData?.title || "Evaluating telemetry..."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-[#030611] border border-white/5">
                  <span className="text-[10px] font-mono text-red-400 font-bold uppercase block">2. ATTACK TYPE</span>
                  <p className="text-slate-200 mt-1 font-mono font-bold">{summary.attack_type || incidentData?.attack_type}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#030611] border border-white/5">
                  <span className="text-[10px] font-mono text-yellow-400 font-bold uppercase block">3. WHAT WAS TARGETED</span>
                  <p className="text-emerald-400 mt-1 font-mono font-bold">{summary.what_was_targeted || "/vulnerable/login"}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#030611] border border-white/5">
                <span className="text-[10px] font-mono text-blue-400 font-bold uppercase block">4. HOW IT WAS DETECTED</span>
                <p className="text-slate-200 mt-1 font-mono text-[11px] leading-relaxed">
                  {summary.how_it_was_detected || "Heuristic AST token & regex match."}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#030611] border border-white/5">
                <span className="text-[10px] font-mono text-purple-400 font-bold uppercase block">6. ATTACK PROGRESSION</span>
                <p className="text-slate-300 mt-1 font-mono text-[11px] leading-relaxed">
                  {summary.attack_progression || "Recon -> Exploit -> Containment"}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/25 border border-emerald-500/40">
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase block">8. RECOMMENDED RESPONSE</span>
                <div className="space-y-1.5 mt-1.5 text-slate-300 text-[11px]">
                  {summary.recommended_response?.map((rec, rIdx) => (
                    <div key={rIdx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">&bull;</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL 3: RAW EVENT INSPECTOR (4 cols) */}
        <div className="lg:col-span-4 cyber-hud-card p-4 rounded-2xl border border-white/10 space-y-3 flex flex-col h-[720px] shadow-lg">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5 font-mono">
            <span className="text-[11px] font-extrabold text-slate-200 uppercase tracking-wider">
              RAW EVENT INSPECTOR
            </span>
            <button
              onClick={copyEvent}
              className="btn-glide text-[10px] text-slate-400 hover:text-white flex items-center gap-1 transition px-2.5 py-1 rounded-full bg-[#030611] border border-white/10"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? "Copied" : "Copy JSON"}</span>
            </button>
          </div>

          {selectedTimelineEvent ? (
            <div className="flex-1 flex flex-col space-y-3 overflow-hidden font-mono">
              {/* Event Metadata Grid */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="p-2.5 rounded-xl bg-[#030611] border border-white/5">
                  <span className="text-slate-500 block text-[9px]">EVENT ID</span>
                  <span className="text-white font-bold">{selectedTimelineEvent.event_id}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#030611] border border-white/5">
                  <span className="text-slate-500 block text-[9px]">STATUS</span>
                  <span className="text-emerald-400 font-bold">{selectedTimelineEvent.status}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#030611] border border-white/5">
                  <span className="text-slate-500 block text-[9px]">METHOD & PATH</span>
                  <span className="text-cyan-400 truncate block font-bold">{selectedTimelineEvent.method} {selectedTimelineEvent.path}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#030611] border border-white/5">
                  <span className="text-slate-500 block text-[9px]">RULE MATCH</span>
                  <span className="text-purple-300 truncate block font-bold">{selectedTimelineEvent.event_type}</span>
                </div>
              </div>

              {/* Formatted JSON output */}
              <div className="flex-1 bg-black/90 rounded-xl p-3.5 border border-white/10 overflow-y-auto font-mono text-[11px]">
                <pre className="text-emerald-400 whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(selectedTimelineEvent, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-center font-mono text-xs">
              Select an event from the attack path nodes to inspect raw telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
